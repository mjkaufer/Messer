const facebook = require("facebook-chat-api")

module.exports = function(credentials) {
    this.api = {}
    this.user = {}
    this.lastThread = null
    this.activeConversations = [] // store full names of recipients

    login(credentials, function(err, fbApi) {
        if (err) return console.error(err)

        api = fbApi // assign to global variable
        api.setOptions({ logLevel: "silent" })

        console.info("Logged in as " + credentials.email)

        getUserDetails(api, user).then(() => {
            console.info("Listening for incoming messages...")

            // listen for incoming messages
            api.listen(function(err, message) {
                if (err) return console.error(err)
                handleMessage(message)
            })

            // start REPL
            repl.start({
                ignoreUndefined: true,
                eval(cmd, context, filename, callback) {
                    processCommand(cmd, callback)
                }
            })
        })

    })

}