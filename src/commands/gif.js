const patterns = require("./util/patterns");
const { getThreadByName, sendRequest } = require("./util/helpers");

module.exports = messer => {
  return {
    primaryCommand: "gif",

    shortcutCommand: "gif",

    help: 'gif "<thread-name>" <gif-keyword>',

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
        sendRequest()
          .then(val => {
            return getThreadByName(messer.messen, rawReceiver)
              .then(thread => {
                if (!thread) throw new Error("No thread found");
                return messer.messen.api.sendMessage(
                  {
                    url: val,
                  },
                  thread.threadID,
                  err => {
                    console.log(err);
                    if (err) return reject(err);
                    return resolve(`Sent message to ${thread.name}`);
                  },
                );
              })
              .catch(err => {
                console.log(err);
                return reject(
                  Error(
                    `User '${rawReceiver}' could not be found in your friends list!`,
                  ),
                );
              });
          })
          .catch(val => {
            console.error(val);
          });
      });
    },
  };
};
