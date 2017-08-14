#!/usr/bin/env node

/* Imports */
const facebook = require("facebook-chat-api")
const repl = require("repl")

const helpers = require("./helpers.js")
const getCommandHandler = require("./command-handlers")
const eventHandlers = require("./event-handlers")
const log = require("./log")

/**
 * Messer creates a singleton that represents a Messer session 
 */
function Messer() {
  this.api = null
  this.user = null
  this.userCache = {} // cached by userID
  this.threadCache = {} // cached by name (quasi linked list)
  this.threadMap = {} // maps a thread id to a thread name
  this.lastThread = null
}

/**
 * Fetches and stores all relevant user details using a promise.
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
          this.cacheThread({
            name: u.name || u.fullName,
            threadID: u.userID,
          }) // cache all friends as potential "threads"

          this.userCache[u.userID] = u
        })

        return resolve(user)
      })
    })
  })
}

/**
 * Authenticates a user with Facebook. Prompts for credentials if argument is undefined
 * @param {Object} credentials 
 */
Messer.prototype.authenticate = function authenticate(credentials) {
  return new Promise((resolve, reject) => {
    facebook(credentials, (err, fbApi) => {
      if (err) return reject(`Failed to login as [${credentials.email}] - ${err}`)

      fbApi.setOptions({
        logLevel: "silent",
      })
      this.api = fbApi

      log("Fetching your details...")

      return this.fetchCurrentUser()
        .then((user) => {
          this.user = user
          this.user.email = credentials.email

          return resolve()
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
      log(`Successfully logged in as ${this.user.email}`)

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
      return callback(null)
    })
    .catch((err) => {
      log(err)
      return callback(null)
    })
}

/*
 * Adds a thread node to the thread cache
 */
Messer.prototype.cacheThread = function cacheThread(thread) {
  let node = this.threadCache[thread.name[0].toLowerCase()]
  if (!(node)) node = []

  node.push({
    name: thread.name,
    threadID: thread.threadID,
  }) // only store what we need, threadCache is the source of truth

  this.threadCache[thread.name[0].toLowerCase()] = node
}

/*
 * Adds a thread node to the thread cache
 */
Messer.prototype.getThreadByName = function getThreadByName(name) {
  const node = this.threadCache[name[0].toLowerCase()]
  if (!(node)) return null

  if (node.length === 1) return node[0]

  return node.find(t => (t.name || t.fullName).toLowerCase().startsWith(name))
}

/*
 * Adds a thread node to the thread cache
 */
Messer.prototype.getThreadById = function getThreadById(threadID) {
  return new Promise((resolve, reject) => {
    let thread = this.threadCache[threadID]

    if (thread) return resolve(thread)

    return this.api.getThreadInfo(threadID, (err, data) => {
      if (err) return reject(err)

      thread = data
      thread.color = thread.color || helpers.getRandomColor()
      this.cacheThread(thread)

      return resolve(thread)
    })
  })
}

// create new Messer instance
const messer = new Messer()
messer.start()
