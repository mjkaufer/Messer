const repl = require("repl");
const path = require("path");
const fs = require("fs");
const { Messen } = require("messen");

const helpers = require("./util/helpers.js");
const { getCommandHandler } = require("./commands/command-handlers");
const eventHandlers = require("./event-handlers");
const logger = require("./util/logger");
const lock = require("./util/lock");
const patterns = require("./commands/command-types/patterns");

const APP_DIR = `${process.env.HOME}/.messer`;
const SETTINGS_FILEPATH = path.resolve(APP_DIR, "settings.json");
const DEFAULT_SETTINGS = {
  SHOW_TYPING: false,
  SHOW_READ: false,
};

/**
 * Basic settings utils
 */
let _settings = undefined;
const settings = {
  list: function() {
    if (_settings) return _settings;

    try {
      _settings = JSON.parse(fs.readFileSync(SETTINGS_FILEPATH));
    } catch (e) {
      _settings = DEFAULT_SETTINGS;
    }

    return _settings;
  },
  get: function(key) {
    const _list = this.list();
    const val = _list[key];

    return val;
  },
  set: function(key, value) {
    return new Promise((resolve, reject) => {
      const _list = this.list();
      _list[key] = value;

      return fs.writeFile(SETTINGS_FILEPATH, JSON.stringify(_list), err => {
        if (err) return reject(err);

        _settings = _list;
        return resolve(_settings);
      });
    });
  },
};

const getMessen = ctx => {
  const messen = new Messen({
    dir: APP_DIR,
  });

  messen.getMfaCode = () => helpers.promptCode();
  messen.promptCredentials = () => helpers.promptCredentials();
  messen.onMessage = ev => {
    const handler = eventHandlers.message.bind(ctx);
    return handler(ev, lock);
  };
  messen.onThreadEvent = ev => {
    const handler = eventHandlers.event.bind(ctx);
    return handler(ev);
  };

  return messen;
};

/**
 * Main Messer class
 * @class
 */
function Messer(options = {}) {
  this.messen = getMessen(this);
  this.repl = undefined;

  this.lastThread = null;
  this.unreadMessagesCount = 0;
  this.debug = options.debug || false;
}

Messer.prototype.log = function log(message, color, error = false) {
  if (!this.repl) return;

  this.repl.clearBufferedCommand();
  logger.log(message, color, error);
  this.repl.displayPrompt(true);
};

Messer.prototype.setReplPrompt = function setReplPrompt(prompt) {
  if (!this.repl) return;

  this.repl._prompt = prompt;
  this.repl._initialPrompt = prompt;
  this.repl._promptLength = prompt.length;
};

/**
 * Starts a Messer session.
 */
Messer.prototype.start = function start() {
  helpers.notifyTerminal();
  logger.log("Logging in...");

  return this.messen
    .login()
    .then(() => {
      logger.log(
        `Successfully logged in as ${this.messen.store.users.me.user.name}`,
      );

      this.messen.listen();

      this.repl = repl.start({
        ignoreUndefined: true,
        eval: (input, context, filename, cb) => {
          this.processCommand(input)
            .then(res => {
              this.log(res);
              return cb(null);
            })
            .catch(err => {
              this.log(err.message);
              return cb(null);
            });
        },
        completer: line => {
          const argv = line.match(patterns[4]);

          const command = argv[1];
          const nameQuery = argv[2];

          const { friends } = this.messen.store.users.me;

          const getCompletions = users => {
            return users.map(user => {
              return `${command} "${user.name}"`;
            });
          };

          const completions = getCompletions(friends);

          const hits = getCompletions(
            friends.filter(user =>
              user.name.toLowerCase().startsWith(nameQuery.toLowerCase()),
            ),
          );

          // Show all completions if none found
          return [hits.length ? hits : completions, line];
        },
      });
    })
    .catch(err => console.log(err));
};

/**
 * Starts Messer and executes a single command
 */
Messer.prototype.startSingle = function startSingle(rawCommand) {
  this.messen
    .login()
    .then(() => this.processCommand(rawCommand))
    .then(output => {
      this.log(output);
    })
    .catch(err => {
      this.log(err, undefined, true);
    });
};

/**
 * Execute appropriate action for user input commands.
 * @param {String} rawCommand - command to process
 * @return {Promise}
 */
Messer.prototype.processCommand = function processCommand(rawCommand) {
  this.clear(); // If we are typing, new messages have been read

  let localCommand = rawCommand;

  // ignore if rawCommand is only spaces
  if (localCommand.trim().length === 0) return Promise.resolve();

  const args = localCommand.replace("\n", "").split(" ");

  let commandHandler = getCommandHandler(args[0]);

  if (lock.isLocked()) {
    if (localCommand.trim() === "unlock") {
      commandHandler = getCommandHandler("unlock");
    } else {
      commandHandler = getCommandHandler("message");
      localCommand = `m "${lock.getLockedTarget()}" ${args.join(" ")}`;
    }
  }

  if (!commandHandler) {
    return Promise.reject(Error("Invalid command - check your syntax"));
  }

  return commandHandler.call(this, localCommand).then(res => {
    if (!lock.isLocked() && !lock.isAnonymous()) return res;

    // delete the last message
    commandHandler = getCommandHandler("delete");
    localCommand = `delete "${lock.getLockedTarget()}" 1`;
    return commandHandler.call(this, localCommand).then(() => {
      return res;
    });
  });
};

/**
 * Clears the messer notification in the terminal title.
 */
Messer.prototype.clear = function clear() {
  if (this.unreadMessagesCount === 0) return;

  this.unreadMessagesCount = 0;
  helpers.notifyTerminal();
};

/**
 * Terminates the Messer session and removes all relevent files.
 */
Messer.prototype.logout = function logout() {
  return this.messen.logout().then(() => {
    process.exit();
  });
};

Messer.prototype.settings = settings;

module.exports = Messer;
