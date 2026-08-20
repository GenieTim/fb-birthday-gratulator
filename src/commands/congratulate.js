import { Command, Flags } from "@oclif/core";
import Gratulator from "../fb-interface/gratulator.js";
import fs from "fs";
import path from "path";
import util from "util";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class FbBirthdayGratulatorCommand extends Command {
  async run() {
    const { flags } = await this.parse(FbBirthdayGratulatorCommand);
    let configFilePath = path.resolve(__dirname, "../../config.json");
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
  version: Flags.version(),
  debug: Flags.boolean({
    char: "d",
    default: false,
    description: "Show browser window and pause between actions for debugging",
  }),
  help: Flags.help(),
};

FbBirthdayGratulatorCommand.aliases = ["gratulate"];

export default FbBirthdayGratulatorCommand;
