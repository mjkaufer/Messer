module.exports = messer => {
  return {
    commands: ["mycommand"],

    regexp: /mycommand/,

    help: "mycommand",

    handler(argv) {
      return new Promise((resolve, reject) => {
        if (messer.lastThread === null) {
          return reject(
            Error(
              "ERROR: You need to receive a message on Messer before using `reply`",
            ),
          );
        }

        if (!argv || !argv[2]) {
          return reject(Error("Invalid command - check your syntax"));
        }

        // var body = rawCommand.substring(commandTypes.REPLY.length).trim()

        return messer.messen.api.sendMessage(
          argv[2],
          messer.lastThread,
          err => {
            if (err) return reject(err);

            return resolve();
          },
        );
      });
    },
  };
};
