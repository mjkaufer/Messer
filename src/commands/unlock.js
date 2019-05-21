const patterns = require("./util/patterns");

module.exports = messer => {
  return {
    primaryCommand: "unlock",

    help: "unlock",

    handler(command) {
      return new Promise((resolve, reject) => {
        if (lock.isLocked()) {
          const threadName = lock.getLockedTarget();
          messer.lock.unlock();
          messer.setPrompt("> ");
          return resolve(`Unlocked from ${threadName}`);
        }
        return reject(Error("No current locked user"));
      });
    },
  };
};
