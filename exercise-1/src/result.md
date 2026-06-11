Yes, it will work correctly, but there is an important detail about what the timings mean.

You now have two different measurements:

### Inside the worker

```ts
const start = performance.now();

// heavy loop

const end = performance.now();
```

This measures:

```text
Pure CPU execution time
```

for the counting loop.

Example:

```json
{
  "completed": true,
  "iterations": 5000000000,
  "durationMs": 8421.32
}
```

---

### Inside the main thread

```ts
const start = performance.now();

const worker = new Worker(...);

worker.on("message", () => {
  const end = performance.now();
});
```

This measures:

```text
Worker lifecycle time
```

which includes:

- Worker creation
- Worker startup
- Script loading
- Loop execution
- Message transfer back to parent

Example:

```txt
Worker completed in 8457.12 ms
```

Notice:

```txt
Worker execution: 8421.32 ms
Worker lifecycle: 8457.12 ms
```

The second number is slightly larger.

That's expected.

---

### Even better

You can make the logs clearer:

```ts
worker.on("message", (result) => {
  const end = performance.now();

  console.log(`Worker lifecycle duration: ${(end - start).toFixed(2)} ms`);

  resolve(result);
});
```

Then your logs become:

```txt
=== HEAVY TASK STARTED ===

[Worker] Starting heavy computation...

Heartbeat: 3021.12 ms
Heartbeat: 4021.89 ms
Heartbeat: 5022.54 ms

[Worker] Completed in 8421.32 ms

Worker lifecycle duration: 8457.12 ms

Total request duration: 8460.44 ms

=== HEAVY TASK FINISHED ===
```

Now each timing has a clear meaning:

| Measurement               | What it Measures                         |
| ------------------------- | ---------------------------------------- |
| Worker duration           | Only the counting loop                   |
| Worker lifecycle duration | Worker creation → worker completion      |
| Request duration          | HTTP request start → HTTP response ready |

---

### TypeScript improvement

Instead of:

```ts
function runHeavyTask(): Promise<unknown>;
```

define the exact shape:

```ts
interface WorkerResult {
  completed: boolean;
  iterations: number;
  durationMs: number;
}
```

Then:

```ts
function runHeavyTask(): Promise<WorkerResult>;
```

This gives:

- Better IntelliSense
- Compile-time safety
- Self-documenting code

Example:

```ts
const result = await runHeavyTask();

console.log(result.durationMs);
console.log(result.iterations);
```

without any casting.

For a learning exercise and future interviews, having all three timings visible is excellent because it demonstrates the difference between:

- CPU execution time
- Thread lifecycle overhead
- End-to-end request latency

Those are three distinct performance metrics that backend engineers frequently analyze in production systems.
