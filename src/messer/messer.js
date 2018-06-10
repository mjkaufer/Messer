const facebook = require("facebook-chat-api");

const helpers = require("./util/helpers.js");

/**
 * Creates a singleton that represents a Messer session.
 * @class
 */
function Messer(options = {}) {
  this.api = null;
  this.user = null;

  this.threads = {}; // id: {}

  this.eventHandlers = {
    message: () => null,
    event: () => null,
    message_reaction: () => null,
  };

  this.lastThread = null;
  this.debug = options.debug || false;
}

/**
 * Perform inital load of, or refresh, user info.
 */
Messer.prototype.getOrRefreshUserInfo = function getOrRefreshUserInfo() {
  return new Promise((resolve, reject) => {
    const userId = this.api.getCurrentUserID();
    if (this.user === null) this.user = {};

    return this.api.getUserInfo(userId, (err, data) => {
      if (err) return reject(err);

      Object.assign(this.user, data[userId]);
      this.user.userID = userId; // set userId, because the api doesn't

      return resolve(this.user);
    });
  });
};

/**
 * Refresh user's friends list
 */
Messer.prototype.refreshFriendsList = function refreshFriendsList() {
  return new Promise((resolve, reject) =>
    this.api.getFriendsList((err, data) => {
      if (err) return reject(err);

      this.user.friendsList = data.reduce((prev, friend) => (
        { ...prev, [friend.userID]: friend }
      ), {});

      return resolve(this.user.friendsList);
    }),
  );
};

/**
 * Refresh the thread list.
 */
Messer.prototype.refreshThreadList = function refreshThreadList() {
  return new Promise((resolve, reject) =>
    this.api.getThreadList(20, null, ["INBOX"], (err, data) => {
      if (!data) return reject("Nothing returned from getThreadList");

      this.threads = data.reduce((prev, thread) => (
        { ...prev, [thread.threadID]: thread }
      ), {});

      return resolve(this.threads);
    }));
};

Messer.prototype.fetchUser = function fetchUser() {
  return Promise.all([
    this.getOrRefreshUserInfo(),
    this.refreshFriendsList(),
    this.refreshThreadList(),
  ]);
};

/**
 * Authenticates a user with Facebook. Prompts for credentials if argument is undefined.
 * @param {Object} credentials - The Facebook credentials of the user
 * @param {string} email - The user's Facebook email
 * @param {string} credentials.password - The user's Facebook password
 * @return {Promise<null>}
 */
Messer.prototype.authenticate = function authenticate(credentials) {
  const config = {
    forceLogin: true,
    logLevel: this.debug ? "info" : "silent",
    selfListen: true,
    listenEvents: true,
  };

  return new Promise((resolve, reject) => {
    facebook(credentials, config, (err, fbApi) => {
      if (err) {
        switch (err.error) {
          case "login-approval":
            helpers.promptCode().then(code => err.continue(code));
            break;
          default:
            return reject(`Failed to login as [${credentials.email}] - ${err.error}`);
        }
        return null;
      }

      helpers.saveAppState(fbApi.getAppState());

      this.api = fbApi;

      return resolve();
    });
  });
};

/**
 * Starts a Messer session.
 */
Messer.prototype.start = function start() {
  helpers.getCredentials()
    .then(credentials => this.authenticate(credentials))
    .then(() => this.getOrRefreshUserInfo())
    .then(() => this.fetchUser())
    .then(() => {
      this.api.listen((err, ev) => (
        err
          ? null
          : this.eventHandlers[ev.type].call(this, ev)
      ));
    });
  // .catch(err => log(err));
};

/**
 * Gets thread by threadID.
 * @param {String} threadID - threadID of desired thread
 * @param {Boolean} requireName - specifies if the thread name is absolutely necessary
 */
Messer.prototype.getThreadById = function getThreadById(threadID, requireName = false) {
  return new Promise((resolve, reject) => {
    let thread = this.threads[threadID];

    if (thread) return resolve(thread);

    return this.api.getThreadInfo(threadID, (err, data) => {
      if (err) return reject(err);
      thread = data;

      // sometimes threads (usually old ones) don't have names, so lets
      // try to get thread name from friends list
      if (!thread.name && requireName) {
        const friend = helpers.objectValues(this.user.friendsList)
          .find(user => user.userID === threadID);

        thread.name = friend.fullName;
      }

      this.cacheThread(thread);

      return resolve(thread);
    });
  });
};

/**
 * Register an event handler for a given event type
 * @param {string} eventType - type of event to handle
 * @param {func} handler - handler function
 */
Messer.prototype.registerEventHandler = function registerEventHandler(eventType, handler) {
  if (!(eventType in this.eventHandlers)) return false;

  this.eventHandlers[eventType] = handler;
  return true;
};

/**
 * Register an event handler for a given event type
 * @param {string} eventType - type of event to handle
 * @param {func} handler - handler function
 */
Messer.prototype.messageByThreadId = function messageByThreadId(threadId, messageBody) {
  return new Promise((resolve, reject) => {
    this.api.sendMessage(messageBody, threadId, (err) => {
      if (err) return reject(err);
      return resolve();
    });
  });
};

module.exports = Messer;
