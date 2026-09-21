const { gql } = require('apollo-server-express');

const typeDefs = gql`
  type User {
    id: ID!
    name: String!
    email: String!
    projects: [Project!]!
  }

  type AuthPayload {
    user: User!
    token: String!
  }

  type Column {
    id: ID!
    name: String!
    slug: String!
    order: Int!
    color: String
    projectId: Int!
  }

  type Attachment {
    id: ID!
    name: String!
    url: String!
    size: Int!
    mimeType: String!
    createdAt: String!
    taskId: Int!
  }

  type Project {
    id: ID!
    name: String!
    user: User!
    userId: Int!
    tasks: [Task!]!
    columns: [Column!]!
  }

  type Task {
    id: ID!
    title: String!
    note: String
    completed: Boolean!
    status: String!
    project: Project!
    projectId: Int!
    subtasks: [SubTask!]!
    attachments: [Attachment!]!
  }

  type SubTask {
    id: ID!
    title: String!
    done: Boolean!
    task: Task!
    taskId: Int!
  }

  type ActivityLog {
    id: ID!
    timestamp: String!
    type: String!
    action: String!
    message: String!
    user: String
    details: String
  }

  type Query {
    me: User
    users: [User!]!
    usersId: [User!]!
    user(id: ID!): User
    myProjects: [Project!]!
    getProjectTasks(projectId: Int!): [Task!]!
    getProjectColumns(projectId: Int!): [Column!]!
    getRecentLogs: [ActivityLog!]!
  }

  type Mutation {
    register(name: String!, email: String!, password: String!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
    logout: Boolean!

    createUser(name: String!, email: String!, password: String): User!
    createProject(name: String!, userId: Int): Project!
    deleteProject(id: Int!): Boolean!

    createColumn(projectId: Int!, name: String!, color: String): Column!
    deleteColumn(id: Int!): Boolean!
    renameColumn(id: Int!, name: String!): Column!

    createTask(title: String!, projectId: Int!, status: String): Task!
    updateTaskStatus(taskId: Int!, status: String!): Task!
    updateTaskTitle(taskId: Int!, title: String!): Task!
    updateTaskNote(taskId: Int!, note: String!): Task!
    deleteTask(taskId: Int!): Boolean!

    createSubTask(title: String!, taskId: Int!): SubTask!
    toggleSubTask(id: Int!): SubTask!
    deleteSubTask(id: Int!): Boolean!

    deleteAttachment(id: Int!): Boolean!
  }

  type Subscription {
    activityLogged: ActivityLog!
  }
`;

module.exports = { typeDefs };
