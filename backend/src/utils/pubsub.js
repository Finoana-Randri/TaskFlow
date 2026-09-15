const { PubSub } = require('graphql-subscriptions');
const crypto = require('crypto');

const pubsub = new PubSub();

// Ensure both asyncIterator and asyncIterableIterator work across versions
if (!pubsub.asyncIterator && typeof pubsub.asyncIterableIterator === 'function') {
  pubsub.asyncIterator = function (triggers) {
    return this.asyncIterableIterator(triggers);
  };
}
const ACTIVITY_LOGGED = 'ACTIVITY_LOGGED';

const MAX_LOGS = 100;
const recentLogs = [];

function logActivity({ type = 'INFO', action, message, user = null, details = null }) {
  const logEntry = {
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    type: type.toUpperCase(),
    action,
    message,
    user: user || 'Anonymous',
    details: typeof details === 'object' ? JSON.stringify(details) : details,
  };

  recentLogs.unshift(logEntry);
  if (recentLogs.length > MAX_LOGS) {
    recentLogs.pop();
  }

  console.log(`[${logEntry.timestamp}] [${logEntry.type}] [${logEntry.action}] ${logEntry.message} (by ${logEntry.user})`);

  pubsub.publish(ACTIVITY_LOGGED, { activityLogged: logEntry });
  return logEntry;
}

function getRecentLogs() {
  return recentLogs;
}

module.exports = {
  pubsub,
  ACTIVITY_LOGGED,
  logActivity,
  getRecentLogs,
};
