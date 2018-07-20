const fs = require("fs")
const prompt = require("prompt")
const readline = require("readline")

const log = require("./log")

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
 * Flashes the state of the facebook api to a file
 * @param {*} appstate object generated from fbApi.getAppState() method
 */
function saveAppState(appstate, filepath) {
  fs.writeFileSync(filepath, JSON.stringify(appstate))
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
}
