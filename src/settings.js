const path = require("path")

const APPSTATE_FILE_PATH = path.resolve(process.env.HOME, ".messer/appstate.json")

module.exports = {
  APPSTATE_FILE_PATH,
}
