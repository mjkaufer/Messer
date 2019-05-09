const getThreadByName = (messen, nameQuery) => {
  return messen.store.threads.getThread({ name: nameQuery }).then(thread => {
    if (thread) return thread;
    return messen.store.users.getUser({ name: nameQuery }).then(user => {
      if (!user) throw new Error();
      return {
        threadID: user.id,
        name: user.name,
      };
    });
  });
};
exports.getThreadByName = getThreadByName;

exports.getThreadHistory = (messen, rawThreadName, messageCount = 5) => {
  return new Promise((resolve, reject) => {
    getThreadByName(rawThreadName).then(thread => {
      if (!thread) throw new Error("no thread");
      return messen.api.getThreadHistory(
        thread.threadID,
        messageCount,
        undefined,
        (err, threadHistory) => {
          if (err) return reject(err);

          return resolve(threadHistory);
        },
      );
    });
  });
};
