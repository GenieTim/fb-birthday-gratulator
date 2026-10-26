import playwright from "playwright";
import fs from "fs";
import path from "path";
import util from "util";
import { fileURLToPath } from "node:url";
import { loadConfig } from "../config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "../../");

class Gratulator {
  /**
   * Constructor to initiate all our constants
   *
   * @param {LoggerInterface} logger The logger to use (e.g. console)
   * @param {string|object} configFilePath The path to the configuration file, config object, or undefined
   * @param {boolean} debug Whether to use debug mode: headful chrome and verbose delays
   */
  constructor(logger, configFilePath, debug = false) {
    this.debug = debug;
    this.logger = logger;
    this.BIRTHDAY_URL = "https://www.facebook.com/events/birthdays";
    this.LOGIN_URL = "https://www.facebook.com/login";
    this.driver = null;
    this.context = null;
    this.browser = null;

    const { config, source } = typeof configFilePath === "object" && configFilePath !== null && !Array.isArray(configFilePath) && configFilePath.username
      ? { config: configFilePath, source: "in-memory object" }
      : loadConfig(configFilePath);

    this.config = config;
    this.logger.log("Configuration source: " + source);

    if (this.config.debug !== undefined && !this.debug) {
      this.debug = Boolean(this.config.debug);
    }

    if (this.debug) {
      this.logger.log("Debug mode on.");
    }

    if (!this.config.username || !this.config.password) {
      const msg = 'Configuration is missing "username" or "password". Please provide config.json or set FB_USERNAME and FB_PASSWORD environment variables.';
      this.logger.error(msg);
      throw new Error(msg);
    }
  }

