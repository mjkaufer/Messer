const helpers = require("./helpers.js")

/* Store regexps that match raw commands */
const regexps = [
  /([A-z]+)\s+"(.*?)"\s+(.+)/,
  /([A-z]+)\s+(.+){0,}/,
  /([A-z]+)\s+"(.*?)"(?:\s+)?([0-9]+)?/,
]

/* Command type constants */
const commandEnum = {
  COLOR: {
    command: "color",
    regexp: regexps[0],
  },
  CONTACTS: {
    command: "contacts",
    help: "contacts",
  },
  HELP: {
    command: "help",
  },
  HISTORY: {
    command: "history",
    regexp: regexps[2],
    help: "history \"[thread name]\" [n]",
  },
  MESSAGE: {
    command: "message",
    regexp: regexps[0],
    help: "message \"[thread name]\" [message]",
  },
  RECENT: {
    command: "recent",
    regexp: regexps[1],
    help: "recent [n]",
  },
  REPLY: {
    command: "reply",
    regexp: regexps[1],
    help: "reply [message]",
  },
}

const commandShortcuts = {
  h: commandEnum.HISTORY,
  m: commandEnum.MESSAGE,
  r: commandEnum.REPLY,
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
      if (!argv) {
        reject("Invalid message - check your syntax")
        return
      }

      const rawReceiver = argv[2]
      const message = argv[3]

      if (message.length === 0) {
        reject("No message to send - check your syntax")
        return
      }

      // Find the thread to send to
      const receiver = this.getThreadByName(rawReceiver)

      if (!receiver) {
        reject(`User '${rawReceiver}' could not be found in your friends list!`)
        return
      }

      this.api.sendMessage(message, receiver.threadID, (err) => {
        if (err) {
          reject(err)
          return
        }

        resolve(`Sent message to ${receiver.name}`)
      })
    })
  },

  /**
   * Replies with a given message to the last received thread.
   * @param {String} rawCommand
   */
  [commandEnum.REPLY.command](rawCommand) {
    return new Promise((resolve, reject) => {
      if (this.lastThread === null) {
        reject("ERROR: You need to receive a message on Messer before using `reply`")
        return
      }

      const argv = parseCommand(commandEnum.REPLY.regexp, rawCommand)
      if (!argv || !argv[2]) {
        reject("Invalid command - check your syntax")
        return
      }

      // var body = rawCommand.substring(commandEnum.REPLY.length).trim()

      this.api.sendMessage(argv[2], this.lastThread, (err) => {
        if (err) {
          reject(err)
          return
        }

        resolve()
      })
    })
  },

  /**
   * Displays users friend list
   */
  [commandEnum.CONTACTS.command]() {
    return new Promise((resolve) => {
      const friendsList = helpers.objectValues(this.userCache).filter(u => u.isFriend)
      if (friendsList.length === 0) resolve("You have no friends :cry:")

      resolve(friendsList
        .sort((a, b) => ((a.fullName || a.name) > (b.fullName || b.name) ? 1 : -1))
        .reduce((a, b) => `${a}${b.fullName || b.name}\n`, ""),
      )
    })
  },

  /**
   * Displays usage instructions
   */
  [commandEnum.HELP.command]() {
    return Promise.resolve(`Commands:\n${helpers.objectValues(commandEnum).reduce((a, b) => `${a}\t${b.command}: ${b.help}\n`, "")}`)
  },
  /**
   * Retrieves last n messages from specified friend
   * @param {String} rawCommand
   */
  [commandEnum.HISTORY.command](rawCommand) {
    return new Promise((resolve, reject) => {
      const argv = parseCommand(commandEnum.HISTORY.regexp, rawCommand)
      if (!argv) {
        reject("Invalid command - check your syntax")
        return
      }

      const DEFAULT_COUNT = 5

      const rawThreadName = argv[2]
      const messageCount = argv[3] ? parseInt(argv[3].trim(), 10) : DEFAULT_COUNT

      // Find the given receiver in the users friendlist
      const thread = this.getThreadByName(rawThreadName)
      if (!thread) {
        reject(`User '${rawThreadName}' could not be found in your friends list!`)
        return
      }

      this.api.getThreadHistory(thread.threadID, messageCount, undefined, (err, history) => {
        if (err) {
          reject(err)
          return
        }

        resolve(history.reduce((a, b) => `${a}${b.senderName}: ${b.body}\n`, ""))
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
      if (!argv) {
        reject("Invalid command - check your syntax")
        return
      }

      let color = argv[3]
      if (!color.startsWith("#")) {
        color = this.api.threadColors[color]
        if (!color) {
          reject(`Color '${argv[3]}' not available`)
          return
        }
      }
      // check if hex code is legit (TODO: regex this)
      if (color.length !== 7) {
        reject(`Hex code '${argv[3]}' is not valid`)
        return
      }


      const threadName = argv[2]
      // Find the thread to send to
      const thread = this.getThreadByName(threadName)

      if (!thread) {
        reject(`Thread '${threadName}' couldn't be found!`)
        return
      }
      this.api.changeThreadColor(color, thread.theadID, (err) => {
        if (err) {
          reject(err)
          return
        }

        resolve()
      })
    })
  },

  /**
   * Retrieves last n messages from specified friend
   * @param {String} rawCommand
   */
  [commandEnum.RECENT.command](rawCommand) {
    return new Promise((resolve, reject) => {
      const argv = parseCommand(commandEnum.RECENT.regexp, rawCommand)
      if (!argv) {
        reject("Invalid command - check your syntax")
        return
      }

      const DEFAULT_COUNT = 5

      const threadCount = argv[2] ? parseInt(argv[2].trim(), 10) : DEFAULT_COUNT

      const threadList = helpers.objectValues(this.threadCache)
        .slice(0, threadCount)
        .reduce((a, b, i) => `${a}[${i}] ${b.name}\n`, "")

      resolve(threadList)
    })
  },
}

module.exports = {
  getCommandHandler(rawCommandKeyword) {
    let command = commandShortcuts[rawCommandKeyword]
    if (command) {
      command = command.command
    } else {
      command = rawCommandKeyword
    }

    return commands[command]
  },
}
