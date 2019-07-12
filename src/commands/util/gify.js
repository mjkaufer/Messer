const { sendGetRequest } = require("./helpers");

exports.getRandomGifEmbedUrl = (base_api, api_key, rating) => {
  var url = buildRandomGifUrl(base_api, api_key, rating);
  return getGifEmbedUrl(url);
};

function getGifEmbedUrl(url) {
  return new Promise((resolve, reject) => {
    sendGetRequest(url)
      .then(body => {
        return resolve(JSON.parse(body).data.embed_url);
      })
      .catch(err => {
        console.log(err);
        return reject("Could not execute request to giphy.");
      });
  });
}

function buildRandomGifUrl(base_api, api_key, rating) {
  return (
    "https://" +
    base_api +
    "/random?api_key=" +
    api_key +
    "&tag=&rating=" +
    rating
  );
}
