const chalk = require("chalk");

/**
 * Wrapper around console.log
 * @param {String} content - content to log
 * @param {String} color - hexcode
 */
function log(content, color) {
  if (!content) return null;

  let message = content;

  if (color) {
    if (chalk[color]) {
      message = chalk[color](content);
    }
    message = chalk.hex(color)(content);
  }

  console.log(message);
}

module.exports = { log };
