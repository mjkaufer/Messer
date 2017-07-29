const log = require("./log")
const helpers = require("./helpers")
const fbAssets = require("./fb-assets")

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
  message(message) {
    helpers.fetchThreadInfo.call(this, message.threadID)
      .then(helpers.getUserByID.call(this, message.senderID))
      .then((user) => {
        process.stderr.write("\x07") // Terminal notification
        this.lastThread = message.threadID
        let sender = user.fullName || user.name
        let messageBody = message.body
        // if (messageBody !== undefined && messageBody !== "") {
        //   messageBody = "unrenderable in Messer :("
        // }

        if (!user.isFriend) {
          sender += " [not your friend]"
        }

        if (message.isGroup) {
          sender = `(Group) ${sender}`
        }

        if (message.attachments.length > 0) {
          messageBody = message.attachments.reduce((prev, curr) => `${prev}; ${parseAttachment(curr)}`, "")
        }

        log(`${sender} - ${messageBody}`, this.threadCache[message.threadID].color)
      })
      .catch(err => log(err))
  },
  event(ev) {
    switch (ev.logMessageType) {
      case "log:thread-color":
        // update thread color here
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
