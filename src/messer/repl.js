const repl = require("repl");
const logger = require("../util/logger");

let _repl;

const start = opts => {
  _repl = repl.start(opts);
};

const setPrompt = prompt => {
  if (!_repl) throw new Error("repl has not been started.");

  _repl._prompt = prompt;
  _repl._initialPrompt = prompt;
  _repl._promptLength = prompt.length;
};

const log = (message, color, error) => {
  if (!_repl) throw new Error("repl has not been started.");

  _repl.clearBufferedCommand();
  logger.log(message, color, error);
  _repl.displayPrompt(true);
};

module.exports = {
  start,
  setPrompt,
  log,
};
