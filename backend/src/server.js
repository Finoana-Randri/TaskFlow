require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { ApolloServer } = require('apollo-server-express');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { WebSocketServer } = require('ws');
const { useServer } = require('graphql-ws/use/ws');
const { PrismaClient } = require('@prisma/client');
const { typeDefs } = require('./graphql/schemas');
const { resolvers } = require('./graphql/resolvers');
const { getUserFromRequest } = require('./utils/auth');

const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { logActivity } = require('./utils/pubsub');

const prisma = new PrismaClient();
const app = express();

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const allowedMimeTypes = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
]);

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || allowedMimeTypes.has(file.mimetype)) {
      return cb(null, true);
    }
    return cb(new Error('Format non pris en charge. Utilisez une image, un PDF, un document ou un tableur.'));
  },
});

const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || origin.startsWith('http://localhost:')) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());

// Serve uploaded files statically
app.use('/uploads', express.static(uploadsDir));

// Healthcheck endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// File upload endpoint for tasks
app.post('/api/tasks/:taskId/attachments', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || 'Fichier invalide' });
    }
    return next();
  });
}, async (req, res) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    const taskId = Number(req.params.taskId);
    if (!taskId) {
      return res.status(400).json({ error: 'ID de tâche manquant' });
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: true },
    });

    if (!task) {
      return res.status(404).json({ error: 'Tâche introuvable' });
    }

    if (task.project.userId !== Number(user.userId)) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    const attachment = await prisma.attachment.create({
      data: {
        name: Buffer.from(req.file.originalname, 'latin1').toString('utf8'),
        url: fileUrl,
        size: req.file.size,
        mimeType: req.file.mimetype || 'application/octet-stream',
        taskId: taskId,
      },
    });

    logActivity({
      type: 'CREATE',
      action: 'UPLOAD_ATTACHMENT',
      message: `Fichier téléversé : "${attachment.name}" sur la tâche #${task.id}`,
      user: user.name,
      details: { attachmentId: attachment.id, taskId: task.id, filename: attachment.name },
    });

    res.status(201).json({ attachment });
  } catch (err) {
    if (req.file?.path) {
      fs.promises.unlink(req.file.path).catch(() => undefined);
    }
    console.error('File upload error:', err);
    res.status(500).json({ error: err.message || 'Erreur lors de l’envoi du fichier' });
  }
});

async function startServer() {
  const schema = makeExecutableSchema({ typeDefs, resolvers });
  const httpServer = http.createServer(app);

  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql',
  });

  const serverCleanup = useServer(
    {
      schema,
      context: () => ({ prisma }),
    },
    wsServer
  );

  const server = new ApolloServer({
    schema,
    context: ({ req, res }) => {
      const user = getUserFromRequest(req);
      return {
        req,
        res,
        prisma,
        user,
      };
    },
    plugins: [
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            },
          };
        },
      },
    ],
  });

  await server.start();
  server.applyMiddleware({ app, cors: false, bodyParserConfig: false });

  const PORT = process.env.PORT || 4000;
  httpServer.listen(PORT, () => {
    console.log(`🚀 GraphQL HTTP Server ready at http://localhost:${PORT}${server.graphqlPath}`);
    console.log(`🚀 GraphQL Subscription WS Server ready at ws://localhost:${PORT}${server.graphqlPath}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
