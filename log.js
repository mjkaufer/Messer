const chalk = require("chalk")

/**
 * Wrapper around console.log
 * @param {String} content 
 * @param {String} color hexcode
 */
function log(content, color) {
  /*eslint-disable */
  if (!content) return null

  if (color) {
    if (chalk[color]) {
      return console.log(chalk[color](content))
    }
    return console.log(chalk.hex(color)(content))
  }

  return console.log(content)
  /*eslint-enable */
}

module.exports = log
