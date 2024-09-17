import playwright from "playwright";
// other dependencies
import fs from "fs";
import path from "path";
import util from "util";

class Gratulator {
  /**
   * Constructor to initiate all our constants
   *
   * @param {LoggerInterface} logger The logger to use (e.g. console)
   * @param {string} configFilePath The path to the configuration file
   * @param {boolean} debug Whether to use debug mode: headfull chrome
   */
  constructor(logger, configFilePath, debug = false) {
    this.debug = debug;
    if (debug) {
      logger.log("Debug mode on.");
    }

    this.logger = logger;
    this.BIRTHDAY_URL = "https://www.facebook.com/events/birthdays/";
    this.LOGIN_URL = "https://www.facebook.com/login";
    this.logger.log("Using config file: " + configFilePath);
    this.config = JSON.parse(fs.readFileSync(configFilePath, "utf8"));
    if (!this.config.username || !this.config.password || !this.config.wishes) {
      this.logger.error(
        util.format(
          'Config file "%s" does not contain keys "username", "password" and "wishes".',
          configFilePath,
        ),
      );
    }
  }

  /**
   * Main logic in order to send wishes to all friends with today birthday
   */
  async sendWishes() {
    // startup
    await this.login();
    if (this.debug) {
      this.logger.debug("Logged in. Fetching todays birthdays...");
    }

    // get list of all birthdaying friends
    let birthdayTitleDiv = (await this.getBirthdayList())[0];
    if (!birthdayTitleDiv) {
      this.logger.warn("Did not find today card.");
      return;
    }

    let birthdayDivs = await birthdayTitleDiv.$$("xpath=../div");
    while (birthdayDivs.length === 1) {
      // step up until we find two divs next to each other.
      // eslint-disable-next-line no-await-in-loop
      birthdayDivs = await birthdayDivs[0].$$("xpath=../../div");
    }

    let birthdayDiv = birthdayDivs[1];
    let textAreas = await birthdayDiv.$$('div[role="textbox"]');

    // try to fetch the usernames – fails sometimes. TODO: investigate
    let users = [];
    try {
      users = await this.findUsernames(birthdayDiv);
      for (let index = 0; index < users.length; ++index) {
        let a = users[index];
        // eslint-disable-next-line no-await-in-loop
        users[index] = await this.driver.evaluate(
          (element) => element.textContent,
          a,
        );
      }
    } catch (error) {
      this.logger.error(error);
      // this.logger.warn('Did not find users names. Error: ' + JSON.stringify(error))
    }

    if (textAreas.length === 0) {
      this.logger.log("You have wished everyone already ;)");
      return this.driver.close();
    }

    if (users.length !== textAreas.length) {
      this.logger.warn(
        util.format(
          "Did not find enough usernames (%d of %d). Will skip personalized messages...",
          users.length,
          textAreas.length,
        ),
      );
    }

    // loop friends & wish them all the best
    for await (const [index, a] of textAreas.entries()) {
      let user = null;
      if (users.length === textAreas.length) {
        user = users[index];
      }

      let wish = await this.getWish(user);
      this.logger.log(util.format('Congratulating "%s" with "%s"', user, wish));
      await a.type(wish);
      await this.driver.keyboard.press("Enter");
      await this.randomSleep();
      this.logger.log(util.format('Success: Congratulated "%s"', user));
    }

    // this.driver.close()
  }

  /**
   * Find the titles containing the names of today's birthday kids
   *
   * @param {ElementHandle} birthdayDiv the div of today's birthdays
   */
  async findUsernames(birthdayDiv) {
    let users = await birthdayDiv.$$("div a h3");
    if (users.length === 0) {
      users = await birthdayDiv.$$("div a h2");
    }

    return users;
  }

  /**
   * Fetch the wish (for a certain user if username could be loaded)
   *
   * @param {string} username The name of the birthday kiddo
   */
  async getWish(username) {
    if (username) {
      username = username.replace(/\s\s+/g, " ");
    }

    let selection;
    // has the user a proprietary congratulation?
    selection =
      username &&
      Object.prototype.hasOwnProperty.call(this.config.wishes, username)
        ? this.config.wishes[username]
        : this.config.wishes.anyone;
    return selection[Math.floor(Math.random() * selection.length)];
  }

  /**
   * Get the list with all the birthday kids
   */
  async getBirthdayList() {
    if (this.driver.url() !== this.BIRTHDAY_URL) {
      await this.driver.goto(this.BIRTHDAY_URL);
      await this.randomSleep();
    }

    if (this.driver.url() !== this.BIRTHDAY_URL) {
      await this.driver.goto("https://www.facebook.com/events");
      await this.randomSleep();
      // Facebook has a strange way of redirection: opening https://www.facebook.com/events/birthdays
      // redirects to something ? acontext = { someObject }.That URL is the one indicated when hovering the
      // sidebar button.Clicking the side bar button leads in the browser to / events / birthdays.WTF.

      // await sleep(100000)
      try {
        await this.driver.click(
          'div[role="navigation"] a[href="/events/birthdays/?acontext=%7B%22event_action_history%22%3A[]%7D"]',
        );
      } catch (error) {
        this.logger.error(error);
        await sleep(100_000);
      }

      await this.randomSleep();
    }

    // unfortunately, in new facebook, we need to go via text hints, as
    // class names are not reliable
    let test = await this.driver.$$(
      'xpath=//div[div[*[self::h1 or self::h2 or self::h3][text() = "Today\'s birthdays"]]]',
    );
    if (test.length === 0) {
      // they change the markup way too often. Maybe it looks like this, this time?
      return this.driver.$$(
        'xpath=//div[div[*[self::h1 or self::h2 or self::h3]/*[text() = "Today\'s birthdays"]]]',
      );
    }

    return test;
  }

