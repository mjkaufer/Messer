const ThreadList = require("./components/ThreadList");
const Header = require("./components/Header");
const CurrentThread = require("./components/CurrentThread");
const MessageInput = require("./components/MessageInput");

const screen = require("./screen");

screen.append(ThreadList);
screen.append(Header);
screen.append(CurrentThread);
screen.append(MessageInput);

screen.render();
