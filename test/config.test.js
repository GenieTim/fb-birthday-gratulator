import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { loadConfig } from "../src/config.js";

describe("loadConfig", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.FB_USERNAME;
    delete process.env.FB_PASSWORD;
    delete process.env.FB_WISHES;
    delete process.env.FB_PERSISTENT;
    delete process.env.PERSISTENT;
    delete process.env.CONFIG_PATH;
    delete process.env.CONFIG_FILE;
    delete process.env.CONFIG_JSON;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  test("loads from environment variables when config file does not exist", () => {
    process.env.FB_USERNAME = "env-user@example.com";
    process.env.FB_PASSWORD = "env-secret-password";
    process.env.FB_PERSISTENT = "true";

    const { config, source } = loadConfig("/non/existent/path.json");

    assert.ok(source);
    assert.equal(config.username, "env-user@example.com");
    assert.equal(config.password, "env-secret-password");
    assert.equal(config.persistent, true);
    assert.ok(Array.isArray(config.wishes.anyone));
    assert.ok(config.wishes.anyone.length > 0);
  });

  test("parses JSON formatted wishes from FB_WISHES", () => {
    process.env.FB_USERNAME = "user@test.com";
    process.env.FB_PASSWORD = "password";
    process.env.FB_WISHES = JSON.stringify({
      anyone: ["Happy birthday!"],
      "John Doe": ["Happy birthday John!"],
    });

    const { config } = loadConfig("/non/existent/path.json");
    assert.deepEqual(config.wishes.anyone, ["Happy birthday!"]);
    assert.deepEqual(config.wishes["John Doe"], ["Happy birthday John!"]);
  });

  test("parses comma-separated wishes from FB_WISHES", () => {
    process.env.FB_USERNAME = "user@test.com";
    process.env.FB_PASSWORD = "password";
    process.env.FB_WISHES = "Wish 1, Wish 2, Wish 3";

    const { config } = loadConfig("/non/existent/path.json");
    assert.deepEqual(config.wishes.anyone, ["Wish 1", "Wish 2", "Wish 3"]);
  });

  test("correctly parses persistent flag boolean options", () => {
    process.env.FB_USERNAME = "user@test.com";
    process.env.FB_PASSWORD = "password";

    process.env.FB_PERSISTENT = "false";
    let res = loadConfig("/non/existent/path.json");
    assert.equal(res.config.persistent, false);

    process.env.FB_PERSISTENT = "0";
    res = loadConfig("/non/existent/path.json");
    assert.equal(res.config.persistent, false);

    process.env.FB_PERSISTENT = "true";
    res = loadConfig("/non/existent/path.json");
    assert.equal(res.config.persistent, true);
  });
});
