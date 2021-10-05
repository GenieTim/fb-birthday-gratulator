/* eslint-disable no-await-in-loop */
const {Command} = require('@oclif/command')
const fs = require('fs')
const path = require('path')
const {cli} = require('cli-ux')
const launch = require('launch-editor')

class ConfigCommand extends Command {
  async run() {
    // get args & flags as necessary
    // const {flags} = this.parse(ConfigCommand)

    let configFilePath = path.join(__dirname, '/../../config.json')
    if (!fs.existsSync(configFilePath)) {
      configFilePath = path.join(this.config.configDir, 'config.json')
    }

    if (fs.existsSync(configFilePath)) {
      this.log(`Config file exists at ${configFilePath}`)
      launch(configFilePath)
    } else {
      this.log('Generating new configiguration...')
      let config = {}
      config.username = await cli.prompt('What is your Facebook login/username/E-Mail?')
      config.password = await cli.prompt('What is your Facebook password?')
      let wishes = {}
      wishes.anyone = await this.askForWishes('anyone')
      this.log('You will now be asked to enter the full name of people you want a personal/specific wish.')
      this.log('Press enter without entering a name/text/an empty string to finish.\n')
      let anotherUser = await cli.confirm('Add specific wishes for another user? [y/n]')
      while (anotherUser) {
        let newUser = await cli.prompt('What is the full name of this other person close to heart?')
        wishes[anotherUser] = await this.askForWishes(newUser)
        anotherUser = await cli.confirm('Add specific wishes for another user? [y/n]')
      }

      config.wishes = wishes
      this.log(`Writing config file ${configFilePath}.`)
      this.warn('Please note that your password is not encrypted on this device – do not let anyone get near that config file.')
      fs.mkdirSync(path.dirname(configFilePath), {recursive: true})
      fs.writeFileSync(configFilePath, JSON.stringify(config), 'utf8')
    }
  }

  async askForWishes(user) {
    let anotherWish = true
    let wishes = []
    while (anotherWish) {
      wishes.push(await cli.prompt(`What shall the wish be for "${user}"?`))
      anotherWish = await cli.confirm(`Add another wish for "${user}?" [y/n]`)
    }
  }
}

ConfigCommand.description = `Generate or edit a config - interactively
...
This command lets you create a new config if none exists interactively 
or opens lazily an editor to let you edit the existing config.
`

ConfigCommand.flags = {
  // debug: flags.string({char: 'd', description: 'debug: write some more stuff'}),
}

module.exports = ConfigCommand
