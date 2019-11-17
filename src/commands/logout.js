module.exports = messer => {
  return {
    primaryCommand: "logout",

    help: "logout",

    handler() {
      return messer.logout();
    },
  };
};
