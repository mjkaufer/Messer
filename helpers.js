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
 * Fetches a user object and caches the result
 * @param {Int} userID 
 */
function fetchUser(userID) {
  return new Promise((resolve, reject) => {
    this.api.getUserInfo(userID, (err, data) => {
      if (err) return reject(err)

      const user = data[userID]

      user.userID = Object.keys(data)[0]
      this.userCache[userID] = user
      return resolve(user)
    })
  })
}

/**
 * Returns the user info for a given userID
 * @param {Int} userID 
 */
function getUserByID(userID) {
  return new Promise((resolve, reject) => {
    const user = this.userCache[userID]

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
 * @param {String} name 
 */
function getFriendByName(name) {
  return this.user.friendsList[name[0].toLowerCase()].find((f) => {
    const fullName = f.fullName || f.name
    return fullName.toLowerCase().startsWith(name.toLowerCase())
  })
}

function getRandomColor() {
  const colors = Object.keys(style.colors)

  return colors[Math.random() * colors.length * 10]
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
  getUserByID,
  getFriendByName,
  getCredentials,
  getRandomColor,
}
