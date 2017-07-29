const chalk = require("chalk")

function log(content, color) {
  if (!content) return null

  if (color) {
    if (chalk[color]) {
      return console.log(chalk[color](content))
    }
    return console.log(chalk.hex(color)(content))
  }

  return console.log(content)
}

module.exports = log
