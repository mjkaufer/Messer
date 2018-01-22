#!/usr/bin/env node

/* Imports */
const facebook = require("facebook-chat-api")
const repl = require("repl")

const helpers = require("./src/helpers.js")
const getCommandHandler = require("./src/command-handlers").getCommandHandler
const eventHandlers = require("./src/event-handlers")
const log = require("./src/log")

/**
 * Messer creates a singleton that represents a Messer session
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
 */
Messer.prototype.fetchCurrentUser = function fetchCurrentUser() {
  const user = {}

  return new Promise((resolve, reject) => {
    user.userID = this.api.getCurrentUserID()

    this.api.getUserInfo(user.userID, (userInfoError, userData) => {
      if (userInfoError) {
        reject(userInfoError)
        return
      }

      Object.assign(user, userData[user.userID])

      this.api.getFriendsList((friendListError, friendList) => {
        if (friendListError) {
          reject(friendListError)
          return
        }

        friendList.forEach((friend) => {
          this.threadMap[friend.name || friend.fullName] = friend.userID
          this.userCache[friend.userID] = friend
        })

        this.api.getThreadList(0, 20, (err, threads) => {
          if (threads) {
            threads.forEach((rawThread) => {
              const thread = Object.assign({}, rawThread)
              if (thread.threadID === user.userID) {
                thread.name = user.fullName || user.name
                this.userCache[user.userID] = user
              }
              this.cacheThread(thread)
            })
          }

          // cache myself
          resolve(user)
          // TODO: return this.getThreadById(user.userID).then(() => resolve(user))
        })
      })
    })
  })
}

/**
 * Authenticates a user with Facebook. Prompts for credentials if argument is undefined
 * @param {Object} credentials
 */
Messer.prototype.authenticate = function authenticate(credentials) {
  log("Logging in...")

  const config = {
    forceLogin: true,
    logLevel: this.debug ? "info" : "silent",
    selfListen: true,
    listenEvents: true,
  }

  return new Promise((resolve, reject) => {
    facebook(credentials, config, (err, fbApi) => {
      if (err) {
        switch (err.error) {
          case "login-approval":
            helpers.promptCode().then(code => err.continue(code))
            break
          default:
            reject(`Failed to login as [${credentials.email}] - ${err.error}`)
        }
        return
      }

      helpers.saveAppState(fbApi.getAppState())

      this.api = fbApi

      log("Fetching your details...")

      this.fetchCurrentUser()
        .then((user) => {
          this.user = user

          resolve()
        })
        .catch(e => reject(e))
    })
  })
}

/**
 * Starts a Messer session
 */
Messer.prototype.start = function start() {
  helpers.getCredentials()
    .then(credentials => this.authenticate(credentials))
    .then(() => {
      log(`Successfully logged in as ${this.user.name}`)

      this.api.listen((err, ev) => {
        if (err) return

        eventHandlers[ev.type].call(this, ev)
      })

      repl.start({
        ignoreUndefined: true,
        eval: (input, context, filename, cb) => this.processCommand(input, cb),
      })
    })
    .catch(err => log(err))
}

/**
 * Execute appropriate action for user input commands
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
      callback(null)
    })
    .catch((err) => {
      log(err)
      callback(null)
    })
}

/*
 * Adds a thread node to the thread cache
 */
Messer.prototype.cacheThread = function cacheThread(thread) {
  if (this.threadCache[thread.threadID]) return

  this.threadCache[thread.threadID] = {
    name: thread.name,
    threadID: thread.threadID,
    color: thread.color,
  } // only cache the info we need

  if (thread.name.length > 0) this.threadMap[thread.name] = thread.threadID
}

/*
 * Gets thread by thread name
 */
Messer.prototype.getThreadByName = function getThreadByName(name) {
  const threadName = Object.keys(this.threadMap)
    .find(n => n.toLowerCase().startsWith(name.toLowerCase()))

  const threadID = this.threadMap[threadName]
  if (!threadID) return null

  if (this.threadCache[threadID].name.length === 0) {
    this.threadCache[threadID].name = threadName
  }

  return this.threadCache[threadID]
}

/*
 * Gets thread by threadID
 */
Messer.prototype.getThreadById = function getThreadById(threadID) {
  return new Promise((resolve, reject) => {
    let thread = this.threadCache[threadID]

    if (thread) {
      resolve(thread)
      return
    }

    this.api.getThreadInfo(threadID, (err, data) => {
      if (err) {
        reject(err)
        return
      }
      thread = data

      this.cacheThread(thread)

      resolve(thread)
    })
  })
}

// create new Messer instance
const messer = new Messer()
messer.start()
