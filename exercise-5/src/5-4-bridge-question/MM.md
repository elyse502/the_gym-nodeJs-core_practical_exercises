# Exercise 5.4 — Bridge Question

This is the most important part of Exercise 5.

The code is small.

The architecture lesson is huge.

The goal is to connect:

```txt
5.2 HTTPS Server (Pure Node.js)

and

5.3 Express Middleware Pipeline
```

and understand what Express is actually doing for you.

---

# The Short Answer

A middleware pipeline is a chain of functions that execute one after another for every incoming request.

Each middleware receives:

```ts
(req, res, next);
```

and decides whether to:

```ts
next();
```

Continue processing.

Or:

```ts
res.status(...).json(...);
return;
```

Terminate processing.

Express simply automates this chain.

---

# What Happens In Your HTTPS Server?

Recall Exercise 5.2:

```ts
https.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/secure") {
    handleSecureRoute(res);

    return;
  }

  res.writeHead(404);
  res.end();
});
```

Request flow:

```txt
Request
   ↓
Route Logic
   ↓
Response
```

There is no pipeline.

There is only:

```txt
One callback
```

inside:

```ts
https.createServer(...)
```

Everything must happen there.

---

# What Happens In Express?

Express internally creates something similar to:

```txt
Request
   ↓
Middleware 1
   ↓
Middleware 2
   ↓
Middleware 3
   ↓
Middleware 4
   ↓
Route Handler
   ↓
Response
```

You write:

```ts
app.use(logger);
app.use(timer);
app.use(auth);
app.post("/data", handler);
```

Express stores them in an ordered collection.

Conceptually:

```ts
[logger, timer, auth, handler];
```

Then executes them one by one.

---

# What Does next() Actually Do?

Many developers use:

```ts
next();
```

for years without understanding it.

Conceptually:

```ts
function next() {
  executeNextMiddleware();
}
```

That's it.

Express keeps track of:

```txt
Current Position In Chain
```

Example:

```txt
[ logger, timer, auth, handler ]
     ↑
   current
```

When:

```ts
next();
```

is called:

```txt
[ logger, timer, auth, handler ]
              ↑
            current
```

moves forward.

---

# Visualizing The Middleware Chain

Suppose:

```ts
app.use(logger);
app.use(timer);
app.use(auth);
```

Incoming request:

```txt
Request
```

Logger executes:

```ts
logger(req, res, next);
```

Calls:

```ts
next();
```

Express moves to:

```ts
timer(req, res, next);
```

Calls:

```ts
next();
```

Express moves to:

```ts
auth(req, res, next);
```

Calls:

```ts
next();
```

Express moves to:

```ts
routeHandler(req, res);
```

Response sent.

---

# What Stops The Chain?

Middleware can decide:

```ts
res.status(401).json({
  error: "Unauthorized",
});

return;
```

No:

```ts
next();
```

means:

```txt
Chain Stops Here
```

Example:

```txt
Logger
  ↓
Timer
  ↓
Auth
  ↓
401
  ↓
STOP
```

Route never executes.

---

# How Would We Build This In Pure HTTPS?

Imagine Node only gives us:

```ts
https.createServer();
```

We would need to create the middleware system ourselves.

---

## Step 1 — Store Middlewares

```ts
type Middleware = (
  req: IncomingMessage,
  res: ServerResponse,
  next: () => void,
) => void;

const middlewares: Middleware[] = [];
```

---

## Step 2 — Register Middleware

```ts
function use(middleware: Middleware): void {
  middlewares.push(middleware);
}
```

Usage:

```ts
use(logger);
use(timer);
use(auth);
```

---

## Step 3 — Execute Chain

```ts
function runMiddlewares(req: IncomingMessage, res: ServerResponse): void {
  let index = 0;

  function next(): void {
    const middleware = middlewares[index++];

    if (!middleware) {
      return;
    }

    middleware(req, res, next);
  }

  next();
}
```

---

## Step 4 — Connect To HTTPS Server

```ts
https.createServer((req, res) => {
  runMiddlewares(req, res);
});
```

Now you have a primitive Express-like pipeline.

---

# Why Express Exists

Without Express:

Every project would repeatedly build:

- Routing
- Middleware chaining
- Request parsing
- Response helpers
- Error handling
- Parameter extraction

Express packages those concerns into a reusable framework.

---

# Express Is Not Replacing Node

Many beginners think:

```txt
Node.js
OR
Express
```

Reality:

```txt
Node.js
   ↓
Express
```

Express sits on top of Node's HTTP server.

Internally Express still uses:

```ts
http.createServer();
```

under the hood.

---

# Relating This To Exercise 5.3

Your middleware chain:

```txt
Logger
 ↓
Request Timer
 ↓
Body Size Guard
 ↓
express.json()
 ↓
Fake Auth
 ↓
POST /data
```

is simply a sequence of functions.

Express executes them one by one.

`next()` advances the sequence.

Returning a response stops the sequence.

---

# Suggested File

Create:

```text
src/5-4-bridge-question/explanation.md
```

and place the following answer inside:

````md
# Middleware Pipeline Architecture

A middleware pipeline is a sequence of functions that execute for every incoming request before the final route handler runs.

Each middleware receives three arguments:

```ts
(req, res, next);
```

The middleware can either continue processing by calling `next()` or terminate the request by sending a response.

Calling `next()` tells Express to execute the next middleware in the chain. Internally Express maintains an ordered list of middleware functions and advances through that list whenever `next()` is invoked.

This architecture allows concerns such as logging, authentication, validation, timing, request parsing, and authorization to remain independent and reusable.

In the HTTPS server from Exercise 5.2 there is no middleware pipeline. Every concern must be implemented manually inside the callback passed to `https.createServer()`.

To replicate Express behavior in pure Node.js, we would need to build our own middleware registry, implement a `use()` function for registration, track the current middleware index, and create a custom `next()` mechanism that executes the next middleware in sequence.

Express provides this entire middleware execution engine out of the box, allowing developers to focus on application logic rather than request orchestration.
````
