const patterns = require("./patterns");

/* Command type constants */
const commandTypes = {
  COLOR: {
    command: "color",
    regexp: patterns[0],
  },
  CONTACTS: {
    command: "contacts",
    help: "contacts",
  },
  THREADS: {
    command: "threads",
    help: "threads",
  },
  HELP: {
    command: "help",
  },
  LOGOUT: {
    command: "logout",
  },
  HISTORY: {
    command: "history",
    regexp: patterns[2],
    help: 'history "<thread-name>" [<n>]',
  },
  MESSAGE: {
    command: "message",
    regexp: patterns[0],
    help: 'message "<thread-name>" <message>',
  },
  FILE: {
    command: "file",
    regexp: patterns[5],
    help: 'file "<thread-name>" "<filepath>" <message>',
  },
  RECENT: {
    command: "recent",
    regexp: patterns[1],
    help: "recent [<n>]",
  },
  REPLY: {
    command: "reply",
    regexp: patterns[1],
    help: "reply <message>",
  },
  CLEAR: {
    command: "clear",
  },
  LOCK: {
    command: "lock",
    regexp: patterns[3],
    help: 'lock "<thread-name>" [--secret]',
  },
  UNLOCK: {
    command: "unlock",
    help: "unlock",
  },
  DELETE: {
    command: "delete",
    regexp: patterns[2],
    help: 'delete "<thread-name>" [<n>]',
  },
};

module.exports = commandTypes;
