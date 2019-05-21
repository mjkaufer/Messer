const patterns = require("./util/patterns");

module.exports = messer => {
  return {
    primaryCommand: "--unlock",

    help: "--unlock",

    handler(command) {
      return new Promise((resolve, reject) => {
        if (!messer.lock.isLocked()) {
          return reject(Error("No current locked user"));
        }

        const threadName = messer.lock.getLockedTarget();
        messer.lock.unlock();
        messer.setPrompt("> ");
        return resolve(`Unlocked from ${threadName}`);
      });
    },
  };
};
