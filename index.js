#!/usr/bin/env node
const parseArgs = require("minimist");
const Messer = require("./src/messer");
const packageJson = require("./package.json");
const settings = require("./settings");

const COMMANDS = require("./src/commands");
const EVENT_HANDLERS = require("./src/event-handlers");

const messer = new Messer();
COMMANDS.forEach(command => {
  messer.registerCommand(command(messer));
});
EVENT_HANDLERS.forEach(handler => {
  messer.registerEventHandler(handler(messer));
});

const argv = parseArgs(process.argv.slice(2));
if (argv._ && argv._[0] === "cleanup") {
  messer.logout();
} else if (argv.command) {
  messer.start(false);
} else if (argv.v) {
  console.log(packageJson.version);
} else {
  messer.start();
}
