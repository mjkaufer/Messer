const mkdirp = require("mkdirp");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const loadPublicKeys = messen => {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(process.env.FRIENDS_PUBLIC_KEY_DIR)) {
      return resolve();
    }

    return fs.readdir(process.env.FRIENDS_PUBLIC_KEY_DIR, (err, files) => {
      files.forEach(filename => {
        const publicKeyRaw = fs.readFileSync(
          path.join(process.env.FRIENDS_PUBLIC_KEY_DIR, filename),
        );

        messen.store.threads._threads[
          filename
        ].zuccnetPublicKey = crypto.createPublicKey(publicKeyRaw);
      });

      return resolve();
    });
  });
};

const setUserPublicKey = (messen, threadID, publicKeyPath) => {
  return new Promise((resolve, reject) => {
    const handleFile = () => {
      fs.copyFileSync(
        publicKeyPath,
        path.join(process.env.FRIENDS_PUBLIC_KEY_DIR, threadID),
      );

      const publicKeyRaw = fs.readFileSync(publicKeyPath);
      messen.store.threads._threads[
        threadID
      ].zuccnetPublicKey = crypto.createPublicKey(publicKeyRaw);

      return resolve();
    };

    if (fs.existsSync(process.env.FRIENDS_PUBLIC_KEY_DIR)) {
      return handleFile();
    }

    mkdirp(process.env.FRIENDS_PUBLIC_KEY_DIR, mkdirpErr => {
      if (mkdirpErr) return reject(mkdirpErr);

      return handleFile();
    });
  });
};

module.exports = {
  setUserPublicKey,
  loadPublicKeys,
};
