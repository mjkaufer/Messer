const fbAssets = require("./fb-assets");
const helpers = require("./util/helpers.js");

/**
 * See the facebook-chat-api for detailed description of these events
 * https://github.com/Schmavery/facebook-chat-api/blob/master/DOCS.md#apilistencallback
 */
const eventHandlers = {
  /**
   * Handles the "message" event type
   * @param {Object} message - message to handle
   */
  message(ev, lock) {
    if (
      ev.senderID === this.messen.store.users.me.user.id &&
      ev.threadID !== this.messen.store.users.me.user.id
    ) {
      return;
    }

    const { thread } = ev;

    let sender = thread.name;
    let messageBody = ev.body;

    if (ev.attachments.length > 0) {
      messageBody += ev.attachments.map(helpers.parseAttachment).join(", ");
    }

    const logEvent = message => {
      if (!lock.isLocked()) {
        this.log(message, thread.color);
        return;
      }

      const lockName = lock.getLockedTarget();
      if (lockName === thread.name) {
        this.log(eventLog, thread.color);

        if (lock.isAnonymous()) {
          // ew, but whatever
          this.messen.api.deleteMessage(ev.messageID, err => {});
        }
      }
    };

    let eventLog;

    if (ev.isGroup) {
      this.messen.store.users
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

    this.unreadMessagesCount += 1;

    helpers.notifyTerminal(this.unreadMessagesCount); // Terminal notification in title

    process.stderr.write("\x07"); // Terminal notification
    this.lastThread = ev.threadID;
  },
  /**
   * Handles the "event" event type
   * @param {Object} ev - event to handle
   */
  event(ev) {
    let logMessage = "An event happened!";

    switch (ev.logMessageType) {
      case "log:thread-color":
        Object.assign(ev.thread, {
          color: `#${ev.logMessageData.theme_color.slice(2)}`,
        });
        logMessage = ev.logMessageBody;
        break;
      default:
        break;
    }

    log(logMessage);
  },
  typ() {},
  read_receipt() {},
  message_reaction() {},
};

module.exports = eventHandlers;
