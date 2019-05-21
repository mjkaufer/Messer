const chalk = require("chalk");
const { objectValues } = require("../util/helpers");

module.exports = messer => {
  return {
    primaryCommand: "help",

    help: "help",

    handler(command) {
      const help = Object.values(messer._commandRegistry.commands)
        .map(command => {
          return `${command.primaryCommand}\n\t${chalk.blue(command.help)}`;
        })
        .join("\n");

      const helpPretty = `Commands:\n\n${help}`;

      return Promise.resolve(helpPretty);
    },
  };
};
