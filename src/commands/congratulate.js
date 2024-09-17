/* eslint-disable no-await-in-loop */
import { Command, Flags } from "@oclif/core";
import Gratulator from "../fb-interface/gratulator.js";
import fs from "fs";
import path from "path";
import util from "util";
import { URL } from "url";

const __dirname = new URL(".", import.meta.url).pathname;

class FbBirthdayGratulatorCommand extends Command {
  async run() {
    const { argv, flags } = await this.parse(FbBirthdayGratulatorCommand);
    // const name = flags.name || 'world'
    // this.log(`hello ${name} from ./src/index.js`)
    let configFilePath = path.join(__dirname, "/../config.json");
    if (!fs.existsSync(configFilePath)) {
      configFilePath = path.join(this.config.configDir, "config.json");
      if (!fs.existsSync(configFilePath)) {
        this.warn(
          util.format('Config file "%s" does not exist.', configFilePath),
        );
        this.error(new Error("Config file not found"), { exit: 1 });
      }
    }

    try {
      const gratulator = new Gratulator(this, configFilePath, flags.debug);
      await gratulator.sendWishes();
    } catch (error) {
      this.error(error, { exit: 2 });
    }

    this.log("Success congratulating everyone.");
    this.exit(0);
  }
}

FbBirthdayGratulatorCommand.description = `Congratulate all todays birthday friends
...
Note that you require a config as described [here](https://github.com/GenieTim/fb-birthday-gratulator#configuration)
`;

FbBirthdayGratulatorCommand.flags = {
  // add --version flag to show CLI version
  version: Flags.version(),
  // add --debug flag to show Chrome (instead of headless)
  debug: Flags.boolean({ char: "d", default: false }),
  // add --help flag to show CLI version
  help: Flags.help(),
  // name: flags.string({char: 'n', description: 'name to print'}),
};

FbBirthdayGratulatorCommand.aliases = ["gratulate"];

export default FbBirthdayGratulatorCommand;
