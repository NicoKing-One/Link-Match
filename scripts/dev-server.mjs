import { createReadStream, existsSync } from "node:fs";
import { createServer } from "node:http";
import { networkInterfaces } from "node:os";
import { extname, join, normalize } from "node:path";

const root = join(process.cwd(), "src");
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || "0.0.0.0";
const configuredLanIp = process.env.LAN_IP;

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

const server = createServer((request, response) => {
  const url = new URL(request.url ?? "/", `http://localhost:${port}`);
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

server.listen(port, host, () => {
  console.log("Link Match dev server");
  console.log(`Local:   http://127.0.0.1:${port}`);

  const lanIp = findLanIp();
  if (host === "0.0.0.0" && lanIp) {
    console.log(`Network: http://${lanIp}:${port}`);
  }
});
