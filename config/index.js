const path = require("path");

process.env.APP_DIR =
  process.env.NODE_ENV === "test"
    ? path.resolve(process.env.ROOT, "test/data/tmp")
    : `${process.env.HOME}/.messer`;
process.env.SETTINGS_FILEPATH = path.resolve(
  process.env.APP_DIR,
  "settings.json",
);
process.env.PUBLIC_KEY_PATH = path.resolve(
  process.env.APP_DIR,
  "messer_id_rsa.pub",
);
process.env.PRIVATE_KEY_PATH = path.resolve(
  process.env.APP_DIR,
  "messer_id_rsa",
);
process.env.FRIENDS_PUBLIC_KEY_DIR = path.resolve(
  process.env.APP_DIR,
  "public_keys",
);
