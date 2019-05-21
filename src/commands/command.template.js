module.exports = messer => {
  return {
    primaryCommand: "mycommand",

    shortcutCommand: "mc",

    help: "mycommand <my-argument>",

    handler(command) {
      return new Promise((resolve, reject) => {
        return resolve();
      });
    },
  };
};
