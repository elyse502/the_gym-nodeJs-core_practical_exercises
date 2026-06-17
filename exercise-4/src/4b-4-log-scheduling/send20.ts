import http from "node:http";

/**
 * Sends a single request.
 */
function request(): Promise<number> {
  return new Promise((resolve) => {
    http.get("http://localhost:3000", (res) => {
      resolve(res.statusCode ?? 0);
    });
  });
}

Promise.all(Array.from({ length: 20 }, request)).then((results) => {
  console.log("all done:", results);
});
