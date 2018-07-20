#!/usr/bin/env node
const Messer = require("./src/messer")

const messer = new Messer()
if (process.argv.length > 3) {
  messer.startSingle(process.argv.slice(3, process.argv.length).join(" "))
} else {
  messer.start()
}
