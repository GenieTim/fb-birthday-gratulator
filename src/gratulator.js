const path = require('path')
const puppeteer = require('puppeteer')
var fs = require('fs')
const util = require('util')

class Gratulator {
  /**
   * Constructor to initiate all our constants
   *
   * @param {LoggerInterface} logger The logger to use (e.g. console)
   * @param {boolean} debug Whether to use debug mode: headfull chrome
   */
  constructor(logger, debug = false) {
    this.debug = debug
    this.logger = logger
    this.BIRTHDAY_URL = 'https://www.facebook.com/events/birthdays/'
    this.LOGIN_URL = 'https://www.facebook.com/login'
    const configFilePath = path.join(__dirname, '/../config.json')
    if (!fs.existsSync(configFilePath)) {
      this.logger.error(util.format('Config file "%s" does not exist.', configFilePath))
    }
    this.config = JSON.parse(fs.readFileSync(configFilePath, 'utf8'))
    if (!this.config.username || !this.config.password || !this.config.wishes) {
      this.logger.error(util.format('Config file "%s" does not contain keys "username", "password" and "wishes".', configFilePath))
    }
  }

  /**
   * Main logic in order to send wishes to all friends with today birthday
   */
  async sendWishes() {
    // startup
    await this.login()
    // get list of all birthdaying friends
    let divs = (await this.getBirthdayList())[0]
    if (!divs) {
      this.logger.warn('Did not find today card.')
      return
    }
    let birthdayDiv = (await divs.$$('div'))[1]

    if (!(birthdayDiv)) {
      this.logger.error('Failed to go one step up.')
      return
    }
    let textAreas = await birthdayDiv.$$('div[role="textbox"]')

    // try to fetch the usernames – fails sometimes. TODO: investigate
    let users = []
    try {
      users = this.findUsernames(birthdayDiv)
      for (let index = 0; index < users.length; ++index) {
        let a = users[index]
        // eslint-disable-next-line no-await-in-loop
        users[index] = await this.driver.evaluate(element => element.textContent, a)
      }
    } catch (error) {
      this.logger.error(error)
      // this.logger.warn('Did not find users names. Error: ' + JSON.stringify(error))
    }

    if (textAreas.length === 0) {
      this.logger.log('You have wished everyone already ;)')
      return this.driver.close()
    }

    if (users.length !== textAreas.length) {
      this.logger.warn(util.format('Did not find enough usernames (%d of %d). Will skip personalized messages...', users.length, textAreas.length))
    }

    // loop friends & wish them all the best
    for await (const [index, a] of textAreas.entries()) {
      let user = null
      if (users.length === textAreas.length) {
        user = users[index]
      }
      let wish = await this.getWish(user)
      this.logger.log(util.format('Congratulating "%s" with "%s"', user, wish))
      await a.type(wish)
      await this.driver.keyboard.press('Enter')
      await this.randomSleep()
      this.logger.log(util.format('Success: Congratulated "%s"', user))
    }

    return this.driver.close()
  }

  async findUsernames(birthdayDiv) {
    let users = await birthdayDiv.$$('div a h3')
    if (users.length === 0) {
      users = await birthdayDiv.$$('div a h2')
    }
    return users
  }

  /**
   * Fetch the wish (for a certain user if username could be loaded)
   *
   * @param {string} username The name of the birthday kiddo
   */
  async getWish(username) {
    let selection
    // has the user a proprietary congratulation?
    if (username && Object.prototype.hasOwnProperty.call(this.config.wishes, username)) {
      selection = this.config.wishes[username]
    } else {
      selection = this.config.wishes.anyone
    }
    return selection[Math.floor(Math.random() * selection.length)]
  }

  /**
   * Get the list with all the birthday kids
   */
  async getBirthdayList() {
    await this.driver.goto(this.BIRTHDAY_URL)
    await this.randomSleep()
    if (this.driver.url() !== this.BIRTHDAY_URL) {
      await this.driver.goto('https://www.facebook.com/events')
      await this.randomSleep()
      // Facebook has a strange way of redirection: opening https://www.facebook.com/events/birthdays
      // redirects to something ? acontext = { someObject }.That URL is the one indicated when hovering the
      // sidebar button.Clicking the side bar button leads in the browser to / events / birthdays.WTF.

      // await sleep(100000)
      try {
        await this.driver.click('div[role="navigation"] a[href="/events/birthdays/?acontext=%7B%22event_action_history%22%3A[]%7D"]')
      } catch (error) {
        this.logger.error(error)
        await sleep(100000)
      }
      await this.randomSleep()
    }
    // unfortunately, in new facebook, we need to go via text hints, as
    // class names are not reliable
    return this.driver.$x('//div[div[*[self::h1 or self::h2 or self::h3][text() = "Today\'s birthdays"]]]')
  }

  /**
   * Log in to facebook – try twice because we can
   *
   * @param {boolean} rep whether this is the first (false) or second attempt (true)
   */
  async login(rep = false) {
    if (!this.driver) {
      await this.startDriver()
    }
    await this.driver.goto(this.LOGIN_URL)
    if (this.driver.url().startsWith(this.LOGIN_URL)) {
      await this.randomSleep(1000)
      await this.driver.type('input[name=email]', this.config.username)
      await this.randomSleep(100)
      await this.driver.type('input[name=pass]', this.config.password)
      await this.randomSleep(500)
      await this.driver.$eval('form', form => form.submit())
      // sleep is so important, you know?
      await this.randomSleep()
      if (this.driver.url().startsWith(this.LOGIN_URL)) {
        if (rep) {
          throw new Error('Failed login.')
        } else {
          await this.login(true)
        }
      }
    } else {
      this.logger.log(util.format("Have been redirected to '%s' from login. Assuming logged in.", this.driver.url()))
    }
  }

  /**
   * Start the Puppeteer browser
   */
  async startDriver() {
    const browser = await puppeteer.launch({
      headless: !this.debug,
      userDataDir: './user_data',
    })
    try {
      this.driver = await browser.newPage()
    } catch (error) {
      this.logger.error(error)
      return
    }
    if (this.debug) {
      this.driver.setViewport({width: 0, height: 0})
    }
    await this.driver.goto(this.BIRTHDAY_URL)
  }

  /**
   * Sleep for a random amount of time
   *
   * @param {double} maximum The maximum sleep time in milliseconds
   */
  async randomSleep(maximum = 10000) {
    await sleep(maximum * Math.random())
  }
}

/**
 * Sleep for a certain time, but only if you have time to `await` it
 *
 * @param {double} millis Millisecond time to sleep
 * @returns {Promise} to sleep. Just like we did. In the end still read a book under the bed sheets.
 */
function sleep(millis) {
  return new Promise(resolve => setTimeout(resolve, millis))
}

module.exports = Gratulator
