const assert = require("assert");
const fs = require("fs");
const path = require("path");

const Messer = require("../src/messer");
const { getMessen, threads } = require("./messer.mock");

const mockSettings = {
  APPSTATE_FILE_PATH: path.resolve(__dirname, "tmp/appstate.json"),
};

const DEFAULT_MOCK_THREAD = threads[0];

/**
 * Return a minimal thread as given by facebook-chat-api
 */
function getMockThread() {
  return JSON.parse(JSON.stringify(DEFAULT_MOCK_THREAD));
}

/**
 * Factory to mock an instance of Messer
 */
function MockMesser() {
  const COMMANDS = require("../src/commands");
  const EVENT_HANDLERS = require("../src/event-handlers");

  const messer = new Messer();
  messer.messen = getMessen();
  messer.setPrompt = _ => {};

  COMMANDS.forEach(command => {
    messer.registerCommand(command(messer));
  });
  EVENT_HANDLERS.forEach(handler => {
    messer.registerEventHandler(handler(messer));
  });

  return messer;
}

/**
 * Test Messer-related functionality
 */
describe("Messer", function() {
  const messer = MockMesser();
  before(async function() {
    await messer.messen.login();
  });

  /**
   * Test processCommand
   */
  describe("#processCommand(command)", function() {
    it("should process and handle a valid command", async function() {
      await messer.processCommand('message "test" hey dude').then(res => {
        assert.ok(res);
      });
    });
  });

  /**
   * Test the command handlers
   */
  describe("Command Handlers", function() {
    let messer = MockMesser();
    before(async function() {
      await messer.messen.login();
    });

    /**
     * Test the "message" command
     */
    describe("#message", function() {
      it("should send message to valid threadname", async function() {
        await messer.processCommand('message "test" hey dude').then(res => {
          assert.ok(res);
        });
      });

      it("should send message to valid threadname using shortcut command", async function() {
        await messer.processCommand('m "test" hey dude').then(res => {
          assert.ok(res);
        });
      });

      it("should send message to valid thread that isn't a friend", async function() {
        await messer.processCommand('message "waylon" hey dude').then(res => {
          assert.ok(res);
        });
      });

      it("should fail to send message to invalid threadname", async function() {
        await messer.processCommand('m "rick" hey dude').catch(err => {
          assert.equal(
            err,
            "Error: User 'rick' could not be found in your friends list!",
          );
        });
      });
    });

    /**
     * Test the "file" command
     */
    describe("#file", function() {
      const testfile = path.resolve(__dirname, "data/test.txt");
      it("should send file to valid threadname", async function() {
        await messer.processCommand(`file "test" "${testfile}"`).then(res => {
          assert.ok(res);
        });
      });

      it("should send file to valid threadname with a caption", async function() {
        await messer
          .processCommand(`file "test" "${testfile}" my caption dood`)
          .then(res => {
            assert.ok(res);
          });
      });

      it("should send file to valid thread that isn't a friend", async function() {
        await messer.processCommand(`file "waylon" "${testfile}"`).then(res => {
          assert.ok(res);
        });
      });

      it("should fail to send file to invalid threadname", async function() {
        await messer.processCommand(`file "rick" "${testfile}"`).catch(err => {
          assert.equal(
            err,
            "Error: User 'rick' could not be found in your friends list!",
          );
        });
      });
    });

    /**
     * Test the "reply" command
     */
    describe("#reply", function() {
      it("should fail if no message has been recieved", async function() {
        await messer.processCommand("reply hey dude").catch(err => {
          assert.ok(err);
        });
      });

      it("should reply", async function() {
        messer.lastThread = getMockThread();
        await messer.processCommand("reply yea i agree").then(() => {
          assert.ok(true);
        });
      });

      it("should reply using shortcut command", async function() {
        await messer.processCommand("r yea i agree").then(() => {
          assert.ok(true);
        });
      });
    });

    /**
     * Test the "history" command
     */
    describe("#history", function() {
      it("should gracefully fail if no thread found", async function() {
        await messer.processCommand('history "bill"').catch(err => {
          assert.ok(err);
        });
      });

      it("should return something for a thread with some history", async function() {
        messer.messen.api.getThreadHistory = (
          threadID,
          messageCount,
          x,
          cb,
        ) => {
          const data = [
            {
              senderID: DEFAULT_MOCK_THREAD.threadID,
              body: "hey dude",
              type: "message",
            },
          ];
          return cb(null, data);
        };
        await messer.processCommand('history "test"').then(res => {
          assert.ok(res.trim().split("\n"));
          assert.ok(!res.includes("undefined"));
          assert.ok(!res.includes("null"));
          assert.ok(res.includes(DEFAULT_MOCK_THREAD.name));
        });
      });

      it("should handle messages where the sender is the current user", async function() {
        messer.messen.api.getThreadHistory = (
          threadID,
          messageCount,
          x,
          cb,
        ) => {
          const data = [
            {
              senderID: DEFAULT_MOCK_THREAD.threadID,
              body: "hey dude",
              type: "message",
            },
            {
              senderID: messer.messen.store.users.me.user.id,
              body: "hey marn",
              type: "message",
            },
          ];
          return cb(null, data);
        };

        await messer.processCommand('history "test"').then(res => {
          assert.ok(res.includes(messer.messen.store.users.me.user.name));
        });
      });

      it("should return truthy value when no history exists in thread", async function() {
        messer.messen.api.getThreadHistory = (
          threadID,
          messageCount,
          x,
          cb,
        ) => {
          const data = [];
          return cb(null, data);
        };
        await messer.processCommand('history "test"').then(res => {
          assert.ok(res);
          assert.ok(!res.includes("test"));
        });
      });

      it("should act appropriately when [messageCount] given", async function() {
        messer.messen.api.getThreadHistory = (
          threadID,
          messageCount,
          x,
          cb,
        ) => {
          const data = [
            {
              senderID: DEFAULT_MOCK_THREAD.threadID,
              body: "hey dude",
              type: "message",
            },
            {
              senderID: DEFAULT_MOCK_THREAD.threadID,
              body: "hey dude",
              type: "message",
            },
            {
              senderID: DEFAULT_MOCK_THREAD.threadID,
              body: "hey dude",
              type: "message",
            },
            {
              senderID: DEFAULT_MOCK_THREAD.threadID,
              body: "hey dude",
              type: "message",
            },
          ].slice(0, messageCount);
          return cb(null, data);
        };
        await messer.processCommand('history "test" 2').then(res => {
          assert.equal(res.trim().split("\n").length, 2);
          assert.ok(!res.includes("undefined"));
          assert.ok(!res.includes("null"));
          assert.ok(res.includes("Tom"));
        });
      });
    });

    /**
     * Test the "contacts" command
     */
    describe("#contacts", function() {
      it("should return list of friends sep. by newline", async function() {
        await messer.processCommand("contacts").then(res => {
          assert.equal(res, "Test Friend\nTom Quirk");
        });
      });

      it("should gracefully handle user with no friends", async function() {
        messer.messen.store.users.me.friends = [];

        const res = await messer.processCommand("contacts");
        assert.ok(res);
      });
    });

    /**
     * Test the "help" command
     */
    describe("#help", function() {
      it("should return some truthy value", async function() {
        await messer.processCommand("help").then(res => {
          assert.ok(res);
        });
      });
    });

    /**
     * Test the "lock" command
     */
    describe("#lock", function() {
      it("should lock on to a valid thread name and process every input line as a message command", async function() {
        await messer
          .processCommand('lock "test"')
          .then(() => {
            return messer.processCommand("hey, dude");
          })
          .then(res => {
            assert.ok(res);
          });
      });

      it("should lock on to a valid thread name that is not a friend and process every input line as a message command", async function() {
        await messer
          .processCommand('lock "waylon"')
          .then(() => {
            return messer.processCommand("hey, dude");
          })
          .then(res => {
            assert.ok(res);
          });
      });

      it("should fail if no thread name is specified", async function() {
        await messer.processCommand("lock").catch(err => {
          assert.ok(err);
        });
      });

      it("should fail if a non-existant thread name is specified", async function() {
        await messer.processCommand('lock "asd"').catch(err => {
          assert.ok(err);
        });
      });
    });

    /**
     * Test the "unlock" command
     */
    describe("#unlock", function() {
      it("should free up the input to type regular commands", async function() {
        await messer
          .processCommand('lock "test"')
          .then(() => {
            return messer.processCommand("unlock");
          })
          .then(() => {
            return messer.processCommand('m "test" hey, dude');
          })
          .then(res => {
            assert.ok(res);
          });
      });

      it("should fail if no lock command was issued beforehand", async function() {
        await messer.processCommand("unlock").catch(err => {
          assert.ok(err);
        });
      });
    });
  });
});
