const path = require("path")

const MESSER_PATH = path.resolve(process.env.HOME, ".messer")
const APPSTATE_FILE_PATH = path.resolve(MESSER_PATH, "tmp/appstate.json")

module.exports = {
  APPSTATE_FILE_PATH,
  MESSER_PATH,
}
