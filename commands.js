const helpers = require("./helpers")

/* Command type constants */
const commandEnum = {
	MESSAGE: "message",
	REPLY: "reply",
	CONTACTS: "contacts",
	HELP: "help",
	READ: "read",
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
		const args = rawCommand.replace("\n", "").split(" ")
		const cmd = rawCommand.substring(args[0].length).trim()

		const quoteReg = /(".*?")(.*)/g
		if (cmd.match(quoteReg) == null) {
			console.warn("Invalid message - check your syntax")
			return this.processCommand()
		}

		const decomposed = quoteReg.exec(cmd)
		const rawReceiver = decomposed[1].replace(/"/g, "")
		const message = decomposed[2].trim()

		if (message.length === 0) {
			console.warn("No message to send - check your syntax")
			return this.processCommand()
		}

		// Find the given receiver in the users friendlist
		const receiver = helpers.getFriendByName.call(this, rawReceiver)

		this.api.sendMessage(message, receiver.userID, err => {
			if (err) return console.error("ERROR:", err.error)

			console.log(`Sent message to ${receiver.fullName}`)
		})
	},

	/**
	 * Replies with a given message to the last received thread.
	 */
	[commandEnum.REPLY](rawCommand) {
		if (this.lastThread === null) {
			return console.warn("Error - can't reply to messages you haven't yet received! You need to receive a message before using `reply`!")
		}

		const args = rawCommand.replace("\n", "").split(" ")
		const body = rawCommand.substring(args[0].length).trim()

		// var body = rawCommand.substring(commandEnum.REPLY.length).trim()

		this.api.sendMessage(body, this.lastThread, err => {
			if (err) return console.error("ERROR:", err.error)

			console.log("✓")
		})
	},

	/**
	 * Displays users friend list
	 */
	[commandEnum.CONTACTS]() {
		if (this.user.friendsList.length === 0) {
			console.log("You have no friends :cry:")
		}
		this.user.friendsList.forEach(f => { console.log(f.fullName) })
	},

	/**
	 * Displays usage instructions
	 */
	[commandEnum.HELP]() {
		console.log("Commands:\n" +
			"\tmessage \"[user]\" [message]\n" +
			"\tcontacts\n"
		)
	},

	/**
	* Retrieves last n messages from specified friend
	*/
	[commandEnum.READ](rawCommand) {
		const quoteReg = /(".*?")(.*)/g
		// to get length of first arg
		const args = rawCommand.replace("\n", "").split(" ")
		const cmd = rawCommand.substring(args[0].length).trim()

		if (cmd.match(quoteReg) == null) {
			console.warn("Invalid message - check your syntax")
			return this.processCommand("help")
		}

		const decomposed = quoteReg.exec(cmd)
		const rawReceiver = decomposed[1].replace(/"/g, "")
		let messageCount = Number.parseInt(decomposed[2].trim())

		if (Number.isNaN(messageCount)) {
			messageCount = 5
		}

		// Find the given reciever in the users friendlist
		const receiver = helpers.getFriendByName.call(this, rawReceiver)

		this.api.getThreadHistory(receiver.userID, messageCount, undefined, (err, history) => {
			if (err) return console.log("ERROR:", err.error)
			history.forEach(cv => { console.log(`${cv.senderName}: ${cv.body}`) })
		})
	},
}

function getCommandHandler(rawCommandKeyword) {
	const command = commandShortcuts[rawCommandKeyword] || rawCommandKeyword
	return commands[command]
}

module.exports = {
	getCommandHandler,
}
