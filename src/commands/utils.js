const chalk = require("chalk");

const getThreadByName = (messen, nameQuery) => {
  return messen.store.threads.getThread({ name: nameQuery }).then(thread => {
    if (thread) return thread;
    return messen.store.users.getUser({ name: nameQuery }).then(user => {
      if (!user) throw new Error();
      return {
        threadID: user.id,
        name: user.name,
      };
    });
  });
};
exports.getThreadByName = getThreadByName;

exports.getThreadHistory = (messen, rawThreadName, messageCount = 5) => {
  return new Promise((resolve, reject) => {
    getThreadByName(messen, rawThreadName).then(thread => {
      if (!thread) throw new Error("no thread");
      return messen.api.getThreadHistory(
        thread.threadID,
        messageCount,
        undefined,
        (err, threadHistory) => {
          if (err) return reject(err);

          return resolve(threadHistory);
        },
      );
    });
  });
};

exports.formatThreadHistory = (messen, threadHistory, prefix = "") => {
  if (threadHistory.length === 0) {
    return "You haven't started a conversation!";
  }

  const senderIds = Array.from(
    new Set(threadHistory.map(message => message.senderID)),
  );

  return messen.store.users.getUsers(senderIds).then(users => {
    const threadHistoryText = threadHistory
      .filter(event => event.type === "message") // TODO include other events here
      .map(message => {
        let sender = users.find(user => user && user.id === message.senderID);
        if (!sender) {
          sender = { name: "unknown" };
        }

        let messageBody = message.body;

        if (message.attachments && message.attachments.length > 0) {
          messageBody += message.attachments
            .map(helpers.parseAttachment)
            .join(", ");
        }

        let logText = `${sender.name}: ${messageBody}`;
        if (message.isUnread) logText = `(unread) ${logText}`;
        if (message.senderID === messen.store.users.me.user.id) {
          logText = chalk.dim(logText);
        }

        return `${prefix}${logText}`;
      })
      .join("\n");

    return threadHistoryText;
  });
};
