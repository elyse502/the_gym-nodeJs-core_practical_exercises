import { EventEmitter } from "node:events";

/**
 * Demonstrates deferred event emission.
 */
class DataLoader extends EventEmitter {
  /**
   * Loads data.
   *
   * The event is emitted after
   * the current call stack completes.
   */
  load(): void {
    process.nextTick(() => {
      this.emit("ready", {
        data: "loaded",
      });
    });

    /*
    // This is the same as the above, but using setImmediate instead of process.nextTick.
    // The event is emitted after the current call stack completes.
    // Note: setImmediate is executed in the check phase of the event loop, while process.nextTick is executed in the next tick queue, which is processed before the event loop continues. Therefore, using setImmediate will ensure that the event is emitted after the current call stack completes, but it will be executed after any other nextTick callbacks.
    setImmediate(() => {
      this.emit("ready", {
        data: "loaded",
      });
    });
    */

    //    ************************************************************************

    /*
    // This is the same as the above, but using setTimeout instead of process.nextTick.
    // The event is emitted after the current call stack completes.
    // Note: setTimeout is executed in the timers phase of the event loop, which is processed after the check phase. Therefore, using setTimeout will ensure that the event is emitted after the current call stack completes, but it will be executed after any other nextTick or setImmediate callbacks.
    setTimeout(() => {
      this.emit("ready", {
        data: "loaded",
      });
    }, 0);
    */
  }
}

const loader = new DataLoader();

loader.load();

loader.on("ready", (result) => {
  console.log("got:", result);
});
