import { EventEmitter } from "node:events";

/**
 * Simulates a component that loads data
 * and emits a ready event.
 */
class DataLoader extends EventEmitter {
  /**
   * Loads data and immediately emits.
   */
  load(): void {
    this.emit("ready", {
      data: "loaded",
    });
  }
}

const loader = new DataLoader();

loader.load();

loader.on("ready", (result) => {
  console.log("got:", result);
});
