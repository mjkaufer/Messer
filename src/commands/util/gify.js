const { sendGetRequest } = require("./helpers");

exports.getRandomGifEmbedUrl = () => {
  return new Promise((resolve, reject) => {
    sendGetRequest(
      "https://api.giphy.com/v1/gifs/random?api_key=Zl14Xzhqe4HpU8wBpcu6JkLbYY8oe0Jl&tag=&rating=G",
    )
      .then(body => {
        return resolve(JSON.parse(body).data.embed_url);
      })
      .catch(err => {
        return reject("Could not execute request to giphy.");
      });
  });
};
