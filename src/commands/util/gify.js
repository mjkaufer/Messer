const { sendGetRequest } = require("./helpers");

exports.getRandomGifEmbedUrl = (base_api, api_key, rating) => {
  var url = buildRandomGifUrl(base_api, api_key, rating);
  return getGifEmbedUrl(url, body => {
    return JSON.parse(body).data.embed_url;
  });
};

exports.searchGifGetFirst = (base_api, api_key, query, rating) => {
  var url = buildSearchGifUrl(base_api, api_key, query, rating);
  return getGifEmbedUrl(url, body => {
    return JSON.parse(body).data[0].embed_url;
  });
};

function getGifEmbedUrl(url, getEmbedUrl) {
  return new Promise((resolve, reject) => {
    sendGetRequest(url)
      .then(body => {
        return resolve(getEmbedUrl(body));
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

function buildSearchGifUrl(base_api, api_key, query, rating) {
  return (
    "https://" +
    base_api +
    "/search?api_key=" +
    api_key +
    "&q=" +
    query +
    "&limit=1&offset=0" +
    "&tag=&rating=" +
    rating
  );
}
