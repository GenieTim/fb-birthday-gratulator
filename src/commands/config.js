import { Command, Flags } from "@oclif/core";
import fs from "fs";
import path from "path";
import cli from "cli-ux";
import launch from "launch-editor";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ConfigCommand extends Command {
  async run() {
    let configFilePath = path.resolve(__dirname, "../../config.json");
    if (!fs.existsSync(configFilePath)) {
      configFilePath = path.join(this.config.configDir, "config.json");
    }

    if (fs.existsSync(configFilePath)) {
      this.log(`Config file exists at ${configFilePath}`);
      launch(configFilePath);
    } else {
      this.log("Generating new configuration...");
      let config = {};
      config.username = await cli.prompt(
        "What is your Facebook login/username/E-Mail?",
      );
      config.password = await cli.prompt("What is your Facebook password?");
      let wishes = {};
      wishes.anyone = await this.askForWishes("anyone");
      this.log(
        "You will now be asked to enter the full name of people you want a personal/specific wish for.",
      );
      this.log(
        "Press enter without entering a name/text/an empty string to finish.\n",
      );
      let anotherUser = await cli.confirm(
        "Add specific wishes for another user? [y/n]",
      );
      while (anotherUser) {
        let newUser = await cli.prompt(
          "What is the full name of this other person close to heart?",
        );
        if (!newUser || !newUser.trim()) {
          break;
        }
        newUser = newUser.trim();
        wishes[newUser] = await this.askForWishes(newUser);
        anotherUser = await cli.confirm(
          "Add specific wishes for another user? [y/n]",
        );
      }

      config.wishes = wishes;
      this.log(`Writing config file ${configFilePath}.`);
      this.warn(
        "Please note that your password is not encrypted on this device – do not let anyone get near that config file.",
      );
      fs.mkdirSync(path.dirname(configFilePath), { recursive: true });
      fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2), "utf8");
    }
  }

  async askForWishes(user) {
    let anotherWish = true;
    let wishes = [];
    while (anotherWish) {
      const wish = await cli.prompt(`What shall the wish be for "${user}"?`);
      if (wish && wish.trim()) {
        wishes.push(wish.trim());
      }
      anotherWish = await cli.confirm(`Add another wish for "${user}"? [y/n]`);
    }
    return wishes;
  }
}

ConfigCommand.description = `Generate or edit a config - interactively
...
This command lets you create a new config if none exists interactively 
or opens lazily an editor to let you edit the existing config.
`;

ConfigCommand.flags = {
  version: Flags.version(),
  help: Flags.help(),
};

export default ConfigCommand;
