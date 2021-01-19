const { notifyTerminal, parseAttachment } = require("../util/helpers");
const { decryptMessage } = require("../util/crypto");

module.exports = messer => {
  return {
    eventType: "message",

    handler(ev) {
      if (
        ev.senderID === messer.messen.store.users.me.user.id &&
        ev.threadID !== messer.messen.store.users.me.user.id
      ) {
        return;
      }

      const { thread } = ev;

      let sender = thread.name;
      const messageBodyEncrypted = ev.body;
      let messageBody = decryptMessage(messageBodyEncrypted);

      if (ev.attachments.length > 0) {
        messageBody += ev.attachments.map(parseAttachment).join(", ");
      }

      const logEvent = message => {
        if (!messer.lock.isLocked()) {
          messer.log(message, thread.color);
          return;
        }

        // I think leave this out for now. Undecided on the UX
        // const lockName = messer.lock.getLockedTarget();
        // if (lockName === thread.name) {
        messer.log(message, thread.color);

        if (messer.lock.isSecret()) {
          // ew, but whatever
          messer.messen.api.deleteMessage(ev.messageID, () => {});
        }
        // }
      };

      if (ev.isGroup) {
        messer.messen.store.users
          .getUser({ id: ev.senderID })
          .then(sendingUser => {
            sender = `(${thread.name}) ${sendingUser.name}`;
            logEvent(`${sender} - ${messageBody}`);
          })
          .catch(() => {
            sender = `(${thread.name}) ${sender.name}`; // Sender not in list, keep origin
            logEvent(`${sender} - ${messageBody}`);
          });
      } else {
        logEvent(`${sender} - ${messageBody}`);
      }

      messer.state.threads.unreadThreadIds.push(thread.threadID);
      messer.state.threads.lastThreadId = ev.threadID;

      notifyTerminal(new Set(messer.state.threads.unreadThreadIds).size); // Terminal notification in title
      process.stderr.write("\x07"); // Terminal notification
    },
  };
};
