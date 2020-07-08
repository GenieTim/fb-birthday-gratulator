fb-birthday-gratulator
======================

Automatically post birthday messages to the Facebook profile wall of your friends.

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/fb-birthday-gratulator.svg)](https://npmjs.org/package/fb-birthday-gratulator)
[![Downloads/week](https://img.shields.io/npm/dw/fb-birthday-gratulator.svg)](https://npmjs.org/package/fb-birthday-gratulator)
[![License](https://img.shields.io/npm/l/fb-birthday-gratulator.svg)](https://github.com/GenieTim/fb-birthday-gratulator/blob/master/package.json)

<!-- toc -->

<!-- tocstop -->

## Installation

Use git's tag v1.0.0 for the old, the tag v2.0.0 for the new Facebook design. 
The tag v3.0.0 and up is for a new execution method including a `config` command.
Up of v4.0.0, you will also have additional config possibilities and [pptr](https://pptr.dev/) was 
changed for [playwright](https://github.com/microsoft/playwright).

Note that you need to set the language of Facebook to English 
for this to work out of the box.

### Via Repo (recommended as tested)
Download this repository, unpack it. Make sure you have [Node.js](https://nodejs.org/en/) installed. 
Then, from the root of this repo/directory, run `yarn install` (make sure to have yarn installed) to run.

### Via NPM/yarn (untested)
Install this repo like:
`npm install --global fb-birthday-gratulator`

(replace `npm install` with `yarn add` if you do not belong to the mainstream)

## Configuration
A file named `config.json` in the root of the directory, in which this tool has been installed to, can be used for the configuration. The content of the `config.json` have the structure (replace strings as appropriate):

```json
{
  "username": "your@email.com",
  "password": "your/pass/word!",
  "wishes":  {
    "anyone": [
      "Happy birthday! ;D",
      "Happy birthday! 🥳🎈🎁🎊🥳",
      "Best wishes & many presents! 🎁🎊🎁"
    ],
    "Your Loved Ones FB-Name": [
      "Enjoy your day, my Love! 😘💕❤️"
    ]
  }
}
```

Note that at the moment, the config is not getting validated in any useful form – you will just get the failure notification.

## Usage
<!-- usage -->
```sh-session
$ npm install -g fb-birthday-gratulator
$ fb-gratulate COMMAND
running command...
$ fb-gratulate (-v|--version|version)
fb-birthday-gratulator/4.0.0 darwin-x64 node-v12.18.1
$ fb-gratulate --help [COMMAND]
USAGE
  $ fb-gratulate COMMAND
...
```
<!-- usagestop -->

## Commands
<!-- commands -->
* [`fb-gratulate config`](#fb-gratulate-config)
* [`fb-gratulate congratulate`](#fb-gratulate-congratulate)
* [`fb-gratulate help [COMMAND]`](#fb-gratulate-help-command)

## `fb-gratulate config`

Generate or edit a config - interactively

```
USAGE
  $ fb-gratulate config

DESCRIPTION
  ...
  This command lets you create a new config if none exists interactively 
  or opens lazily an editor to let you edit the existing config.
```

_See code: [src/commands/config.js](https://github.com/GenieTim/fb-birthday-gratulator/blob/v4.0.0/src/commands/config.js)_

## `fb-gratulate congratulate`

Congratulate all todays birthday friends

```
USAGE
  $ fb-gratulate congratulate

OPTIONS
  -d, --debug
  -h, --help     show CLI help
  -v, --version  show CLI version

DESCRIPTION
  ...
  Note that you require a config as described [here](https://github.com/GenieTim/fb-birthday-gratulator#configuration)

ALIASES
  $ fb-gratulate gratulate
```

_See code: [src/commands/congratulate.js](https://github.com/GenieTim/fb-birthday-gratulator/blob/v4.0.0/src/commands/congratulate.js)_

## `fb-gratulate help [COMMAND]`

display help for fb-gratulate

```
USAGE
  $ fb-gratulate help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.1.0/src/commands/help.ts)_
<!-- commandsstop -->

## Automation
Use a separate program, such as a [cron](https://help.ubuntu.com/community/CronHowto), to execute this utility daily.
