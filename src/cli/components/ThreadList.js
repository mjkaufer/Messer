const blessed = require("blessed");
const screen = require("../screen");

const ThreadList = blessed.list({
  top: "left",
  left: "left",
  width: 30,
  height: "100%",
  border: {
    type: "line",
  },
  scrollable: true,

  // content: "{bold}{/bold}!\nasd",
  items: [
    "asd",
    "asdd",
  ],
  // tags: true,
});

module.exports = ThreadList;
