const crypto = require("crypto");
const fs = require("fs");

process.env.ROOT = __dirname;
require("../../config");

const generateKeyPair = () => {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
  });

  return { publicKey, privateKey };
};

const saveKeyPair = ({ publicKey, privateKey }) => {
  fs.writeFileSync(
    process.env.PUBLIC_KEY_PATH,
    publicKey.export({ type: "pkcs1", format: "pem" }),
  );
  fs.writeFileSync(
    process.env.PRIVATE_KEY_PATH,
    privateKey.export({ type: "pkcs1", format: "pem" }),
  );
};

const createMesserKeyPair = () => {
  const { publicKey, privateKey } = generateKeyPair();
  saveKeyPair({ publicKey, privateKey });

  return { publicKey, privateKey };
};

const getMesserKeyPair = () => {
  const privateKeyRaw = fs.readFileSync(process.env.PRIVATE_KEY_PATH);
  const privateKey = crypto.createPrivateKey(privateKeyRaw);

  const publicKeyRaw = fs.readFileSync(process.env.PUBLIC_KEY_PATH);
  const publicKey = crypto.createPublicKey(publicKeyRaw);

  return { publicKey, privateKey };
};

const getOrCreateMesserKeyPair = () => {
  let { privateKey, publicKey } = getMesserKeyPair();
  if (privateKey && publicKey) {
    return { privateKey, publicKey };
  }

  return createMesserKeyPair();
};

/**
 *
 * @param {String} message
 * @param {KeyObject} recipientPublicKey
 */
const encryptMessage = (message, recipientPublicKey) => {
  const encryptedMessage = crypto.publicEncrypt(
    {
      key: recipientPublicKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    Buffer.from(message),
  );

  return encryptedMessage.toString("base64");
};

/**
 *
 * @param {String} encryptedMessage - base64 encoded string
 */
const decryptMessage = encryptedMessage => {
  const encryptedMessageBuffer = Buffer.from(encryptedMessage, "base64");
  const { privateKey } = getOrCreateMesserKeyPair();
  const message = crypto.privateDecrypt(
    {
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    Buffer.from(encryptedMessageBuffer),
  );

  return message;
};

module.exports = {
  encryptMessage,
  decryptMessage,
};
