const fs = require("fs")
const prompt = require("prompt")
const style = require("ansi-styles")
const log = require("./log")

/**
 * Fetches and stores all relevant user details using a promise.
 */
function fetchCurrentUser() {
  const user = {}

  return new Promise((resolve, reject) => {
    user.userID = this.api.getCurrentUserID()

    this.api.getUserInfo(user.userID, (err, data) => {
      if (err) return reject(err)

      Object.assign(user, data[user.userID])

      // user is a friend of themselves (to make things easier)
      user.friendsList = [data[user.userID]]

      // fetch and cache user's friends list
      return this.api.getFriendsList((err, data) => {
        if (err) return reject(err)

        // add users' actual friends
        user.friendsList = user.friendsList.concat(data)

        return resolve(user)
      })
    })
  })
}

function fetchUser(userID) {
  return new Promise((resolve, reject) => {
    this.api.getUserInfo(userID, (err, data) => {
      if (err) return reject(err)

      const user = data[userID]

      user.userID = Object.keys(data)[0]
      this.userCache.push(user)
      return resolve(user)
    })
  })
}

/**
 * Returns the user info for a given userID.
 */
function getUserByID(userID) {
  return new Promise((resolve, reject) => {
    // is the current user
    if (userID === this.user.userID) return resolve(this.user)

    const user =
      this.user.friendsList.find(f => f.userID === userID) ||
      this.userCache.find(u => u.userID === userID)

    if (!user) {
      fetchUser.call(this, userID)
        .then(_user => resolve(_user))
        .catch(() => reject())
    }

    return resolve(user)
  })
}

/**
 * Returns the user info for a given name. Matches on the closest name
 */
function getFriendByName(name) {
  const user = this.user.friendsList.find((f) => {
    const fullName = f.fullName || f.name
    return fullName.toLowerCase().startsWith(name.toLowerCase())
  })

  if (!user) {
    log(`User '${name}' could not be found in your friends list!`)
    return null
  }

  return user
}

function getRandomColor() {
  const colors = Object.keys(style.colors)

  return colors[Math.random() * colors.length * 10]
}

function fetchThreadInfo(threadID) {
  return new Promise((resolve, reject) => {
    const threadInfo = this.threadCache[threadID]

    if (!threadInfo) {
      return this.api.getThreadInfo(threadID, (err, info) => {
        if (err) return reject(err)

        this.threadCache[threadID] = info
        this.threadCache[threadID].color = this.threadCache[threadID].color || getRandomColor()
        return resolve(info)
      })
    }

    return resolve(threadInfo)
  })
}

/**
 * Returns a promise resolving with the credentials to log in with
 */
function getCredentials() {
  const configFilePath = process.argv[2]

  return new Promise((resolve, reject) => {
    if (!configFilePath) {
      // No credentials file specified; prompt for manual entry
      log("Enter your Facebook credentials - your password will not be visible as you type it in")
      prompt.start()

      return prompt.get([{
        name: "email",
        required: true,
      }, {
        name: "password",
        hidden: true,
        conform: () => true,
      }], (err, result) => {
        resolve(result)
      })
    }

    return fs.readFile(configFilePath, (err, data) => {
      if (err) return reject(err)

      return resolve(JSON.parse(data))
    })
  })
}

module.exports = {
  fetchCurrentUser,
  fetchUser,
  fetchThreadInfo,
  getUserByID,
  getFriendByName,
  getCredentials,
  getRandomColor,
}
