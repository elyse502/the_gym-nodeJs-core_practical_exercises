import { appendLog } from "./logger.js";

/**
 * Registers shutdown handlers.
 */
export function registerShutdownHooks(): void {
  process.on("exit", () => {
    appendLog(`server shut down at ${new Date().toISOString()}`);
  });
}

/**
 * Schedules process termination.
 */
export function shutdown(): void {
  console.warn("[WARNING] Shutdown requested. Exiting in 3 seconds...");

  setTimeout(() => {
    process.exit(1);
  }, 3000);
}
