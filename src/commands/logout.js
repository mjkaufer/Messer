module.exports = messer => {
  return {
    primaryCommand: "logout",

    help: "logout",

    handler(command) {
      return messer.logout();
    },
  };
};
