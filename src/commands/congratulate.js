import { Command, Flags } from "@oclif/core";
import Gratulator from "../fb-interface/gratulator.js";
import { applyRandomDelay } from "../delay.js";

class FbBirthdayGratulatorCommand extends Command {
  async run() {
    const { flags } = await this.parse(FbBirthdayGratulatorCommand);
    const debug = flags.debug || process.env.DEBUG === "true" || process.env.DEBUG === "1";
    const configFilePath = flags.config || process.env.CONFIG_PATH || process.env.CONFIG_FILE;

    await applyRandomDelay(this, flags.delayMaxH || process.env.DELAY_MAX_H);

    try {
      const gratulator = new Gratulator(this, configFilePath, debug);
      const result = await gratulator.sendWishes();
      if (result && result.count > 0) {
        this.log(`Success: Congratulated ${result.count} birthday friend(s).`);
      } else if (result && result.reason === "no_card") {
        this.log("Completed: No today's birthday card or textboxes found.");
      } else {
        this.log("Success congratulating everyone.");
      }
    } catch (error) {
      this.error(error, { exit: 2 });
    }

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
  config: Flags.string({
    char: "c",
    description: "Path to configuration file (defaults to config.json or FB_* env vars)",
  }),
  delayMaxH: Flags.string({
    description: "Maximum random delay in hours before executing (e.g. 3.5)",
    env: "DELAY_MAX_H",
  }),
  help: Flags.help(),
};

FbBirthdayGratulatorCommand.aliases = ["gratulate"];

export default FbBirthdayGratulatorCommand;
