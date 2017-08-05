const helpers = require("./helpers")

/* Store regexps that match raw commands */
const regexps = [
  /([A-z]+)\s+"(.*?)"\s+(.+)/,
  /([A-z]+)\s+(.+)/,
  /([A-z]+)\s+"(.*?)"(?:\s+)?([0-9]+)?/,
]

/* Command type constants */
const commandEnum = {
  MESSAGE: {
    command: "message",
    regexp: regexps[0],
  },
  REPLY: {
    command: "reply",
    regexp: regexps[1],
  },
  CONTACTS: {
    command: "contacts",
  },
  HELP: {
    command: "help",
  },
  READ: {
    command: "read",
    regexp: regexps[2],
  },
  COLOR: {
    command: "color",
    regexp: regexps[0],
  },
}

const commandShortcuts = {
  r: commandEnum.REPLY,
  m: commandEnum.MESSAGE,
}

/**
 * Matches a raw command on a given regex and returns the available arguments
 * @param {Regex} regexp 
 * @param {String} rawCommand 
 */
function parseCommand(regexp, rawCommand) {
  if (regexp) return rawCommand.match(regexp)

  // return a 1-item array if no regex i.e. 1 word commands (contacts, etc.)
  return [rawCommand.trim()]
}

const commands = {
  /**
   * Sends message to given user
   * @param {String} rawCommand 
   */
  [commandEnum.MESSAGE.command](rawCommand) {
    return new Promise((resolve, reject) => {
      const argv = parseCommand(commandEnum.MESSAGE.regexp, rawCommand)
      if (!argv) return reject("Invalid message - check your syntax")

      const rawReceiver = argv[1]
      const message = argv[2]

      if (message.length === 0) return reject("No message to send - check your syntax")

      // Find the given receiver in the users friendlist
      const receiver = helpers.getFriendByName.call(this, rawReceiver)

      if (!receiver) return reject(`User '${rawReceiver}' could not be found in your friends list!`)

      return this.api.sendMessage(message, receiver.userID, (err) => {
        if (err) return reject()
        return resolve(`Sent message to ${receiver.fullName}`)
      })
    })
  },

  /**
   * Replies with a given message to the last received thread.
   * @param {String} rawCommand 
   */
  [commandEnum.REPLY.command](rawCommand) {
    return new Promise((resolve, reject) => {
      if (this.lastThread === null) return reject("ERROR: You need to receive a message on Messer before using `reply`")

      const argv = parseCommand(commandEnum.REPLY.regexp, rawCommand)
      if (!argv) return reject("Invalid command - check your syntax")

      // var body = rawCommand.substring(commandEnum.REPLY.length).trim()

      return this.api.sendMessage(argv[1], this.lastThread, (err) => {
        if (err) return reject()

        return resolve()
      })
    })
  },

  /**
   * Displays users friend list
   */
  [commandEnum.CONTACTS.command]() {
    return new Promise((resolve) => {
      if (this.user.friendsList.length === 0) return resolve("You have no friends :cry:")

      return resolve(this.user.friendsList
        .sort((a, b) => ((a.fullName || a.name) > (b.fullName || b.name) ? 1 : -1))
        .reduce((a, b) => `${a}${b.fullName || b.name}\n`, ""),
      )
    })
  },

  /**
   * Displays usage instructions
   */
  [commandEnum.HELP.command]() {
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
  [commandEnum.READ.command](rawCommand) {
    return new Promise((resolve, reject) => {
      const argv = parseCommand(commandEnum.READ.regexp, rawCommand)
      if (!argv) return reject("Invalid command - check your syntax")

      const DEFAULT_COUNT = 5

      const rawReceiver = argv[1]
      const messageCount = argv[2] ? parseInt(argv[2].trim(), 10) : DEFAULT_COUNT

      // Find the given receiver in the users friendlist
      const receiver = helpers.getFriendByName.call(this, rawReceiver)

      return this.api.getThreadHistory(receiver.userID, messageCount, undefined, (err, history) => {
        if (err) return reject()

        return resolve(history.reduce((a, b) => `${a}${b.senderName}: ${b.body}\n`, ""))
      })
    })
  },
  /**
   * Changes the color of the thread that matches given name
   * @param {String} rawCommand 
   */
  [commandEnum.COLOR.command](rawCommand) {
    return new Promise((resolve, reject) => {
      const argv = parseCommand(commandEnum.COLOR.regexp, rawCommand)
      if (!argv) return reject("Invalid command - check your syntax")

      // TODO: finish

      return resolve()
    })
  },
}

module.exports = function getCommandHandler(rawCommandKeyword) {
  const command = commandShortcuts[rawCommandKeyword] || rawCommandKeyword
  return commands[command]
}
