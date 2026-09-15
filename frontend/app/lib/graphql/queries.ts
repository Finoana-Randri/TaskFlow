import { gql } from '@apollo/client';

export const ME_QUERY = gql`
  query Me {
    me {
      id
      name
      email
      projects {
        id
        name
      }
    }
  }
`;

export const GET_MY_PROJECTS = gql`
  query GetMyProjects {
    myProjects {
      id
      name
      tasks {
        id
        title
        status
        completed
      }
    }
  }
`;

export const GET_USERS_ID = gql`
  query GetUsersId {
    usersId {
      id
      name
      email
    }
  }
`;

export const GET_USERS = gql`
  query GetUsers {
    users {
      id
      name
      email
      projects {
        id
        name
        tasks {
          id
          title
          completed
          subtasks {
            id
            title
            done
          }
        }
      }
    }
  }
`;

export const GET_PROJECT_TASKS = gql`
  query GetProjectTasks($projectId: Int!) {
    getProjectTasks(projectId: $projectId) {
      id
      title
      status
      completed
      projectId
      subtasks {
        id
        title
        done
        taskId
      }
    }
  }
`;

export const GET_RECENT_LOGS = gql`
  query GetRecentLogs {
    getRecentLogs {
      id
      timestamp
      type
      action
      message
      user
      details
    }
  }
`;
