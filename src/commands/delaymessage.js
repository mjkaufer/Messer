/* eslint no-unused-vars: 0 */ // --> OFF
const patterns = require("./util/patterns");
const { getThreadByName, parseMessage } = require("./util/helpers");

module.exports = messer => {
    return {
      primaryCommand: "delaymessage",
  
      shortcutCommand: "dm",
  
      help: '(delaymessage | m) "<thread-name>" <message>',
  
      handler(command) {
        return new Promise((resolve, reject) => {
          const argv = command.match(patterns[7]);
          if (!argv || !argv[2] || !argv[3] || !argv[4])
            return reject(Error("Invalid message - check your syntax"));
  
          const rawReceiver = argv[2];
          const rawDelay = argv[3];
          const rawMessage = argv[4];

          const minDelay = rawDelay * 60000;
  
          if (rawMessage.length === 0) {
            return reject(Error("No message to send - check your syntax"));
          }

          if (rawDelay.length === 0 /*|| !Number.isInteger(minDelay) */ || !(rawDelay>=1 && rawDelay <=1440)) {
            return reject(Error("Invalid delay - it has to be an integer between 1-1440"));
          }
          else {
              //return getThreadByName(messer.messen, rawReceiver)
              //.then(thread => 
              console.log('Waiting ',rawDelay,' minutes to send the message' /* to ',thread.name*/);
              setTimeout(action, minDelay);
          }
          
          function action() {
            return getThreadByName(messer.messen, rawReceiver)
            .then(thread => {
              if (!thread) throw new Error("No thread found");


  
              // clean message
              const message = parseMessage(rawMessage, thread);
  
              return messer.messen.api.sendMessage(
                message,
                thread.threadID,
                err => {
                  if (err) return reject(err);
  
                  return resolve(`Sent message to ${thread.name} with ${rawDelay} minutes delay`);
                },
              );
            })
            .catch(() => {
              return reject(
                Error(
                  `User '${rawReceiver}' could not be found in your friends list!`,
                ),
              );
            });
          }

          
        });
      },
    };
  };
  