import { gql } from '@apollo/client';

export const ACTIVITY_LOGGED_SUBSCRIPTION = gql`
  subscription OnActivityLogged {
    activityLogged {
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
