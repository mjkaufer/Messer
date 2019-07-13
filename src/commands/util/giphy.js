const { sendGetRequest } = require("./helpers");

exports.getRandomGifEmbedUrl = (baseApi, apiKey, rating) => {
  var url = buildRandomGifUrl(baseApi, apiKey, rating);
  return getGifEmbedUrl(url, body => {
    return JSON.parse(body).data.embed_url;
  });
};

exports.searchGifGetFirst = (baseApi, apiKey, query, rating) => {
  var url = buildSearchGifUrl(baseApi, apiKey, query, rating);
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

function buildRandomGifUrl(baseApi, apiKey, rating) {
  return (
    "https://" +
    baseApi +
    "/random?api_key=" +
    apiKey +
    "&tag=&rating=" +
    rating
  );
}

function buildSearchGifUrl(baseApi, apiKey, query, rating) {
  return (
    "https://" +
    baseApi +
    "/search?api_key=" +
    apiKey +
    "&q=" +
    query +
    "&limit=1&offset=0" +
    "&tag=&rating=" +
    rating
  );
}
