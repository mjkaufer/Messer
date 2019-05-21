const patterns = require("./util/patterns");

module.exports = messer => {
  return {
    primaryCommand: "settings",

    help: "settings (set | get | list) [<key>=<value>]",

    handler(command) {
      return new Promise((resolve, reject) => {
        const argv = command.match(patterns[5]);
        if (!argv || !argv[2])
          return Promise.reject("Invalid command - check your syntax");

        const command = argv[2];
        const key = argv[3];
        const value = argv[4];

        if (command === "list" && !key && !value) {
          const settings = messer.settings.list();
          return Promise.resolve(
            Object.keys(settings)
              .map(k => {
                return `${k}=${settings[k]}`;
              })
              .join("\n"),
          );
        }

        if (command === "get" && key && !value) {
          return Promise.resolve(`${messer.settings.get(key)}`);
        }

        if (command === "set" && key && value) {
          let _value;
          try {
            _value = JSON.parse(value);
          } catch (e) {
            _value = value;
          }

          return messer.settings.set(key, _value).then(() => {
            return;
          });
        }
      });
    },
  };
};
