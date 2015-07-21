#! /usr/bin/env node

var login = require("facebook-chat-api");
var fs = require('fs')
var repl = require('repl')
var lastThread = null;

if(process.argv.length < 3)
	return console.log("Please specify a config JSON as your second argument!")


fs.readFile(process.argv[2], function(err, data){
	if(err)
		return console.log(err)


	var json = JSON.parse(data)

	login(json, function(err, api) {

		if(err) return console.error(err);

		console.log("Logged in as " + json.email)

		api.setOptions({
			logLevel: "silent"
		})

		api.listen(function callback(err, message) {
			if(err)
				return console.log(err)
			
			process.stderr.write("\007");//makes a beep
			if(message.type == "sticker"){
				console.log("New sticker from " + message.sender_name + " - Sticker URL: " + message.sticker_url)
			}
			console.log("New message from " + message.sender_name + " - " + message.body)
			lastThread = message.thread_id;

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

					api.sendDirectMessage(message, to, function(err, data){
						if(err){
							console.log("ERROR!")
							console.log(err)
							return callback(null)
						}

						console.log("Sent message to " + to)
						return callback(null)
					})

				} else if(cmd.toLowerCase().indexOf("reply") == 0){
					if(lastThread === null){
						console.log("Error - can't reply to messages you haven't yet received! You need to receive a message before using `reply`!");
						return callback(null);
					}

					var body = cmd.substring("reply".length).trim();

					api.sendDirectMessage(body, lastThread, function(err, data){
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
})


		