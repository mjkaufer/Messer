module.exports = messer => {
  return {
    primaryCommand: "threads",

    help: "threads",

    handler(command) {
      return new Promise(resolve => {
        const threads = messer.messen.store.threads.getThreadList();
        if (threads.length === 0)
          return resolve("You haven't sent any messages yet!");

        const threadNames = threads.map(thread => thread.name).join("\n");

        return resolve(threadNames);
      });
    },
  };
};
