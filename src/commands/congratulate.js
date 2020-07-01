const {Command, flags} = require('@oclif/command')
const Gratulator = require('../fb-interface/gratulator')
const fs = require('fs')
const path = require('path')
const util = require('util')

class FbBirthdayGratulatorCommand extends Command {
  async run() {
    const {flags} = this.parse(FbBirthdayGratulatorCommand)
    // const name = flags.name || 'world'
    // this.log(`hello ${name} from ./src/index.js`)
    let configFilePath = path.join(__dirname, '/../config.json')
    if (!fs.existsSync(configFilePath)) {
      configFilePath = path.join(this.config.configDir, 'config.json')
      if (!fs.existsSync(configFilePath)) {
        this.logger.error(util.format('Config file "%s" does not exist.', configFilePath))
        this.error(new Error('Config file not found'), {exit: 1})
      }
    }
    try {
      const gratulator = new Gratulator(this, configFilePath, flags.debug)
      await gratulator.sendWishes()
    } catch (error) {
      this.error(error, {exit: 2})
    }
    this.log('Success congratulating everyone.')
    this.exit(0)
  }
}

FbBirthdayGratulatorCommand.description = `Congratulate all todays birthday friends
...
Note that you require a config as described [here](https://github.com/GenieTim/fb-birthday-gratulator#configuration)
`

FbBirthdayGratulatorCommand.flags = {
  // add --version flag to show CLI version
  version: flags.version({char: 'v'}),
  // add --debug flag to show Chrome (instead of headless)
  debug: flags.boolean({char: 'd', default: false}),
  // add --help flag to show CLI version
  help: flags.help({char: 'h'}),
  // name: flags.string({char: 'n', description: 'name to print'}),
}

FbBirthdayGratulatorCommand.aliases = ['gratulate']

module.exports = FbBirthdayGratulatorCommand
