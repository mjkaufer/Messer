#!/usr/bin/env node
const parseArgs = require("minimist")
const Messer = require("./src/messer")

const argv = parseArgs(process.argv.slice(2))
const messer = new Messer()

if (argv.command) {
  messer.startSingle(argv.command)
} else {
  messer.start()
}
