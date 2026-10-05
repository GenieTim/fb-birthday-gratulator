import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { applyRandomDelay } from "../src/delay.js";

describe("applyRandomDelay", () => {
  const dummyLogger = {
    log: () => {},
  };

  test("returns 0 for undefined, null, or negative hours without waiting", async () => {
    assert.equal(await applyRandomDelay(dummyLogger, undefined), 0);
    assert.equal(await applyRandomDelay(dummyLogger, null), 0);
    assert.equal(await applyRandomDelay(dummyLogger, 0), 0);
    assert.equal(await applyRandomDelay(dummyLogger, -5), 0);
    assert.equal(await applyRandomDelay(dummyLogger, "invalid"), 0);
  });

  test("calculates a delay bounded by max hours", async () => {
    // 0.0001 hours = ~360ms
    const start = Date.now();
    const delay = await applyRandomDelay(dummyLogger, 0.00005);
    const elapsed = Date.now() - start;

    assert.ok(delay >= 0);
    assert.ok(delay <= 0.00005 * 3600 * 1000);
    assert.ok(elapsed >= 0);
  });
});
