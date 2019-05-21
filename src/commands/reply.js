const patterns = require("./util/patterns");

module.exports = messer => {
  return {
    primaryCommand: "reply",

    shortcutCommand: "r",

    help: "reply <message>",

    handler(command) {
      return new Promise((resolve, reject) => {
        const argv = command.match(patterns[1]);
        if (!argv || !argv[2]) {
          return reject(Error("Invalid command - check your syntax"));
        }

        const messageBody = argv[2];

        if (messer.lastThread === null) {
          return reject(
            Error(
              "Oops! You need to receive a message on Messer before using `reply`",
            ),
          );
        }

        messer.messen.api.sendMessage(messageBody, messer.lastThread, err => {
          if (err) return reject(err);

          return resolve();
        });
      });
    },
  };
};
