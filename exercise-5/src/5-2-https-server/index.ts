import fs from "node:fs";
import https from "node:https";

import { handleSecureRoute } from "./routes/secure.route.js";

/**
 * Loads TLS certificate files.
 */
const options = {
  key: fs.readFileSync("certs/key.pem"),
  cert: fs.readFileSync("certs/cert.pem"),
};

const server = https.createServer(options, (req, res) => {
  if (req.method === "GET" && req.url === "/secure") {
    handleSecureRoute(res);

    return;
  }

  res.writeHead(404);
  res.end();
});

server.listen(4000, () => {
  console.log("HTTPS server running at https://localhost:4000/secure");
});
