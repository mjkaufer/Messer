process.env.NODE_ENV === "test" ? require("./test") : require("./app");
