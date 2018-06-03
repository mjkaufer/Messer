const assert = require("assert")

const commandTypes = require("../src/commands/command-types")
const Messer = require("../src/messer")

/**
 * Return a minimal thread as given by facebook-chat-api
 */
function getThread() {
  return {
    name: "Mark Zuckerberg",
    threadID: "111",
    color: "#000000",
  }
}

/**
 * Factory to mock an instance of the facebook-chat-api
 */
function MockApi() {
  return {
    getThreadHistory(threadID, messageCount, x, cb) {
      const data = []
      return cb(null, data)
    },
    sendMessage(message, threadID, cb) {
      return cb(null)
    },
  }
}

/**
 * Factory to mock an instance of Messer
 */
function MockMesser() {
  const messer = new Messer()

  messer.api = MockApi()
  messer.cacheThread(getThread())
  messer.user = {
    userID: "666",
    name: "Tom Quirk",
    friendsList: {
      "Waylon Smithers": {
        fullName: "Waylon Smithers",
        userID: "1",
      },
      "Keniff Kaniff": {
        fullName: "Keniff Kaniff",
        userID: "2",
      },
    },
  }

  return messer
}

/**
 * Test Messer-related functionality
 */
describe("Messer", () => {
  /**
   * Test cacheThread
   */
  describe("#cacheThread(thread)", () => {
    const messer = new Messer()
    const thread = getThread()

    it("should populate threadCache as expected", () => {
      messer.cacheThread(thread)
      assert.deepEqual(thread, messer.threadCache[thread.threadID])
    })

    it("should populate threadNameToIdMap as expected", () => {
      messer.cacheThread(thread)
      assert.equal(thread.threadID, messer.threadNameToIdMap[thread.name])
    })
  })

  /**
   * Test getThreadByName
   */
  describe("#getThreadByName(name)", () => {
    const messer = new Messer()
    const thread = getThread()

    messer.cacheThread(thread)

    it("should retrieve thread by exact name", () =>
      messer.getThreadByName(thread.name)
        .then(res => assert.deepEqual(res, thread)))

    it("should retrieve thread by fuzzy name", () =>
      messer.getThreadByName("mark")
        .then(res => assert.deepEqual(res, thread)))

    it("should fail to retrieve thread by name that is not cached", () =>
      messer.getThreadByName("bill")
        .catch(e => assert(e != null)))
  })

  /**
   * Test processCommand
   */
  describe("#processCommand(command)", () => {
    const messer = MockMesser()

    it("should process and handle a valid command", () =>
      messer.processCommand("message \"waylon\" hey dude")
        .then(res => assert.ok(res)))
  })
})

/**
 * Test the command handlers
 */
describe("Command Handlers", () => {
  const messer = MockMesser()

  /**
   * Test the "message" command
   */
  describe(`#${commandTypes.MESSAGE.command}`, () => {
    it("should send message to valid threadname", () =>
      messer.processCommand("message \"waylon\" hey dude")
        .then((res) => {
          assert.ok(res)
        }))

    it("should send message to valid threadname using abbreviated command", () =>
      messer.processCommand("m \"waylon\" hey dude")
        .then((res) => {
          assert.ok(res)
        }))

    it("should send message to valid thread that isn't a friend", () =>
      messer.processCommand("message \"mark\" hey dude")
        .then((res) => {
          assert.ok(res)
        }))

    it("should fail to send message to invalid threadname", () =>
      messer.processCommand("m \"rick\" hey dude")
        .catch((err) => {
          assert.equal(err, "User 'rick' could not be found in your friends list!")
        }))
  })

  /**
   * Test the "reply" command
   */
  describe(`#${commandTypes.REPLY.command}`, () => {
    const messerCanReply = MockMesser()
    messerCanReply.lastThread = getThread()

    it("should fail if no message has been recieved", () =>
      messer.processCommand("reply hey dude")
        .catch((err) => {
          assert.ok(err)
        }))

    it("should reply", () =>
      messerCanReply.processCommand("reply yea i agree")
        .then(() => {
          assert.ok(true)
        }))

    it("should reply using abbreviated command", () =>
      messerCanReply.processCommand("r yea i agree")
        .then(() => {
          assert.ok(true)
        }))
  })


  /**
   * Test the "history" command
   */
  describe(`#${commandTypes.HISTORY.command}`, () => {
    const messerWithHistory = MockMesser()

    it("should gracefully fail if no thread found", () =>
      messer.processCommand("history \"bill\"")
        .catch((err) => {
          assert.ok(err)
        }))

    it("should return something for a thread with some history", () => {
      messerWithHistory.api.getThreadHistory = (threadID, messageCount, x, cb) => {
        const data = [{ senderID: "111", body: "hey dude" }]
        return cb(null, data)
      }
      return messerWithHistory.processCommand("history \"mark\"")
        .then((res) => {
          assert.ok(res.trim().split("\n"))
          assert.ok(!res.includes("undefined"))
          assert.ok(res.includes("Mark"))
        })
    })

    it("should handle messages where the sender is the current user", () => {
      messerWithHistory.api.getThreadHistory = (threadID, messageCount, x, cb) => {
        const data = [
          { senderID: "111", body: "hey dude" },
          { senderID: messer.user.userID, body: "hey marn" },
        ]
        return cb(null, data)
      }

      messerWithHistory.api.getThreadInfo = (threadID, cb) =>
        cb(null, { threadID, name: "Tom Quirk" })

      return messerWithHistory.processCommand("history \"mark\"")
        .then((res) => {
          assert.ok(res.includes(messer.user.name))
        })
    })

    it("should return truthy value when no history exists in thread", () =>
      messer.processCommand("history \"waylon\"")
        .then((res) => {
          assert.ok(res)
          assert.ok(!res.includes("waylon"))
        }))
  })

  /**
   * Test the "contacts" command
   */
  describe(`#${commandTypes.CONTACTS.command}`, () => {
    it("should return list of friends sep. by newline", () =>
      messer.processCommand("contacts")
        .then((res) => {
          assert.equal(res, "Keniff Kaniff\nWaylon Smithers\n")
        }))

    it("should gracefully handle user with no friends", () => {
      const messerNoFriends = MockMesser()
      messerNoFriends.user.friendsList = []

      return messerNoFriends.processCommand("contacts")
        .then((res) => {
          assert.ok(res)
        })
    })
  })

  /**
   * Test the "help" command
   */
  describe(`#${commandTypes.HELP.command}`, () => {
    it("should return some truthy value", () =>
      messer.processCommand("help")
        .then((res) => {
          assert.ok(res)
        }))
  })
})
