#! /usr/bin/env node

/* imports */
var login = require("facebook-chat-api")
var repl = require("repl")

/* Command type constants */
var commandEnum = {
	MESSAGE: "message",
	REPLY: "reply",
	CONTACTS: "contacts",
	HELP: "help"
}

/* Global variables */
var api
var user = {} // store for user details
var lastThread = null

/* Initialisation */
if (process.argv.length < 3) {
	//	User didn't store credentials in JSON, make them manually enter credentials

	var prompt = require("prompt")
	console.log("Enter your Facebook credentials - your password will not be visible as you type it in")
	prompt.start()

	prompt.get([{
		name: "email",
		required: true
	}, {
		name: "password",
		hidden: true,
		conform: function (value) {
			return true
		}
	}], function (err, result) {
		authenticate(result)
	})

} else {
	var fs = require("fs")
	fs.readFile(process.argv[2], function (err, data) {
		if (err)
			return console.log(err)

		authenticate(JSON.parse(data))
	})
}

/* command handlers */
var commands = {
  /**
   * Sends message to given user
   */
  message: function (rawCommand) {
    var quoteReg = /(".*?")(.*)/g
    cmd = rawCommand.substring(commandEnum.MESSAGE.length).trim()

    if (cmd.match(quoteReg) == null) {
      console.warn("Invalid message - check your syntax")
      processCommand("help")
    }

    var decomposed = quoteReg.exec(cmd)
    var rawReceiver = decomposed[1].replace(/"/g, "")
    var message = decomposed[2].trim()

    if (message.length == 0) {
      console.warn("No message to send - check your syntax")
      processCommand("help")
    }

    var receiver = user.friendsList.find(function (f) {
      return f.fullName.toLowerCase().startsWith(rawReceiver.toLowerCase())
    })

    if (!receiver)
      console.warn(rawReceiver + " could not be found in your friends list!")

    api.sendMessage(message, receiver.userID, function (err) {
      if (err) {
        console.warn("ERROR!", err)
      }
      console.log("Sent message to " + receiver.fullName)
    })
  },

  /**
   * Replies with a given message to the last received thread.
   */
  reply: function (rawCommand) {
    if (lastThread === null) {
      console.warn("Error - can't reply to messages you haven't yet received! You need to receive a message before using `reply`!")
    }

    var body = rawCommand.substring(commandEnum.REPLY.length).trim()

    api.sendMessage(body, lastThread, function (err, data) {
      if (err) console.error(err)
      console.log("Successfully replied!")
    })
  },

  /**
   * Displays users friend list
   */
  contacts: function () {
    user.friendsList.forEach(function (f) { console.log(f.fullName) })
  },

  /**
   * Displays usage instructions
   */
  help: function () {
    console.log("Commands:\n" +
      "\tmessage \"[user]\" [message]\n" +
      "\tcontacts\n"
    )
  }
}

/**
 * Fetches and stores all relevant user details using a promise.
 */
function getUserDetails() {
	console.info("Fetching user details...")
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

	// seen message (not sent)
	if (!message.senderID)
		return

	var sender = user.friendsList.find(function (f) { return f.userID === message.senderID })
	sender = sender.fullName

	if (message.participantNames && message.participantNames.length > 1)
		sender = "'" + sender + "'" + " (" + message.senderName + ")"

	process.stderr.write("\007")	// Makes a beep

	var messageBody = null

	if (message.type != "message") {
		return
	}
	else if (message.body !== undefined && message.body != "") {
		// console.log("New message sender " + sender + " - " + message.body)
		messageBody = " - " + message.body
	}

	if (message.attachments.length == 0)
		console.log("New message from " + sender + (messageBody || unrenderableMessage))
	else {
		var attachment = message.attachments[0]//only first attachment
		var attachmentType = attachment.type.replace(/\_/g, " ")
		console.log("New " + attachmentType + " from " + sender + (messageBody || unrenderableMessage))
	}

	lastThread = message.threadID
}

/**
 * Execute appropriate action for user input commands
 */
function processCommand(rawCommand, cb) {
	var args = rawCommand.replace('\n', '').split(' ')
	var commandHandler = commands[args[0]]

	if (!commandHandler) {
		console.error("Invalid command - check your syntax")
	} else {
		commandHandler(rawCommand)
	}

	return cb(null)
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

		console.info("Logged in as " + credentials.email)

		getUserDetails(api, user).then(function () {
			console.info("Listening for incoming messages...")

			// listen for incoming messages
			api.listen(function (err, message) {
				if (err) return console.error(err)
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