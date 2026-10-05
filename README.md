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

## Deployment (Coolify & Docker)

This repository includes first-class support for deploying to [Coolify](https://coolify.io) or any Docker / Docker Compose host.

### Deploying on Coolify

1. **Add Resource in Coolify**:
   - In your Coolify dashboard, click **+ Add Resource** &rarr; **Git Repository**.
   - Select this repository.
   - Coolify will detect `docker-compose.yml` automatically (or you can select **Docker Compose** / **Dockerfile**).

2. **Configure Environment Variables** in Coolify:
   | Variable | Required | Default | Description |
   |---|---|---|---|
   | `FB_USERNAME` | Yes | - | Your Facebook login email or username |
   | `FB_PASSWORD` | Yes | - | Your Facebook password |
   | `TZ` | No | `Europe/Zurich` | Timezone (e.g. `UTC`, `America/New_York`) |
   | `FB_WISHES` | No | *(Default wishes)* | Custom wishes as JSON object, JSON array, or comma-separated strings |
   | `FB_PERSISTENT` | No | `true` | Save cookies and browser profile to volume (`/app/user_data`) |
   | `RUN_ON_STARTUP` | No | `false` | Run congratulator once immediately upon container start |
   | `DELAY_MAX_H` | No | *(None)* | Random delay up to this many hours before executing (e.g. `4`) |
   | `CRON_SCHEDULE` | No | *(None)* | Optional internal cron (only needed if NOT using Coolify's Scheduled Tasks) |
   | `TRIGGER_TOKEN` | No | *(None)* | Optional token to protect manual webhooks via `POST /trigger` |
   | `PORT` | No | `3000` | Port for the HTTP healthcheck & status server |

3. **Deploy the Service**:
   - Click **Deploy**.
   - The container runs as a background service, keeping your Facebook session cookies in the persistent volume `fb_user_data` and serving healthchecks on port 3000.

4. **Schedule the Daily Task in Coolify (Recommended)**:
   - In your deployed resource in Coolify, open the **Scheduled Tasks** tab.
   - Click **+ Add New**.
   - Fill in:
     - **Name**: `Daily Birthday Wishes`
     - **Command**: `fb-gratulate congratulate`
     - **Frequency**: `0 9 * * *` (e.g. every day at 09:00 AM)
   - Click **Save**.
   - Coolify will run `fb-gratulate congratulate` inside the container on schedule, display individual execution logs and duration for each run, and let you test anytime with the **Run Now** button!

### HTTP Healthcheck & Status API

The daemon includes a built-in HTTP server on port 3000:
- **`GET /health`** (or `GET /`): Returns JSON with uptime, last run status, and next scheduled run timestamp. Coolify uses this for automatic health monitoring.
- **`POST /trigger`**: Triggers an immediate congratulation run. If `TRIGGER_TOKEN` is configured, pass `Authorization: Bearer <token>` or `x-trigger-token: <token>`.

### Initial Login & 2-Step Verification (2FA)

When logging in for the first time, Facebook may require 2-step verification or login approval on your mobile device. There are two easy ways to handle this:

#### Method A: Copy existing local session (Recommended)
Log in once on your local machine with a visible browser:
```sh
yarn gratulate -d
```
Once approved, copy your local `user_data/` directory directly into the Docker volume on your server:
```sh
docker cp user_data/. fb-birthday-gratulator:/app/user_data/
```
Because the session cookies and device trust are stored in `user_data`, the container will stay authenticated without prompting for 2FA again.

#### Method B: Forward Display via `ssh -X`
If connected to your server via `ssh -X` (or `ssh -Y`), forward the X11 display socket into Docker:
```sh
docker compose run --rm \
  -e DISPLAY=$DISPLAY \
  -v /tmp/.X11-unix:/tmp/.X11-unix \
  fb-birthday-gratulator congratulate -d
```
The browser window will open on your local machine through SSH X11 forwarding, allowing you to log in and approve the 2FA checkpoint interactively. The session is preserved in the persistent volume `fb_user_data`.

### Manual CLI Run

You can also run one-off tasks via Docker:
```sh
# Run congratulate directly
docker compose run --rm fb-birthday-gratulator congratulate

# Or execute inside a running container
docker compose exec fb-birthday-gratulator node bin/run.js congratulate
```


## License
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2FGenieTim%2Ffb-birthday-gratulator.svg?type=large)](https://app.fossa.com/projects/git%2Bgithub.com%2FGenieTim%2Ffb-birthday-gratulator?ref=badge_large)
