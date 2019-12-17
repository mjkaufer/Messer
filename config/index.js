const path = require("path");

process.env.APP_DIR =
  process.env.NODE_ENV === "test"
    ? path.resolve(process.env.ROOT, "test/data/tmp")
    : `${process.env.HOME}/.messer`;
process.env.SETTINGS_FILEPATH = path.resolve(
  process.env.APP_DIR,
  "settings.json",
);
