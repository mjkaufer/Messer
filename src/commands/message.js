const patterns = require("./util/patterns");
const { getThreadByName } = require("./util/helpers");

module.exports = messer => {
  return {
    primaryCommand: "message",

    shortcutCommand: "m",

    help: '(message | m) "<thread-name>" <message>',

    handler(command) {
      return new Promise((resolve, reject) => {
        const argv = command.match(patterns[0]);
        if (!argv || !argv[2] || !argv[3])
          return reject(Error("Invalid message - check your syntax"));

        const rawReceiver = argv[2];
        const rawMessage = argv[3];

        if (rawMessage.length === 0) {
          return reject(Error("No message to send - check your syntax"));
        }

        // clean message
        const message = rawMessage.split("\\n").join("\u000A");

        return getThreadByName(messer.messen, rawReceiver)
          .then(thread => {
            if (!thread) throw new Error("No thread found");

            return messer.messen.api.sendMessage(
              { body: message },
              thread.threadID,
              err => {
                if (err) return reject(err);

                return resolve(`Sent message to ${thread.name}`);
              },
            );
          })
          .catch(() => {
            return reject(
              Error(
                `User '${rawReceiver}' could not be found in your friends list!`,
              ),
            );
          });
      });
    },
  };
};
