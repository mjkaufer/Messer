const patterns = require("./util/patterns");
const { getThreadByName } = require("./util/helpers");
const { setUserPublicKey } = require("../messer/public_keys");

module.exports = messer => {
  return {
    primaryCommand: "public_key",

    shortcutCommand: "pk",

    help: 'pk "<user name>" <path to public key file>',

    handler(command) {
      return new Promise((resolve, reject) => {
        const argv = command.match(patterns[0]);
        if (!argv || !argv[2] || !argv[3]) {
          return reject(Error("Invalid message - check your syntax"));
        }

        const rawReceiver = argv[2];
        const publicKeyPath = argv[3];

        return getThreadByName(messer.messen, rawReceiver)
          .then(thread => {
            if (!thread) {
              throw new Error(
                `User '${rawReceiver}' could not be found in your friends list!`,
              );
            }

            return setUserPublicKey(
              messer.messen,
              thread.threadID,
              publicKeyPath,
            );
          })
          .then(() => {
            return resolve();
          })
          .catch(err => {
            return reject(err || "Failed to set public key for user.");
          });
      });
    },
  };
};
