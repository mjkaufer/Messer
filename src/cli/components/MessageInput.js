const blessed = require("blessed");
const screen = require("../screen");

const MessageInput = blessed.textarea({
  top: "100%-5",
  left: 30,
  width: "100%-30",
  height: 5,
  border: {
    type: "line",
  },
});

module.exports = MessageInput;
