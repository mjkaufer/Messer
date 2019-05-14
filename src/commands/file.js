module.exports = messer => {
  return {
    commands: ["mycommand"],

    help: "mycommand",

    parseCommand(rawCommand) {
      return {
        
      }
    }

    handler(argv) {
      return new Promise((resolve, reject) => {
        if (!argv || !argv[2] || !argv[3])
          return reject(Error("Invalid command - check your syntax"));

        const rawReceiver = argv[2];
        const filePath = argv[3];
        const message = argv[4];

        if (filePath.length === 0) {
          return reject(Error("No file to send - check your syntax"));
        }

        let file;
        try {
          file = fs.createReadStream(filePath);
        } catch (e) {
          return reject(Error("File could't be found - check your path"));
        }

        return getThreadByName(this.messen, rawReceiver)
          .then(thread => {
            if (!thread) throw new Error("No thread found");

            return this.messen.api.sendMessage(
              {
                body: message,
                attachment: file,
              },
              thread.threadID,
              err => {
                if (err) return reject(err);

                return resolve(`File sent to ${thread.name}`);
              },
            );
          })
          .catch(e => {
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
