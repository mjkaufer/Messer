exports.getThreadHistory = (messen, rawThreadName, messageCount = 5) => {
  return new Promise((resolve, reject) => {
    return messen.store.threads
      .getThread({ name: rawThreadName })
      .then(thread => {
        if (thread) return thread;
        return messen.store.users
          .getUser({ name: rawThreadName })
          .then(user => {
            if (!user) throw new Error();
            return {
              threadID: user.id,
              name: user.name,
            };
          });
      })
      .then(thread => {
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
