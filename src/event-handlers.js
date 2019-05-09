const log = require("./util/log");
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
  message(ev) {
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

    if (ev.isGroup) {
      this.messen.store.users
        .getUser({ id: ev.senderID })
        .then(sendingUser => {
          sender = `(${thread.name}) ${sendingUser.name}`; // Get true sender name from list
          log(
            `${this.lastThread !== ev.threadID &&
              "\n"}${sender} - ${messageBody}`,
            thread.color,
          );
        })
        .catch(() => {
          sender = `(${thread.name}) ${sender.name}`; // Sender not in list, keep origin
          log(
            `${this.lastThread !== ev.threadID &&
              "\n"}${sender} - ${messageBody}`,
            thread.color,
          );
        });
    } else {
      log(
        `${this.lastThread !== ev.threadID && "\n"}${sender} - ${messageBody}`,
        thread.color,
      );
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
