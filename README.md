# Messer

Command-line messaging for Facebook Messenger

## Installation

Install `messer` globally with `npm install messer -g`, so you can use the command in any context.

## Setup

Make sure you are running Node 4.x

If you want to log in with your credentials stored in a file, do the following - otherwise, you'll log in by typing in your credentials each time you run Messer

Create a `config.json` somewhere. Inside of the `config.json`, add

```
{
	"email": "email",
	"password": "password"
}
```
Fill in the email you use for Facebook, along with your Facebook password

## Usage

If you stored your credentials in a json, simply type `messer path/to/config.json`, replacing `path/to/config.json` with the path to your `config.json` Otherwise, type `messer` and input your email and password as you are prompted for them. The password will not be visible as you type it in.

Once you're logged in, you'll see a REPL.

Currently, the only supported commands are `message` and `reply`

### Syntax:

`message "[user]" [message]`

The quotes around the username are mandatory. An example might be `message "Matthew" hello world!`

When sending a message, Messer picks the closest match to what you type in as `user`. For this reason, you should probably use last names if you want to avoid accidentally texting someone.

`reply [message]`

This will reply to the last message you received. Note: this will only work if you have received at least one message through Messer.

## Todo

* Track received messages from users, and give the user the ability to look at them with a command
* Make a Messenger-esque UI in the terminal
	* Using `blessed`
	* Make an option to use prettier UI vs plain text
* Be able to send to specific group chats
	* Maybe something with `getThreadList` - a list of recent conversations with indices, and be able to reply to a conversation by inputting its index
* Different colors for different chats?
* Giphy support - send random gif based on text user sends

## Warnings

facebook-chat-api@1.0.6 relies on a version of node which requires basic ES6 support - use facebook-chat-api@1.0.5 if you have an older version of node

## Contributing

Send a pull request! Check out the list of todos