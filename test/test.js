const assert = require("assert")
const commandTypes = require("../src/commands/command-types")
const getCommandHandler = require("../src/commands/command-handlers").getCommandHandler
const Messer = require("../messer")

/**
 * Return a thread as given by facebook-chat-api
 */
function getThread() {
  return {
    name: "Mark Zuckerberg",
    threadID: 111,
    color: "#000000",
  }
}

function MockApi() {
  return {
    getThreadHistory(threadID, messageCount, x, cb) {
      const data = []
      return cb(null, data)
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
  return messer
}

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

    it("should populate threadMap as expected", () => {
      messer.cacheThread(thread)
      assert.equal(thread.threadID, messer.threadMap[thread.name])
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
})

describe("Command Handlers", () => {
  const messer = MockMesser()

  /**
   * Test the history command
   */
  describe(`#${commandTypes.HISTORY.command}`, () => {
    // set up
    const rawCommand = "history \"mark\""
    const args = rawCommand.replace("\n", "").split(" ")
    const commandHandler = getCommandHandler(args[0])

    it("should return 'user not found in friends list' if friend doesn't exist", () =>
      commandHandler.call(messer, "history \"bill\"")
        .catch((err) => {
          assert.equal(err, "User 'bill' could not be found in your friends list!")
        }))

    it("should return something for a known user", () =>
      commandHandler.call(messer, "history \"mark\"")
        .then((res) => {
          assert.equal(res, "")
        }))
  })
})
