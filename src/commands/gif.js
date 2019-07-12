const patterns = require("./util/patterns");
const { getThreadByName } = require("./util/helpers");
const { getRandomGifEmbedUrl } = require("./util/gify");

module.exports = messer => {
  return {
    primaryCommand: "gif",

    shortcutCommand: "gif",

    help: 'gif "<thread-name>" <gif-keyword>',

    handler(command) {
      return new Promise((resolve, reject) => {
        const argv = command.match(patterns[0]);
        if (!argv || !argv[2] || !argv[3])
          return reject(Error("Invalid message - check your syntax"));

        const rawReceiver = argv[2];
        const rawMessage = argv[3];

        if (rawMessage.length === 0) {
          return reject(Error("No message to send - check your syntax"));
        }

        return getThreadByName(messer.messen, rawReceiver)
          .then(thread => {
            if (!thread) throw new Error("No thread found");
            const base_api = messer.settings.get("GIFY_BASE_API");
            const api_key = messer.settings.get("GIFY_API_KEY");
            const rating = messer.settings.get("GIFY_DEFAULT_RATING");
            getRandomGifEmbedUrl(base_api, api_key, rating)
              .then(embed_url => {
                return messer.messen.api.sendMessage(
                  {
                    url: embed_url,
                  },
                  thread.threadID,
                  err => {
                    if (err) return reject(err);
                    return resolve(`Sent message to ${thread.name}`);
                  },
                );
              })
              .catch(() => {
                return reject(Error(`Failed to fetch embed url from gify`));
              });
          })
          .catch(() => {
            return reject(
              Error(
                `User '${rawReceiver}' could not be found in your friends list!`,
              ),
            );
          });
      });
    },
  };
};
