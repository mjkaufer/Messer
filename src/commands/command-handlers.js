const chalk = require("chalk");

const helpers = require("../util/helpers");
const lock = require("../util/lock");
const commandTypes = require("./command-types");

/* Store regexps that match raw commands */
const commandShortcuts = {
  h: commandTypes.HISTORY,
  m: commandTypes.MESSAGE,
  r: commandTypes.REPLY,
  c: commandTypes.CLEAR,
};

/**
 * Matches a raw command on a given regex and returns the available arguments
 * @param {Regex} regexp - regex to use to parse command
 * @param {String} rawCommand - command to parse
 * @return {Array<String>}
 */
function parseCommand(regexp, rawCommand) {
  if (regexp) return rawCommand.match(regexp);

  // return a 1-item array if no regex i.e. 1 word commands (contacts, etc.)
  return [rawCommand.trim()];
}

/**
 * Command register. All commands get bound to the Messer instance, which allows
 * the api (and others) to be referenced and used within the functions.
 */
const commands = {
  /**
   * Sends message to given user
   * @param {String} rawCommand - command to handle
   * @return {Promise<String>}
   */
  [commandTypes.MESSAGE.command](rawCommand) {
    return new Promise((resolve, reject) => {
      const argv = parseCommand(commandTypes.MESSAGE.regexp, rawCommand);
      if (!argv) return reject(Error("Invalid message - check your syntax"));

      const rawReceiver = argv[2];
      const rawMessage = argv[3];

      if (rawMessage.length === 0) {
        return reject(Error("No message to send - check your syntax"));
      }

      // clean message
      const message = rawMessage.split("\\n").join("\u000A");

      return this.messen.store.threads
        .getThread({ name: rawReceiver })
        .then(thread => {
          if (thread) return thread;
          return this.messen.store.users
            .getUser({ name: rawReceiver })
            .then(user => {
              if (!user) throw new Error();
              return {
                threadID: user.id,
                name: user.name,
              };
            });
        })
        .then(thread => {
          if (!thread) throw new Error("No thread found");

          return this.messen.api.sendMessage(
            { body: message },
            thread.threadID,
            err => {
              if (err) return reject(err);

              return resolve(`Sent message to ${thread.name}`);
            },
          );
        })
        .catch(e =>
          reject(
            Error(
              `User '${rawReceiver}' could not be found in your friends list!`,
            ),
          ),
        );
    });
  },

  /**
   * Replies with a given message to the last received thread.
   * @param {String} rawCommand - command to handle
   * @return {Promise<null>}
   */
  [commandTypes.REPLY.command](rawCommand) {
    return new Promise((resolve, reject) => {
      if (this.lastThread === null) {
        return reject(
          Error(
            "ERROR: You need to receive a message on Messer before using `reply`",
          ),
        );
      }

      const argv = parseCommand(commandTypes.REPLY.regexp, rawCommand);
      if (!argv || !argv[2]) {
        return reject(Error("Invalid command - check your syntax"));
      }

      // var body = rawCommand.substring(commandTypes.REPLY.length).trim()

      return this.messen.api.sendMessage(argv[2], this.lastThread, err => {
        if (err) return reject(err);

        return resolve();
      });
    });
  },

  /**
   * Displays users friend list
   * @return {Promise<String>}
   */
  [commandTypes.CONTACTS.command]() {
    return new Promise(resolve => {
      const { friends } = this.messen.store.users.me;
      if (friends.length === 0) return resolve("You have no friends 😢");

      const friendsPretty = friends
        .sort((a, b) => (a.name > b.name ? 1 : -1))
        .reduce((a, b) => `${a}${b.name}\n`, "");

      return resolve(friendsPretty);
    });
  },

  /**
   * Displays usage instructions
   * @return {Promise<String>}
   */
  [commandTypes.HELP.command]() {
    const helpPretty = `Commands:\n${helpers
      .objectValues(commandTypes)
      .filter(command => command.help)
      .reduce((a, b) => `${a}\t${chalk.blue(b.command)}: ${b.help}\n`, "")}`;

    return new Promise(resolve => resolve(helpPretty));
  },

  /**
   * Logs the user out of Messer
   */
  [commandTypes.LOGOUT.command]() {
    return this.logout();
  },

  /**
   * Clears the number of unread messages in the terminal title
   * @return {Promise<String>}
   */
  [commandTypes.CLEAR.command]() {
    return new Promise(() => this.clear());
  },

  /**
   * Retrieves last n messages from specified friend
   * @param {String} rawCommand - command to handle
   * @return {Promise<String>}
   */
  [commandTypes.HISTORY.command](rawCommand) {
    return new Promise((resolve, reject) => {
      const DEFAULT_COUNT = 5;

      const argv = parseCommand(commandTypes.HISTORY.regexp, rawCommand);
      if (!argv) return reject(Error("Invalid command - check your syntax"));
      const rawThreadName = argv[2];
      const messageCount = argv[3]
        ? parseInt(argv[3].trim(), 10)
        : DEFAULT_COUNT;

      return this.messen.store.threads
        .getThread({ name: rawThreadName })
        .then(thread => {
          if (thread) return thread;
          return this.messen.store.users
            .getUser({ name: rawThreadName })
            .then(user => {
              if (!user) throw new Error();
              return {
                threadID: user.id,
                name: user.name,
              };
            });
        })
        .then(thread => {
          if (!thread) throw new Error("no thread");
          return this.messen.api.getThreadHistory(
            thread.threadID,
            messageCount,
            undefined,
            (err, threadHistory) => {
              if (err) return reject(err);

              if (threadHistory.length === 0) {
                return resolve("You haven't started a conversation!");
              }

              const senderIds = Array.from(
                new Set(threadHistory.map(message => message.senderID)),
              );

              return this.messen.store.users.getUsers(senderIds).then(users => {
                const threadHistoryText = threadHistory
                  .filter(event => event.type === "message") // TODO include other events here
                  .reduce((a, message) => {
                    let sender = users.find(
                      user => user && user.id === message.senderID,
                    );
                    if (!sender) {
                      sender = { name: "unknown" };
                    }

                    let messageBody = message.body;

                    if (message.attachments.length > 0) {
                      messageBody += message.attachments
                        .map(helpers.parseAttachment)
                        .join(", ");
                    }

                    let logText = `${sender.name}: ${messageBody}`;
                    if (message.isUnread) logText = `(unread) ${logText}`;
                    if (
                      message.senderID === this.messen.store.users.me.user.id
                    ) {
                      logText = chalk.dim(logText);
                    }

                    return `${a}${logText}\n`;
                  }, "");

                return resolve(threadHistoryText);
              });
            },
          );
        })
        .catch(err =>
          reject(
            Error(`We couldn't find a thread for '${rawThreadName}'! ${err}`),
          ),
        );
    });
  },

  /**
   * Changes the color of the thread that matches given name
   * @param {String} rawCommand - command to handle
   * @return {Promise<null>}
   */
  [commandTypes.COLOR.command](rawCommand) {
    return new Promise((resolve, reject) => {
      const argv = parseCommand(commandTypes.COLOR.regexp, rawCommand);
      if (!argv) return reject(Error("Invalid command - check your syntax"));

      let color = argv[3];
      if (!color.startsWith("#")) {
        color = this.messen.api.threadColors[color];
        if (!color) return reject(Error(`Color '${argv[3]}' not available`));
      }
      // check if hex code is legit (TODO: regex this)
      if (color.length !== 7) {
        return reject(Error(`Hex code '${argv[3]}' is not valid`));
      }

      const rawThreadName = argv[2];

      // Find the thread to send to
      return this.messen.store.threads
        .getThread({ name: rawThreadName })
        .then(thread => {
          if (thread) return thread;
          return this.messen.store.users
            .getUser({ name: rawThreadName })
            .then(user => {
              if (!user) throw new Error();
              return {
                threadID: user.id,
                name: user.name,
              };
            });
        })
        .then(thread =>
          this.messen.api.changeThreadColor(color, thread.theadID, err => {
            if (err) return reject(err);

            return resolve();
          }),
        )
        .catch(() =>
          reject(Error(`Thread '${rawThreadName}' couldn't be found!`)),
        );
    });
  },

  /**
   * Displays the most recent n threads
   * @param {String} rawCommand - command to handle
   * @return {Promise<string>}
   */
  [commandTypes.RECENT.command](rawCommand) {
    return new Promise((resolve, reject) => {
      const argv = parseCommand(commandTypes.RECENT.regexp, rawCommand);
      if (!argv) return reject(Error("Invalid command - check your syntax"));

      const DEFAULT_COUNT = 5;

      const threadCount = argv[2]
        ? parseInt(argv[2].trim(), 10)
        : DEFAULT_COUNT;

      const threadList = this.messen.store.threads
        .getThreadList(threadCount)
        .sort((a, b) => a.lastMessageTimestamp < b.lastMessageTimestamp)
        .reduce((a, thread, i) => {
          let logText = `[${i}] ${thread.name}`;
          if (thread.unreadCount) logText = chalk.red(logText);

          return `${a}${logText}\n`;
        }, "");

      return resolve(threadList);
    });
  },

  /**
   * Locks the display onto a given user
   */
  [commandTypes.LOCK.command](rawCommand) {
    return new Promise((resolve, reject) => {
      const receiver = rawCommand
        .split(" ")
        .slice(1)
        .join(" ")
        .replace("\n", "");
      if (!receiver) {
        return reject(Error("Please, specify a user to lock on to"));
      }
      return this.messen.store.threads
        .getThread({ name: receiver })
        .then(thread => {
          if (thread) return thread;
          return this.messen.store.users
            .getUser({ name: receiver })
            .then(user => {
              if (!user) throw new Error();
              return {
                threadID: user.id,
                name: user.name,
              };
            });
        })
        .then(() => {
          lock.lockOn(receiver);
          return resolve("Locked on to ".concat(receiver));
        })
        .catch(() =>
          reject(
            Error(
              "Cannot find user "
                .concat(receiver)
                .concat(" in friends list or active threads"),
            ),
          ),
        );
    });
  },

  /**
   * Displays the most recent n threads
   * @param {String} rawCommand - command to handle
   */
  [commandTypes.UNLOCK.command]() {
    return new Promise((resolve, reject) => {
      if (lock.isLocked()) {
        const threadName = lock.getLockedTarget();
        lock.unlock();
        return resolve("Unlocked form ".concat(threadName));
      }
      return reject(Error("No current locked user"));
    });
  },
};

module.exports = {
  /**
   * Return the command handler for a given keyword
   * @param {*} rawCommandKeyword - can be longform or shortcut command i.e. message | m
   * @return {Promise}
   */
  getCommandHandler(rawCommandKeyword) {
    const shortcutCommand = commandShortcuts[rawCommandKeyword];

    if (shortcutCommand) {
      return commands[shortcutCommand.command];
    }

    return commands[rawCommandKeyword];
  },
};
