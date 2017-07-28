const chalk = require("chalk")

function log(content, hexColor) {
  if (hexColor) {
    return console.log(chalk.hex(hexColor)(content))
  }

  return console.log(content)
}

module.exports = log
