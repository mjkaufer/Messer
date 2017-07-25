/* Command type constants */
const commandEnum = {
	MESSAGE: "message",
	REPLY: "reply",
	CONTACTS: "contacts",
	HELP: "help"
}

const commandShortcuts = {
	"r": commandEnum.REPLY,
	"m": commandEnum.MESSAGE
}

const commands = {
	/**
	 * Sends message to given user
	 */
	[commandEnum.MESSAGE](rawCommand) {
		const quoteReg = /(".*?")(.*)/g
		// to get length of first arg
		const args = rawCommand.replace("\n", "").split(" ")
		const cmd = rawCommand.substring(args[0].length).trim()

		if (cmd.match(quoteReg) == null) {
			console.warn("Invalid message - check your syntax")
			return processCommand("help")
		}

		const decomposed = quoteReg.exec(cmd)
		const rawReceiver = decomposed[1].replace(/"/g, "")
		const message = decomposed[2].trim()

		if (message.length == 0) {
			console.warn("No message to send - check your syntax")
			return processCommand("help")
		}

		// Find the given receiver in the users friendlist
		const receiver = user.friendsList.find(f => {
			return f.fullName.toLowerCase().startsWith(rawReceiver.toLowerCase())
		})

		if (!receiver) {
			console.warn(`User '${rawReceiver}' could not be found in your friends list!`)
			return
		}

		api.sendMessage(message, receiver.userID, err => {
			if (err) return console.error("ERROR:", err.error)

			console.log(`Sent message to ${receiver.fullName}`)
		})
	},

	/**
	 * Replies with a given message to the last received thread.
	 */
	[commandEnum.REPLY](rawCommand) {
		if (lastThread === null) {
			return console.warn("Error - can't reply to messages you haven't yet received! You need to receive a message before using `reply`!")
		}

		const args = rawCommand.replace("\n", "").split(" ")
		const body = rawCommand.substring(args[0].length).trim()

		// var body = rawCommand.substring(commandEnum.REPLY.length).trim()

		api.sendMessage(body, lastThread, err => {
			if (err) return console.error("ERROR:", err.error)

			console.log("✓")
		})
	},

	/**
	 * Displays users friend list
	 */
	[commandEnum.CONTACTS]() {
		if (user.friendsList.length === 0) {
			console.log("You have no friends :cry:")
		}
		user.friendsList.forEach(f => { console.log(f.fullName) })
	},

	/**
	 * Displays usage instructions
	 */
	[commandEnum.HELP]() {
		console.log("Commands:\n" +
			"\tmessage \"[user]\" [message]\n" +
			"\tcontacts\n"
		)
	}
}

/**
 * Execute appropriate action for user input commands
 */
function processCommand(rawCommand) {
	// ignore if rawCommand is only spaces
	if (rawCommand.trim().length === 0) return null

	const args = rawCommand.replace("\n", "").split(" ")
	const command = commandShortcuts[args[0]] || args[0]
	const commandHandler = this.commands[command]

	if (!commandHandler) {
		return console.error("Invalid command - check your syntax")
	}

	return commandHandler(rawCommand)
}

module.exports = {
	processCommand,
	commands,
}
