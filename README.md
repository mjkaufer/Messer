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
2. Run `messer`
    ```bash
    $ messer
    ```
3. Enter your details
4. ...
5. Profit

For a list of commands, jump to the [Commands Reference](https://github.com/mjkaufer/Messer#commands-reference)

## Setup

### 2-Factor Authentication

1. Start Messer and wait for "Enter Code" prompt
2. Enter a 2FA code generated from your 2FA app

    If at this point the login fails, go to [Facebook](https://www.facebook.com) and check for an "Unrecognised browser" notification

3. Approve the browser/device (i.e. approve Messer)
4. Retry from Step 1

After you've successfully logged in, an `appstate.json` file is created which should allow you to skip this process every time you log in. If you wish to "start over", just delete that file.

This _should™_ work! Please let us know if it doesn't: we've had a number of issues with it in the past.

## Commands Reference

### `message`

Sends a _message_ to a given _user_

```bash
(message | m) "<user>" <message>
```

Examples

- `message "Matthew" hello world!`
- `m "Matthew" hello world!`

When sending a message, Messer picks the closest match to what you type in as `user`. For this reason, you should probably use last names if you want to avoid accidentally texting someone.

### `reply`

Replys to the last message you recevied i.e. Sends a message to the user of the most recently received message.

```bash
(reply | r) <message>
```

Example

- `r "hey yo this is my reply"`

Note: this will only work if you have received at least one message through Messer.

### `contacts`

Lists all of your Facebook friends

```bash
contacts
```

### `history`

Displays the last _n_ messages in the conversation with a given user. The number of messages to retrieve are optional (default is 5).

```bash
(history | h] "<user>" [<numMessages>]
```

Examples

- `history "Matthew" 10`
- `h "Matthew"`

### `recent`

Displays the _n_ most recent conversations. The number of threads is optional (default is 5).

```bash
recent [<numThreads>]
```

Examples

- `history "Matthew" 10`
- `h "Matthew"`

### `logout`

Logs you out

```bash
logout
```


## Non-interactive Mode

Messer can be run in non-interactive mode with command line arguments to execute a single command.

```bash
messer --command='[command]'
```

Login will be prompted if this is the first time logging in.  


Examples

- `messer --command='m "John Smith" Hey, John'`
- `messer --command='r Hey, John'`


## FAQ

### Group Chats

Messages from group chats appear like

```bash
(My cool friends) John Smith - hey guys!!$$@@
```

Send a message to a group by using the `message` command. The `name` is the name of the group chat! Reply works as normal

## Contributing

Take a look in [Issues](https://github.com/mjkaufer/Messer/issues) for things to contribute to. Only PR's that reference an issue will be considered. If you have a feature idea, submit an issue so it can be discussed!

### Before you submit your PR, ask yourself...

1. Does this PR resolve a particular issue? (if not, then why is this PR necessary)?

2. Have I written tests? (where appropriate)

3. Have I made sure the tests pass?

```bash
npm test
```
