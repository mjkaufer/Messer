const log = require("./log")
const fbAssets = require("./fb-assets")

/**
 * Returns the parsed attachment object as a String
 * @param {Object} attachment 
 */
function parseAttachment(attachment) {
  const attachmentType = attachment.type.replace(/_/g, " ")

  let messageBody = ""

  switch (attachmentType) {
    case "sticker":
      messageBody = fbAssets.facebookStickers[attachment.packID][attachment.stickerID] || "sticker - only viewable in browser"
      break
    case "file":
      messageBody = `${attachment.name}: ${attachment.url}`
      break
    case "photo":
      messageBody = `${attachment.filename}: ${attachment.facebookUrl}`
      break
    case "share":
      messageBody = `${attachment.facebookUrl}`
      break
    case "video":
      messageBody = `${attachment.filename}: ${attachment.url}`
      break
    default:
      messageBody = `${attachmentType} - only viewable in browser`
      break
  }

  return `[${attachmentType}] ${messageBody}`
}

/**
 * See the facebook-chat-api for detailed description of these events
 * https://github.com/Schmavery/facebook-chat-api/blob/master/DOCS.md#apilistencallback
 */
const eventHandlers = {
  /**
   * Handles the "message" event type
   * @param {Object} message 
   */
  message(message) {
    this.getThreadById(message.threadID)
      .then((thread) => {
        if (message.senderID === this.user.userID && message.threadID !== this.user.userID) return

        const user = this.userCache[message.senderID]

        let sender = user.fullName || user.name
        let messageBody = message.body

        if (!user.isFriend && message.senderID !== this.user.userID) {
          sender = `${sender} [not your friend]`
        }

        if (message.isGroup) {
          sender = `(${thread.name}) ${sender}`
        }

        if (message.attachments.length > 0) {
          messageBody = message.attachments.reduce((prev, curr) => `${prev} ${parseAttachment(curr)};`, "")
        }

        log(`${this.lastThread !== message.threadID ? "\n" : ""}${sender} - ${messageBody}`, thread.color)

        process.stderr.write("\x07") // Terminal notification
        this.lastThread = message.threadID
      })
      .catch(err => log(err))
  },
  /**
   * Handles the "message" event type
   * @param {Object} ev 
   */
  event(ev) {
    this.getThreadById(ev.threadID)
      .then((thread) => {
        let logMessage = "An event happened!"

        switch (ev.logMessageType) {
          case "log:thread-color":
            Object.assign(thread, { color: `#${ev.logMessageData.theme_color.slice(2)}` })
            logMessage = ev.logMessageBody
            break
          default:
            break
        }

        log(logMessage)
      })
  },
  typ() {

  },
  read_receipt() {

  },
  message_reaction() {

  },
}

module.exports = eventHandlers
