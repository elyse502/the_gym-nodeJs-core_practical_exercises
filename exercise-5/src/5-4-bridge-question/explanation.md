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
