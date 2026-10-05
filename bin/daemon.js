#!/usr/bin/env node

import http from "node:http";
import process from "node:process";
import { Cron } from "croner";
import Gratulator from "../src/fb-interface/gratulator.js";
import { loadConfig } from "../src/config.js";
import { applyRandomDelay } from "../src/delay.js";

const cronSchedule = process.env.CRON_SCHEDULE || null;
const timezone = process.env.TZ || undefined;
const runOnStartup =
  process.env.RUN_ON_STARTUP === "true" ||
  process.env.RUN_ON_STARTUP === "1" ||
  process.env.RUN_ON_STARTUP === "yes";
const port = parseInt(process.env.PORT || "3000", 10);
const disableHttp =
  process.env.DISABLE_HTTP === "true" ||
  process.env.DISABLE_HTTP === "1";
const triggerToken = process.env.TRIGGER_TOKEN;

let isRunning = false;
let lastRun = null;
let cronJob = null;
let server = null;
const startTime = Date.now();

const logger = {
  log: (...args) => console.log(new Date().toISOString(), "[INFO]", ...args),
  warn: (...args) => console.warn(new Date().toISOString(), "[WARN]", ...args),
  error: (...args) => console.error(new Date().toISOString(), "[ERROR]", ...args),
};

async function executeGratulator(triggerSource = "cron") {
  if (isRunning) {
    logger.warn(`Run requested via ${triggerSource}, but a run is already in progress. Skipping.`);
    return { success: false, reason: "Already running" };
  }

  isRunning = true;
  const startedAt = new Date().toISOString();

  if (triggerSource === "cron_schedule" && process.env.DELAY_MAX_H) {
    await applyRandomDelay(logger, process.env.DELAY_MAX_H);
  }

  logger.log(`Starting birthday wishes run (trigger: ${triggerSource})...`);

  try {
    const { config, source } = loadConfig();
    const debug = config.debug || process.env.DEBUG === "true" || process.env.DEBUG === "1";
    logger.log(`Configuration loaded from: ${source}`);

    const gratulator = new Gratulator(logger, config, debug);
    await gratulator.sendWishes();

    lastRun = {
      time: startedAt,
      finishedAt: new Date().toISOString(),
      trigger: triggerSource,
      status: "success",
      error: null,
    };
    logger.log("Birthday wishes run completed successfully.");
    return { success: true };
  } catch (error) {
    const errorMsg = error?.message || String(error);
    lastRun = {
      time: startedAt,
      finishedAt: new Date().toISOString(),
      trigger: triggerSource,
      status: "error",
      error: errorMsg,
    };
    logger.error("Error during birthday wishes run:", error);
    return { success: false, error: errorMsg };
  } finally {
    isRunning = false;
  }
}

function startHttpServer() {
  if (disableHttp) {
    logger.log("HTTP health server disabled via DISABLE_HTTP.");
    return;
  }

  server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

    if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/health" || url.pathname === "/status")) {
      const isCronActive = Boolean(cronJob);
      const responsePayload = {
        status: "healthy",
        service: "fb-birthday-gratulator",
        uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
        cronSchedule: isCronActive ? cronSchedule : "Coolify Scheduled Tasks / Manual",
        timezone: timezone || "System Default",
        isRunning,
        nextRun: isCronActive ? cronJob.nextRun()?.toISOString() : null,
        lastRun,
      };

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(responsePayload, null, 2));
      return;
    }

    if (req.method === "POST" && url.pathname === "/trigger") {
      if (triggerToken) {
        const authHeader = req.headers.authorization || req.headers["x-trigger-token"] || "";
        const token = authHeader.replace(/^Bearer\s+/i, "");
        if (token !== triggerToken) {
          res.writeHead(401, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Unauthorized" }));
          return;
        }
      }

      if (isRunning) {
        res.writeHead(409, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "A run is already in progress." }));
        return;
      }

      // Trigger asynchronously
      executeGratulator("http_trigger").catch((err) =>
        logger.error("Async trigger error:", err),
      );

      res.writeHead(202, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Run triggered successfully." }));
      return;
    }

    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not Found" }));
  });

  server.listen(port, "0.0.0.0", () => {
    logger.log(`HTTP health server listening on http://0.0.0.0:${port}`);
  });

  server.on("error", (err) => {
    logger.error("HTTP server error:", err.message);
  });
}

async function main() {
  logger.log("=========================================");
  logger.log("Starting fb-birthday-gratulator daemon");
  logger.log("=========================================");

  startHttpServer();

  const isScheduleActive =
    cronSchedule &&
    !["disabled", "off", "none", "false"].includes(cronSchedule.toLowerCase());

  if (isScheduleActive) {
    logger.log(`Internal cron enabled with expression: "${cronSchedule}" (Timezone: ${timezone || "Default"})`);
    cronJob = new Cron(
      cronSchedule,
      { timezone, protect: true },
      async () => {
        await executeGratulator("cron_schedule");
      },
    );

    const next = cronJob.nextRun();
    if (next) {
      logger.log(`Next scheduled run: ${next.toISOString()}`);
    }
  } else {
    logger.log("Internal cron is inactive. Tasks can be scheduled natively via Coolify's Scheduled Tasks tab (recommended) or triggered via POST /trigger.");
  }

  if (runOnStartup) {
    logger.log("RUN_ON_STARTUP is enabled. Running congratulator now...");
    executeGratulator("startup").catch((err) =>
      logger.error("Startup run error:", err),
    );
  } else {
    logger.log("RUN_ON_STARTUP is disabled. Waiting for next scheduled run.");
  }
}

function handleShutdown(signal) {
  logger.log(`Received ${signal}. Shutting down gracefully...`);
  if (cronJob) {
    cronJob.stop();
  }
  if (server) {
    server.close(() => {
      logger.log("HTTP server closed.");
      process.exit(0);
    });
    setTimeout(() => process.exit(0), 5000).unref();
  } else {
    process.exit(0);
  }
}

process.on("SIGTERM", () => handleShutdown("SIGTERM"));
process.on("SIGINT", () => handleShutdown("SIGINT"));

main().catch((err) => {
  logger.error("Fatal error starting daemon:", err);
  process.exit(1);
});
