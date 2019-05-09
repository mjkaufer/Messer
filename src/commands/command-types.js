const regexps = [
  /([A-z]+)\s+"(.*?)"\s+(.+)/,
  /([A-z]+)\s+(.+){0,}/,
  /([A-z]+)\s+"(.*?)"(?:\s+)?([0-9]+)?/,
  /([A-z]+)\s+"(.*?)"(?:\s+)?(--[A-z]+)?/,
];

/* Command type constants */
const commandTypes = {
  COLOR: {
    command: "color",
    regexp: regexps[0],
  },
  CONTACTS: {
    command: "contacts",
    help: "contacts",
  },
  HELP: {
    command: "help",
  },
  LOGOUT: {
    command: "logout",
  },
  HISTORY: {
    command: "history",
    regexp: regexps[2],
    help: 'history "<thread-name>" [<n>]',
  },
  MESSAGE: {
    command: "message",
    regexp: regexps[0],
    help: 'message "<thread-name>" <message>',
  },
  RECENT: {
    command: "recent",
    regexp: regexps[1],
    help: "recent [<n>]",
  },
  REPLY: {
    command: "reply",
    regexp: regexps[1],
    help: "reply <message>",
  },
  CLEAR: {
    command: "clear",
  },
  LOCK: {
    command: "lock",
    regexp: regexps[3],
    help: 'lock "<thread-name>" [--anon]',
  },
  UNLOCK: {
    command: "unlock",
    help: "unlock",
  },
  DELETE: {
    command: "delete",
    regexp: regexps[2],
    help: 'delete "<thread-name>" [<n>]',
  },
};

module.exports = commandTypes;
