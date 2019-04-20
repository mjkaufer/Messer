const assert = require("assert");
const fs = require("fs");
const path = require("path");

const mockMessen = require("messen/dist/test/mock");
const commandTypes = require("../src/commands/command-types");
const Messer = require("../src/messer");

const mockSettings = {
  APPSTATE_FILE_PATH: path.resolve(__dirname, "tmp/appstate.json"),
};

const DEFAULT_MOCK_THREAD = {
  name: "Mark Zuckerberg",
  threadID: "111",
  color: "#000000",
  unreadCount: 0,
  lastMessageTimestamp: "123456789",
};

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
  const messer = new Messer();

  messer.messen = mockMessen.getMessen();
  return messer;
}

/**
 * Test Messer-related functionality
 */
describe("Messer", () => {
  /**
   * Test processCommand
   */
  describe("#processCommand(command)", () => {
    const messer = MockMesser();

    it("should process and handle a valid command", () =>
      messer.processCommand('message "waylon" hey dude').then(res => {
        assert.ok(res);
      }));
  });
});

/**
 * Test the command handlers
 */
describe("Command Handlers", async () => {
  const messer = MockMesser();
  await messer.messen.login();

  /**
   * Test the "message" command
   */
  describe(`#${commandTypes.MESSAGE.command}`, () => {
    it("should send message to valid threadname", () =>
      messer.processCommand('message "waylon" hey dude').then(res => {
        assert.ok(res);
      }));

    it("should send message to valid threadname using abbreviated command", () =>
      messer.processCommand('m "waylon" hey dude').then(res => {
        assert.ok(res);
      }));

    it("should send message to valid thread that isn't a friend", () =>
      messer.processCommand('message "mark" hey dude').then(res => {
        assert.ok(res);
      }));

    it("should fail to send message to invalid threadname", () =>
      messer.processCommand('m "rick" hey dude').catch(err => {
        assert.equal(err, "Error: User 'rick' could not be found in your friends list!");
      }));
  });

  /**
   * Test the "reply" command
   */
  describe(`#${commandTypes.REPLY.command}`, async () => {
    const messerCanReply = MockMesser();
    await messer.messen.login();

    messerCanReply.lastThread = getMockThread();

    it("should fail if no message has been recieved", () =>
      messer.processCommand("reply hey dude").catch(err => {
        assert.ok(err);
      }));

    it("should reply", () =>
      messerCanReply.processCommand("reply yea i agree").then(() => {
        assert.ok(true);
      }));

    it("should reply using abbreviated command", () =>
      messerCanReply.processCommand("r yea i agree").then(() => {
        assert.ok(true);
      }));
  });

  /**
   * Test the "history" command
   */
  describe(`#${commandTypes.HISTORY.command}`, async () => {
    const messerWithHistory = MockMesser();
    await messer.messen.login();

    it("should gracefully fail if no thread found", () =>
      messer.processCommand('history "bill"').catch(err => {
        assert.ok(err);
      }));

    it("should return something for a thread with some history", () => {
      messerWithHistory.messen.api.getThreadHistory = (threadID, messageCount, x, cb) => {
        const data = [
          {
            senderID: DEFAULT_MOCK_THREAD.threadID,
            body: "hey dude",
            type: "message",
          },
        ];
        return cb(null, data);
      };
      return messerWithHistory.processCommand('history "mark"').then(res => {
        assert.ok(res.trim().split("\n"));
        assert.ok(!res.includes("undefined"));
        assert.ok(!res.includes("null"));
        assert.ok(res.includes("Mark"));
      });
    });

    it("should handle messages where the sender is the current user", () => {
      messerWithHistory.messen.api.getThreadHistory = (threadID, messageCount, x, cb) => {
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

      messerWithHistory.messen.api.getThreadInfo = (threadID, cb) =>
        cb(null, { threadID, name: "Tom Quirk" });

      return messerWithHistory.processCommand('history "mark"').then(res => {
        assert.ok(res.includes(messer.messen.store.users.me.user.name));
      });
    });

    it("should return history for thread that isn't cached", () => {
      messerWithHistory.messen.api.getThreadHistory = (threadID, messageCount, x, cb) => {
        const data = [{ senderID: "1", body: "hey im waylon", type: "message" }];
        return cb(null, data);
      };

      messerWithHistory.messen.api.getThreadInfo = (threadID, cb) =>
        cb(null, { threadID, name: "Waylon Smithers" });

      return messerWithHistory.processCommand('history "waylon"').then(res => {
        assert.ok(res.trim().split("\n"));
        assert.ok(!res.includes("undefined"));
        assert.ok(!res.includes("null"));
        assert.ok(res.includes("Waylon"));
      });
    });

    it("should return truthy value when no history exists in thread", () =>
      messer.processCommand('history "waylon"').then(res => {
        assert.ok(res);
        assert.ok(!res.includes("waylon"));
      }));

    it("should act appropriately when [messageCount] given", () => {
      messerWithHistory.messen.api.getThreadHistory = (threadID, messageCount, x, cb) => {
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
      return messerWithHistory.processCommand('history "mark" 2').then(res => {
        assert.equal(res.trim().split("\n").length, 2);
        assert.ok(!res.includes("undefined"));
        assert.ok(!res.includes("null"));
        assert.ok(res.includes("Mark"));
      });
    });
  });

  /**
   * Test the "contacts" command
   */
  describe(`#${commandTypes.CONTACTS.command}`, () => {
    it("should return list of friends sep. by newline", () =>
      messer.processCommand(commandTypes.CONTACTS.command).then(res => {
        assert.equal(res, "Keniff Kaniff\nWaylon Smithers\n");
      }));

    it("should gracefully handle user with no friends", () => {
      const messerNoFriends = MockMesser();
      messerNoFriends.messen.store.users.me.friends = [];

      return messerNoFriends.processCommand("contacts").then(res => {
        assert.ok(res);
      });
    });
  });

  /**
   * Test the "help" command
   */
  describe(`#${commandTypes.HELP.command}`, () => {
    it("should return some truthy value", () =>
      messer.processCommand(commandTypes.HELP.command).then(res => {
        assert.ok(res);
      }));
  });

  /**
   * Test the "logout" command
   */
  describe(`#${commandTypes.LOGOUT.command}`, () => {
    it("should remove appstate file", () => {
      fs.writeFile(mockSettings.APPSTATE_FILE_PATH, "{}", () =>
        messer.processCommand(commandTypes.LOGOUT.command).then(() => {
          assert.ok(!fs.existsSync(mockSettings.APPSTATE_FILE_PATH));
        }),
      );
    });
  });

  /**
   * Test the "lock" command
   */
  describe(`#${commandTypes.LOCK.command}`, () => {
    it("should lock on to a valid thread name and porcess every input line as a message command", () =>
      messer.processCommand("lock waylon").then(() =>
        messer.processCommand("hey, dude").then(res => {
          assert.ok(res);
        }),
      ));

    it("should lock on to a valid thread name that is not a friend and porcess every input line as a message command", () =>
      messer.processCommand("lock mark").then(() =>
        messer.processCommand("hey, dude").then(res => {
          assert.ok(res);
        }),
      ));

    it("should fail if no thread name is specified", () =>
      messer.processCommand("lock").catch(err => {
        assert.ok(err);
      }));

    it("should fail if a non-existant thread name is specified", () =>
      messer.processCommand("lock asd").catch(err => {
        assert.ok(err);
      }));
  });

  /**
   * Test the "unlock" command
   */
  describe(`#${commandTypes.UNLOCK.command}`, () => {
    it("should free up the input to type regular commands", () =>
      messer.processCommand("lock waylon").then(() =>
        messer.processCommand("unlock").then(() =>
          messer.processCommand('m "waylon" hey, dude').then(res => {
            assert.ok(res);
          }),
        ),
      ));

    it("should fail if no lock command was issued beforehand", () =>
      messer.processCommand("unlock").catch(err => {
        assert.ok(err);
      }));
  });
});
