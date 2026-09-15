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

  type Project {
    id: ID!
    name: String!
    user: User!
    userId: Int!
    tasks: [Task!]!
  }

  type Task {
    id: ID!
    title: String!
    completed: Boolean!
    status: String!
    project: Project!
    projectId: Int!
    subtasks: [SubTask!]!
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
    getRecentLogs: [ActivityLog!]!
  }

  type Mutation {
    register(name: String!, email: String!, password: String!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
    logout: Boolean!

    createUser(name: String!, email: String!, password: String): User!
    createProject(name: String!, userId: Int): Project!
    deleteProject(id: Int!): Boolean!

    createTask(title: String!, projectId: Int!, status: String): Task!
    updateTaskStatus(taskId: Int!, status: String!): Task!
    updateTaskTitle(taskId: Int!, title: String!): Task!
    deleteTask(taskId: Int!): Boolean!

    createSubTask(title: String!, taskId: Int!): SubTask!
    toggleSubTask(id: Int!): SubTask!
    deleteSubTask(id: Int!): Boolean!
  }

  type Subscription {
    activityLogged: ActivityLog!
  }
`;

module.exports = { typeDefs };
