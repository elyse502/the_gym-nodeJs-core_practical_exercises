import http from "node:http";
import { writeLog } from "./helpers/loggers";

const server = http.createServer((_req, res) => {
  res.end("ok");

  setImmediate(async () => {
    await writeLog(`setImmediate ${Date.now()}`);
  });
});

server.listen(3000);
