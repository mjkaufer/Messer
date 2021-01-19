const chalk = require("chalk");
const helpers = require("../../util/helpers.js");

const MENTIONS_REGEX = /.*@([A-z]+(?:\s[A-z]+)?).*/;

const getThreadByName = (messen, nameQuery) => {
  return messen.store.threads.getThread({ name: nameQuery }).then(thread => {
    if (thread) return thread;
    return messen.store.users.getUser({ name: nameQuery }).then(user => {
      if (!user)
        throw new Error(
          `User '${nameQuery}' could not be found in your friends list!`,
        );
      return {
        threadID: user.id,
        name: user.name,
      };
    });
  });
};
exports.getThreadByName = getThreadByName;

exports.getThreadHistory = (messen, rawThreadName, messageCount = 5) => {
  return getThreadByName(messen, rawThreadName).then(thread => {
    if (!thread) throw new Error("no thread");

    return new Promise((resolve, reject) => {
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

exports.muteThread = (messen, rawThreadName, seconds = -1) => {
  return getThreadByName(messen, rawThreadName).then(thread => {
    if (!thread) throw new Error("no thread");

    return new Promise((resolve, reject) => {
      return messen.api.muteThread(thread.threadID, seconds, (err, res) => {
        if (err) return reject(err);
        return resolve(res);
      });
    });
  });
};

exports.formatThreadHistory = (messen, threadHistory, prefix = "") => {
  if (threadHistory && threadHistory.length === 0) {
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
        let timeStamp = new Date(
          parseFloat(message.timestamp),
        ).toLocaleString();
        if (message.attachments && message.attachments.length > 0) {
          messageBody += message.attachments
            .map(helpers.parseAttachment)
            .join(", ");
        }

        let logText = `[${timeStamp}] ${sender.name}: ${messageBody}`;
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

exports.parseMessage = (rawMessage, thread) => {
  const message = rawMessage.split("\\n").join("\u000A");
  const rawMentions = message.match(MENTIONS_REGEX) || [];
  const mentions = rawMentions
    .map(mention => {
      const person = thread.participants.find(p => p.name.startsWith(mention));
      if (!person) return;

      return {
        tag: `@${mention}`,
        id: person.userID,
      };
    })
    .filter(Boolean);

  return {
    body: message,
    mentions,
  };
};
