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
  r: commandEnum.REPLY,
  m: commandEnum.MESSAGE,
}

const commands = {
  /**
   * Sends message to given user
   */
  [commandEnum.MESSAGE](rawCommand) {
    return new Promise((resolve, reject) => {
      const args = rawCommand.replace("\n", "").split(" ")
      const cmd = rawCommand.substring(args[0].length).trim()

      const quoteReg = /(".*?")(.*)/g
      if (cmd.match(quoteReg) == null) {
        return reject("Invalid message - check your syntax")
      }

      const decomposed = quoteReg.exec(cmd)
      const rawReceiver = decomposed[1].replace(/"/g, "")
      const message = decomposed[2].trim()

      if (message.length === 0) {
        return reject("No message to send - check your syntax")
      }

      // Find the given receiver in the users friendlist
      const receiver = helpers.getFriendByName.call(this, rawReceiver)

      return this.api.sendMessage(message, receiver.userID, (err) => {
        if (err) return reject()

        return resolve(`Sent message to ${receiver.fullName}`)
      })
    })
  },

  /**
   * Replies with a given message to the last received thread.
   */
  [commandEnum.REPLY](rawCommand) {
    return new Promise((resolve, reject) => {
      if (this.lastThread === null) {
        return reject("Error - you can't reply to messages you haven't yet received! You need to receive a message before using `reply`!")
      }

      const args = rawCommand.replace("\n", "").split(" ")
      const body = rawCommand.substring(args[0].length).trim()

      // var body = rawCommand.substring(commandEnum.REPLY.length).trim()

      return this.api.sendMessage(body, this.lastThread, (err) => {
        if (err) return reject()

        return resolve("✓ - Replied to x")
      })
    })
  },

  /**
   * Displays users friend list
   */
  [commandEnum.CONTACTS]() {
    return new Promise((resolve) => {
      if (this.user.friendsList.length === 0) {
        return resolve("You have no friends :cry:")
      }

      return resolve(this.user.friendsList
        .sort((a, b) => ((a.fullName || a.name) > (b.fullName || b.name) ? 1 : -1))
        .reduce((a, b) => `${a}${b.fullName || b.name}\n`, ""),
      )
    })
  },

  /**
   * Displays usage instructions
   */
  [commandEnum.HELP]() {
    return new Promise(resolve =>
      resolve("Commands:\n" +
        "\tmessage \"[user]\" [message]\n" +
        "\tcontacts\n",
      ),
    )
  },

  /**
   * Retrieves last n messages from specified friend
   * @param {String} rawCommand 
   */
  [commandEnum.READ](rawCommand) {
    return new Promise((resolve, reject) => {
      const quoteReg = /(".*?")(.*)/g
      // to get length of first arg
      const args = rawCommand.replace("\n", "").split(" ")
      const cmd = rawCommand.substring(args[0].length).trim()

      if (cmd.match(quoteReg) == null) {
        return reject("Invalid message - check your syntax")
      }

      const decomposed = quoteReg.exec(cmd)
      const rawReceiver = decomposed[1].replace(/"/g, "")
      let messageCount = Number.parseInt(decomposed[2].trim(), 10)

      if (Number.isNaN(messageCount)) {
        messageCount = 5
      }

      // Find the given reciever in the users friendlist
      const receiver = helpers.getFriendByName.call(this, rawReceiver)

      return this.api.getThreadHistory(receiver.userID, messageCount, undefined, (err, history) => {
        if (err) return reject()

        return resolve(history.reduce((a, b) => `${a}${b.senderName}: ${b.body}\n`), "")
      })
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