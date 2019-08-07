const path = require('path')
const puppeteer = require('puppeteer');
var fs = require('fs')

class Gratulator {
  constructor() {
    this.BIRTHDAY_URL = 'https://www.facebook.com/events/birthdays/'
    const configFilePath = path.join(__dirname, '/../config.json')
    if (!fs.existsSync(configFilePath)) {
      console.error("Config file '" + configFilePath + "' does not exist.")
    }
    this.config = JSON.parse(fs.readFileSync(configFilePath, 'utf8'))
    if (!this.config.username || !this.config.password || !this.config.wishes) {
      console.error("Config file '" + configFilePath + "' does not contain keys 'username', 'password' or 'wishes'.")
    }
  }

  async sendWishes() {
    await this.login()
    let divs = await this.getBirthdayList()
    let birthdayDiv = await divs.$x('..')

    let textAreas = await birthdayDiv.$$('textArea')
    let users = []
    try {
      users = await birthdayDiv.$x('//a[@data-hovercard]')
    } catch (error) {
      console.warn('Did not find users names', e)
    }

    if (textAreas.length === 0) {
      console.log('You have wished everyone already ;)')
      return this.driver.close()
    }

    for (const [index, a] of textAreas.entries()) {
      let user = null
      if (users.length === textAreas.length) {
        user = users[index]
      }
      await a.type(this.getWish(user))
      await this.driver.keyboard.press('Enter')
      await sleep(1000 * Math.random())
      console.log('Congratulated "' + user + '"')
    }
  }

  async getWish(username) {
    if (username && this.config.wishes.hasOwnProperty(username)) {
      return this.config.wishes[username]
    }
    return this.config.wishes[Math.floor(Math.random() * this.config.wishes.length)]
  }

  async getBirthdayList() {
    if (this.driver.current_url !== this.BIRTHDAY_URL) {
      await this.driver.goto('https://www.facebook.com/events')
      await sleep(2300)
      // Facebook has a strange way of redirection: opening https://www.facebook.com/events/birthdays
      // redirects to something ? acontext = { someObject }.That URL is the one indicated when hovering the
      // sidebar button.Clicking the side bar button leads in the browser to / events / birthdays.WTF.
      await this.driver.click("#entity_sidebar [data-key='birthdays'] a")
      await sleep(4000)
    }
    return this.driver.$('#birthdays_today_card')
  }

  async login() {
    if (!this.driver) {
      await this.startDriver()
    }
    await this.driver.type('input[name=email]', this.config.username)
    await this.driver.type('input[name=pass]', this.config.password)
    await this.driver.$eval('form', form => form.submit())
    await sleep(3000)
  }

  async startDriver() {
    const browser = await puppeteer.launch()
    this.driver = await browser.newPage()
    await this.driver.goto(this.BIRTHDAY_URL)
  }
}

function sleep(millis) {
  return new Promise(resolve => setTimeout(resolve, millis))
}

let g = new Gratulator()
module.exports = g
