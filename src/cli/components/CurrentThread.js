const blessed = require("blessed");
const screen = require("../screen");

const CurrentThread = blessed.box({
  top: 3,
  left: 30,
  width: "100%-30",
  height: `100%-${3 + 5}`,
  border: {
    type: "line",
  },
  valign: "bottom",
  scrollable: true,

  content: "{bold}Thread name{/bold}",
  tags: true,
});

module.exports = CurrentThread;
