const argv = parseCommand(commandTypes.SETTINGS.regexp, rawCommand);

if (!argv || !argv[2])
  return Promise.reject("Invalid command - check your syntax");
const command = argv[2];
const key = argv[3];
const value = argv[4];

if (command === "list" && !key && !value) {
  const settings = this.settings.list();
  return Promise.resolve(
    Object.keys(settings)
      .map(k => {
        return `${k}=${settings[k]}`;
      })
      .join("\n"),
  );
}

if (command === "get" && key && !value) {
  return Promise.resolve(`${this.settings.get(key)}`);
}

if (command === "set" && key && value) {
  let _value;
  try {
    _value = JSON.parse(value);
  } catch (e) {
    _value = value;
  }

  return this.settings.set(key, _value).then(() => {
    return;
  });
}

return Promise.reject("Invalid command - check your syntax");
},