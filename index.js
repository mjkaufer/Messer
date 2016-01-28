#! /usr/bin/env node

var login = require("facebook-chat-api");
var repl = require('repl')
var lastThread = null;
var unrenderableMessage = ", unrenderable in Messer :("

if(process.argv.length < 3){//user didn't store credentials in JSON, make them manually enter credentials

	//return console.log("Please specify a config JSON as your second argument!")
	var prompt = require('prompt')
	console.log("Enter your Facebook credentials - your password will not be visible as you type it in")
	prompt.start();

	prompt.get([{
			name: 'email',
			required: true
		}, {
			name: 'password',
			hidden: true,
			conform: function (value) {
				return true;
			}
		}], function (err, result) {
			authenticate(result)
	});

} else{
	var fs = require('fs')
	fs.readFile(process.argv[2], function(err, data){
		if(err)
			return console.log(err)

		authenticate(JSON.parse(data))
	})
}

function authenticate(credentials){//where credentials is the user's credentials as an object, fields `email` and `password
	login(credentials, function(err, api) {

		if(err) return console.error(err);

		console.log("Logged in as " + credentials.email)

		api.setOptions({
			logLevel: "silent"
		})

		api.listen(function cb(err, message) {
			if(err)
				return console.log(err)
			
			var from = message.threadName

			if(message.participantNames && message.participantNames.length > 1)
				from = "'" + from + "'" + " (" + message.senderName + ")"

			process.stderr.write("\007");//makes a beep

			var messageBody = null


			if(message.type != "message"){
				return
			}
			else if(message.body !== undefined && message.body != ""){
				// console.log("New message from " + from + " - " + message.body)
				messageBody = " - " + message.body
			} 

			if(message.attachments.length == 0)
				console.log("New message from " + from + (messageBody || unrenderableMessage))
			else{
				var attachment = message.attachments[0]//only first attachment
				var attachmentType = attachment.type.replace(/\_/g," ")
				console.log("New " + attachmentType + " from " + from + (messageBody || unrenderableMessage))
			}
			
			lastThread = message.threadID;

		});

		var quoteReg = /(".*?")(.*)/g
		repl.start({
			ignoreUndefined: true,
			eval: function(cmd, context, filename, callback){
				var ndex = cmd.lastIndexOf("\n")
				ndex = ndex == -1 ? cmd.length : ndex

				cmd = cmd.substring(0, ndex)


				if(cmd.toLowerCase() == "help"){
					showHelp()
					return callback(null)
				} else if(cmd.toLowerCase().indexOf("message") == 0){
					cmd = cmd.substring("message".length).trim()

					if(cmd.match(quoteReg) == null){
						console.log("Invalid message - check your syntax")
						showHelp()
						return callback(null)
					}

					var decomposed = quoteReg.exec(cmd)
					var to = decomposed[1].replace(/"/g,"")
					var message = decomposed[2].trim()
					if(message.length == 0){
						console.log("No message to send - check your syntax")
						showHelp()
						return callback(null)
					}
					api.getUserID(to, function(err, data){
						if(err){
							console.log("ERROR!", err)
							return callback(null)
						}
						var threadID = data[0].userID;
						api.sendMessage(message, threadID, function(err){
							if(err){
								console.log("ERROR!", err)
								return callback(null)
							}
							console.log("Sent message to " + to);
										return callback(null)
						});
					
					});

				} else if(cmd.toLowerCase().indexOf("reply") == 0){
					if(lastThread === null){
						console.log("Error - can't reply to messages you haven't yet received! You need to receive a message before using `reply`!");
						return callback(null);
					}

					var body = cmd.substring("reply".length).trim();

					api.sendMessage(body, lastThread, function(err, data){

						if(err){
							console.log("ERROR!")
							console.log(err)
							return callback(null)
						}

						console.log("Successfully replied!")
						return callback(null)
					})


				} else {
					console.log("Invalid command - check your syntax")
					showHelp()
					return callback(null)	
				}

			}
		})

		function showHelp(){
			console.log("Commands:\n" + 
				" message \"[user]\" [message]\n" +
				" reply [message]"
			)
		}

	});
}
		
