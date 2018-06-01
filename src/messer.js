const facebook = require("facebook-chat-api")
const repl = require("repl")

const helpers = require("./util/helpers.js")
const getCommandHandler = require("./commands/command-handlers").getCommandHandler
const eventHandlers = require("./event-handlers")
const log = require("./util/log")

/**
 * Creates a singleton that represents a Messer session.
 * @class
 */
function Messer(options = {}) {
  this.api = null
  this.user = null
  this.userCache = {} // cached by userID
  this.threadCache = {} // cached by id
  this.threadMap = {} // maps a thread/user name to a thread id
  this.lastThread = null
  this.debug = options.debug || false
}

/**
 * Fetches and stores all relevant user details using a promise.
 * @return {Promise<Object>}
 */
Messer.prototype.fetchCurrentUser = function fetchCurrentUser() {
  const user = {}

  return new Promise((resolve, reject) => {
    user.userID = this.api.getCurrentUserID()

    this.api.getUserInfo(user.userID, (err, data) => {
      if (err) return reject(err)

      Object.assign(user, data[user.userID])

      return this.api.getFriendsList((err, data) => {
        if (err) return reject(err)

        data.forEach((u) => {
          this.threadMap[u.name || u.fullName] = u.userID
          this.userCache[u.userID] = u
        })

        return this.api.getThreadList(0, 20, (err, threads) => {
          if (threads) {
            threads.forEach((t) => {
              if (t.threadID === user.userID) {
                t.name = user.fullName || user.name
                this.userCache[user.userID] = user
              }
              this.cacheThread(t)
            })
          }

          // cache myself
          return resolve(user)
          // TODO: return this.getThreadById(user.userID).then(() => resolve(user))
        })
      })
    })
  })
}

/**
 * Authenticates a user with Facebook. Prompts for credentials if argument is undefined.
 * @param {Object} credentials - The Facebook credentials of the user
 * @param {string} email - The user's Facebook email
 * @param {string} credentials.password - The user's Facebook password
 * 
 * @return {Promise<null>}
 */
Messer.prototype.authenticate = function authenticate({ email, password }) {
  log("Logging in...")

  const config = {
    forceLogin: true,
    logLevel: this.debug ? "info" : "silent",
    selfListen: true,
    listenEvents: true,
  }

  return new Promise((resolve, reject) => {
    facebook({ email, password }, config, (err, fbApi) => {
      if (err) {
        switch (err.error) {
          case "login-approval":
            helpers.promptCode().then(code => err.continue(code))
            break
          default:
            return reject(`Failed to login as [${email}] - ${err.error}`)
        }
        return null
      }

      helpers.saveAppState(fbApi.getAppState())

      this.api = fbApi

      log("Fetching your details...")

      return this.fetchCurrentUser()
        .then((user) => {
          this.user = user

          return resolve()
        })
        .catch(e => reject(e))
    })
  })
}

/**
 * Starts a Messer session.
 */
Messer.prototype.start = function start() {
  helpers.getCredentials()
    .then(credentials => this.authenticate(credentials))
    .then(() => {
      log(`Successfully logged in as ${this.user.name}`)

      this.api.listen((err, ev) => {
        if (err) return null

        return eventHandlers[ev.type].call(this, ev)
      })

      repl.start({
        ignoreUndefined: true,
        eval: (input, context, filename, cb) => this.processCommand(input, cb),
      })
    })
    .catch(err => log(err))
}

/**
 * Execute appropriate action for user input commands.
 * @param {String} rawCommand
 * @param {Function} callback 
 */
Messer.prototype.processCommand = function processCommand(rawCommand, callback) {
  // ignore if rawCommand is only spaces
  if (rawCommand.trim().length === 0) return null

  const args = rawCommand.replace("\n", "").split(" ")
  const commandHandler = getCommandHandler(args[0])

  if (!commandHandler) {
    return log("Invalid command - check your syntax")
  }

  return commandHandler.call(this, rawCommand)
    .then((message) => {
      log(message)
      return callback(null)
    })
    .catch((err) => {
      log(err)
      return callback(null)
    })
}

/**
 * Adds a thread node to the thread cache.
 * @param {Object} thread 
 */
Messer.prototype.cacheThread = function cacheThread(thread) {
  if (this.threadCache[thread.threadID]) return

  this.threadCache[thread.threadID] = {
    name: thread.name,
    threadID: thread.threadID,
    color: thread.color,
  } // only cache the info we need

  if (thread.name) {
    this.threadMap[thread.name] = thread.threadID
  }
}

/**
 * Gets thread by thread name.
 * @param {String} name 
 */
Messer.prototype.getThreadByName = function getThreadByName(name) {
  return new Promise((resolve, reject) => {
    const threadName = Object.keys(this.threadMap)
      .find(n => n.toLowerCase().startsWith(name.toLowerCase()))

    const threadID = this.threadMap[threadName]
    if (!threadID) return reject("no thread with that name found")

    return this.getThreadById(threadID)
      .then((thread) => {
        if (!thread.name) {
          Object.assign(thread, { name: threadName })
        }

        return resolve(thread)
      })
      .catch(err => reject(err))
  })
}

/**
 * Gets thread by threadID.
 * @param {String} threadID
 */
Messer.prototype.getThreadById = function getThreadById(threadID) {
  return new Promise((resolve, reject) => {
    let thread = this.threadCache[threadID]

    if (thread) return resolve(thread)

    return this.api.getThreadInfo(threadID, (err, data) => {
      if (err) return reject(err)
      thread = data

      this.cacheThread(thread)

      return resolve(thread)
    })
  })
}

module.exports = Messer