  /**
   * Main logic in order to send wishes to all friends with today birthday
   */
  async sendWishes() {
    try {
      // startup
      await this.login();
      if (this.debug) {
        this.logger.log("Logged in. Fetching today's birthdays...");
        await this.debugSleep(2000);
      }

      // get list of all birthdaying friends
      const birthdayList = await this.getBirthdayList();
      let birthdayTitleDiv = birthdayList[0];
      let birthdayDiv = null;
      let textAreas = [];

      if (birthdayTitleDiv) {
        await this.debugSleep(1500);

        // Climb ancestors of birthdayTitleDiv to find the container holding today's birthday cards & textboxes
        let currentCard = birthdayTitleDiv;
        for (let depth = 0; depth < 6; depth++) {
          const found = await currentCard.$$('div[role="textbox"]');
          if (found.length > 0) {
            birthdayDiv = currentCard;
            textAreas = found;
            break;
          }
          const parent = await currentCard.$("xpath=..");
          if (!parent) break;
          currentCard = parent;
        }
      }

      // If textboxes weren't found in ancestors, query directly on the birthday page
      if (textAreas.length === 0) {
        textAreas = await this.driver.$$('div[role="textbox"]');
      }

      // Wait briefly if textboxes might still be rendering
      if (textAreas.length === 0) {
        try {
          await this.driver.waitForSelector('div[role="textbox"]', { timeout: 3000 });
          textAreas = await this.driver.$$('div[role="textbox"]');
        } catch {
          // not found
        }
      }

      if (textAreas.length === 0 && !birthdayTitleDiv) {
        this.logger.warn("Did not find today's birthday card or textboxes. Current URL: " + this.driver.url());
        const screenShotPath = path.resolve(PROJECT_ROOT, "birthday-card-not-found.png");
        await this.driver.screenshot({ path: screenShotPath, fullPage: true }).catch(() => {});
        this.logger.log("Saved diagnostic screenshot to " + screenShotPath);
        return { count: 0, reason: "no_card" };
      }

      // Fetch fallback usernames from container or driver
      let fallbackUsers = [];
      try {
        const userElements = birthdayDiv ? await this.findUsernames(birthdayDiv) : await this.findUsernames(this.driver);
        for (const el of userElements) {
          const name = await this.driver.evaluate((element) => element.textContent, el);
          if (name && name.trim()) {
            fallbackUsers.push(name.trim());
          }
        }
      } catch (error) {
        this.logger.error("Could not extract usernames: " + error.message);
      }

      // Resolve usernames for each textbox individually
      let users = [];
      for (let i = 0; i < textAreas.length; i++) {
        const specificName = await this.extractUsernameForTextbox(textAreas[i], fallbackUsers[i]);
        users.push(specificName);
      }

      // Detect all friends listed in Today's birthdays section
      const allTodayFriends = await this.getTodayBirthdayNames();
      const wishedUsers = users.filter(Boolean);
      // Friends who have birthdays today, but no timeline textbox (e.g. timeline closed, Message only)
      const privateMessageOnly = allTodayFriends.filter((name) => !wishedUsers.includes(name));

      for (const name of privateMessageOnly) {
        this.logger.log(
          util.format(
            'Notice: "%s" has a birthday today, but their timeline is closed for posts (Message only). You may want to message them privately.',
            name,
          ),
        );
      }

      if (this.debug) {
        this.logger.log(
          util.format(
            "Found %d textbox(es) and %d username(s).",
            textAreas.length,
            users.filter(Boolean).length,
          ),
        );
        await this.debugSleep(2000);
      }

      if (textAreas.length === 0) {
        if (privateMessageOnly.length > 0) {
          this.logger.log(
            util.format(
              "Completed: Found %d friend(s) with birthday today, but timeline posts are disabled (%s).",
              privateMessageOnly.length,
              privateMessageOnly.join(", "),
            ),
          );
          return { count: 0, reason: "private_message_only", privateMessageOnly };
        }

        this.logger.log("You have wished everyone already ;) (or no birthdays today)");
        return { count: 0, reason: "already_wished" };
      }

      if (users.length !== textAreas.length) {
        this.logger.warn(
          util.format(
            "Did not find matching number of usernames (%d names for %d textboxes). Will use generic messages where needed...",
            users.length,
            textAreas.length,
          ),
        );
      }

      // loop friends & wish them all the best
      let successCount = 0;
      for (let index = 0; index < textAreas.length; index++) {
        const a = textAreas[index];
        let user = users[index] || null;

        let wish = await this.getWish(user);
        this.logger.log(util.format('Congratulating "%s" with "%s"', user || "Friend", wish));

        try {
          await a.scrollIntoViewIfNeeded().catch(() => {});
          await a.click().catch(() => {});
          await this.debugSleep(1500);

          // Type the wish (with typing delay in debug mode so it looks natural and is visible)
          if (typeof a.pressSequentially === "function") {
            await a.pressSequentially(wish, { delay: this.debug ? 80 : 20 });
          } else if (typeof a.type === "function") {
            await a.type(wish, { delay: this.debug ? 80 : 20 });
          } else {
            await a.fill(wish);
          }

          // Sleep in debug mode so the user can inspect the typed message before sending
          await this.debugSleep(2500);

          await this.driver.keyboard.press("Enter");

          // Sleep after sending wish so the POST request completes and UI updates
          await this.randomSleep(3000);
          await this.debugSleep(2500);

          this.logger.log(util.format('Success: Congratulated "%s"', user || "Friend"));
          successCount++;
        } catch (cardError) {
          this.logger.error(
            util.format('Failed to congratulate "%s": %s', user || "Friend", cardError.message),
          );
        }
      }

      if (this.debug) {
        this.logger.log("Finished sending all birthday wishes.");
        await this.debugSleep(3000);
      }

      return { count: successCount, reason: "completed", privateMessageOnly };
    } finally {
      await this.close();
    }
  }

