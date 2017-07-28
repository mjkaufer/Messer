#!/usr/bin/env node

/* Imports */
const facebook = require("facebook-chat-api")
const repl = require("repl")

const fbAssets = require("./fb-assets.js")
const helpers = require("./helpers.js")
const getCommandHandler = require("./commands").getCommandHandler

/**
 * Messer creates a singleton that represents a Messer session 
 */
function Messer() {
  this.api = null
  this.user = null
  this.lastThread = null
  this.userCache = null // cache non-friends
}

Messer.prototype.authenticate = function (credentials) {
  return new Promise((resolve, reject) => {
    facebook(credentials, (err, fbApi) => {
      if (err) return reject(`Failed to login as [${credentials.email}] - ${err}`)

      fbApi.setOptions({
        logLevel: "silent",
      })
      this.api = fbApi

      console.info("Fetching your details...")

      return helpers.fetchCurrentUser.call(this).then((user) => {
        this.user = user
        this.user.email = credentials.email

        return resolve()
      })
    })
  })
}

Messer.prototype.start = function () {
  helpers.getCredentials()
    .then(credentials => this.authenticate(credentials))
    .then(() => {
      console.info(`Successfully logged in as ${this.user.email}`)

      this.api.listen((err, message) => {
        if (err) return null
        return this.handleInboundMessage(message)
      })

      repl.start({
        ignoreUndefined: true,
        eval: (input, context, filename, cb) => this.processCommand(input, cb),
      })
    })
    .catch(() => {})
}

/**
 * Handles incoming messages by logging appropriately.
 */
Messer.prototype.handleInboundMessage = function (message) {
  // seen message (not sent)
  if (!message.senderID || message.type !== "message") return

  // TODO: break this up...
  helpers.getUserByID.call(this, message.senderID)
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
        console.log(`New message from ${sender} - ${messageBody}`)
      } else {
        const attachment = message.attachments[0] // only first attachment
        const attachmentType = attachment.type.replace(/_/g, " ")

        if (attachmentType === "sticker") {
          messageBody =
            fbAssets.facebookStickers[attachment.packID][attachment.stickerID] ||
            messageBody
        }

        console.log(`New ${attachmentType} from ${sender} - ${messageBody}`)
      }

      this.lastThread = message.threadID
    })
}

/**
 * Execute appropriate action for user input commands
 */
Messer.prototype.processCommand = function (rawCommand, callback) {
  // ignore if rawCommand is only spaces
  if (rawCommand.trim().length === 0) return null

  const args = rawCommand.replace("\n", "").split(" ")
  const commandHandler = getCommandHandler(args[0])

  if (!commandHandler) {
    return console.error("Invalid command - check your syntax")
  }

  return commandHandler.call(this, rawCommand)
    .then((message) => {
      console.log(message)
      callback(null)
    })
    .catch((err) => {
      console.log(err)
      callback(null)
    })
}

// create new Messer instance
const messer = new Messer()
messer.start()