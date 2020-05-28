const patterns = require("./util/patterns");
const { parseMessage } = require("./util/helpers");
const action = require("./delaymessage");

module.exports = messer => {
  return {
    primaryCommand: "stop",
  
    help: "stop",
  
    handler(command) {
      if(setTimeout(action))
      clearTimeout(action);
      console.log('Message cancelled');

    return new Promise((resolve, reject) => {
      const argv = command.match(patterns[8]);
      if (!argv) {
        return reject(Error("Invalid command - check your syntax1"));
      }

      if (!setTimeout(action))
        return reject(Error("There's no message waiting to be sent"));
      else if (setTimeout(action)) {
        clearTimeout(action);
        return resolve("Message cancelled");
      }
    });
  },
};
}
  