# Messer

Command-line Messaging for Facebook Messenger

![Downloads](https://img.shields.io/npm/dm/messer.svg)
![Version](https://img.shields.io/npm/v/messer.svg)
![License](https://img.shields.io/npm/l/messer.svg)

Messer is a fully featured Facebook Messenger client for your terminal. Send and receive messages, view chat historys and more!

## Installation

```bash
$ npm install -g messer
```

## Quick Start

1. Install `messer`
2. Run `messer`
   ```bash
   $ messer
   ```
3. Enter your login details (don't worry, we don't store a thing)

You can configure some of Messer's behaviour via the `settings` command.

## Commands Reference

#### `message`

Sends a _message_ to a given _user_

```bash
(message | m) "<user>" <message>
```

Examples

- `message "Matthew" hello world!`
- `m "Matthew" hello world!`

When sending a message, Messer picks the closest match to what you type in as `user`. For this reason, you should probably use last names if you want to avoid accidentally texting someone.

#### `reply`

Replys to the last message you recevied i.e. Sends a message to the user of the most recently received message.

```bash
(reply | r) <message>
```

Example

- `r "hey yo this is my reply"`

Note: this will only work if you have received at least one message through Messer.

#### `contacts`

Lists all of your Facebook friends

```bash
contacts
```

#### `history`

Displays the last _n_ messages in the conversation with a given user. The number of messages to retrieve are optional (default is 5).

```bash
(history | h) "<user>" [<n>]
```

Examples

- `history "Matthew" 10`
- `h "Matthew"`

#### `recent`

Displays the _n_ most recent conversations. The number of threads is optional (default is 5).
The `--history` option will display the 5 most recent messages in each thread.

```bash
recent [<n>] [--history]
```

Examples

- `recent`
- `recent 10`
- `recent --history`

#### `gif`

Send a random gif to someone, powered by Giphy!

```bash
gif "<thread-name>" [<gif-query>]
```

Examples

- `gif "Matthew"`
- `gif "Tom" curb`

#### `clear`

Clears the number of unread messages in the window title. Since we cannot listen on focus events, it has to be done manually.

```bash
(clear | c)
```

#### `logout`

Logs you out

```bash
logout
```

#### `settings`

Interact with your settings for Messer

```bash
settings (set | get | list) [<key>=<value>]
```

Examples

- `settings get "Matthew"`
- `gif "Tom" curb`

##### Supported Settings

- `SHOW_READ`: boolean (default: `false`),

  - determines if your messages will be marked as "read" to your recipients

- `GIPHY_BASE_API`: string
- `GIPHY_API_KEY`: string,
- `GIPHY_DEFAULT_RATING` - string (default: `G`),

### Lock-on Mode

Locking on to a user or group allows you to send messages without having to specify the `message` command; just type away!

```bash
lock "Tom Q"
```

**To unlock**, simply run:

```bash
unlock
```

#### Secret Mode

When in this mode, any messages sent or recieved in the thread will be deleted for you (note, **they won't be deleted for everyone**).

```bash
lock "Tom Q" --secret
```

### Non-interactive Mode

Messer can be run in non-interactive mode with command line arguments to execute a single command.

```bash
messer --command='<command>'
```

Login will be prompted if this is the first time logging in.

Examples

- `messer --command='m "John Smith" Hey, John'`
- `messer --command='r Hey, John'`

### Cleanup

If ever you want to clean up any old Messer sessions and start from scratch, run:

```bash
$ messer cleanup
```

## FAQ

### Do you store any of my data?

**We don't store your username, password, or any of your interactions on Messer**. The only thing we store is a temporary login token when you first log in. This let's us authenticate you with Facebook _without_ you having to enter your username and password every time. If you want to get rid of it, simply run `messer cleanup`, or if you're in a Messer session, run the `logout` command.

### How do group chats work?

Messages from group chats appear like

```bash
(My cool friends) John Smith - hey guys!!$$@@
```

Send a message to a group by using the `message` command. The `name` is the name of the group chat! Reply works as normal

## Contributing

Want to add a new command, fix a bug or improve Messer in another way? Please read CONTRIBUTING.md for details on our code of conduct, and the process for submitting pull requests to us.

## License

This project is licensed under the ISC License - see the LICENSE file for details