  /**
   * Log in to facebook – try twice because we can
   *
   * @param {int} rep how many attempts where taken to log in
   */
  async login(rep = 0) {
    if (!this.driver) {
      await this.startDriver();
    }

    try {
      await this.driver.goto(this.LOGIN_URL);
    } catch (error) {
      this.logger.warn(
        "Failed to go to login page. Am on " + this.driver.url(),
      );
      const screenShotPath = path.join(
        "/",
        __dirname,
        "../../login-nav-error.png",
      );
      await this.driver.screenshot({ path: screenShotPath, fullPage: true });
      this.logger.error(error);
      throw new Error(
        "Failed navigating to login. URL is still " +
          this.driver.url() +
          ". Took screenshot to " +
          screenShotPath,
      );
    }

    if (this.driver.url().startsWith(this.LOGIN_URL)) {
      await this.acceptCookies();
      await this.randomSleep(1000);
      await this.driver.fill("input[name=email]", this.config.username);
      await this.randomSleep(100);
      await this.driver.fill("input[name=pass]", this.config.password);
      await this.randomSleep(500);
      // two methods to submit form – just try them each
      await (rep < 2
        ? this.driver.click('css=[type="submit"]')
        : this.driver.$eval("form", (form) => form.submit()));
      // sleep is so important, you know?
      await this.randomSleep();
      if (this.driver.url().startsWith(this.LOGIN_URL)) {
        if (rep > 2) {
          // failed login even after second try.
          this.logger.log(
            "Failed logging in after three attempts. Page is " +
              this.driver.url(),
          );
          const screenShotPath = path.join(
            "/",
            __dirname,
            "../../login-error.png",
          );
          await this.driver.screenshot({
            path: screenShotPath,
            fullPage: true,
          });
          throw new Error(
            "Failed login. After three attempts, URL is still " +
              this.driver.url() +
              ". Took screenshot to " +
              screenShotPath,
          );
        } else {
          await this.login(true);
        }
      }
    } else {
      this.logger.log(
        util.format(
          "Have been redirected to '%s' from login. Assuming logged in.",
          this.driver.url(),
        ),
      );
    }
  }

  async acceptCookies() {
    await this.randomSleep(1000);
    // check if there is a cookie notice we have to get rid of
    let cookieBtnSelectors = [
      "css=[data-cookiebanner='accept_button']",
      "[aria-label='Allow all cookies'][tabindex='0']",
    ];
    await cookieBtnSelectors.forEach(async (cookieBtnSelector) => {
      try {
        await this.driver.waitForSelector(cookieBtnSelector, { timeout: 5000 });
        const btnEl = await this.driver.$$(cookieBtnSelector);
        if (btnEl) {
          await this.driver.locator(cookieBtnSelector).scrollIntoViewIfNeeded();
          try {
            await this.driver.click(cookieBtnSelector);
          } catch (error) {
            this.logger.warn(
              "Could not get rid of cookie notification: " + error,
            );
          }
        }
      } catch (e) {
        this.logger.log(
          "The cookie accept button was not found with selector " +
            cookieBtnSelector +
            ".",
          e,
        );
      }
    });
  }

  /**
   * Start the Puppeteer browser
   */
  async startDriver() {
    const browserType =
      await playwright[
        this.config.browserType ? this.config.browserType : "chromium"
      ];
    let context;
    let browser;
    if (this.config.persistent) {
      context = await browserType.launchPersistentContext("./user_data", {
        headless: !this.debug,
        timeout: 60_000,
        locale: "en-US"
      });
    } else {
      browser = await browserType.launch({
        headless: !this.debug,
        locale: "en-US"
      });
      context = await browser.newContext();
      // block possible tracking scripts to reduce overhead
      const addons = await import("playwright-addons");
      await addons.adblocker(browser);
      await addons.stealth(browser);
    }

    try {
      this.driver = await context.newPage();
    } catch (error) {
      this.logger.error(error);
      return;
    }

    if (this.debug) {
      this.driver.setViewportSize({ width: 1240, height: 980 });
    }

    await this.driver.goto(this.BIRTHDAY_URL);
  }

  /**
   * Sleep for a random amount of time
   *
   * @param {double} maximum The maximum sleep time in milliseconds
   */
  async randomSleep(maximum = 10_000) {
    await sleep(maximum * Math.random());
  }
}

/**
 * Sleep for a certain time, but only if you have time to `await` it
 *
 * @param {double} millis Millisecond time to sleep
 * @returns {Promise} to sleep. Just like we did. In the end still read a book under the bed sheets.
 */
function sleep(millis) {
  return new Promise((resolve) => setTimeout(resolve, millis));
}

export default Gratulator;
