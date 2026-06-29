import { once } from "node:events";
import { spawn } from "node:child_process";
import { test } from "node:test";
import assert from "node:assert/strict";

function waitForOutput(child, predicate) {
  let output = "";
  const collect = (chunk) => {
    output += chunk.toString();
    if (predicate(output)) {
      cleanup();
      resolve(output);
    }
  };

  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });

  const timeout = setTimeout(() => {
    cleanup();
    reject(new Error(`Timed out waiting for dev-server output. Saw:\n${output}`));
  }, 3000);

  const onExit = (code) => {
    cleanup();
    reject(new Error(`dev-server exited with code ${code}. Saw:\n${output}`));
  };

  function cleanup() {
    clearTimeout(timeout);
    child.stdout.off("data", collect);
    child.stderr.off("data", collect);
    child.off("exit", onExit);
  }

  child.stdout.on("data", collect);
  child.stderr.on("data", collect);
  child.on("exit", onExit);
  return promise;
}

test("dev server can expose a real-device preview URL", async () => {
  const port = String(51000 + Math.floor(Math.random() * 1000));
  const child = spawn(process.execPath, ["scripts/dev-server.mjs"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      HOST: "0.0.0.0",
      PORT: port,
      LAN_IP: "192.168.1.102",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  try {
    const output = await waitForOutput(child, (text) => text.includes("Network:"));

    assert.match(output, new RegExp(`Local:\\s+http://127\\.0\\.0\\.1:${port}`));
    assert.match(output, new RegExp(`Network:\\s+http://192\\.168\\.1\\.102:${port}`));
  } finally {
    child.kill();
    await once(child, "exit").catch(() => {});
  }
});
