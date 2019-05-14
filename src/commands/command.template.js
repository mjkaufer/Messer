module.exports = messer => {
  return {
    commands: ["mycommand"],

    regexp: /mycommand/,

    help: "mycommand",

    handler() {
      return new Promise((resolve, reject) => {
        return resolve();
      });
    },
  };
};
