import { AwsClient } from "aws4fetch";
import { requireEnv } from "./env.mjs";

/**
 * R2 の S3 互換エンドポイントに接続するクライアントを作る。
 * dryRun のときは認証情報が無くても動くよう null を返す。
 */
export function createR2Client({ dryRun = false } = {}) {
  if (dryRun) return null;

  const accessKeyId = requireEnv("R2_ACCESS_KEY_ID");
  const secretAccessKey = requireEnv("R2_SECRET_ACCESS_KEY");
  const bucket = process.env.R2_BUCKET || "portfolio-assets";

  const client = new AwsClient({
    accessKeyId,
    secretAccessKey,
    service: "s3",
    region: "auto",
  });

  // 通常は R2 の S3 エンドポイント。テストや S3 互換ストレージ向けに上書き可能。
  const endpoint =
    process.env.R2_ENDPOINT?.replace(/\/+$/, "") ||
    `https://${requireEnv("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com/${bucket}`;

  return { client, endpoint, bucket };
}

function decodeXml(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

/** S3 のキーを URL パスとして安全に使える形にエンコードする */
export function encodeKey(key) {
  return key
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

/** 指定プレフィックス配下のキーを全件取得する（ページング対応） */
export async function listRemoteKeys(r2, prefix) {
  const keys = [];
  let continuationToken;

  do {
    const url = new URL(r2.endpoint);
    url.searchParams.set("list-type", "2");
    url.searchParams.set("prefix", prefix);
    if (continuationToken) {
      url.searchParams.set("continuation-token", continuationToken);
    }

    const response = await r2.client.fetch(url.toString());
    if (!response.ok) {
      throw new Error(
        `LIST ${prefix} に失敗しました: ${response.status} ${await response.text()}`
      );
    }

    const xml = await response.text();
    for (const match of xml.matchAll(/<Key>([^<]+)<\/Key>/g)) {
      keys.push(decodeXml(match[1]));
    }

    continuationToken =
      /<NextContinuationToken>([^<]+)<\/NextContinuationToken>/.exec(xml)?.[1];
  } while (continuationToken);

  return keys;
}
