/* command handlers */
module.exports = {
  /**
   * Sends message to given user
   */
  message(rawCommand) {
    const quoteReg = /(".*?")(.*)/g
    // to get length of first arg
    const args = rawCommand.replace('\n', '').split(' ')
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

    // Find the given reciever in the users friendlist
    const receiver = user.friendsList.find(function(f) {
      return f.fullName.toLowerCase().startsWith(rawReceiver.toLowerCase())
    })

    if (!receiver) {
      console.warn("User \"" + rawReceiver + "\"" + " could not be found in your friends list!")
      return
    }

    api.sendMessage(message, receiver.userID, function(err) {
      if (err) {
        console.warn("ERROR!", err)
      }
      console.log("Sent message to " + receiver.fullName)
    })
  },

  /**
   * Replies with a given message to the last received thread.
   */
  reply(rawCommand) {
    if (lastThread === null) {
      console.warn("Error - can't reply to messages you haven't yet received! You need to receive a message before using `reply`!")
    }

    const args = rawCommand.replace('\n', '').split(' ')
    const body = rawCommand.substring(args[0].length).trim()

    // var body = rawCommand.substring(commandEnum.REPLY.length).trim()

    api.sendMessage(body, lastThread, function(err, data) {
      if (err) {
        console.error(err)
        return
      }

      const color = colors[activeConversations.length % colors.length]
      console.log(chalk[color]("✓"))
    })
  },

  /**
   * Displays users friend list
   */
  contacts() {
    user.friendsList.forEach(f => { console.log(f.fullName) })
  },

  /**
   * Displays usage instructions
   */
  help() {
    console.log("Commands:\n" +
      "\tmessage \"[user]\" [message]\n" +
      "\tcontacts\n"
    )
  }
}