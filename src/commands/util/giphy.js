const axios = require("axios");

const buildRandomGifUrl = baseApi => {
  return `https://${baseApi}/random`;
};

const getRandomGif = (baseApi, apiKey, rating) => {
  const url = buildRandomGifUrl(baseApi, apiKey, rating);
  return axios.get(url, { params: { api_key: apiKey, rating } }).then(res => {
    return res.data.data.embed_url;
  });
};

const getFirstGifFromQuery = (baseApi, apiKey, rating, query) => {
  const url = buildRandomGifUrl(baseApi, apiKey, rating);
  return axios
    .get(url, { params: { api_key: apiKey, rating, query, limit: 1 } })
    .then(res => {
      return res.data.data.embed_url;
    });
};

exports.getGif = (baseApi, apiKey, rating, query) => {
  return query
    ? getFirstGifFromQuery(baseApi, apiKey, rating, query)
    : getRandomGif(baseApi, apiKey, rating);
};
