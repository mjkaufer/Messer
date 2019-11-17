const patterns = require("./util/patterns");
const { parseMessage } = require("./util/helpers");

module.exports = messer => {
  return {
    primaryCommand: "reply",

    shortcutCommand: "r",

    help: "reply <message>",

    handler(command) {
      return new Promise((resolve, reject) => {
        const argv = command.match(patterns[6]);
        if (!argv || !argv[2]) {
          return reject(Error("Invalid command - check your syntax"));
        }

        const { lastThreadId } = messer.state.threads;

        if (!lastThreadId) {
          return reject(
            Error(
              "Oops! You need to receive a message on Messer before using `reply`",
            ),
          );
        }

        return messer.messen.store.threads
          .getThread({ id: lastThreadId })
          .then(thread => {
            const message = parseMessage(argv[2], thread);

            return messer.messen.api.sendMessage(message, lastThreadId, err => {
              if (err) return reject(err);

              return resolve();
            });
          });
      });
    },
  };
};
