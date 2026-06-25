# Exercise 5 - HTTPS, TLS, and Custom Middleware Pipeline

## Overview

This exercise explores two fundamental concepts in backend engineering:

1. HTTPS and TLS encryption using Node.js native modules.
2. Express middleware architecture and request processing pipelines.

The goal is to understand both how secure HTTP communication works and how Express internally organizes request processing through middleware chains.

Unlike previous exercises focused on the Event Loop and File System operations, this exercise moves closer to production-grade backend architecture.

---

# Learning Objectives

By completing this exercise, you should understand:

- What HTTPS is and why it exists
- The role of TLS certificates
- The difference between HTTP and HTTPS
- How self-signed certificates work
- How to create an HTTPS server using Node.js
- What middleware is
- How Express executes middleware chains
- How `next()` works internally
- How middleware can terminate request processing
- How middleware enriches request objects
- How Express builds functionality on top of Node's HTTP server

---

# Project Structure

```text
exercise-5/
│
├── certs/
│   ├── cert.pem
│   └── key.pem
│
├── src/
│
│   ├── 5-2-https-server/
│   │   ├── index.ts
│   │   ├── routes/
│   │   │   └── secure.route.ts
│   │   └── types/
│   │       └── https-options.type.ts
│   │
│   ├── 5-3-custom-middleware/
│   │   ├── index.ts
│   │   ├── middlewares/
│   │   │   ├── logger.middleware.ts
│   │   │   ├── request-timer.middleware.ts
│   │   │   ├── body-size-guard.middleware.ts
│   │   │   └── fake-auth.middleware.ts
│   │   │
│   │   ├── routes/
│   │   │   └── data.route.ts
│   │   │
│   │   ├── types/
│   │   │   └── request-with-user.interface.ts
│   │   │
│   │   └── logs/
│   │       └── requests.log
│   │
│   └── 5-4-bridge-question/
│       └── explanation.md
│
├── package.json
├── tsconfig.json
└── README.md
```

---

# Part 5.1 - TLS Certificate Generation

## OpenSSL Verification

```bash
openssl version
```

Used OpenSSL to generate a self-signed certificate for local HTTPS development.

---

## Certificate Generation

```bash
mkdir certs

openssl req -x509 \
-newkey rsa:2048 \
-keyout certs/key.pem \
-out certs/cert.pem \
-days 365 \
-nodes
```

Generated:

```text
certs/
├── cert.pem
└── key.pem
```

---

## Security Consideration

The private key must never be committed to source control.

Added:

```gitignore
certs/
```

to `.gitignore`.

---

# Part 5.2 - Native HTTPS Server

Implemented an HTTPS server using Node's built-in `https` module.

No Express was used.

---

## Endpoint

### GET /secure

Response:

```json
{
  "message": "you are on a secure connection"
}
```

---

## HTTPS Configuration

Loaded:

```ts
key.pem;
cert.pem;
```

during server startup and configured them as TLS credentials.

---

## Concepts Learned

- TLS handshake
- Certificates
- Public/private key pairs
- Self-signed certificates
- HTTPS server configuration
- Secure transport layer

---

# Part 5.3 - Custom Middleware Pipeline

Implemented an Express application containing four custom middlewares.

---

## Logger Middleware

Responsibilities:

- Log timestamp
- Log HTTP method
- Log request path
- Persist entries to requests.log

Example:

```text
[2026-06-25T08:00:00.000Z] POST /data
```

---

## Request Timer Middleware

Responsibilities:

- Record request start time
- Listen for `res.on("finish")`
- Measure complete request duration

Example:

```text
POST /data completed in 42 ms
```

---

## Body Size Guard Middleware

Responsibilities:

- Read Content-Length header
- Reject requests larger than 1 KB
- Return HTTP 413

Response:

```json
{
  "error": "Payload Too Large"
}
```

---

## Fake Auth Middleware

Responsibilities:

- Validate `x-token`
- Attach authenticated user to request
- Reject unauthorized requests

Required header:

```http
x-token: secret123
```

Attached object:

```ts
req.user = {
  name: "admin",
};
```

Unauthorized response:

```json
{
  "error": "Unauthorized"
}
```

---

# POST /data

The final route consumes data prepared by previous middleware.

Response:

```json
{
  "user": {
    "name": "admin"
  },
  "body": {
    "message": "hello"
  }
}
```

---

# Middleware Pipeline Flow

```text
Request
   ↓
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
   ↓
Response
```

---

# Part 5.4 - Middleware Architecture

The exercise concludes by comparing:

- Native HTTPS servers
- Express middleware pipelines

Key concepts explored:

- Middleware chaining
- next() execution flow
- Request orchestration
- Manual middleware implementation in Node.js

---

# Testing

## HTTPS Endpoint

Verified:

```http
GET https://localhost:4000/secure
```

using Postman with SSL verification disabled.

---

## Authentication Tests

Verified:

- Valid token
- Invalid token
- Missing token

---

## Payload Validation Tests

Verified:

- Payload < 1 KB
- Payload > 1 KB

---

## Logging Tests

Verified:

- Request logging
- Duration tracking
- File persistence

---

# Skills Demonstrated

- HTTPS server configuration
- TLS certificate management
- Node.js native networking
- Express middleware development
- Request lifecycle monitoring
- Authentication middleware
- Validation middleware
- Request enrichment patterns
- Separation of concerns
- TypeScript backend architecture

---

# Key Takeaways

HTTPS and Express solve different problems.

HTTPS secures communication between clients and servers.

Express organizes request processing through middleware pipelines.

Understanding both layers helps explain how modern backend applications receive, validate, authenticate, process, and respond to requests securely.
