const assert = require("assert")

const commandTypes = require("../src/commands/command-types")
const Messer = require("../src/messer")

/**
 * Return a minimal thread as given by facebook-chat-api
 */
function getThread() {
  return {
    name: "Mark Zuckerberg",
    threadID: 111,
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
    friendsList: {
      "Waylon Smithers": {
        fullName: "Waylon Smithers",
        userID: 1,
      },
      "Keniff Kaniff": {
        fullName: "Keniff Kaniff",
        userID: 2,
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
    it("should return 'user not found in friends list' if friend doesn't exist", () =>
      messer.processCommand("history \"bill\"")
        .catch((err) => {
          assert.equal(err, "User 'bill' could not be found in your friends list!")
        }))

    it("should return something for a known user", () =>
      messer.processCommand("history \"mark\"")
        .then((res) => {
          assert.equal(res, "")
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
