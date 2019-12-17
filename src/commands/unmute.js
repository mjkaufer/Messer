const patterns = require("./util/patterns");
const { muteThread } = require("./util/helpers");

module.exports = messer => {
  return {
    primaryCommand: "unmute",

    shortcutCommand: undefined,

    help: 'mute "<thread name>"',

    handler(command) {
      return new Promise((resolve, reject) => {
        const argv = command.match(patterns[2]);
        if (!argv || !argv[2]) {
          return reject(Error("Invalid command - check your syntax"));
        }

        return muteThread(messer.messen, argv[2], 0).then(resolve);
      });
    },
  };
};
