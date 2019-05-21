module.exports = messer => {
  return {
    primaryCommand: "contacts",

    help: "contacts",

    handler(command) {
      return new Promise(resolve => {
        const { friends } = messer.messen.store.users.me;
        if (friends.length === 0) return resolve("You have no friends 😢");

        const friendsPretty = friends
          .sort((a, b) => (a.name > b.name ? 1 : -1))
          .map(user => user.name)
          .join("\n");

        return resolve(friendsPretty);
      });
    },
  };
};
