import { createReadStream, existsSync } from "node:fs";
import { createServer } from "node:http";
import { createConnection } from "node:net";
import { networkInterfaces } from "node:os";
import { extname, join, normalize } from "node:path";

const root = join(process.cwd(), "src");
const requestedPort = Number(process.env.PORT || 4173);
const host = process.env.HOST || "0.0.0.0";
const configuredLanIp = process.env.LAN_IP;
const maxPortAttempts = 20;

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

const server = createServer((request, response) => {
  const address = server.address();
  const activePort = typeof address === "object" && address ? address.port : requestedPort;
  const url = new URL(request.url ?? "/", `http://localhost:${activePort}`);
  const pathname = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
  const target = normalize(join(root, pathname));

  if (!target.startsWith(root) || !existsSync(target)) {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  response.writeHead(200, { "content-type": types[extname(target)] ?? "application/octet-stream" });
  createReadStream(target).pipe(response);
});

function findLanIp() {
  if (configuredLanIp) {
    return configuredLanIp;
  }

  for (const interfaces of Object.values(networkInterfaces())) {
    for (const details of interfaces ?? []) {
      if (details.family === "IPv4" && !details.internal) {
        return details.address;
      }
    }
  }

  return null;
}

function isPortInUse(port) {
  const probeHost = host === "0.0.0.0" ? "127.0.0.1" : host;

  return new Promise((resolve) => {
    let settled = false;
    const finish = (inUse) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(inUse);
    };
    const socket = createConnection({ host: probeHost, port });
    socket.once("connect", () => finish(true));
    socket.once("error", () => finish(false));
    socket.setTimeout(300, () => finish(false));
  });
}

async function listen(port, attemptsRemaining = maxPortAttempts) {
  if (await isPortInUse(port)) {
    if (attemptsRemaining <= 0) {
      throw new Error(`No available dev server port found after ${maxPortAttempts} attempts.`);
    }

    const nextPort = port + 1;
    console.warn(`Port ${port} is busy, trying ${nextPort}...`);
    await listen(nextPort, attemptsRemaining - 1);
    return;
  }

  server.once("error", (error) => {
    if (error.code !== "EADDRINUSE" || attemptsRemaining <= 0) {
      throw error;
    }

    const nextPort = port + 1;
    console.warn(`Port ${port} is busy, trying ${nextPort}...`);
    void listen(nextPort, attemptsRemaining - 1);
  });

  server.listen({ port, host, exclusive: true }, () => {
    server.removeAllListeners("error");
    printServerUrls(port);
  });
}

function printServerUrls(port) {
  console.log("Link Match dev server");
  console.log(`Local:   http://127.0.0.1:${port}`);

  const lanIp = findLanIp();
  if (host === "0.0.0.0" && lanIp) {
    console.log(`Network: http://${lanIp}:${port}`);
  }
}

listen(requestedPort);
