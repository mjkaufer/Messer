#! /usr/bin/env node

/* imports */
var login = require("facebook-chat-api")
var repl = require("repl")

/* Global variables */
var api
var user = {} // store for user details
var lastThread = null

/* Command type constants */
var commands = {
	MESSAGE: "message",
	CONTACTS: "contacts",
	HELP: "help"
}

/* Initialisation */
if (process.argv.length < 3) {
	//	User didn't store credentials in JSON, make them manually enter credentials

	var prompt = require("prompt")
	console.log("Enter your Facebook credentials - your password will not be visible as you type it in")
	prompt.start()

	prompt.get([{
		name: 'email',
		required: true
	}, {
		name: 'password',
		hidden: true,
		conform: function (value) {
			return true
		}
	}], function (err, result) {
		authenticate(result)
	})

} else {
	var fs = require('fs')
	fs.readFile(process.argv[2], function (err, data) {
		if (err)
			return console.log(err)

		authenticate(JSON.parse(data))
	})
}

/**
 * Fetches and stores all relevant user details using a promise.
 */
function getUserDetails() {
	console.log("Fetching user details...")
	return promise = new Promise(function (resolve, reject) {
		api.getFriendsList(function (err, data) {
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
	var from = user.friendsList.find(function (f) { return f.userID === message.senderID }).fullName

	if (message.participantNames && message.participantNames.length > 1)
		from = "'" + from + "'" + " (" + message.senderName + ")"

	process.stderr.write("\007")	// Makes a beep

	var messageBody = null

	if (message.type != "message") {
		return
	}
	else if (message.body !== undefined && message.body != "") {
		// console.log("New message from " + from + " - " + message.body)
		messageBody = " - " + message.body
	}

	if (message.attachments.length == 0)
		console.log("New message from " + from + (messageBody || unrenderableMessage))
	else {
		var attachment = message.attachments[0]//only first attachment
		var attachmentType = attachment.type.replace(/\_/g, " ")
		console.log("New " + attachmentType + " from " + from + (messageBody || unrenderableMessage))
	}

	lastThread = message.threadID
}

/**
 * Sends message to given user
 */
function sendMessage(rawCommand) {
	var quoteReg = /(".*?")(.*)/g
	cmd = rawCommand.substring(commands.MESSAGE.length).trim()

	if (cmd.match(quoteReg) == null) {
		console.log("Invalid message - check your syntax")
		processCommand("help")
	}

	var decomposed = quoteReg.exec(cmd)
	var rawReceiver = decomposed[1].replace(/"/g, "")
	var message = decomposed[2].trim()

	if (message.length == 0) {
		console.log("No message to send - check your syntax")
		processCommand("help")
	}

	var receiver = user.friendsList.find(function (f) { return f.fullName.startsWith(rawReceiver) });

	api.sendMessage(message, receiver.userID, function (err) {
		if (err) {
			console.log("ERROR!", err)
		}
		console.log("Sent message to " + receiver.fullName);
	})
}

/**
 * Execute appropriate action for user input commands
 */
function processCommand(rawArgs, cb) {
	var args = rawArgs.replace('\n', '').split(' ');
	console.log(rawArgs)
	if (args[0].toLowerCase() === commands.MESSAGE) {
		sendMessage(rawArgs);
	} else if (args[0].toLowerCase() === commands.HELP) {
		console.log("Commands:\n" +
			"\tmessage \"[user]\" [message]\n" +
			"\tcontacts\n"
		)
	} else if (args[0].toLowerCase() === commands.CONTACTS) {
		user.friendsList.forEach(function (f) { console.log(f.fullName) })
	} else {
		console.error("Invalid command - check your syntax")
	}
	
	return cb(null);
}

/**
 * Initialise Messer
 */
function authenticate(credentials) {
	// Where credentials is the user's credentials as an object, fields `email` and `password
	login(credentials, function (err, fbApi) {
		if (err) return console.error(err)

		api = fbApi // assign to global variable
		api.setOptions({ logLevel: "silent" })

		console.log("Logged in as " + credentials.email)

		getUserDetails(api, user).then(function () {
			console.log("Listening for incoming messages...")

			// listen for incoming messages
			api.listen(function (err, message) {
				if (err) return console.log(err)
				handleMessage(message)
			})

			// start REPL
			repl.start({
				ignoreUndefined: true,
				eval: function (cmd, context, filename, callback) {
					processCommand(cmd, callback)
				}
			})
		})

	})
}