const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const { signToken, setAuthCookie, clearAuthCookie } = require('../../utils/auth');
const { pubsub, ACTIVITY_LOGGED, logActivity, getRecentLogs } = require('../../utils/pubsub');

function requireAuth(user) {
  if (!user || !user.userId) {
    throw new Error('Non authentifié. Veuillez vous connecter pour accéder à vos projets.');
  }
}

async function verifyProjectOwnership(prisma, projectId, userId) {
  const project = await prisma.project.findUnique({
    where: { id: Number(projectId) },
  });
  if (!project) {
    throw new Error('Projet introuvable');
  }
  if (project.userId !== Number(userId)) {
    throw new Error('Accès refusé : vous ne pouvez accéder qu’à vos propres projets.');
  }
  return project;
}

async function verifyTaskOwnership(prisma, taskId, userId) {
  const task = await prisma.task.findUnique({
    where: { id: Number(taskId) },
    include: { project: true },
  });
  if (!task) {
    throw new Error('Tâche introuvable');
  }
  if (task.project.userId !== Number(userId)) {
    throw new Error('Accès refusé : cette tâche appartient au projet d’un autre utilisateur.');
  }
  return task;
}

async function verifySubTaskOwnership(prisma, subTaskId, userId) {
  const subtask = await prisma.subTask.findUnique({
    where: { id: Number(subTaskId) },
    include: {
      task: {
        include: { project: true },
      },
    },
  });
  if (!subtask) {
    throw new Error('Sous-tâche introuvable');
  }
  if (subtask.task.project.userId !== Number(userId)) {
    throw new Error('Accès refusé : cette sous-tâche appartient au projet d’un autre utilisateur.');
  }
  return subtask;
}

async function verifyColumnOwnership(prisma, columnId, userId) {
  const column = await prisma.column.findUnique({
    where: { id: Number(columnId) },
    include: { project: true },
  });
  if (!column) {
    throw new Error('Colonne introuvable');
  }
  if (column.project.userId !== Number(userId)) {
    throw new Error('Accès refusé : cette colonne appartient à un autre utilisateur.');
  }
  return column;
}

const DEFAULT_COLUMNS = [
  { name: 'À faire', slug: 'todo', order: 0, color: 'indigo' },
  { name: 'En cours', slug: 'doing', order: 1, color: 'amber' },
  { name: 'Terminé', slug: 'done', order: 2, color: 'emerald' },
];

async function ensureDefaultColumns(prisma, projectId) {
  const count = await prisma.column.count({ where: { projectId: Number(projectId) } });
  if (count === 0) {
    for (const col of DEFAULT_COLUMNS) {
      await prisma.column.create({
        data: {
          name: col.name,
          slug: col.slug,
          order: col.order,
          color: col.color,
          projectId: Number(projectId),
        },
      });
    }
  }
}

async function ensureValidColumnStatus(prisma, projectId, status) {
  await ensureDefaultColumns(prisma, projectId);
  const column = await prisma.column.findFirst({
    where: {
      projectId: Number(projectId),
      slug: status,
    },
  });

  if (!column) {
    throw new Error('Cette colonne n’existe plus dans le projet. Actualisez le tableau puis réessayez.');
  }

  return column;
}

function removeUploadedFile(url) {
  if (!url || !url.startsWith('/uploads/')) return;
  const relativePath = url.replace(/^\/+/, '');
  const filePath = path.join(__dirname, '../../../', relativePath);
  fs.promises.unlink(filePath).catch(() => undefined);
}

