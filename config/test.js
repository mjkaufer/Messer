const path = require("path");

process.env.APP_DIR = path.resolve(process.env.ROOT, "test/data/tmp");
process.env.SETTINGS_FILEPATH = path.resolve(
  process.env.APP_DIR,
  "settings.json",
);
