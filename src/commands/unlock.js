module.exports = messer => {
  return {
    commands: ["mycommand"],

    regexp: /mycommand/,

    help: "mycommand",

    handler() {
      return new Promise((resolve, reject) => {
        if (lock.isLocked()) {
          const threadName = lock.getLockedTarget();
          lock.unlock();
          this.setReplPrompt("> ");
          return resolve(`Unlocked from ${threadName}`);
        }
        return reject(Error("No current locked user"));
      });
    },
  };
};
