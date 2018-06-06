const blessed = require("blessed");
const screen = require("../screen");

const Header = blessed.box({
  top: "top",
  left: 30,
  width: "100%-30",
  height: 3,
  border: {
    type: "line",
  },

  content: "{bold}Thread name{/bold}",
  tags: true,
});

module.exports = Header;
