fb-birthday-gratulator
======================

Automatically post birthday messages to the Facebook profile wall of your friends.

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/fb-birthday-gratulator.svg)](https://npmjs.org/package/fb-birthday-gratulator)
[![Downloads/week](https://img.shields.io/npm/dw/fb-birthday-gratulator.svg)](https://npmjs.org/package/fb-birthday-gratulator)
[![License](https://img.shields.io/npm/l/fb-birthday-gratulator.svg)](https://github.com/GenieTim/fb-birthday-gratulator/blob/master/package.json)

<!-- toc -->
- [fb-birthday-gratulator](#fb-birthday-gratulator)
  - [Installation](#installation)
    - [Via Repo (recommended as tested)](#via-repo-recommended-as-tested)
    - [Via NPM/yarn (untested)](#via-npmyarn-untested)
  - [Configuration](#configuration)
  - [Usage](#usage)
  - [Automation](#automation)
<!-- tocstop -->

## Installation

### Via Repo (recommended as tested)
Download this repository, unpack it. Make sure you have [Node.js](https://nodejs.org/en/) installed. 
Then, from the root of this repo/directory, run `yarn install` (make sure to have yarn installed) to run

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
$ fb-gratulate
running command...
$ fb-gratulate (-v|--version|version)
fb-birthday-gratulator/0.0.0 darwin-x64 node-v13.2.0
$ fb-gratulate --help
USAGE
  $ fb-gratulate
...
```
<!-- usagestop -->

## Automation
Use a separate program, such as a [cron](https://help.ubuntu.com/community/CronHowto), to execute this utility daily.