const resolvers = {
  Query: {
    me: async (_, __, { prisma, user }) => {
      if (!user) return null;
      return prisma.user.findUnique({
        where: { id: user.userId },
        include: {
          projects: {
            include: {
              tasks: {
                include: {
                  subtasks: true,
                  attachments: true,
                },
              },
              columns: {
                orderBy: { order: 'asc' },
              },
            },
          },
        },
      });
    },

    users: async (_, __, { prisma }) => {
      return prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
        },
      });
    },

    usersId: async (_, __, { prisma }) => {
      return prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
        },
      });
    },

    user: async (_, { id }, { prisma, user: authUser }) => {
      requireAuth(authUser);
      if (Number(authUser.userId) !== Number(id)) {
        throw new Error('Accès refusé : profil utilisateur inaccessible');
      }
      return prisma.user.findUnique({
        where: { id: Number(id) },
        include: {
          projects: {
            include: {
              tasks: {
                include: {
                  subtasks: true,
                  attachments: true,
                },
              },
              columns: {
                orderBy: { order: 'asc' },
              },
            },
          },
        },
      });
    },

    myProjects: async (_, __, { prisma, user }) => {
      requireAuth(user);
      return prisma.project.findMany({
        where: { userId: user.userId },
        include: {
          tasks: {
            include: {
              subtasks: true,
              attachments: true,
            },
          },
          columns: {
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { id: 'desc' },
      });
    },

    getProjectTasks: async (_, { projectId }, { prisma, user }) => {
      requireAuth(user);
      await verifyProjectOwnership(prisma, projectId, user.userId);

      const project = await prisma.project.findUnique({
        where: { id: Number(projectId) },
        include: {
          tasks: {
            include: {
              subtasks: true,
              attachments: true,
            },
          },
        },
      });
      return project ? project.tasks : [];
    },

    getProjectColumns: async (_, { projectId }, { prisma, user }) => {
      requireAuth(user);
      await verifyProjectOwnership(prisma, projectId, user.userId);
      await ensureDefaultColumns(prisma, projectId);

      return prisma.column.findMany({
        where: { projectId: Number(projectId) },
        orderBy: { order: 'asc' },
      });
    },

    getRecentLogs: () => {
      return getRecentLogs();
    },
  },

  Mutation: {
    register: async (_, { name, email, password }, { prisma, res }) => {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        throw new Error('Un utilisateur avec cet email existe déjà');
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
        },
      });

      const token = signToken(newUser);
      setAuthCookie(res, token);

      logActivity({
        type: 'AUTH',
        action: 'REGISTER',
        message: `Nouvel utilisateur inscrit : "${newUser.name}" (${newUser.email})`,
        user: newUser.name,
        details: { userId: newUser.id, email: newUser.email },
      });

      return {
        user: newUser,
        token,
      };
    },

    login: async (_, { email, password }, { prisma, res }) => {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        throw new Error('Identifiants invalides');
      }

      if (user.password) {
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
          throw new Error('Identifiants invalides');
        }
      }

      const token = signToken(user);
      setAuthCookie(res, token);

      logActivity({
        type: 'AUTH',
        action: 'LOGIN',
        message: `Connexion réussie de "${user.name}" (${user.email})`,
        user: user.name,
        details: { userId: user.id },
      });

      return {
        user,
        token,
      };
    },

    logout: async (_, __, { res, user }) => {
      clearAuthCookie(res);
      logActivity({
        type: 'AUTH',
        action: 'LOGOUT',
        message: `Déconnexion effectuée`,
        user: user?.name || 'Anonymous',
      });
      return true;
    },

    createUser: async (_, { name, email, password }, { prisma, user }) => {
      const hashedPassword = password ? await bcrypt.hash(password, 10) : '';
      const created = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
        },
      });

      logActivity({
        type: 'CREATE',
        action: 'CREATE_USER',
        message: `Utilisateur créé : "${created.name}"`,
        user: user?.name || 'System',
      });

      return created;
    },

    createProject: async (_, { name }, { prisma, user }) => {
      requireAuth(user);

      const project = await prisma.project.create({
        data: {
          name,
          userId: user.userId,
        },
        include: {
          user: true,
          tasks: {
            include: {
              subtasks: true,
            },
          },
        },
      });

      await ensureDefaultColumns(prisma, project.id);

      logActivity({
        type: 'CREATE',
        action: 'CREATE_PROJECT',
        message: `Projet créé : "${project.name}" (ID: ${project.id})`,
        user: user.name,
        details: { projectId: project.id, projectName: project.name },
      });

      return project;
    },

    deleteProject: async (_, { id }, { prisma, user }) => {
      requireAuth(user);
      const projectId = Number(id);
      const project = await verifyProjectOwnership(prisma, projectId, user.userId);

      const tasks = await prisma.task.findMany({ where: { projectId } });
      for (const task of tasks) {
        await prisma.subTask.deleteMany({ where: { taskId: task.id } });
      }
      await prisma.task.deleteMany({ where: { projectId } });
      await prisma.project.delete({ where: { id: projectId } });

      logActivity({
        type: 'DELETE',
        action: 'DELETE_PROJECT',
        message: `Projet supprimé : "${project.name}" (ID: ${projectId})`,
        user: user.name,
      });

      return true;
    },

    createTask: async (_, { title, projectId, status = 'todo' }, { prisma, user }) => {
      requireAuth(user);
      await verifyProjectOwnership(prisma, projectId, user.userId);

      const targetStatus = (status || 'todo').trim();
      await ensureValidColumnStatus(prisma, projectId, targetStatus);

      const task = await prisma.task.create({
        data: {
          title,
          projectId: Number(projectId),
          status: targetStatus,
          completed: targetStatus === 'done',
        },
        include: {
          project: true,
          subtasks: true,
        },
      });

      logActivity({
        type: 'CREATE',
        action: 'CREATE_TASK',
        message: `Tâche créée : "${task.title}" [Statut: ${task.status}] (Projet #${task.projectId})`,
        user: user.name,
        details: { taskId: task.id, projectId: task.projectId, status: task.status },
      });

      return task;
    },

    updateTaskStatus: async (_, { taskId, status }, { prisma, user }) => {
      requireAuth(user);
      const existingTask = await verifyTaskOwnership(prisma, taskId, user.userId);
      const targetStatus = status.trim();
      await ensureValidColumnStatus(prisma, existingTask.projectId, targetStatus);

      const task = await prisma.task.update({
        where: { id: Number(taskId) },
        data: {
          status: targetStatus,
          completed: targetStatus === 'done',
        },
        include: {
          subtasks: true,
          project: true,
        },
      });

      logActivity({
        type: 'UPDATE',
        action: 'UPDATE_TASK_STATUS',
        message: `Statut de la tâche #${task.id} ("${task.title}") mis à jour -> [${status}]`,
        user: user.name,
        details: { taskId: task.id, newStatus: targetStatus },
      });

      return task;
    },

    updateTaskTitle: async (_, { taskId, title }, { prisma, user }) => {
      requireAuth(user);
      await verifyTaskOwnership(prisma, taskId, user.userId);

      const task = await prisma.task.update({
        where: { id: Number(taskId) },
        data: { title },
        include: {
          subtasks: true,
          project: true,
        },
      });

      logActivity({
        type: 'UPDATE',
        action: 'UPDATE_TASK_TITLE',
        message: `Titre de la tâche #${task.id} renommé -> "${title}"`,
        user: user.name,
        details: { taskId: task.id, title },
      });

      return task;
    },

    updateTaskNote: async (_, { taskId, note }, { prisma, user }) => {
      requireAuth(user);
      await verifyTaskOwnership(prisma, taskId, user.userId);

      const task = await prisma.task.update({
        where: { id: Number(taskId) },
        data: { note: note.trim() },
        include: {
          subtasks: true,
          attachments: true,
          project: true,
        },
      });

      logActivity({
        type: 'UPDATE',
        action: 'UPDATE_TASK_NOTE',
        message: `Note de la tâche #${task.id} mise à jour`,
        user: user.name,
        details: { taskId: task.id },
      });

      return task;
    },

    deleteTask: async (_, { taskId }, { prisma, user }) => {
      requireAuth(user);
      const existing = await verifyTaskOwnership(prisma, taskId, user.userId);
      const id = Number(taskId);

      await prisma.subTask.deleteMany({ where: { taskId: id } });
      await prisma.attachment.deleteMany({ where: { taskId: id } });
      await prisma.task.delete({ where: { id } });

      logActivity({
        type: 'DELETE',
        action: 'DELETE_TASK',
        message: `Tâche supprimée : "${existing.title}" (ID: ${id})`,
        user: user.name,
        details: { taskId: id },
      });

      return true;
    },

    createColumn: async (_, { projectId, name, color = 'indigo' }, { prisma, user }) => {
      requireAuth(user);
      await verifyProjectOwnership(prisma, projectId, user.userId);

      const trimmedName = name.trim();
      if (!trimmedName) {
        throw new Error('Le nom de la colonne ne peut pas être vide.');
      }

      let baseSlug = trimmedName
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      if (!baseSlug) baseSlug = 'col';

      let slug = baseSlug;
      let counter = 1;
      while (await prisma.column.findFirst({ where: { projectId: Number(projectId), slug } })) {
        slug = `${baseSlug}-${counter++}`;
      }

      const lastCol = await prisma.column.findFirst({
        where: { projectId: Number(projectId) },
        orderBy: { order: 'desc' },
      });
      const order = lastCol ? lastCol.order + 1 : 0;

      const column = await prisma.column.create({
        data: {
          name: trimmedName,
          slug,
          order,
          color: color || 'indigo',
          projectId: Number(projectId),
        },
      });

      logActivity({
        type: 'CREATE',
        action: 'CREATE_COLUMN',
        message: `Nouvelle colonne créée : "${column.name}" (Projet #${projectId})`,
        user: user.name,
        details: { columnId: column.id, name: column.name, slug: column.slug },
      });

      return column;
    },

    renameColumn: async (_, { id, name }, { prisma, user }) => {
      requireAuth(user);
      await verifyColumnOwnership(prisma, id, user.userId);

      const trimmedName = name.trim();
      if (!trimmedName) {
        throw new Error('Le nom de la colonne ne peut pas être vide.');
      }

      const column = await prisma.column.update({
        where: { id: Number(id) },
        data: { name: trimmedName },
      });

      logActivity({
        type: 'UPDATE',
        action: 'RENAME_COLUMN',
        message: `Colonne #${column.id} renommée en "${column.name}"`,
        user: user.name,
      });

      return column;
    },

    deleteColumn: async (_, { id }, { prisma, user }) => {
      requireAuth(user);
      const column = await verifyColumnOwnership(prisma, id, user.userId);

      // A project must always keep one destination for its tasks.
      const otherCol = await prisma.column.findFirst({
        where: {
          projectId: column.projectId,
          id: { not: column.id },
        },
        orderBy: { order: 'asc' },
      });

      if (!otherCol) {
        throw new Error('Impossible de supprimer la dernière colonne du projet.');
      }

      const fallbackStatus = otherCol.slug;
      await prisma.task.updateMany({
        where: { projectId: column.projectId, status: column.slug },
        data: { status: fallbackStatus },
      });

      await prisma.column.delete({ where: { id: Number(id) } });

      logActivity({
        type: 'DELETE',
        action: 'DELETE_COLUMN',
        message: `Colonne "${column.name}" supprimée (les tâches ont été basculées vers [${fallbackStatus}])`,
        user: user.name,
      });

      return true;
    },

    deleteAttachment: async (_, { id }, { prisma, user }) => {
      requireAuth(user);
      const attachment = await prisma.attachment.findUnique({
        where: { id: Number(id) },
        include: { task: { include: { project: true } } },
      });
      if (!attachment) throw new Error('Pièce jointe introuvable');
      if (attachment.task.project.userId !== Number(user.userId)) {
        throw new Error('Accès refusé');
      }

      await prisma.attachment.delete({ where: { id: Number(id) } });
      removeUploadedFile(attachment.url);

      logActivity({
        type: 'DELETE',
        action: 'DELETE_ATTACHMENT',
        message: `Document supprimé : "${attachment.name}"`,
        user: user.name,
      });

      return true;
    },

    createSubTask: async (_, { title, taskId }, { prisma, user }) => {
      requireAuth(user);
      await verifyTaskOwnership(prisma, taskId, user.userId);

      const subtask = await prisma.subTask.create({
        data: {
          title,
          taskId: Number(taskId),
          done: false,
        },
        include: {
          task: true,
        },
      });

      logActivity({
        type: 'CREATE',
        action: 'CREATE_SUBTASK',
        message: `Sous-tâche ajoutée : "${subtask.title}" (sur la tâche #${subtask.taskId})`,
        user: user.name,
        details: { subTaskId: subtask.id, taskId: subtask.taskId },
      });

      return subtask;
    },

    toggleSubTask: async (_, { id }, { prisma, user }) => {
      requireAuth(user);
      const subtask = await verifySubTaskOwnership(prisma, id, user.userId);
      const subtaskId = Number(id);

      const updated = await prisma.subTask.update({
        where: { id: subtaskId },
        data: { done: !subtask.done },
        include: { task: true },
      });

      logActivity({
        type: 'UPDATE',
        action: 'TOGGLE_SUBTASK',
        message: `Sous-tâche #${updated.id} ("${updated.title}") marquée comme ${updated.done ? 'TERMINÉE' : 'À FAIRE'}`,
        user: user.name,
        details: { subTaskId: updated.id, done: updated.done },
      });

      return updated;
    },

    deleteSubTask: async (_, { id }, { prisma, user }) => {
      requireAuth(user);
      const subtask = await verifySubTaskOwnership(prisma, id, user.userId);
      const subtaskId = Number(id);

      await prisma.subTask.delete({ where: { id: subtaskId } });

      logActivity({
        type: 'DELETE',
        action: 'DELETE_SUBTASK',
        message: `Sous-tâche #${subtaskId} ("${subtask.title}") supprimée`,
        user: user.name,
        details: { subTaskId: subtaskId },
      });

      return true;
    },
  },

  Subscription: {
    activityLogged: {
      subscribe: () => pubsub.asyncIterator([ACTIVITY_LOGGED]),
    },
  },

  Task: {
    subtasks: async (parent, _, { prisma }) => {
      if (parent.subtasks) return parent.subtasks;
      return prisma.subTask.findMany({ where: { taskId: parent.id } });
    },
    attachments: async (parent, _, { prisma }) => {
      if (parent.attachments) return parent.attachments;
      return prisma.attachment.findMany({
        where: { taskId: parent.id },
        orderBy: { createdAt: 'desc' },
      });
    },
    project: async (parent, _, { prisma }) => {
      if (parent.project) return parent.project;
      return prisma.project.findUnique({ where: { id: parent.projectId } });
    },
  },

  Project: {
    user: async (parent, _, { prisma }) => {
      if (parent.user) return parent.user;
      return prisma.user.findUnique({ where: { id: parent.userId } });
    },
    tasks: async (parent, _, { prisma }) => {
      if (parent.tasks) return parent.tasks;
      return prisma.task.findMany({
        where: { projectId: parent.id },
        include: { subtasks: true, attachments: true },
      });
    },
    columns: async (parent, _, { prisma }) => {
      if (parent.columns) return parent.columns;
      await ensureDefaultColumns(prisma, parent.id);
      return prisma.column.findMany({
        where: { projectId: parent.id },
        orderBy: { order: 'asc' },
      });
    },
  },

  SubTask: {
    task: async (parent, _, { prisma }) => {
      if (parent.task) return parent.task;
      return prisma.task.findUnique({ where: { id: parent.taskId } });
    },
  },

  Attachment: {
    createdAt: (parent) => {
      return parent.createdAt ? new Date(parent.createdAt).toISOString() : new Date().toISOString();
    },
  },
};

module.exports = { resolvers };
