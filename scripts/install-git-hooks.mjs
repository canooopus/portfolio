import { spawnSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const script = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "git-sync.mjs"
);

const result = spawnSync(process.execPath, [script, "install"], {
  stdio: "inherit",
});

process.exitCode = result.status ?? 1;
