import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const PROJECT_ROOT = path.resolve(__dirname, "../");

const DEFAULT_WISHES = {
  anyone: [
    "Happy birthday! 🥳🎈🎁🎊🎂",
    "Happy birthday! 🎈🎁🎊🧁🥳",
    "Happy birthday! 🥮🎈🎁🎊🥳",
  ],
};

/**
 * Parse wishes from environment variable string if present
 * @param {string} rawWishes
 * @returns {object|null}
 */
function parseEnvWishes(rawWishes) {
  if (!rawWishes || typeof rawWishes !== "string") return null;
  const trimmed = rawWishes.trim();
  if (trimmed.startsWith("{")) {
    try {
      return JSON.parse(trimmed);
    } catch {
      // ignore JSON parse error and fallback
    }
  } else if (trimmed.startsWith("[")) {
    try {
      return { anyone: JSON.parse(trimmed) };
    } catch {
      // ignore JSON parse error and fallback
    }
  }

  // Comma or newline separated list
  const list = trimmed
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (list.length > 0) {
    return { anyone: list };
  }

  return null;
}

/**
 * Load and merge configuration from config file and environment variables
 *
 * @param {string|object|undefined} configSource File path, in-memory config object, or undefined
 * @param {string|undefined} userConfigDir Optional OCLIF user config directory
 * @returns {{config: object, source: string}}
 */
export function loadConfig(configSource, userConfigDir) {
  let loadedConfig = {};
  let resolvedPath = null;
  let sourceDesc = "default/env";

  if (typeof configSource === "object" && configSource !== null) {
    loadedConfig = { ...configSource };
    sourceDesc = "object";
  } else {
    const candidatePaths = [];

    if (typeof configSource === "string" && configSource.trim().length > 0) {
      candidatePaths.push(path.resolve(configSource));
    }

    if (process.env.CONFIG_PATH) {
      candidatePaths.push(path.resolve(process.env.CONFIG_PATH));
    }
    if (process.env.CONFIG_FILE) {
      candidatePaths.push(path.resolve(process.env.CONFIG_FILE));
    }

    // Default root config.json
    candidatePaths.push(path.resolve(PROJECT_ROOT, "config.json"));

    // OCLIF user config dir
    if (userConfigDir) {
      candidatePaths.push(path.join(userConfigDir, "config.json"));
    }

    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        try {
          const content = fs.readFileSync(p, "utf8");
          loadedConfig = JSON.parse(content);
          resolvedPath = p;
          sourceDesc = p;
          break;
        } catch (err) {
          throw new Error(`Failed to parse config file at ${p}: ${err.message}`, { cause: err });
        }
      }
    }

    // If no config file was found, check if CONFIG_JSON is set
    if (!resolvedPath && process.env.CONFIG_JSON) {
      try {
        loadedConfig = JSON.parse(process.env.CONFIG_JSON);
        sourceDesc = "CONFIG_JSON env var";
      } catch (err) {
        throw new Error(`Failed to parse CONFIG_JSON env variable: ${err.message}`, { cause: err });
      }
    }
  }

  const finalConfig = { ...loadedConfig };

  // Apply environment variable overrides
  const envUsername =
    process.env.FB_USERNAME ||
    process.env.FACEBOOK_USERNAME ||
    process.env.FB_EMAIL;
  if (envUsername) {
    finalConfig.username = envUsername;
  }

  const envPassword =
    process.env.FB_PASSWORD ||
    process.env.FACEBOOK_PASSWORD;
  if (envPassword) {
    finalConfig.password = envPassword;
  }

  const envWishes = parseEnvWishes(process.env.FB_WISHES);
  if (envWishes) {
    finalConfig.wishes = {
      ...(finalConfig.wishes || {}),
      ...envWishes,
    };
  }

  if (!finalConfig.wishes || Object.keys(finalConfig.wishes).length === 0) {
    finalConfig.wishes = DEFAULT_WISHES;
  }

  // Persistent session handling
  if (process.env.FB_PERSISTENT !== undefined) {
    finalConfig.persistent =
      process.env.FB_PERSISTENT === "true" ||
      process.env.FB_PERSISTENT === "1" ||
      process.env.FB_PERSISTENT === "yes";
  } else if (process.env.PERSISTENT !== undefined) {
    finalConfig.persistent =
      process.env.PERSISTENT === "true" ||
      process.env.PERSISTENT === "1" ||
      process.env.PERSISTENT === "yes";
  } else if (finalConfig.persistent === undefined) {
    finalConfig.persistent = true;
  }

  // User data directory
  const envUserDataDir =
    process.env.FB_USER_DATA_DIR ||
    process.env.USER_DATA_DIR;
  if (envUserDataDir) {
    finalConfig.userDataDir = path.resolve(envUserDataDir);
  } else if (finalConfig.userDataDir) {
    finalConfig.userDataDir = path.resolve(finalConfig.userDataDir);
  } else {
    finalConfig.userDataDir = path.resolve(PROJECT_ROOT, "user_data");
  }

  // Browser type
  const envBrowserType =
    process.env.FB_BROWSER_TYPE ||
    process.env.BROWSER_TYPE;
  if (envBrowserType) {
    finalConfig.browserType = envBrowserType;
  } else if (!finalConfig.browserType) {
    finalConfig.browserType = "chromium";
  }

  // Debug flag
  if (process.env.DEBUG !== undefined) {
    finalConfig.debug =
      process.env.DEBUG === "true" ||
      process.env.DEBUG === "1";
  }

  return { config: finalConfig, resolvedPath, source: sourceDesc };
}

export default loadConfig;
