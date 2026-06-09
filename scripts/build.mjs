import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const outDir = join(root, "dist");

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });
await cp(join(root, "src"), outDir, { recursive: true });
await writeFile(
  join(outDir, "build-info.json"),
  JSON.stringify(
    {
      name: "link-match",
      target: "web-h5-preview",
      builtAt: new Date().toISOString(),
      entry: "index.html",
    },
    null,
    2,
  ),
  "utf8",
);

console.log(`Build output: ${outDir}`);
