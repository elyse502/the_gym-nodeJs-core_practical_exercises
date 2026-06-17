/**
 * Demonstrates queue priorities.
 */

setTimeout(() => {
  console.log("A");
}, 0);

Promise.resolve().then(() => {
  console.log("B");
});

setImmediate(() => {
  console.log("C");
});

process.nextTick(() => {
  console.log("D");
});
