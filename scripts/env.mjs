import fs from "fs";

/**
 * .env.local を読み込む。Next.js 以外（Node スクリプト）では自動で
 * 読み込まれないため、ここで補う。
 */
export function loadEnvLocal(envPath = ".env.local") {
  if (!fs.existsSync(envPath)) return;

  if (typeof process.loadEnvFile === "function") {
    try {
      process.loadEnvFile(envPath);
      return;
    } catch {
      // 古い Node などで失敗した場合は簡易パーサーにフォールバック
    }
  }

  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

export function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `環境変数 ${name} が未設定です。.env.local を確認してください（.env.example 参照）。`
    );
  }
  return value;
}
