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

async function stopChild(child) {
  if (child.exitCode !== null || child.killed) return;
  const exited = once(child, "exit").catch(() => {});
  child.kill();
  await exited;
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
    await stopChild(child);
  }
});

test("dev server falls back to the next port when the requested port is busy", async () => {
  const port = String(52000 + Math.floor(Math.random() * 1000));
  const firstChild = spawn(process.execPath, ["scripts/dev-server.mjs"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      HOST: "0.0.0.0",
      PORT: port,
      LAN_IP: "192.168.1.102",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let child;

  try {
    await waitForOutput(firstChild, (text) => text.includes("Network:"));
    child = spawn(process.execPath, ["scripts/dev-server.mjs"], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        HOST: "0.0.0.0",
        PORT: port,
        LAN_IP: "192.168.1.102",
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    const output = await waitForOutput(child, (text) => text.includes("Network:"));
    const portMatch = output.match(/Local:\s+http:\/\/127\.0\.0\.1:(\d+)/);

    assert.notEqual(portMatch?.[1], port);
    assert.match(output, /Port \d+ is busy, trying \d+\.\.\./);
    assert.match(output, new RegExp(`Network:\\s+http://192\\.168\\.1\\.102:${portMatch?.[1]}`));
  } finally {
    if (child) await stopChild(child);
    await stopChild(firstChild);
  }
});
