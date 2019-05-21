module.exports = messer => {
  return {
    primaryCommand: "clear",

    help: "clear",

    handler(command) {
      return Promise.resolve().then(() => {
        return messer.clear();
      });
    },
  };
};
