import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { loadEnvLocal } from "./env.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(ROOT);

const MANIFEST_PATH = "src/generated/image-manifest.json";
const OGP_CACHE_PATH = "content/.cache/ogp-cache.json";
const HOOK_NAMES = [
  "pre-commit",
  "post-merge",
  "post-rewrite",
  "post-checkout",
  "pre-push",
];

function log(message) {
  console.log(`[git-sync] ${message}`);
}

function info(message) {
  console.log(`[git-sync] ${message}`);
}

function warn(message) {
  console.warn(`[git-sync] ⚠️  ${message}`);
}

function error(message) {
  console.error(`[git-sync] ❌ ${message}`);
}

/** コマンドを実行して終了コードを返す（throw しない） */
function run(command, args = []) {
  const result = spawnSync(command, args, { stdio: "inherit" });
  if (result.error) {
    warn(`実行できませんでした: ${command} (${result.error.message})`);
    return 1;
  }
  return result.status ?? 1;
}

/** 標準出力を取得する。失敗時は null */
function capture(command, args = []) {
  const result = spawnSync(command, args, { encoding: "utf8" });
  if (result.error || result.status !== 0) return null;
  return result.stdout.trim();
}

function runNodeScript(script, args = []) {
  return run(process.execPath, [script, ...args]);
}

function runNodeBin(relativeBin, args = []) {
  const binPath = path.join("node_modules", relativeBin);
  if (!fs.existsSync(binPath)) {
    warn(
      `node_modules/${relativeBin} が見つからないためスキップしました（npm install 後に再実行してください）`
    );
    return 0;
  }
  return run(process.execPath, [binPath, ...args]);
}

function readStdin() {
  // 手動実行（TTY）ではブロックしない
  if (process.stdin.isTTY) return "";
  try {
    return fs.readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

function diffNames(from, to, paths = []) {
  const args = ["diff", "--name-only", from, to];
  if (paths.length > 0) args.push("--", ...paths);
  const output = capture("git", args);
  return output ? output.split(/\r?\n/).filter(Boolean) : [];
}

function stagedFiles() {
  const output = capture("git", [
    "diff",
    "--cached",
    "--name-only",
    "--diff-filter=ACMR",
  ]);
  return output ? output.split(/\r?\n/).filter(Boolean) : [];
}

function gitStatusChanged(filePath) {
  return Boolean(capture("git", ["status", "--porcelain", "--", filePath]));
}

function hasR2Credentials() {
  loadEnvLocal();
  return Boolean(
    process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      (process.env.R2_ACCOUNT_ID || process.env.R2_ENDPOINT)
  );
}

function hasNodeModules() {
  return fs.existsSync(path.join("node_modules", "aws4fetch"));
}

function hasAnyOriginal() {
  const roots = [
    path.join("public", "images", "blog"),
    path.join("public", "images", "home"),
  ];
  const stack = roots.filter((root) => fs.existsSync(root));

  while (stack.length > 0) {
    const dir = stack.pop();
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        stack.push(path.join(dir, entry.name));
      } else {
        return true;
      }
    }
  }

  return false;
}

/** pull 後の変更内容から元画像の復元が必要か判断する */
function needsImageSync(changedFiles) {
  return (
    changedFiles.includes(MANIFEST_PATH) ||
    changedFiles.some(
      (file) => file.startsWith("content/blog/") && file.endsWith(".md")
    )
  );
}

/** R2 から元画像を復元する。git 操作は止めない */
function syncImages(reason) {
  if (!hasNodeModules()) {
    warn("npm install 前のため元画像の復元をスキップしました");
    return 0;
  }

  if (!hasR2Credentials()) {
    warn(
      "R2 の認証情報が未設定のため元画像の復元をスキップしました（.env.local 設定後に npm run images:pull）"
    );
    return 0;
  }

  log(`${reason} → R2 から元画像を復元します`);
  const code = runNodeScript("scripts/pull-originals.mjs");
  if (code !== 0) {
    warn(
      "元画像の復元に失敗しました。npm run images:pull を手動で実行してください"
    );
  }
  return 0;
}

function preCommit() {
  if (fs.existsSync(path.join("node_modules", "sharp"))) {
    log("画像を最適化しています...");
    if (runNodeScript("scripts/optimize-images.mjs") !== 0) {
      error("画像の最適化に失敗したためコミットを中止します");
      return 1;
    }
  } else {
    warn(
      "node_modules/sharp が無いため画像の最適化をスキップしました（npm install 後に再実行してください）"
    );
  }

  if (gitStatusChanged(MANIFEST_PATH)) {
    if (run("git", ["add", MANIFEST_PATH]) !== 0) {
      error(`${MANIFEST_PATH} をステージできなかったためコミットを中止します`);
      return 1;
    }
    log("更新された image-manifest.json をステージしました");
  }

  const staged = stagedFiles().filter((file) => fs.existsSync(file));

  const lintTargets = staged.filter((file) =>
    /\.(?:c|m)?(?:j|t)sx?$/.test(file)
  );
  if (lintTargets.length > 0) {
    log(`ESLint を実行します（${lintTargets.length} ファイル）`);
    if (runNodeBin("eslint/bin/eslint.js", lintTargets) !== 0) {
      error("ESLint でエラーが見つかったためコミットを中止します");
      return 1;
    }
  }

  const typecheckTargets = staged.filter((file) => /\.(?:ts|tsx)$/.test(file));
  if (typecheckTargets.length > 0) {
    log("型チェック (tsc --noEmit) を実行します");
    if (runNodeBin("typescript/bin/tsc", ["--noEmit"]) !== 0) {
      error("型エラーがあるためコミットを中止します");
      return 1;
    }
  }

  if (gitStatusChanged(OGP_CACHE_PATH)) {
    warn(
      "content/.cache/ogp-cache.json が変更されています（記事と一緒にコミットするとキャッシュを共有できます）"
    );
  }

  return 0;
}

