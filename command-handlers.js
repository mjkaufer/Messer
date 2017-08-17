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
  HISTORY: {
    command: "history",
    regexp: regexps[2],
  },
  COLOR: {
    command: "color",
    regexp: regexps[0],
  }
}

const commandShortcuts = {
  r: commandEnum.REPLY,
  m: commandEnum.MESSAGE,
  h: commandEnum.HISTORY,
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

/**
 * Command register. All commands get bound to the Messer instance, which allows
 * the api (and others) to be referenced and used within the functions.
 */
const commands = {
  /**
   * Sends message to given user
   * @param {String} rawCommand 
   */
  [commandEnum.MESSAGE.command](rawCommand) {
    return new Promise((resolve, reject) => {
      const argv = parseCommand(commandEnum.MESSAGE.regexp, rawCommand)
      if (!argv) return reject("Invalid message - check your syntax")

      const rawReceiver = argv[2]
      const message = argv[3]

      if (message.length === 0) return reject("No message to send - check your syntax")

      // Find the thread to send to
      const receiver = this.getThreadByName(rawReceiver)

      if (!receiver) return reject(`User '${rawReceiver}' could not be found in your friends list!`)

      return this.api.sendMessage(message, receiver.threadID, (err) => {
        if (err) return reject(err)

        return resolve(`Sent message to ${receiver.name}`)
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

      return this.api.sendMessage(argv[2], this.lastThread, (err) => {
        if (err) return reject(err)

        return resolve()
      })
    })
  },

  /**
   * Displays users friend list
   */
  [commandEnum.CONTACTS.command]() {
    return new Promise((resolve) => {
      const friendsList = Object.values(this.userCache).filter(u => u.isFriend)
      if (friendsList.length === 0) return resolve("You have no friends :cry:")

      return resolve(friendsList
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
  [commandEnum.HISTORY.command](rawCommand) {
    return new Promise((resolve, reject) => {
      const argv = parseCommand(commandEnum.HISTORY.regexp, rawCommand)
      if (!argv) return reject("Invalid command - check your syntax")

      const DEFAULT_COUNT = 5

      const rawThreadName = argv[2]
      const messageCount = argv[3] ? parseInt(argv[3].trim(), 10) : DEFAULT_COUNT

      // Find the given receiver in the users friendlist
      const thread = this.getThreadByName(rawThreadName)
      if (!thread) return reject(`User '${rawThreadName}' could not be found in your friends list!`)

      return this.api.getThreadHistory(thread.threadID, messageCount, undefined, (err, history) => {
        if (err) return reject(err)

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

      let color = argv[3]
      if (!color.startsWith("#")) {
        color = this.api.threadColors[color]
        if (!color) return reject(`Color '${argv[3]}' not available`)
      }
      // check if hex code is legit (TODO: regex this)
      if (color.length !== 7) return reject(`Hex code '${argv[3]}' is not valid`)


      const threadName = argv[2]
      // Find the thread to send to
      const thread = this.getThreadByName(threadName)

      if (!thread) return reject(`Thread '${threadName}' couldn't be found!`)
      return this.api.changeThreadColor(color, thread.theadID, (err) => {
        if (err) return reject(err)

        return resolve()
      })
    })
  },
}

module.exports = function getCommandHandler(rawCommandKeyword) {
  let command = commandShortcuts[rawCommandKeyword]
  if (command) {
    command = command.command
  } else {
    command = rawCommandKeyword
  }

  return commands[command]
}
