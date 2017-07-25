# Messer

Command-line messaging for Facebook Messenger

![](https://user-images.githubusercontent.com/12551741/27252310-6655f4f6-539e-11e7-978b-c8eaba02ba68.png)

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

### Commands Reference

#### message
`[message | m] "[user]" [message]`
Sends a _message_ to a given _user_

Examples
- `message "Matthew" hello world!`
- `m "Matthew" hello world!`

When sending a message, Messer picks the closest match to what you type in as `user`. For this reason, you should probably use last names if you want to avoid accidentally texting someone.

#### reply
Replys to the last message you recevied i.e. Sends a message to the user of the most recently received message.
`[reply | r] [message]`

Example
- `r "hey yo this is my reply"`

Note: this will only work if you have received at least one message through Messer.

#### contacts
Lists all of your Facebook friends
`contacts`

#### read
Displays the last _n_ messages in the conversation with a given user. The number of messages to retrieve are optional (default is 5).
`read "[user]" [numMessages]`

Examples
- `read "Matthew" 10`
- `read "Matthew"`

## Todo

* Track received messages from users, and ~~give the user the ability to look at them with a command~~
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

Take a look in [Issues](https://github.com/mjkaufer/Messer/issues) for things to contribute to. In the future, only PR's that reference an issue will be considered. If you have a feature idea, submit an issue so it can be discussed!
