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
      messageBody = fbAssets.facebookStickers[attachment.packID][attachment.stickerID]
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
      messageBody = "only viewable in browser"
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
        process.stderr.write("\x07") // Terminal notification
        this.lastThread = message.threadID

        const user = this.userCache[message.senderID]

        let sender = user.fullName || user.name
        let messageBody = message.body

        if (!user.isFriend) {
          sender = `${sender} [not your friend]`
        }

        if (message.isGroup) {
          sender = `(Group) ${sender}`
        }

        if (message.attachments.length > 0) {
          messageBody = message.attachments.reduce((prev, curr) => `${prev}; ${parseAttachment(curr)}`, "")
        }

        log(`${sender} - ${messageBody}`, thread.color)
      })
      .catch(err => log(err))
  },
  /**
   * Handles the "message" event type
   * @param {Object} ev 
   */
  event(ev) {
    switch (ev.logMessageType) {
      case "log:thread-color":
        // update thread color here
        break
      default:
        break
    }
  },
  typ() {

  },
  read_receipt() {

  },
  message_reaction() {

  },
}

module.exports = eventHandlers
