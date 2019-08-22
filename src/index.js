const {Command, flags} = require('@oclif/command')
const Gratulator = require('./gratulator')

class FbBirthdayGratulatorCommand extends Command {
  async run() {
    const {flags} = this.parse(FbBirthdayGratulatorCommand)
    // const name = flags.name || 'world'
    // this.log(`hello ${name} from ./src/index.js`)
    try {
      const gratulator = new Gratulator(this, flags.debug)
      await gratulator.sendWishes()
    } catch (error) {
      this.error(error, {exit: 1})
    }
    this.log('Success congratulating everyone.')
    this.exit(1)
  }
}

FbBirthdayGratulatorCommand.description = `Congratulate all todays birthday friends
...
Extra documentation goes here
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

module.exports = FbBirthdayGratulatorCommand
