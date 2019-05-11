const chalk = require("chalk");

/**
 * Wrapper around console.log
 * @param {String} content - content to log
 * @param {String} color - hexcode
 */
function log(content, color, error) {
  if (!content) return null;

  let message = content;

  if (color) {
    if (chalk[color]) {
      message = chalk[color](content);
    }
    message = chalk.hex(color)(content);
  }

  if (error) {
    console.error(error);
  }

  console.log(message);
}

module.exports = { log };
