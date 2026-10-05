/**
 * Apply a random delay up to delayMaxHours before proceeding
 *
 * @param {object} logger Logger with .log method
 * @param {number|string|undefined} delayMaxHours Max delay in hours
 * @returns {Promise<number>} Delay milliseconds that were waited
 */
export async function applyRandomDelay(logger, delayMaxHours) {
  if (delayMaxHours === undefined || delayMaxHours === null || delayMaxHours === "") {
    return 0;
  }

  const maxHours = parseFloat(delayMaxHours);
  if (isNaN(maxHours) || maxHours <= 0) {
    return 0;
  }

  const delayMs = Math.floor(Math.random() * maxHours * 3600 * 1000);
  const totalSeconds = Math.floor(delayMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const targetTime = new Date(Date.now() + delayMs).toLocaleTimeString();

  logger.log(
    `Random delay active (DELAY_MAX_H=${maxHours}h): waiting for ${hours}h ${minutes}m ${seconds}s (until ${targetTime}) before running...`,
  );

  await new Promise((resolve) => setTimeout(resolve, delayMs));
  logger.log("Delay completed. Proceeding with execution.");
  return delayMs;
}

export default applyRandomDelay;
