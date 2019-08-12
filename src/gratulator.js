const path = require('path')
const puppeteer = require('puppeteer')
var fs = require('fs')

class Gratulator {
  constructor(logger, debug = false) {
    this.debug = debug
    this.logger = logger
    this.BIRTHDAY_URL = 'https://www.facebook.com/events/birthdays/'
    this.LOGIN_URL = 'https://www.facebook.com/login'
    const configFilePath = path.join(__dirname, '/../config.json')
    if (!fs.existsSync(configFilePath)) {
      this.logger.error("Config file '" + configFilePath + "' does not exist.")
    }
    this.config = JSON.parse(fs.readFileSync(configFilePath, 'utf8'))
    if (!this.config.username || !this.config.password || !this.config.wishes) {
      this.logger.error("Config file '" + configFilePath + "' does not contain keys 'username', 'password' or 'wishes'.")
    }
  }

  async sendWishes() {
    await this.login()
    let divs = await this.getBirthdayList()
    if (!divs) {
      this.logger.warn('Did not find today card.')
      return
    }
    let birthdayDiv = (await divs.$x('..'))[0]

    if (!(birthdayDiv)) {
      this.logger.error('Failed to go one step up.')
      return
    }
    let textAreas = await birthdayDiv.$$('textarea')

    let users = []
    try {
      users = await birthdayDiv.$x('//a[@data-hovercard]')
    } catch (error) {
      this.logger.warn('Did not find users names', error)
    }

    if (textAreas.length === 0) {
      this.logger.log('You have wished everyone already ;)')
      return this.driver.close()
    }

    if (users.length !== textAreas.length) {
      this.logger.warn('Did not find enough usernames. Will skip personalized messages...')
    }

    for (const [index, a] of textAreas.entries()) {
      let user = null
      if (users.length === textAreas.length) {
        user = users[index]
      }
      let wish = await this.getWish(user)
      this.logger.log('Congratulating "' + user + '" with "' + wish + '"')
      await a.type(wish)
      await this.driver.keyboard.press('Enter')
      await this.randomSleep()
      this.logger.log('Congratulated "' + user + '"')
    }

    this.driver.close()
  }

  async getWish(username) {
    if (username && this.config.wishes.hasOwnProperty(username)) {
      return this.config.wishes[username]
    }
    return this.config.wishes[Math.floor(Math.random() * this.config.wishes.length)]
  }

  async getBirthdayList() {
    if (this.driver.url() !== this.BIRTHDAY_URL) {
      await this.driver.goto('https://www.facebook.com/events')
      await this.randomSleep()
      // Facebook has a strange way of redirection: opening https://www.facebook.com/events/birthdays
      // redirects to something ? acontext = { someObject }.That URL is the one indicated when hovering the
      // sidebar button.Clicking the side bar button leads in the browser to / events / birthdays.WTF.
      await this.driver.click("#entity_sidebar [data-key='birthdays'] a")
      await this.randomSleep()
    }
    return this.driver.$('#birthdays_today_card')
  }

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
      await this.randomSleep()
      if (this.driver.url().startsWith(this.LOGIN_URL)) {
        if (rep) {
          throw new Error('Failed login.')
        } else {
          await this.login(true)
        }
      }
    } else {
      this.logger.log("Have been redirected to '%s' from login. Assuming logged in.", this.driver.url())
    }
    await this.driver.goto(this.BIRTHDAY_URL)
  }

  async startDriver() {
    const browser = await puppeteer.launch({
      headless: !this.debug,
      userDataDir: './user_data',
    })
    this.driver = await browser.newPage()
    if (this.debug) {
      this.driver.setViewport({width: 0, height: 0})
    }
    await this.driver.goto(this.BIRTHDAY_URL)
  }

  async randomSleep(maximum = 10000) {
    await sleep(maximum * Math.random())
  }
}

function sleep(millis) {
  return new Promise(resolve => setTimeout(resolve, millis))
}

module.exports = Gratulator
