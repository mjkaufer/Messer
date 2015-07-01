# Messer
Command-line messaging for Facebook Messenger

## Installation
Install `messer` globally with `npm install messer -g`, so you can use the command in any context.

## Setup

Create a `config.json` somewhere. Inside of the `config.json`, add

```
{
	"email": "email",
	"password": "password"
}
```
Fill in the email you use for facebook, along with your facebook password

## Usage
Simply type `messer path/to/config.json`, replacing `path/to/config.json` with the path to your `config.json`

Once you're logged in, you'll see a REPL.

Currently, the only supported command is `message`

### Syntax:

`message "[user]" message`

The quotes around the username are mandatory. An example might be `message "Matthew" hello world!`

When sending a message, Messer picks the closest match to what you type in as `user`. For this reason, you should probably use last names if you want to avoid accidentally texting someone.

## Contributing

Send a pull request!