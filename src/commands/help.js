module.exports = messer => {
  return {
    primaryCommand: "help",

    help: "help",

    handler(command) {
      const helpPretty = `Commands:\n${helpers
        .objectValues(commandTypes)
        .filter(command => command.help)
        .map(type => {
          return chalk.blue(type.command);
        })
        .join("\n")}`;

      return Promise.resolve(helpPretty);
    },
  };
};
