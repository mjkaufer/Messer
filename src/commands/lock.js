const patterns = require("./util/patterns");
const { getThreadByName } = require("./util/helpers");

module.exports = messer => {
  return {
    primaryCommand: "lock",

    help: 'lock "<thread-name>" [--secret]',

    handler(command) {
      return new Promise((resolve, reject) => {
        const argv = command.match(patterns[3]);
        if (!argv || !argv[2])
          return reject(Error("Invalid command - check your syntax"));

        const rawReceiver = argv[2];
        const anonymous = argv[3] === "--secret";

        return getThreadByName(messer.messen, rawReceiver)
          .then(thread => {
            messer.lock.lockOn(thread.name, anonymous);
            messer.setPrompt(`${thread.name}${anonymous ? " 🔒" : ""}> `);

            return resolve(
              `Locked on to ${thread.name} ${
                anonymous ? "(anonymous mode)" : ""
              }`,
            );
          })
          .catch(() => {
            return reject(
              Error(
                `Cannot find user "${rawReceiver}" in friends list or active threads`,
              ),
            );
          });
      });
    },
  };
};
