import http from "node:http";
import { writeLog } from "./helpers/loggers";

const server = http.createServer((_req, res) => {
  res.end("ok");

  setImmediate(async () => {
    await writeLog(`setImmediate ${Date.now()}`);
  });
});

server.listen(3000, () => {
  console.log("server listening on port 3000 => http://localhost:3000");
});
