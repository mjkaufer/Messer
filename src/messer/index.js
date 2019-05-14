const fs = require("fs");
const { Messen } = require("messen");

const repl = require("./repl");
const settings = require("./settings");
const helpers = require("../util/helpers.js");
const lock = require("../util/lock");
const messageEventHandler = require("../event-handlers/message");
const eventEventHandler = require("../event-handlers/event");

const _getMessen = ctx => {
  const messen = new Messen({
    dir: process.env.APP_DIR,
  });

  messen.getMfaCode = () => helpers.promptCode();
  messen.promptCredentials = () => helpers.promptCredentials();
  messen.onMessage = ev => {
    const { handler } = messageEventHandler(ctx);
    return handler(ev);
  };
  messen.onThreadEvent = ev => {
    const { handler } = eventEventHandler(ctx);
    return handler(ev);
  };

  return messen;
};

/**
 * Main Messer class
 * @class
 */
function Messer(options = {}) {
  this._commandRegistry = {
    commands: {},
    shortcutMap: {},
  };
  this._eventHandlers = {};

  this.options = options;
  this.messen = _getMessen(this);
  this.state = {
    threads: {
      lastThread: undefined,
      unreadThreadIds: [],
    },
  };
}

Messer.prototype.registerCommand = function registerCommand(command) {
  const { primaryCommand, shortcutCommand, help, handler } = command;
  if (!primaryCommand || !help || !handler) {
    throw new Error("Invalid Command");
  }

  this._commandRegistry.commands[primaryCommand] = command;
  if (shortcutCommand) {
    this._commandRegistry.shortcutMap[shortcutCommand] = primaryCommand;
  }
};

Messer.prototype.registerEventHandler = function registerEventHandler(
  eventHandler,
) {
  const { eventType, handler } = eventHandler;
  if (!eventType || !handler) {
    throw new Error("Invalid Event Handler");
  }

  this._eventHandlers[eventType] = handler;
};

Messer.prototype.log = repl.log;

/**
 * Starts a Messer session.
 */
Messer.prototype.start = function start(interactive = true) {
  helpers.notifyTerminal();
  console.log("Logging in...");

  return this.messen
    .login()
    .then(() => {
      if (!interactive) {
        return this.processCommand(rawCommand).then(res => {
          console.log(res);
        });
      }

      console.log(
        `Successfully logged in as ${this.messen.store.users.me.user.name}`,
      );

      this.messen.listen();
      repl.start({
        ignoreUndefined: true,
        eval: (input, context, filename, cb) => {
          return this.processCommand(input)
            .then(res => {
              repl.log(res);
              return cb(null);
            })
            .catch(err => {
              repl.log(err.message);
              return cb(null);
            });
        },
        completer: line => {
          const argv = line.match(/([A-z]+)\s+"(.*)/);

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

Messer.prototype.processCommand = function processCommand(rawCommand) {
  // ignore if rawCommand is only spaces
  if (rawCommand.trim().length === 0) return Promise.resolve();

  const args = rawCommand.replace("\n", "").split(" ");

  let commandEntry = this._commandRegistry.commands[args[0]];
  if (!commandEntry) {
    commandEntry = this._commandRegistry.commands[
      this._commandRegistry.shortcutMap[args[0]]
    ];
  }

  if (!commandEntry) {
    return Promise.reject(Error("Invalid command - check your syntax"));
  }

  return commandEntry.handler(rawCommand);

  // return commandHandler.call(this, localCommand).then(res => {
  //   if (!lock.isLocked() && !lock.isAnonymous()) return res;

  //   // delete the last message
  //   commandHandler = getCommandHandler("delete");
  //   localCommand = `delete "${lock.getLockedTarget()}" 1`;
  //   return commandHandler.call(this, localCommand).then(() => {
  //     return res;
  //   });
  // });
};

/**
 * Clears the messer notification in the terminal title.
 */
Messer.prototype.clear = function clear() {
  if (this.settings.get("SHOW_READ") === true) {
    new Set(this.unreadThreadIds).forEach(threadId => {
      this.messen.api.markAsRead(threadId);
    });
  }

  this.unreadThreadIds = [];

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
