const http = require("http");

/**
 * Sends a registration request to the server.
 *
 * @param {number} requestId
 * @returns {Promise<object>}
 */
function sendRequest(requestId) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      name: "Concurrent User",
      email: "same@example.com",
      password: "123456",
    });

    const options = {
      hostname: "localhost",
      port: 3000,
      path: "/register",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
      },
    };

    const req = http.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        let parsedBody;

        try {
          parsedBody = JSON.parse(data);
        } catch {
          parsedBody = data;
        }

        resolve({
          requestId,
          status: res.statusCode,
          body: parsedBody,
        });
      });
    });

    req.on("error", reject);

    req.write(body);
    req.end();
  });
}

/**
 * Fires 20 requests simultaneously.
 */
async function run() {
  console.log("\nStarting stress test...\n");

  const results = await Promise.all(
    Array.from({ length: 20 }, (_, index) => sendRequest(index + 1)),
  );

  results.forEach((result) => {
    console.log(
      `Request ${result.requestId.toString().padStart(2)} → ${result.status}`,
    );
  });

  const created = results.filter((result) => result.status === 201).length;

  const duplicates = results.filter((result) => result.status === 409).length;

  console.log("\nSummary");
  console.log("----------------------");
  console.log(`201 Created   : ${created}`);
  console.log(`409 Duplicate : ${duplicates}`);
}

run().catch(console.error);
