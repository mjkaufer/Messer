const patterns = require("./util/patterns");
const { muteThread } = require("./util/helpers");

module.exports = messer => {
  return {
    primaryCommand: "mute",

    shortcutCommand: undefined,

    help: 'mute "<thread name>" [<seconds>]',

    handler(command) {
      return new Promise((resolve, reject) => {
        const argv = command.match(patterns[2]);
        if (!argv || !argv[2] || (argv[3] && isNaN(argv[3]))) {
          return reject(Error("Invalid command - check your syntax"));
        }

        return muteThread(messer.messen, argv[2], argv[3]).then(resolve);
      });
    },
  };
};
