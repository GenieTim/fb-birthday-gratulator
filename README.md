fb-birthday-gratulator
======================

Automatically post birthday messages to the Facebook profile wall of your friends.

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/fb-birthday-gratulator.svg)](https://npmjs.org/package/fb-birthday-gratulator)
[![Downloads/week](https://img.shields.io/npm/dw/fb-birthday-gratulator.svg)](https://npmjs.org/package/fb-birthday-gratulator)
[![License](https://img.shields.io/npm/l/fb-birthday-gratulator.svg)](https://github.com/GenieTim/fb-birthday-gratulator/blob/master/package.json)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2FGenieTim%2Ffb-birthday-gratulator.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2FGenieTim%2Ffb-birthday-gratulator?ref=badge_shield)

<!-- toc -->

<!-- tocstop -->

## Installation

Use git's tag v1.0.0 for the old, the tag v2.0.0 for the new Facebook design. 
The tag v3.0.0 and up is for a new execution method including a `config` command.
Up of v4.0.0, you will also have additional config possibilities and [pptr](https://pptr.dev/) was 
changed for [playwright](https://github.com/microsoft/playwright).

Note that you need to set the language of Facebook to English 
for this to work out of the box.

### Via Repo
Download this repository, unpack it. Make sure you have [Node.js](https://nodejs.org/en/) installed. 
Then, from the root of this repo/directory, run `yarn install` (make sure to have yarn installed) to run.

### Via NPM/yarn
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
$ fb-gratulate (--version|-v)
fb-birthday-gratulator/4.1.2 darwin-x64 node-v22.1.0
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
* [`fb-gratulate gratulate`](#fb-gratulate-gratulate)
* [`fb-gratulate help [COMMAND]`](#fb-gratulate-help-command)
* [`fb-gratulate version`](#fb-gratulate-version)

## `fb-gratulate config`

Generate or edit a config - interactively

```
USAGE
  $ fb-gratulate config [--version] [--help]

FLAGS
  --help     Show CLI help.
  --version  Show CLI version.

DESCRIPTION
  Generate or edit a config - interactively
  ...
  This command lets you create a new config if none exists interactively
  or opens lazily an editor to let you edit the existing config.
```

_See code: [src/commands/config.js](https://github.com/GenieTim/fb-birthday-gratulator/blob/v4.1.2/src/commands/config.js)_

## `fb-gratulate congratulate`

Congratulate all todays birthday friends

```
USAGE
  $ fb-gratulate congratulate [--version] [-d] [--help]

FLAGS
  -d, --debug
      --help     Show CLI help.
      --version  Show CLI version.

DESCRIPTION
  Congratulate all todays birthday friends
  ...
  Note that you require a config as described [here](https://github.com/GenieTim/fb-birthday-gratulator#configuration)


ALIASES
  $ fb-gratulate gratulate
```

_See code: [src/commands/congratulate.js](https://github.com/GenieTim/fb-birthday-gratulator/blob/v4.1.2/src/commands/congratulate.js)_

## `fb-gratulate gratulate`

Congratulate all todays birthday friends

```
USAGE
  $ fb-gratulate gratulate [--version] [-d] [--help]

FLAGS
  -d, --debug
      --help     Show CLI help.
      --version  Show CLI version.

DESCRIPTION
  Congratulate all todays birthday friends
  ...
  Note that you require a config as described [here](https://github.com/GenieTim/fb-birthday-gratulator#configuration)


ALIASES
  $ fb-gratulate gratulate
```

## `fb-gratulate help [COMMAND]`

Display help for fb-gratulate.

```
USAGE
  $ fb-gratulate help [COMMAND...] [-n]

ARGUMENTS
  COMMAND...  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for fb-gratulate.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v6.0.21/src/commands/help.ts)_

## `fb-gratulate version`

```
USAGE
  $ fb-gratulate version [--json] [--verbose]

FLAGS
  --verbose  Show additional information about the CLI.

GLOBAL FLAGS
  --json  Format output as json.

FLAG DESCRIPTIONS
  --verbose  Show additional information about the CLI.

    Additionally shows the architecture, node version, operating system, and versions of plugins that the CLI is using.
```

_See code: [@oclif/plugin-version](https://github.com/oclif/plugin-version/blob/v2.0.18/src/commands/version.ts)_
<!-- commandsstop -->

## Automation
Use a separate program, such as a [cron](https://help.ubuntu.com/community/CronHowto), to execute this utility daily.


## License
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2FGenieTim%2Ffb-birthday-gratulator.svg?type=large)](https://app.fossa.com/projects/git%2Bgithub.com%2FGenieTim%2Ffb-birthday-gratulator?ref=badge_large)
