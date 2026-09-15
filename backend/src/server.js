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

const prisma = new PrismaClient();
const app = express();

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

// Healthcheck endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
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
