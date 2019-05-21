module.exports = messer => {
  return {
    primaryCommand: "clear",

    help: "clear",

    handler() {
      return Promise.resolve().then(() => {
        return messer.clear();
      });
    },
  };
};
