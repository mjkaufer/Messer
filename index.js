#!/usr/bin/env node
"use strict"

/* Imports */
const facebook = require("facebook-chat-api")
const repl = require("repl")

const fbAssets = require("./fb-assets.js")
const helpers = require("./helpers.js")
const commands = require("./commands")

/**
 * Messer creates a singleton that represents a Messer session 
 */
function Messer() {
	this.lastThread = null

	const credentials = helpers.getCredentials(process.argv[2])

	this.authenticate(credentials, function () {
		console.info(`Successfully logged in as ${credentials.email}`)

		this.api.listen((err, message) => {
			if (err) return
			this.handleInboundMessage(message)
		})

		repl.start({
			ignoreUndefined: true,
			eval(cmd) {
				this.processCommand(cmd)
			}
		})
	})
}

Messer.prototype.authenticate = function (credentials, callback) {
	facebook(credentials, (err, fbApi) => {
		if (err) return console.error(`Failed to login as [${credentials.email}]`)

		this.api = fbApi // assign to global variable
		api.setOptions({ logLevel: "silent" })

		console.info("Fetching your details...")

		helpers.getCurrentUser().then(user => {
			this.user = user

			callback()
		})
	})
}

/**
 * Handles incoming messages by logging appropriately.
 */
Messer.prototype.handleInboundMessage = function (message) {
	// seen message (not sent)
	if (!message.senderID || message.type !== "message") return

	let senderObj = helpers.getUser(message.senderID)
	let sender = senderObj.fullName || senderObj.name || "Unknown User"
	if (!senderObj.isFriend) {
		sender += " [not your friend]"
	}

	if (message.participantNames && message.participantNames.length > 1) {
		sender = `'${sender}' (${message.senderName})`
	}

	let messageBody = null

	if (message.body !== undefined && message.body != "") {
		messageBody = message.body
	} else {
		messageBody = "unrenderable in Messer :("
	}

	process.stderr.write("\x07")	// Terminal notification

	if (message.attachments.length === 0) {
		console.log(`New message from ${sender} - ${messageBody}`)
	} else {
		const attachment = message.attachments[0] // only first attachment
		const attachmentType = attachment.type.replace(/\_/g, " ")

		if (attachmentType === "sticker") {
			messageBody = fbAssets.facebookStickers[attachment.packID][attachment.stickerID] || messageBody
		}

		console.log(`New ${attachmentType} from ${sender} - ${messageBody}`)
	}

	this.lastThread = message.threadID
}

Object.assign(Messer.prototype, commands)

// create new Messer instance
new Messer()
