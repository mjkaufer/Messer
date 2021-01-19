const patterns = require("./util/patterns");
const { getThreadByName, parseMessage } = require("./util/helpers");
const { encryptMessage } = require("../util/crypto");
const crypto = require("crypto");
const fs = require("fs");

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

        return getThreadByName(messer.messen, rawReceiver)
          .then(thread => {
            if (!thread) {
              throw new Error(
                `User '${rawReceiver}' could not be found in your friends list!`,
              );
            }

            if (!thread.zuccnetPublicKey) {
              throw new Error(`Public key for ${rawReceiver} unknown.`);
            }

            // clean message
            const message = parseMessage(rawMessage, thread);
            const encryptedMessageBody = encryptMessage(
              message.body,
              thread.zuccnetPublicKey,
            );

            message.body = encryptedMessageBody;

            return messer.messen.api.sendMessage(
              message,
              thread.threadID,
              err => {
                if (err) return reject(err);

                return resolve(`Sent encrypted message to ${thread.name}`);
              },
            );
          })
          .catch(err => {
            return reject(err || Error("Failed to send message"));
          });
      });
    },
  };
};
