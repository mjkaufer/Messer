module.exports = messer => {
  return {
    commands: ["mycommand"],

    regexp: /mycommand/,

    help: "mycommand",

    handler() {
      return new Promise((resolve, reject) => {
        const argv = parseCommand(commandTypes.LOCK.regexp, rawCommand);
        if (!argv) return reject(Error("Invalid command - check your syntax"));

        const rawReceiver = argv[2];
        const anonymous = argv[3] === "--secret";

        return getThreadByName(this.messen, rawReceiver)
          .then(thread => {
            lock.lockOn(thread.name, anonymous);
            this.setReplPrompt(`${thread.name}${anonymous ? " 🔒" : ""}> `);

            return resolve(
              `Locked on to ${thread.name} ${
                anonymous ? "(anonymous mode)" : ""
              }`,
            );
          })
          .catch(err => {
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
