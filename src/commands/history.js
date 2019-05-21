const patterns = require("./util/patterns");
const { getThreadHistory, formatThreadHistory } = require("./util/helpers");

module.exports = messer => {
  return {
    primaryCommand: "history",

    help: 'history "<thread-name>" [<n>]',

    handler(command) {
      const DEFAULT_COUNT = 5;

      const argv = command.match(patterns[2]);
      if (!argv) return Promise.reject("Invalid command - check your syntax");

      const rawThreadName = argv[2];
      const messageCount = argv[3]
        ? parseInt(argv[3].trim(), 10)
        : DEFAULT_COUNT;

      return getThreadHistory(messer.messen, rawThreadName, messageCount)
        .then(threadHistory => {
          return formatThreadHistory(messer.messen, threadHistory);
        })
        .catch(() => {
          throw new Error(`We couldn't find a thread for '${rawThreadName}'!`);
        });
    },
  };
};
