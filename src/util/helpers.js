const prompt = require("prompt");
const readline = require("readline");

const { log } = require("./logger");

/**
 * Adds the number of unread messages in the terminal title
 */
function notifyTerminal(unreadMessagesCount) {
  const title = unreadMessagesCount
    ? `messer (${unreadMessagesCount})`
    : "messer";
  process.stdout.write(
    `${String.fromCharCode(27)}]0;${title}${String.fromCharCode(7)}`,
  );
}

/**
 * Prompts the user for their username and password in the terminal
 */
function promptCredentials() {
  log(
    "Enter your Facebook credentials - your password will not be visible as you type it in",
  );
  prompt.start();

  return new Promise((resolve, reject) => {
    prompt.get(
      [
        {
          name: "email",
          required: true,
        },
        {
          name: "password",
          required: true,
          hidden: true,
        },
      ],
      (err, result) => {
        if (err) return reject(err);
        return resolve(result);
      },
    );
  });
}

/**
 * Prompts the user for a 2-factor authentication code
 */
function promptCode() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => {
    log("Enter code > ");
    return rl.on("line", line => {
      resolve(line);
      rl.close();
    });
  });
}

/**
 * Substitute for Object.values
 * @param {object} dict - to extract values from
 */
function objectValues(dict) {
  return Object.keys(dict).map(key => dict[key]);
}

/**
 * Returns the parsed attachment object as a String
 * @param {Object} attachment
 * @return {String}
 */
function parseAttachment(attachment) {
  const attachmentType = attachment.type.replace(/_/g, " ");

  let messageBody = "";

  switch (attachmentType) {
    case "sticker":
      try {
        messageBody =
          fbAssets.facebookStickers[attachment.packID][attachment.stickerID];
      } catch (e) {
        messageBody = "- only viewable in browser";
      }
      break;
    case "file":
      messageBody = `${attachment.name}: ${attachment.url}`;
      break;
    case "photo":
      messageBody = `${attachment.url}`;
      break;
    case "share":
      messageBody = `${attachment.url}`;
      break;
    case "video":
      messageBody = `${attachment.url}`;
      break;
    default:
      messageBody = `- only viewable in browser`;
      break;
  }

  return `[${attachmentType}] ${messageBody}`;
}

const sortObjects = (arr, key, asc = true) => {
  return arr.sort((a, b) => {
    if (a[key] < b[key]) return asc ? -1 : 1;
    if (a[key] > b[key]) return asc ? 1 : -1;
    return 0;
  });
};

module.exports = {
  promptCredentials,
  promptCode,
  objectValues,
  notifyTerminal,
  parseAttachment,
  sortObjects,
};
