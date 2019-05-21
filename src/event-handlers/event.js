module.exports = messer => {
  return {
    eventType: "message",

    handler(ev) {
      let logMessage = "An event happened!";

      switch (ev.logMessageType) {
        case "log:thread-color":
          Object.assign(ev.thread, {
            color: `#${ev.logMessageData.theme_color.slice(2)}`,
          });
          logMessage = ev.logMessageBody;
          break;
        default:
          break;
      }

      messer.log(logMessage);
    },
  };
};
