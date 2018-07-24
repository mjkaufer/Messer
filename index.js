#!/usr/bin/env node
const parseArgs = require("minimist")
const Messer = require("./src/messer")
const packageJson = require("./package.json")

const argv = parseArgs(process.argv.slice(2))
const messer = new Messer()

if (argv.command) {
  messer.startSingle(argv.command)
} else if (argv.v) {
  console.log(packageJson.version) // eslint-disable-line
} else {
  messer.start()
}
