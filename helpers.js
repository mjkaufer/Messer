const fs = require("fs")
const prompt = require("prompt")
const log = require("./log")

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
  getCredentials,
}