function warnIfWorkerChanged(refsText) {
  let workerChanged = false;

  for (const line of refsText.split(/\r?\n/).filter(Boolean)) {
    const [, localSha, , remoteSha] = line.split(/\s+/);
    if (!localSha || /^0+$/.test(localSha)) continue;

    const base =
      remoteSha && !/^0+$/.test(remoteSha)
        ? remoteSha
        : capture("git", ["merge-base", "HEAD", "origin/main"]);
    if (!base) continue;

    if (diffNames(base, localSha, ["worker"]).length > 0) {
      workerChanged = true;
      break;
    }
  }

  if (workerChanged) {
    warn(
      "worker/ が変更されています。必要なら npm run images:deploy を実行してください"
    );
  }
}

function prePush() {
  if (process.env.SKIP_IMAGE_PUBLISH === "1") {
    log("SKIP_IMAGE_PUBLISH=1 のため R2 へのアップロードをスキップしました");
    return 0;
  }

  if (!hasNodeModules()) {
    error(
      "node_modules が無いため R2 へアップロードできません。npm install 後に push してください（回避: SKIP_IMAGE_PUBLISH=1 git push）"
    );
    return 1;
  }

  if (!hasR2Credentials()) {
    error(
      "R2 の認証情報が無いため push を中止しました。.env.local を設定するか、SKIP_IMAGE_PUBLISH=1 git push で回避してください"
    );
    return 1;
  }

  log("R2 へ画像をアップロードしています（元画像のバックアップを含む）...");
  if (
    runNodeScript("scripts/publish-images.mjs", ["--with-originals"]) !== 0
  ) {
    error(
      "R2 へのアップロードに失敗したため push を中止しました（回避: SKIP_IMAGE_PUBLISH=1 git push）"
    );
    return 1;
  }

  warnIfWorkerChanged(readStdin());
  return 0;
}

function postMerge() {
  const previous = capture("git", ["rev-parse", "--verify", "HEAD@{1}"]);
  if (!previous) return 0;

  const changed = diffNames(previous, "HEAD");
  if (!needsImageSync(changed)) {
    log("画像の更新は無いためスキップしました");
    return 0;
  }

  return syncImages("pull で画像の変更を検出");
}

function postRewrite() {
  const first = readStdin().split(/\r?\n/).filter(Boolean)[0];
  const previous = first?.split(/\s+/)[0];
  if (!previous) return 0;

  const changed = diffNames(previous, "HEAD");
  if (!needsImageSync(changed)) return 0;

  return syncImages("rebase / amend で画像の変更を検出");
}

function postCheckout(args) {
  const [oldHead, newHead, flag] = args;

  // ブランチ切替のみ対象（ファイル単位の checkout は無視）
  if (flag !== "1") return 0;
  if (!oldHead || !newHead) return 0;
  if (/^0+$/.test(oldHead) || /^0+$/.test(newHead)) return 0;

  const changed = diffNames(oldHead, newHead);
  if (!needsImageSync(changed)) return 0;

  return syncImages("ブランチ切替で画像の変更を検出");
}

function install() {
  if (!fs.existsSync(".git")) {
    log("Git リポジトリではないためスキップしました");
    return 0;
  }

  if (process.env.CI) {
    log("CI 環境のためスキップしました");
    return 0;
  }

  if (!fs.existsSync(".githooks")) {
    warn(".githooks が見つからないためフックを設定できません");
    return 0;
  }

  if (run("git", ["config", "core.hooksPath", ".githooks"]) !== 0) {
    warn("core.hooksPath を設定できませんでした");
    return 0;
  }
  log("Git フックを有効化しました (core.hooksPath=.githooks)");

  if (process.platform !== "win32") {
    for (const name of HOOK_NAMES) {
      const hookPath = path.join(".githooks", name);
      if (fs.existsSync(hookPath)) fs.chmodSync(hookPath, 0o755);
    }
  }

  if (hasAnyOriginal()) {
    log("元画像は既にローカルにあります");
    return 0;
  }

  if (!hasNodeModules()) {
    info("npm install 後に npm run git:sync で元画像を復元できます");
    return 0;
  }

  if (!hasR2Credentials()) {
    info(
      ".env.local に R2 の認証情報を設定後、npm run git:sync で元画像を復元してください"
    );
    return 0;
  }

  return syncImages("初回セットアップ");
}

const command = process.argv[2];
const commandArgs = process.argv.slice(3);

switch (command) {
  case "install":
    process.exitCode = install();
    break;
  case "pre-commit":
    process.exitCode = preCommit();
    break;
  case "pre-push":
    process.exitCode = prePush();
    break;
  case "post-merge":
    process.exitCode = postMerge();
    break;
  case "post-rewrite":
    process.exitCode = postRewrite();
    break;
  case "post-checkout":
    process.exitCode = postCheckout(commandArgs);
    break;
  case "sync":
    process.exitCode = syncImages("手動同期");
    break;
  default:
    console.log(`使い方: node scripts/git-sync.mjs <command>

  install         Git フックを有効化し、初回は元画像を復元
  pre-commit      画像最適化 + manifest ステージ + lint / tsc
  pre-push        R2 へ画像をアップロード
  post-merge      pull / merge 後に元画像を復元
  post-rewrite    rebase / amend 後に元画像を復元
  post-checkout   ブランチ切替時に元画像を復元
  sync            元画像を手動で復元`);
    process.exitCode = command ? 1 : 0;
}
