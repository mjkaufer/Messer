#!/usr/bin/env node

/* imports */
const repl = require("repl")
const chalk = require("chalk")
const commands = require("./commands")
const Session = require("./session")

/* Command type constants */
const commandEnum = {
	MESSAGE: "message",
	REPLY: "reply",
	CONTACTS: "contacts",
	HELP: "help"
}

const commandMap = {
	"r": commandEnum.REPLY,
	"m": commandEnum.MESSAGE
}

const colors = ["green", "yellow", "blue", "magenta", "cyan", "red"]

/* Initialisation */
if (process.argv.length < 3) {
	//	User didn't store credentials in JSON, make them manually enter credentials

	const prompt = require("prompt")
	console.log("Enter your Facebook credentials - your password will not be visible as you type it in")
	prompt.start()

	prompt.get([{
		name: "email",
		required: true
	}, {
		name: "password",
		hidden: true,
		conform: function(value) {
			return true
		}
	}], function(err, result) {
		authenticate(result)
	})

} else {
	const fs = require("fs")
	fs.readFile(process.argv[2], function(err, data) {
		if (err)
			return console.log(err)

		authenticate(JSON.parse(data))
	})
}

/**
 * Fetches and stores all relevant user details using a promise.
 */
function getUserDetails() {
	console.info("Fetching user details...")
	return promise = new Promise(function(resolve, reject) {
		api.getFriendsList(function(err, data) {
			if (err) return console.error(err)
			user.friendsList = data
			resolve()
		})
	})
}

/**
 * Handles incoming messages by logging appropriately.
 */
function handleMessage(message) {
	var unrenderableMessage = ", unrenderable in Messer :("

	// seen message (not sent)
	if (!message.senderID)
		return

	let sender = user.friendsList.find(function(f) { return f.userID === message.senderID })
	sender = sender.fullName || "Unknown User";

	if (message.participantNames && message.participantNames.length > 1)
		sender = "'" + sender + "'" + " (" + message.senderName + ")"

	process.stderr.write("\007")	// Terminal notification

	let messageBody = null

	if (message.type != "message") {
		return
	}
	else if (message.body !== undefined && message.body != "") {
		// console.log("New message sender " + sender + " - " + message.body)
		messageBody = " - " + message.body
	}

	// add to active conversations if it is new
	if (!activeConversations.indexOf(sender))
		activeConversations.push(sender)

	if (message.attachments.length == 0) {
		const color = colors[activeConversations.length % colors.length]
		console.log(chalk[color]("New message from " + sender + (messageBody || unrenderableMessage)))
	} else {
		const attachment = message.attachments[0]//only first attachment
		const attachmentType = attachment.type.replace(/\_/g, " ")
		console.log("New " + attachmentType + " from " + sender + (messageBody || unrenderableMessage))
	}

	lastThread = message.threadID
}

/**
 * Execute appropriate action for user input commands
 */
function processCommand(rawCommand, cb) {
	const args = rawCommand.replace('\n', '').split(' ')
	const command = commandMap[args[0]] || args[0]
	const commandHandler = commands[command]

	if (!commandHandler) {
		console.error("Invalid command - check your syntax")
	} else {
		commandHandler(rawCommand)
	}

	if (cb)
		return cb(null)
}

// new Session(credentials)
