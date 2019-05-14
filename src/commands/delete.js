const argv = parseCommand(commandTypes.DELETE.regexp, rawCommand);
if (!argv || !argv[2])
  return Promise.reject("Invalid command - check your syntax");

const rawThreadName = argv[2];
const messageCount = argv[3] ? parseInt(argv[3].trim(), 10) : 1;

const deleteMessage = messageId => {
  return new Promise((resolve, reject) => {
    this.messen.api.deleteMessage(messageId, err => {
      if (err) return reject(err);
      return resolve();
    });
  });
};

return getThreadHistory(this.messen, rawThreadName, messageCount).then(
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