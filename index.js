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
  this.threadCache = []
  this.lastThread = null
  this.userCache = [] // cache non-friends
}

Messer.prototype.authenticate = function authenticate(credentials) {
  return new Promise((resolve, reject) => {
    facebook(credentials, (err, fbApi) => {
      if (err) return reject(`Failed to login as [${credentials.email}] - ${err}`)

      fbApi.setOptions({
        logLevel: "silent",
      })
      this.api = fbApi

      log("Fetching your details...")

      return helpers.fetchCurrentUser.call(this).then((user) => {
        this.user = user
        this.user.email = credentials.email

        return resolve()
      })
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
    .catch(() => {})
}

/**
 * Execute appropriate action for user input commands
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

// create new Messer instance
const messer = new Messer()
messer.start()
