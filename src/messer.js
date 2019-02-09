const Messy = require('messy');
const repl = require('repl');

const helpers = require('./util/helpers.js');
const { getCommandHandler } = require('./commands/command-handlers');
const eventHandlers = require('./event-handlers');
const log = require('./util/log');
const lock = require('./util/lock');

const getMessy = () => {
  const messy = new Messy();

  messy.getMfaCode = () => helpers.promptCode();
  messy.promptCredentials = () => helpers.promptCredentials();
  messy.onMessage = ev => eventHandlers.message(ev);
  messy.onThreadEvent = ev => eventHandlers.event(ev);

  return messy;
};

/**
 * Creates a singleton that represents a Messer session.
 * @class
 */
function Messer(options = {}) {
  this.messy = getMessy();

  this.threadCache = {}; // cached by id
  this.threadNameToIdMap = {}; // maps a thread name to a thread id

  this.lastThread = null;
  this.unreadMessagesCount = 0;
  this.debug = options.debug || false;
}

/**
 * Refresh the thread list.
 */
Messer.prototype.refreshThreadList = function refreshThreadList() {
  return new Promise((resolve, reject) =>
    this.messy.api.getThreadList(20, null, ['INBOX'], (err, threads) => {
      if (!threads) return reject(Error('Nothing returned from getThreadList'));

      threads.forEach(thread => this.cacheThread(thread));
      return resolve();
    }),
  );
};

/**
 * Starts a Messer session.
 */
Messer.prototype.start = function start() {
  helpers.notifyTerminal();

  this.messy
    .login()
    .then(() => {
      log(`Successfully logged in as ${this.messy.user.name}`);

      this.messy.listen();

      repl.start({
        ignoreUndefined: true,
        eval: (input, context, filename, cb) =>
          this.processCommand(input)
            .then(res => {
              log(res);
              cb(null);
            })
            .catch(err => {
              log(err.message);
              cb(null);
            }),
      });
    })
    .catch(err => log(err));
};
/**
 * Starts Messer and executes a single command
 */
Messer.prototype.startSingle = function startSingle(rawCommand) {
  this.messy
    .login()
    .then(() => this.processCommand(rawCommand))
    .catch(err => log(err));
};
/**
 * Execute appropriate action for user input commands.
 * @param {String} rawCommand - command to process
 * @return {Promise}
 */
Messer.prototype.processCommand = function processCommand(rawCommand) {
  this.clear(); // If we are typing, new messages have been read

  let localCommand = rawCommand;

  // ignore if rawCommand is only spaces
  if (localCommand.trim().length === 0) return Promise.resolve();

  const args = localCommand.replace('\n', '').split(' ');

  let commandHandler = getCommandHandler(args[0]);

  if (lock.isLocked()) {
    if (localCommand.trim() === 'unlock') {
      commandHandler = getCommandHandler('unlock');
    } else {
      commandHandler = getCommandHandler('m');
      localCommand = 'm '
        .concat('"')
        .concat(lock.getLockedTarget())
        .concat('" ')
        .concat(args.join(' '));
    }
  }

  if (!commandHandler) {
    return Promise.reject(Error('Invalid command - check your syntax'));
  }

  return commandHandler.call(this, localCommand);
};

/**
 * Adds a thread node to the thread cache.
 * @param {Object} thread - thread object to cache
 */
Messer.prototype.cacheThread = function cacheThread(thread) {
  this.threadCache[thread.threadID] = {
    name: thread.name,
    threadID: thread.threadID,
    color: thread.color,
    lastMessageTimestamp: thread.lastMessageTimestamp,
    unreadCount: thread.unreadCount,
  }; // only cache the info we need

  if (thread.name) {
    this.threadNameToIdMap[thread.name] = thread.threadID;
  }
};

/**
 * Gets thread by thread name. Will select the thread with name starting with the given name.
 * @param {String} _threadName
 */
Messer.prototype.getThreadByName = function getThreadByName(threadName) {
  return new Promise((resolve, reject) => {
    const fullThreadName = Object.keys(this.threadNameToIdMap).find(n =>
      n.toLowerCase().startsWith(threadName.toLowerCase()),
    );

    const threadID = this.threadNameToIdMap[fullThreadName];

    // if thread not cached, try the friends list
    if (!threadID) {
      const friendName = Object.keys(this.messy.user.friendsList).find(n =>
        n.toLowerCase().startsWith(threadName.toLowerCase()),
      );

      if (!friendName) {
        return reject(Error('No threadID could be found.'));
      }

      // create a fake thread based off friend info
      const friendThread = {
        name: friendName,
        threadID: this.messy.user.friendsList[friendName].userID,
      };

      return resolve(friendThread);
    }

    return this.getThreadById(threadID)
      .then(thread => {
        if (!thread.name) {
          Object.assign(thread, { name: threadName });
        }

        return resolve(thread);
      })
      .catch(err => reject(err));
  });
};

/**
 * Gets thread by threadID.
 * @param {String} threadID - threadID of desired thread
 * @param {Boolean} requireName - specifies if the thread name is absolutely necessary
 */
Messer.prototype.getThreadById = function getThreadById(
  threadID,
  requireName = false,
) {
  return new Promise((resolve, reject) => {
    let thread = this.threadCache[threadID];

    if (thread) return resolve(thread);

    return this.messy.api.getThreadInfo(threadID, (err, data) => {
      if (err) return reject(err);
      thread = data;

      // try to get thread name from friends list
      if (!thread.name && requireName) {
        let friendName = null;

        if (threadID === this.messy.user.userID) {
          friendName = this.messy.user.name;
        } else {
          const friend = helpers
            .objectValues(this.messy.user.friendsList)
            .find(user => user.userID === threadID);

          if (!friend) {
            return reject(Error('Name could not be found for thread'));
          }

          friendName = friend.fullName;
        }

        thread.name = friendName;
      }

      this.cacheThread(thread);

      return resolve(thread);
    });
  });
};

/**
 * Clears the messer notification in the terminal title.
 */
Messer.prototype.clear = function clear() {
  if (this.unreadMessagesCount === 0) return;

  this.unreadMessagesCount = 0;
  helpers.notifyTerminal();
};

module.exports = Messer;
