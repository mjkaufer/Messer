# Messer

Command-line Messaging for Facebook Messenger

![Downloads](https://img.shields.io/npm/dm/messer.svg)
![Version](https://img.shields.io/npm/v/messer.svg)
![License](https://img.shields.io/npm/l/messer.svg)

![](https://user-images.githubusercontent.com/12551741/27252310-6655f4f6-539e-11e7-978b-c8eaba02ba68.png)

## Installation

```bash
npm install -g messer
```

## Quick Start

1. Install `messer`
1. Run `messer` and enter your details
1. ...
1. Profit

## Setup

### Logging In

The preferred login method is to store your Facebook credentials in a file (default filepath is *./config.json*). Create a file as described below, and start `messer` with

```bash
messer [~/path/to/file]
```

```json
// config.json
{
  "email": "myfacebook@email.com",
  "password": "yourS3curePassw0rd"
}
```

### 2-Factor Authentication

Due to some issues with the [facebook-chat-api](https://github.com/Schmavery/facebook-chat-api/), there isn't a nice way to log in with 2FA-enabled Facebook account. But, we have a work-around!

1. Disable 2FA on your Facebook account (don't worry, you will be turning it back on soon)
2. Log in to Messer. Once logged in, Messer generates an `appstate.json` file that is essentially an object of your _facebook.com_ browser cookies.
3. Terminate your Messer session (i.e. close the terminal session)
4. Re-enable 2FA on your Facebook account
5. Log in to Messer

This _should™_ work! Note that this clearly is NOT multi-factor authentication. If you absoultely require it, Messer is unfortunately not for you :cry:

## Commands Reference

### message

Sends a _message_ to a given _user_

```bash
[message | m] "[user]" [message]
```

Examples

- `message "Matthew" hello world!`
- `m "Matthew" hello world!`

When sending a message, Messer picks the closest match to what you type in as `user`. For this reason, you should probably use last names if you want to avoid accidentally texting someone.

### reply

Replys to the last message you recevied i.e. Sends a message to the user of the most recently received message.

```bash
[reply | r] [message]
```

Example

- `r "hey yo this is my reply"`

Note: this will only work if you have received at least one message through Messer.

### contacts

Lists all of your Facebook friends

```bash
contacts
```

### history

Displays the last _n_ messages in the conversation with a given user. The number of messages to retrieve are optional (default is 5).

```bash
[history | h] "[user]" [numMessages]
```

Examples

- `history "Matthew" 10`
- `h "Matthew"`

## Todo

- Track received messages from users, and ~~give the user the ability to look at them with a command~~
- Make a Messenger-esque UI in the terminal
  - Using `blessed`
- Make an option to use prettier UI vs plain text
- Be able to send to specific group chats
  - Maybe something with `getThreadList` - a list of recent conversations with indices, and be able to reply to a conversation by inputting its index
- Giphy support - send random gif based on text user sends

## Contributing

Take a look in [Issues](https://github.com/mjkaufer/Messer/issues) for things to contribute to. In the future, only PR's that reference an issue will be considered. If you have a feature idea, submit an issue so it can be discussed!
