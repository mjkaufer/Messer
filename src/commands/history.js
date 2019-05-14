module.exports = messer => {
  return {
    commands: ["mycommand"],

    regexp: /mycommand/,

    help: "mycommand",

    handler() {
      const DEFAULT_COUNT = 5;

      const argv = parseCommand(commandTypes.HISTORY.regexp, rawCommand);
      if (!argv) return Promise.reject("Invalid command - check your syntax");

      const rawThreadName = argv[2];
      const messageCount = argv[3]
        ? parseInt(argv[3].trim(), 10)
        : DEFAULT_COUNT;

      return getThreadHistory(this.messen, rawThreadName, messageCount)
        .then(threadHistory => {
          return formatThreadHistory(this.messen, threadHistory);
        })
        .catch(err => {
          throw new Error(`We couldn't find a thread for '${rawThreadName}'!`);
        });
    },
  };
};
