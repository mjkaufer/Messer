const patterns = require("./util/patterns");
const { getThreadByName } = require("./util/helpers");
const { getRandomGifEmbedUrl, searchGifGetFirst } = require("./util/gify");

module.exports = messer => {
  return {
    primaryCommand: "gif",

    shortcutCommand: "gif",

    help: 'gif "<thread-name>" [gif-keyword] [gif-rating]',

    handler(command) {
      return new Promise((resolve, reject) => {
        const argv = command.match(patterns[6]);
        if (!argv || !argv[2])
          return reject(Error("Invalid message - check your syntax"));

        const rawReceiver = argv[2];
        const base_api = messer.settings.get("GIFY_BASE_API");
        const api_key = messer.settings.get("GIFY_API_KEY");
        const rating = messer.settings.get("GIFY_DEFAULT_RATING");

        return getThreadByName(messer.messen, rawReceiver)
          .then(thread => {
            if (!thread) throw new Error("No thread found");
            var urlPromise = undefined;
            if (argv[3]) {
              urlPromise = searchGifGetFirst(
                base_api,
                api_key,
                argv[3],
                rating,
              );
            } else {
              urlPromise = getRandomGifEmbedUrl(base_api, api_key, rating);
            }
            urlPromise
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
          .catch(err => {
            console.log(err);
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
