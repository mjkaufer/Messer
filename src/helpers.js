const fs = require("fs")
const prompt = require("prompt")
const readline = require("readline")

const log = require("./log")

const APP_STATE_FILEPATH = "./appstate.json"
const CREDS_FILEPATH = "./config.json"

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
      if (err) {
        reject(err)
        return
      }
      resolve(result)
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
    rl.on("line", (line) => {
      resolve(line)
      rl.close()
    })
  })
}

/**
 * Returns a promise resolving with the credentials to log in with.
 * First tries App State file, then Credentials file, and finally prompts user for username/password
 */
function getCredentials() {
  return new Promise((resolve, reject) => {
    fs.readFile(APP_STATE_FILEPATH, (errA, appstate) => {
      if (appstate) {
        resolve({ appState: JSON.parse(appstate) })
        return
      }

      fs.readFile(process.argv[2] || CREDS_FILEPATH, (errB, creds) => {
        if (errB) {
          promptCredentials()
            .then(data => resolve(data))
            .catch(errC => reject(errC))

          return
        }

        resolve(JSON.parse(creds))
      })
    })
  })
}

/**
 * Flashes the state of the facebook api to a file
 * @param {*} appstate object generated from fbApi.getAppState() method
 */
function saveAppState(appstate) {
  fs.writeFileSync(APP_STATE_FILEPATH, JSON.stringify(appstate))
}

/**
 * Substitute for Object.values
 * @param {object} dict to extract values from
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
