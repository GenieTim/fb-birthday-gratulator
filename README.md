fb-birthday-gratulator
======================

Facebook Auto Post Birthday Message

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/fb-birthday-gratulator.svg)](https://npmjs.org/package/fb-birthday-gratulator)
[![Downloads/week](https://img.shields.io/npm/dw/fb-birthday-gratulator.svg)](https://npmjs.org/package/fb-birthday-gratulator)
[![License](https://img.shields.io/npm/l/fb-birthday-gratulator.svg)](https://github.com/GenieTim/fb-birthday-gratulator/blob/master/package.json)

<!-- toc -->
- [fb-birthday-gratulator](#fb-birthday-gratulator)
  - [Configuration](#configuration)
  - [Usage](#usage)
  - [Automation](#automation)
<!-- tocstop -->
## Configuration
A file named `config.json` in the root of this directory, where the content have the structure (replace strings as appropriate):

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
Use a separate program, such as a cron, to execute this utility daily.
