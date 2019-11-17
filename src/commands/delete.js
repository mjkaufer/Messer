const patterns = require("./util/patterns");
const { getThreadHistory } = require("./util/helpers");

module.exports = messer => {
  return {
    primaryCommand: "delete",

    help: 'delete "<thread-name>" [n]',

    handler(command) {
      const argv = command.match(patterns[2]);
      if (!argv || !argv[2])
        return Promise.reject(Error("Invalid command - check your syntax"));

      const rawThreadName = argv[2];
      const messageCount = argv[3] ? parseInt(argv[3].trim(), 10) : 1;

      const deleteMessage = messageId => {
        return new Promise((resolve, reject) => {
          messer.messen.api.deleteMessage(messageId, err => {
            if (err) return reject(err);
            return resolve();
          });
        });
      };

      return getThreadHistory(messer.messen, rawThreadName, messageCount).then(
        threadHistory => {
          return Promise.all(
            threadHistory.map(thread => {
              return deleteMessage(thread.messageID);
            }),
          ).then(deleted => {
            return `Last ${deleted.length} messages deleted.`;
          });
        },
      );
    },
  };
};