  /**
   * Extract username for a specific textbox (from aria-label, ancestor row, or fallback)
   *
   * @param {ElementHandle} textArea
   * @param {string|null} fallbackUser
   * @returns {Promise<string|null>}
   */
  async extractUsernameForTextbox(textArea, fallbackUser = null) {
    try {
      // 1. Check aria-label for friend name
      const ariaLabel = await textArea.getAttribute("aria-label").catch(() => null);
      if (ariaLabel) {
        // German patterns: "Schreibe in die Chronik von <Name>", "Schreibe an <Name>"
        const deMatch = ariaLabel.match(/schreibe\s+(?:in\s+die\s+chronik\s+von|etwas\s+in\s+die\s+chronik\s+von|etwas\s+für|an)\s+([^.…]+)/i);
        if (deMatch && deMatch[1].trim()) {
          return deMatch[1].trim();
        }
        // English patterns: "Write on <Name>'s timeline", "Write something to <Name>"
        const enMatch = ariaLabel.match(/write\s+(?:something\s+)?(?:on|to)\s+(.+?)(?:'s|\s+timeline|$|\.)/i);
        if (enMatch && enMatch[1].trim()) {
          return enMatch[1].trim();
        }
      }

      // 2. Look in the row / card container of this textbox
      const nameSelectors = [
        'xpath=ancestor::div[.//a[@role="link" or contains(@href, "facebook.com")]][1]//a[@role="link" or contains(@href, "facebook.com")]//span[dir="auto"]',
        'xpath=ancestor::div[.//h3 or .//h4][1]//*[self::h3 or self::h4]//span',
        'xpath=ancestor::div[.//h3 or .//h4][1]//*[self::h3 or self::h4]',
        'xpath=ancestor::div[.//a][1]//a[not(@role="button")]//span',
      ];

      for (const sel of nameSelectors) {
        const el = await textArea.$(sel).catch(() => null);
        if (el) {
          const text = await this.driver.evaluate((e) => e.textContent, el).catch(() => null);
          if (text && text.trim()) {
            return text.trim();
          }
        }
      }
    } catch {
      // ignore
    }

    return fallbackUser || null;
  }

  /**
   * Extract all friend names listed under Today's birthdays section
   * @returns {Promise<string[]>}
   */
  async getTodayBirthdayNames() {
    try {
      return await this.driver.evaluate(() => {
        const headings = Array.from(document.querySelectorAll("h1, h2, h3, h4, span"));
        const todayHeading = headings.find((h) =>
          /today's birthday|heutige geburtstage|geburtstage heute|heutiger geburtstag/i.test(h.innerText?.trim())
        );
        if (!todayHeading) return [];

        let card = todayHeading.closest('div[class*="x"]');
        for (let i = 0; i < 6; i++) {
          if (card && card.parentElement && !/upcoming|recent|anstehend|kürzlich/i.test(card.parentElement.innerText || "")) {
            card = card.parentElement;
          }
        }
        if (!card) return [];

        const friendLinks = Array.from(card.querySelectorAll('a[role="link"], a[href*="facebook.com/"]'));
        const names = [];
        for (const a of friendLinks) {
          const text = a.innerText?.trim();
          if (text && text.length > 2 && text.length < 60 && !/^(events|home|birthdays|notifications|message|nachricht|see all)/i.test(text)) {
            if (!names.includes(text)) {
              names.push(text);
            }
          }
        }
        return names;
      });
    } catch {
      return [];
    }
  }

  /**
   * Find the titles containing the names of today's birthday kids
   *
   * @param {ElementHandle} birthdayDiv the div of today's birthdays
   */
  async findUsernames(birthdayDiv) {
    const selectors = [
      "div a h3",
      "div a h2",
      "a[role='link'] h3",
      "a[role='link'] h2",
      "a[role='link'] span[dir='auto']",
      "h3 span",
      "h2 span",
      "span[dir='auto']",
    ];

    for (const selector of selectors) {
      const users = await birthdayDiv.$$(selector);
      if (users.length > 0) {
        return users;
      }
    }

    return [];
  }

  /**
   * Fetch the wish (for a certain user if username could be loaded)
   *
   * @param {string} username The name of the birthday kiddo
   */
  async getWish(username) {
    if (username) {
      username = username.replace(/\s\s+/g, " ").trim();
    }

    const wishes = this.config.wishes || {};
    let selection;

    if (username && Object.prototype.hasOwnProperty.call(wishes, username) && Array.isArray(wishes[username]) && wishes[username].length > 0) {
      selection = wishes[username];
    } else if (Array.isArray(wishes.anyone) && wishes.anyone.length > 0) {
      selection = wishes.anyone;
    } else {
      selection = ["Happy birthday! 🥳🎈🎂"];
    }

    return selection[Math.floor(Math.random() * selection.length)];
  }

  /**
   * Get the list with all the birthday kids
   */
  async getBirthdayList() {
    if (!this.driver.url().includes("/events/birthdays")) {
      await this.driver.goto(this.BIRTHDAY_URL);
      await this.driver.waitForLoadState("domcontentloaded").catch(() => {});
      await this.sleep(2500);
    }

    // Dismiss any popups or cookie dialogs
    await this.acceptCookies();
    try {
      const okBtn = this.driver.locator(
        'div[aria-label="OK" i], div[role="button"]:has-text("OK"), button:has-text("OK"), button:has-text("Not now"), button:has-text("Jetzt nicht"), button:has-text("Close"), div[aria-label="Close" i], div[aria-label="Schließen" i]'
      ).first();
      if (await okBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
        await okBtn.click();
        await this.sleep(1000);
      }
    } catch {
      // ignore
    }

    // Check if direct navigation showed "This page isn't available" or redirected away to events/discovery
    const currentUrl = this.driver.url();
    const pageText = await this.driver.evaluate(() => (document.body ? document.body.innerText : "")).catch(() => "");
    const pageUnavailable =
      pageText.includes("This page isn't available") ||
      pageText.includes("Diese Seite ist nicht verfügbar") ||
      currentUrl.includes("/events/discovery") ||
      !currentUrl.includes("/events/birthdays");

    if (pageUnavailable) {
      this.logger.log("Direct birthdays URL blocked or redirected. Navigating via Facebook home bookmarks...");
      await this.driver.goto("https://www.facebook.com/");
      await this.driver.waitForLoadState("domcontentloaded").catch(() => {});
      await this.sleep(3000);
      await this.acceptCookies();

      // Look for birthdays link on home page
      const homeBirthdayLink = this.driver.locator('a[href*="/events/birthdays/"], a[href*="/events/birthdays"]').first();
      const count = await homeBirthdayLink.count().catch(() => 0);
      if (count > 0) {
        const href = await homeBirthdayLink.getAttribute("href").catch(() => null);
        if (href) {
          const targetUrl = href.startsWith("http") ? href : new URL(href, "https://www.facebook.com").href;
          await this.driver.goto(targetUrl);
        } else {
          await homeBirthdayLink.click().catch(() => {});
        }
        await this.driver.waitForLoadState("domcontentloaded").catch(() => {});
        await this.sleep(3000);
      } else {
        // Fallback: check /events
        await this.driver.goto("https://www.facebook.com/events");
        await this.driver.waitForLoadState("domcontentloaded").catch(() => {});
        await this.sleep(2000);
        const eventsBirthdayLink = this.driver.locator('a[href*="birthdays"]').first();
        if ((await eventsBirthdayLink.count().catch(() => 0)) > 0) {
          const href = await eventsBirthdayLink.getAttribute("href").catch(() => null);
          if (href) {
            const targetUrl = href.startsWith("http") ? href : new URL(href, "https://www.facebook.com").href;
            await this.driver.goto(targetUrl);
            await this.driver.waitForLoadState("domcontentloaded").catch(() => {});
            await this.sleep(3000);
          }
        }
      }
    }

    // Wait up to 5s for birthday headings or textboxes to render in the DOM
    try {
      await this.driver.waitForSelector(
        'xpath=//*[self::h1 or self::h2 or self::h3 or self::h4 or self::span][contains(., "Today\'s birthday") or contains(., "Today’s birthday") or contains(., "Today\'s Birthday") or contains(., "Today’s Birthday") or contains(., "Heutige Geburtstage") or contains(., "Geburtstage heute") or contains(., "Heutiger Geburtstag")] | div[role="textbox"]',
        { timeout: 5000 },
      );
    } catch {
      // Content may still be partially loaded
    }

    // Try finding "Today's birthdays" heading with different tag variations, quote styles, and languages (English, German)
    const headingSelectors = [
      'xpath=//div[div[*[self::h1 or self::h2 or self::h3 or self::h4 or self::span][contains(., "Today\'s birthday") or contains(., "Today’s birthday") or contains(., "Today\'s Birthday") or contains(., "Today’s Birthday") or contains(., "Heutige Geburtstage") or contains(., "Geburtstage heute") or contains(., "Heutiger Geburtstag")]]]',
      'xpath=//*[self::h1 or self::h2 or self::h3 or self::h4 or self::span][contains(., "Today\'s birthday") or contains(., "Today’s birthday") or contains(., "Today\'s Birthday") or contains(., "Today’s Birthday") or contains(., "Heutige Geburtstage") or contains(., "Geburtstage heute") or contains(., "Heutiger Geburtstag")]',
      'xpath=//div[contains(., "Today\'s birthdays") or contains(., "Today’s birthdays") or contains(., "Heutige Geburtstage")]',
    ];

    for (const selector of headingSelectors) {
      try {
        const matches = await this.driver.$$(selector);
        if (matches.length > 0) {
          return matches;
        }
      } catch {
        // continue to next selector
      }
    }

    return [];
  }

  /**
   * Check if the browser session is authenticated to Facebook
   */
  async isAuthenticated() {
    if (!this.driver || !this.context) return false;
    const url = this.driver.url();
    if (
      url.includes("/login") ||
      url.startsWith(this.LOGIN_URL) ||
      this.isVerificationRequired() ||
      (await this.hasCaptchaOnPage())
    ) {
      return false;
    }

    // 1. Check cookies: Facebook sets `c_user` cookie for authenticated sessions
    let hasCUser = false;
    try {
      const cookies = await this.context.cookies();
      hasCUser = cookies.some((c) => c.name === "c_user" && c.value && c.value !== "0");
    } catch {
      // ignore
    }

    // 2. Check for logged-in profile indicators
    let hasProfileIndicator = false;
    try {
      const profileIndicator = this.driver.locator(
        'div[aria-label="Your profile" i], div[aria-label="Dein Profil" i], [aria-label*="Account controls" i], [aria-label*="Kontoverwaltung" i], div[role="navigation"] a[href*="/me"], a[href*="/me/"]',
      ).first();
      hasProfileIndicator = await profileIndicator.isVisible({ timeout: 1500 }).catch(() => false);
    } catch {
      // ignore
    }

    // If profile indicator is visible, session is definitely authenticated
    if (hasProfileIndicator) {
      return true;
    }

    // If no c_user cookie exists, the session is NOT authenticated
    if (!hasCUser) {
      return false;
    }

    // 3. Check for obvious unauthenticated indicators (login forms / prompts)
    try {
      const loginIndicator = this.driver.locator(
        'input[name="email"], input[id="email"], input[type="password"], a[href*="/login"], div[role="dialog"] button:has-text("Log In"), div[role="dialog"] button:has-text("Anmelden")',
      ).first();
      const hasLoginPrompt = await loginIndicator.isVisible({ timeout: 1500 }).catch(() => false);
      if (hasLoginPrompt) {
        return false;
      }
    } catch {
      // ignore
    }

    return true;
  }

  /**
   * Log in to facebook – try up to 3 times
   *
   * @param {number} rep how many attempts were taken to log in
   */
  async login(rep = 0) {
    if (!this.driver) {
      await this.startDriver();
    }

    // Check if persistent session is already valid
    if (rep === 0) {
      try {
        await this.driver.goto(this.BIRTHDAY_URL);
        await this.driver.waitForLoadState("domcontentloaded").catch(() => {});
        await this.sleep(3000);
        await this.acceptCookies();
        if (await this.isAuthenticated()) {
          this.logger.log("Already logged in with existing session (" + this.driver.url() + ").");
          return;
        }
        this.logger.log("Session not authenticated on birthdays page. Navigating to login...");
      } catch {
        // Fall back to explicit login
      }
    }

    try {
      await this.driver.goto(this.LOGIN_URL);
      await this.driver.waitForLoadState("domcontentloaded").catch(() => {});
      await this.debugSleep(2000);
    } catch (error) {
      this.logger.warn("Failed to go to login page. Am on " + this.driver.url());
      const screenShotPath = path.resolve(PROJECT_ROOT, "login-nav-error.png");
      await this.driver.screenshot({ path: screenShotPath, fullPage: true }).catch(() => {});
      this.logger.error(error);
      throw new Error(
        "Failed navigating to login. URL is still " +
          this.driver.url() +
          ". Took screenshot to " +
          screenShotPath,
        { cause: error },
      );
    }

    // Check if immediately redirected to 2FA or captcha
    if (this.isVerificationRequired() || (await this.hasCaptchaOnPage())) {
      await this.handleVerification();
      return;
    }

    if (this.driver.url().startsWith(this.LOGIN_URL) || this.driver.url().includes("/login")) {
      await this.acceptCookies();
      await this.randomSleep(1000);
      await this.debugSleep(1500);

      if (this.isVerificationRequired() || (await this.hasCaptchaOnPage())) {
        await this.handleVerification();
        return;
      }

      // If Facebook shows saved profile / "Continue as <user name>" button
      const continueProfileBtn = this.driver.locator('div[role="button"]:has-text("Continue"), button:has-text("Continue"), [aria-label*="Continue as" i]').first();
      if ((await continueProfileBtn.count()) > 0 && (await continueProfileBtn.isVisible().catch(() => false))) {
        this.logger.log("Detected saved profile prompt ('Continue'). Clicking continue...");
        await continueProfileBtn.click({ timeout: 5000 }).catch(() => {});
        await this.randomSleep(2000);
        await this.debugSleep(2000);
      }

      // Check if clicking continue took us away from login
      if (!this.driver.url().startsWith(this.LOGIN_URL) && !this.driver.url().includes("/login")) {
        this.logger.log("Successfully logged in via saved profile.");
        return;
      }

      // Fill email safely if editable
      const emailInput = this.driver.locator('input[name="email"], input[id="email"]').first();
      if ((await emailInput.count()) > 0) {
        const isEditable = await emailInput.isEditable().catch(() => false);
        if (isEditable) {
          await emailInput.fill(this.config.username).catch(() => {});
          await this.randomSleep(300);
          await this.debugSleep(1000);
        }
      }

      if (this.isVerificationRequired() || (await this.hasCaptchaOnPage())) {
        await this.handleVerification();
        return;
      }

      // Fill password safely if editable
      const passInput = this.driver.locator('input[name="pass"], input[type="password"]').first();
      if ((await passInput.count()) > 0) {
        const isEditable = await passInput.isEditable().catch(() => false);
        if (isEditable) {
          await passInput.fill(this.config.password).catch(() => {});
          await this.randomSleep(500);
          await this.debugSleep(1500);
        }
      }

      if (this.isVerificationRequired() || (await this.hasCaptchaOnPage())) {
        await this.handleVerification();
        return;
      }

      // Submit form
      try {
        const submitBtn = this.driver.locator('button[name="login"], #loginbutton, [data-testid="royal_login_button"]').first();
        if ((await submitBtn.count()) > 0 && (await submitBtn.isVisible().catch(() => false))) {
          await submitBtn.click({ timeout: 5000 });
        } else {
          await this.driver.keyboard.press("Enter");
        }
      } catch {
        await this.driver.keyboard.press("Enter");
      }

      // Wait up to 20 seconds for navigation, captcha, or 2FA to appear
      const submitStart = Date.now();
      let detectedVerification = false;

      while (Date.now() - submitStart < 20_000) {
        await this.sleep(1000);
        if (this.isVerificationRequired() || (await this.hasCaptchaOnPage())) {
          detectedVerification = true;
          break;
        }
        const currentUrl = this.driver.url();
        if (!currentUrl.includes("/login") && !currentUrl.startsWith(this.LOGIN_URL)) {
          break;
        }
      }

      // Check for 2-step verification or captcha after submit
      if (detectedVerification || this.isVerificationRequired() || (await this.hasCaptchaOnPage())) {
        await this.handleVerification();
        return;
      }

      if (this.driver.url().startsWith(this.LOGIN_URL) || this.driver.url().includes("/login")) {
        // If in debug mode and still on login page, user might be solving a captcha or prompt
        if (this.debug) {
          this.logger.log("Still on login page after submitting credentials. Checking if verification or captcha is active...");
          await this.handleVerification();
          return;
        }

        if (rep >= 2) {
          this.logger.log("Failed logging in after three attempts. Page is " + this.driver.url());
          const screenShotPath = path.resolve(PROJECT_ROOT, "login-error.png");
          await this.driver.screenshot({
            path: screenShotPath,
            fullPage: true,
          }).catch(() => {});
          throw new Error(
            "Failed login. After three attempts, URL is still " +
              this.driver.url() +
              ". Took screenshot to " +
              screenShotPath,
          );
        } else {
          this.logger.warn(util.format("Login attempt %d failed. Retrying...", rep + 1));
          await this.debugSleep(2000);
          await this.login(rep + 1);
        }
      }
    } else {
      this.logger.log(
        util.format(
          "Have been redirected to '%s' from login. Assuming logged in.",
          this.driver.url(),
        ),
      );
      await this.debugSleep(2000);
    }
  }

  /**
   * Check if current URL indicates 2FA, checkpoint, or captcha challenge
   */
  isVerificationRequired() {
    if (!this.driver) return false;
    const url = this.driver.url();
    return (
      url.includes("two_step_verification") ||
      url.includes("checkpoint") ||
      url.includes("captcha") ||
      url.includes("/auth/") ||
      url.includes("challenge") ||
      url.includes("recover")
    );
  }

  /**
   * Check if page DOM currently contains a visible captcha element, iframe, or security check
   */
  async hasCaptchaOnPage() {
    if (!this.driver) return false;
    try {
      const captchaSelectors = [
        'iframe[src*="captcha" i]',
        'iframe[src*="arkose" i]',
        'iframe[src*="funcaptcha" i]',
        'iframe[src*="challenge" i]',
        'iframe[title*="recaptcha" i]',
        'iframe[title*="challenge" i]',
        'iframe[title*="security" i]',
        'img[src*="captcha" i]',
        'input[name*="captcha" i]',
        'input[id*="captcha" i]',
        '#captcha',
        '[data-testid*="captcha" i]',
      ];
      for (const sel of captchaSelectors) {
        const el = await this.driver.$(sel);
        if (el && (await el.isVisible().catch(() => false))) {
          return true;
        }
      }

      // Check text content on page for security check keywords
      const pageText = await this.driver.evaluate(() => (document.body ? document.body.innerText : "")).catch(() => "");
      if (
        /security check|enter the text|unusual activity|solve the puzzle|confirm it's you|verify it's you|sicherheitsprüfung|sicherheitskontrolle/i.test(
          pageText,
        )
      ) {
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }

  /**
   * Wait for the user to solve captcha or approve 2FA (up to 15 minutes by default)
   */
  async handleVerification() {
    const timeoutMinutes = parseInt(process.env.LOGIN_TIMEOUT_MINUTES || "15", 10) || 15;
    const timeoutMs = timeoutMinutes * 60 * 1000;

    this.logger.log(
      "\n===========================================================\n" +
      "ACTION REQUIRED: Captcha / 2-Step Verification detected!\n" +
      "Current URL: " + this.driver.url() + "\n" +
      `Please solve the captcha or approve verification in the browser window.\n` +
      `Waiting up to ${timeoutMinutes} minutes for you to complete this...\n` +
      "===========================================================\n"
    );

    const startTime = Date.now();
    while (Date.now() - startTime < timeoutMs) {
      await this.sleep(3000);

      const url = this.driver.url();
      const onVerificationPage = this.isVerificationRequired();
      const hasCaptcha = await this.hasCaptchaOnPage();

      if (!onVerificationPage && !hasCaptcha && !url.includes("/login") && !url.startsWith(this.LOGIN_URL)) {
        this.logger.log("Verification completed successfully! Current URL: " + this.driver.url());
        await this.debugSleep(3000);
        return true;
      }
    }

    const screenShotPath = path.resolve(PROJECT_ROOT, "verification-timeout.png");
    await this.driver.screenshot({ path: screenShotPath, fullPage: true }).catch(() => {});
    throw new Error(
      `Timed out after ${timeoutMinutes} minutes waiting for captcha/verification. Saved screenshot to ${screenShotPath}`
    );
  }

  /**
   * Accept or dismiss cookie consent banner if present
   */
  async acceptCookies() {
    await this.randomSleep(500);
    await this.debugSleep(1000);

    const cookieBtnSelectors = [
      "[data-cookiebanner='accept_button']",
      "[data-cookiebanner='accept_only_essential_button']",
      "[data-cookiebanner='accept_all_button']",
      "button[data-cookiebanner='accept_button']",
      "[aria-label='Allow all cookies']",
      "[aria-label='Allow essential and optional cookies']",
      "[aria-label='Alle Cookies erlauben']",
      "[aria-label='Erforderliche und optionale Cookies erlauben']",
      "[aria-label='Accept all']",
      "[aria-label='Only allow essential cookies']",
      "button[name='accept_cookies']",
      "button:has-text('Allow all cookies')",
      "button:has-text('Alle Cookies erlauben')",
      "button:has-text('Erforderliche und optionale Cookies erlauben')",
      "xpath=//button[contains(., 'Allow all cookies') or contains(., 'Accept all') or contains(., 'Allow essential') or contains(., 'Alle Cookies gestatten') or contains(., 'Alle Cookies erlauben') or contains(., 'Nur essenzielle Cookies') or contains(., 'Erforderliche und optionale Cookies erlauben')]",
      "xpath=//div[@role='button'][contains(., 'Allow all cookies') or contains(., 'Accept all') or contains(., 'Allow essential') or contains(., 'Alle Cookies gestatten') or contains(., 'Alle Cookies erlauben')]",
    ];

    for (const cookieBtnSelector of cookieBtnSelectors) {
      try {
        const btnLocator = this.driver.locator(cookieBtnSelector).first();
        const isVisible = await btnLocator.isVisible({ timeout: 1500 }).catch(() => false);
        if (isVisible) {
          await btnLocator.scrollIntoViewIfNeeded().catch(() => {});
          await btnLocator.click({ timeout: 3000 });
          this.logger.log("Accepted cookie dialog using: " + cookieBtnSelector);
          await this.randomSleep(1000);
          await this.debugSleep(2000);
          break;
        }
      } catch {
        // Continue to next selector
      }
    }
  }

  /**
   * Start the Playwright browser
   */
  async startDriver() {
    const browserName = this.config.browserType ? this.config.browserType : "chromium";
    const browserType = playwright[browserName];

    // Determine defined userData directory independent of current working directory
    const userDataDir = this.config.userDataDir
      ? path.resolve(this.config.userDataDir)
      : path.join(PROJECT_ROOT, "user_data");

    const launchArgs = [
      ...(this.config.args || []),
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
    ];

    if (this.config.persistent) {
      fs.mkdirSync(userDataDir, { recursive: true });
      if (this.debug) {
        this.logger.log("Launching persistent context in: " + userDataDir);
      }

      this.context = await browserType.launchPersistentContext(userDataDir, {
        headless: !this.debug,
        timeout: 180_000,
        locale: "en-US",
        viewport: this.debug ? { width: 1240, height: 980 } : undefined,
        args: launchArgs,
      });

      // Apply addons to context if available
      try {
        const addons = await import("playwright-addons");
        if (addons.adblocker) await addons.adblocker(this.context);
        if (addons.stealth) await addons.stealth(this.context);
      } catch (addonErr) {
        if (this.debug) {
          this.logger.log("Could not load addons for persistent context: " + addonErr.message);
        }
      }
    } else {
      if (this.debug) {
        this.logger.log("Launching standard non-persistent browser context");
      }

      this.browser = await browserType.launch({
        headless: !this.debug,
        timeout: 180_000,
        locale: "en-US",
        args: launchArgs,
      });
      this.context = await this.browser.newContext({
        locale: "en-US",
        viewport: this.debug ? { width: 1240, height: 980 } : undefined,
      });

      // block possible tracking scripts to reduce overhead
      try {
        const addons = await import("playwright-addons");
        if (addons.adblocker) await addons.adblocker(this.browser);
        if (addons.stealth) await addons.stealth(this.browser);
      } catch (addonErr) {
        if (this.debug) {
          this.logger.log("Could not load addons for browser: " + addonErr.message);
        }
      }
    }

    try {
      const pages = this.context.pages();
      this.driver = pages.length > 0 ? pages[0] : await this.context.newPage();
    } catch (error) {
      this.logger.error("Failed opening page: " + error.message);
      throw error;
    }

    if (this.debug) {
      await this.driver.setViewportSize({ width: 1240, height: 980 }).catch(() => {});
      await this.debugSleep(1500);
    }

    await this.driver.goto(this.BIRTHDAY_URL);
    await this.debugSleep(2000);
  }

  /**
   * Sleep for a random amount of time. In debug mode, a guaranteed minimum pause is enforced.
   *
   * @param {number} maximum The maximum sleep time in milliseconds
   */
  async randomSleep(maximum = 10_000) {
    const minSleep = this.debug ? Math.max(maximum * 0.4, 2000) : 0;
    const duration = minSleep + maximum * Math.random();
    await this.sleep(duration);
  }

  /**
   * Dedicated sleep that only runs in debug mode
   *
   * @param {number} millis Milliseconds to pause
   */
  async debugSleep(millis = 2000) {
    if (this.debug) {
      await this.sleep(millis);
    }
  }

  /**
   * Helper sleep function
   *
   * @param {number} millis Millisecond time to sleep
   * @returns {Promise<void>}
   */
  async sleep(millis) {
    return new Promise((resolve) => setTimeout(resolve, millis));
  }

  /**
   * Safely close all browser and context resources
   */
  async close() {
    try {
      if (this.driver && !this.driver.isClosed()) {
        await this.driver.close().catch(() => {});
      }
      if (this.context) {
        await this.context.close().catch(() => {});
      }
      if (this.browser) {
        await this.browser.close().catch(() => {});
      }
    } catch {
      // Suppress closure errors on exit
    }
  }
}

export default Gratulator;
