const { Command, flags } = require('@oclif/command')
const Gratulator = require('./gratulator')

class FbBirthdayGratulatorCommand extends Command {
  async run() {
    // const { flags } = this.parse(FbBirthdayGratulatorCommand)
    // const name = flags.name || 'world'
    // this.log(`hello ${name} from ./src/index.js`)
    const gratulator = new Gratulator(this)
    gratulator.sendWishes()
  }
}

FbBirthdayGratulatorCommand.description = `Congratulate all todays birthday friends
...
Extra documentation goes here
`

FbBirthdayGratulatorCommand.flags = {
  // add --version flag to show CLI version
  version: flags.version({ char: 'v' }),
  // add --help flag to show CLI version
  help: flags.help({ char: 'h' }),
  // name: flags.string({char: 'n', description: 'name to print'}),
}

module.exports = FbBirthdayGratulatorCommand
