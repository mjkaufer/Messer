const fs = require("fs")
const path = require("path")
const prompt = require("prompt")
const readline = require("readline")
const mkdirp = require("mkdirp")

const log = require("./log")

/**
 * Adds the number of unread messages in the terminal title
 * @param {Object} unreadMessagesCount number of unread messages
 */
function notifyTerminal(unreadMessagesCount) {
  const title = (unreadMessagesCount) ? `messer (${unreadMessagesCount})` : "messer"
  process.stdout.write(`${String.fromCharCode(27)}]0;${title}${String.fromCharCode(7)}`)
}

/**
 * Prompts the user for their username and password in the terminal
 */
function promptCredentials() {
  log("Enter your Facebook credentials - your password will not be visible as you type it in")
  prompt.start()

  return new Promise((resolve, reject) => {
    prompt.get([{
      name: "email",
      required: true,
    }, {
      name: "password",
      required: true,
      hidden: true,
    }], (err, result) => {
      if (err) return reject(err)
      return resolve(result)
    })
  })
}

/**
 * Prompts the user for a 2-factor authentication code
 */
function promptCode() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve) => {
    log("Enter code > ")
    return rl.on("line", (line) => {
      resolve(line)
      rl.close()
    })
  })
}

/**
 * Returns a promise resolving with the credentials to log in with.
 * First tries App State file, then prompts user for username/password
 * @return {Promise<{email: string, password: string}>}
 */
function getCredentials(appstateFilePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(appstateFilePath, (appStateErr, appstate) => {
      if (!appStateErr && appstate) {
        return resolve({ appState: JSON.parse(appstate) })
      }

      return promptCredentials()
        .then(data => resolve(data))
        .catch(credsErr => reject(credsErr))
    })
  })
}

/**
 * Dumps the state of the Facebook API to a file
 * @param {Object} appstate object generated from fbApi.getAppState() method
 * @param {string} filepath file to save appstate to
 * @return {Promise}
 */
function saveAppState(appstate, filepath) {
  return new Promise((resolve, reject) => mkdirp(path.dirname(filepath), (mkdirpErr) => {
    if (mkdirpErr) return reject(mkdirpErr)

    // ...then write the file
    return fs.writeFile(filepath, JSON.stringify(appstate), (writeErr) => {
      if (writeErr) return reject(writeErr)

      return resolve(appstate)
    })
  }))
}

/**
 * Substitute for Object.values
 * @param {object} dict - to extract values from
 */
function objectValues(dict) {
  return Object.keys(dict).map(key => dict[key])
}


module.exports = {
  getCredentials,
  saveAppState,
  promptCode,
  objectValues,
  notifyTerminal,
}
