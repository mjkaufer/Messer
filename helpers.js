const fs = require("fs")
const prompt = require("prompt")

/**
 * Fetches and stores all relevant user details using a promise.
 */
function getCurrentUser(api, session) {

	return new Promise((resolve, reject) => {

		session.user.userID = api.getCurrentUserID()

		api.getUserInfo(session.user.userID, (err, data) => {
			if (err) return reject(err)

			Object.assign(user, data[session.user.userID])

			// user is a friend of themselves (to make things easier)
			session.user.friendsList = [data[session.user.userID]]

			// fetch and cache user's friends list
			api.getFriendsList((err, data) => {
				if (err) return reject(err)

				// add users' actual friends
				session.user.friendsList.concat(data)

				return resolve()
			})

		})

	})
}

/**
 * Returns the user info for a given userID.
 */
function getUser(session, userID) {
	// current user
	if (userID === session.user.userID) return session.user

	let user = session.user.friendsList.find(f => f.userID === userID)

	if (!user) {
		api.getUserInfo(userID, (err, data) => {
			if (err) return console.error(err)

			user = data[userID]

			user.userID = Object.keys(data)[0]
			user.friendsList.push(user)
		})
	}

	return user
}

function getCredentials(configFilePath) {
	let credentials = {}

	if (!configFilePath) {
		//	No credentials file specified; prompt for manual entry

		console.log("Enter your Facebook credentials - your password will not be visible as you type it in")
		prompt.start()

		prompt.get([{
			name: "email",
			required: true
		}, {
			name: "password",
			hidden: true,
			conform: () => true
		}], (err, result) => { credentials = result })
	} else {
		fs.readFile(configFilePath, (err, data) => {
			if (err) return console.error(err)

			credentials = data
		})
	}

	return credentials
}

module.exports = {
	getCurrentUser,
	getUser,
	getCredentials,
}
