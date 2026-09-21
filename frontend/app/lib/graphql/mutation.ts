import { gql } from '@apollo/client';

export const REGISTER = gql`
  mutation Register($name: String!, $email: String!, $password: String!) {
    register(name: $name, email: $email, password: $password) {
      user {
        id
        name
        email
      }
      token
    }
  }
`;

export const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      user {
        id
        name
        email
      }
      token
    }
  }
`;

export const LOGOUT = gql`
  mutation Logout {
    logout
  }
`;

export const CREATE_USER = gql`
  mutation CreateUser($name: String!, $email: String!, $password: String) {
    createUser(name: $name, email: $email, password: $password) {
      id
      name
      email
    }
  }
`;

export const CREATE_PROJECT = gql`
  mutation CreateProject($name: String!, $userId: Int) {
    createProject(name: $name, userId: $userId) {
      id
      name
    }
  }
`;

export const DELETE_PROJECT = gql`
  mutation DeleteProject($id: Int!) {
    deleteProject(id: $id)
  }
`;

export const CREATE_TASK = gql`
  mutation CreateTask($title: String!, $projectId: Int!, $status: String) {
    createTask(title: $title, projectId: $projectId, status: $status) {
      id
      title
      note
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

export const UPDATE_TASK_STATUS = gql`
  mutation UpdateTaskStatus($taskId: Int!, $status: String!) {
    updateTaskStatus(taskId: $taskId, status: $status) {
      id
      status
      completed
      title
      note
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

export const UPDATE_TASK_NOTE = gql`
  mutation UpdateTaskNote($taskId: Int!, $note: String!) {
    updateTaskNote(taskId: $taskId, note: $note) {
      id
      note
    }
  }
`;

export const UPDATE_TASK_TITLE = gql`
  mutation UpdateTaskTitle($taskId: Int!, $title: String!) {
    updateTaskTitle(taskId: $taskId, title: $title) {
      id
      title
      note
      status
      completed
      projectId
    }
  }
`;

export const DELETE_TASK = gql`
  mutation DeleteTask($taskId: Int!) {
    deleteTask(taskId: $taskId)
  }
`;

export const CREATE_SUBTASK = gql`
  mutation CreateSubTask($title: String!, $taskId: Int!) {
    createSubTask(title: $title, taskId: $taskId) {
      id
      title
      done
      taskId
    }
  }
`;

export const TOGGLE_SUBTASK = gql`
  mutation ToggleSubTask($id: Int!) {
    toggleSubTask(id: $id) {
      id
      title
      done
      taskId
    }
  }
`;

export const DELETE_SUBTASK = gql`
  mutation DeleteSubTask($id: Int!) {
    deleteSubTask(id: $id)
  }
`;

export const CREATE_COLUMN = gql`
  mutation CreateColumn($projectId: Int!, $name: String!, $color: String) {
    createColumn(projectId: $projectId, name: $name, color: $color) {
      id
      name
      slug
      order
      color
      projectId
    }
  }
`;

export const RENAME_COLUMN = gql`
  mutation RenameColumn($id: Int!, $name: String!) {
    renameColumn(id: $id, name: $name) {
      id
      name
      slug
      order
      color
      projectId
    }
  }
`;

export const DELETE_COLUMN = gql`
  mutation DeleteColumn($id: Int!) {
    deleteColumn(id: $id)
  }
`;

export const DELETE_ATTACHMENT = gql`
  mutation DeleteAttachment($id: Int!) {
    deleteAttachment(id: $id)
  }
`;
