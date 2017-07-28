const log = require("./log")
const helpers = require("./helpers")
const fbAssets = require("./fb-assets")

/**
 * See the facebook-chat-api for detailed description of these events
 * https://github.com/Schmavery/facebook-chat-api/blob/master/DOCS.md#apilistencallback
 */
const eventHandlers = {
  message(message) {
    // TODO: break this up...

    helpers.fetchThreadInfo()
      .then(helpers.getUserByID.call(this, message.senderID))
      .then((user) => {
        let sender = user.fullName || user.name
        if (!user.isFriend) {
          sender += " [not your friend]"
        }

        if (message.participantNames && message.participantNames.length > 1) {
          sender = `'${sender}' (${message.senderName})`
        }

        let messageBody = null

        if (message.body !== undefined && message.body !== "") {
          messageBody = message.body
        } else {
          messageBody = "unrenderable in Messer :("
        }

        process.stderr.write("\x07") // Terminal notification

        if (message.attachments.length === 0) {
          log(`New message from ${sender} - ${messageBody}`, this.threadCache[message.threadID].color)
        } else {
          const attachment = message.attachments[0] // only first attachment
          const attachmentType = attachment.type.replace(/_/g, " ")

          if (attachmentType === "sticker") {
            messageBody =
              fbAssets.facebookStickers[attachment.packID][attachment.stickerID] ||
              messageBody
          }

          log(`New ${attachmentType} from ${sender} - ${messageBody}`, this.threadCache[message.threadID].color)
        }

        this.lastThread = message.threadID
      })
  },
  event() {

  },
  typ() {

  },
  read_receipt() {

  },
  message_reaction() {

  },
}

module.exports = eventHandlers
