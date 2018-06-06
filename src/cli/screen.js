const blessed = require("blessed");

const screen = blessed.screen({
  smartCSR: true,
  title: "Messer",
});

// Quit on Escape, q, or Control-C.
screen.key(["escape", "q", "C-c"], () => process.exit(0));

module.exports = screen;
