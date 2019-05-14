module.exports = messer => {
  return {
    commands: ["mycommand"],

    regexp: /mycommand/,

    help: "mycommand",

    handler() {
      const helpPretty = `Commands:\n${helpers
        .objectValues(commandTypes)
        .filter(command => command.help)
        .map(type => {
          return chalk.blue(type.command);
        })
        .join("\n")}`;

      return new Promise(resolve => resolve(helpPretty));
    },
  };
};
