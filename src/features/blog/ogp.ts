import fs from "fs";
import path from "path";

export interface OgpData {
  url: string;
  title: string;
  description: string;
  image?: string;
  domain: string;
  favicon?: string;
}

const CACHE_FILE_PATH = path.join(
  process.cwd(),
  "content",
  ".cache",
  "ogp-cache.json",
);

let memoryCache: Record<string, OgpData> | null = null;

/**
 * キャッシュの取得（インメモリ優先）
 */
function getCache(): Record<string, OgpData> {
  if (memoryCache !== null) {
    return memoryCache;
  }
  try {
    if (fs.existsSync(CACHE_FILE_PATH)) {
      const data = fs.readFileSync(CACHE_FILE_PATH, "utf8");
      memoryCache = JSON.parse(data);
      return memoryCache!;
    }
  } catch (error) {
    console.warn("[OGP] Failed to read OGP cache:", error);
  }
  memoryCache = {};
  return memoryCache;
}

/**
 * キャッシュファイルの保存
 */
function saveCache(): void {
  if (!memoryCache) return;
  try {
    const dir = path.dirname(CACHE_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(
      CACHE_FILE_PATH,
      JSON.stringify(memoryCache, null, 2),
      "utf8",
    );
  } catch (error) {
    console.warn("[OGP] Failed to save OGP cache:", error);
  }
}

/**
 * HTMLエンティティの簡易デコード
 */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

/**
 * HTML文字列からメタタグのcontent属性を抽出
 */
function extractMeta(html: string, property: string): string | null {
  const regex = new RegExp(
    `<meta[^>]+(?:property|name)=["'](?:og:)?${property}["'][^>]+content=["']([^"']*)["']`,
    "i",
  );
  const match = html.match(regex);
  if (match && match[1]) {
    return decodeHtmlEntities(match[1].trim());
  }

  // 属性の順序が逆の場合（content="..." property="..."）
  const reverseRegex = new RegExp(
    `<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["'](?:og:)?${property}["']`,
    "i",
  );
  const revMatch = html.match(reverseRegex);
  if (revMatch && revMatch[1]) {
    return decodeHtmlEntities(revMatch[1].trim());
  }

  return null;
}

/**
 * HTML文字列から<title>タグを抽出
 */
function extractTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return match && match[1] ? decodeHtmlEntities(match[1].trim()) : null;
}

/**
 * 相対URLを絶対URLに解決
 */
function resolveUrl(relativeUrl: string, baseUrl: string): string {
  try {
    return new URL(relativeUrl, baseUrl).href;
  } catch {
    return relativeUrl;
  }
}

/**
 * URLからOGP情報を取得（キャッシュ優先）
 */
export async function getOgpData(targetUrl: string): Promise<OgpData> {
  const cache = getCache();

  if (cache[targetUrl]) {
    return cache[targetUrl];
  }

  let domain = "";
  try {
    domain = new URL(targetUrl).hostname;
  } catch {
    domain = targetUrl;
  }

  // デフォルト（フォールバック）データ
  const fallbackData: OgpData = {
    url: targetUrl,
    title: domain || targetUrl,
    description: "",
    domain,
    favicon: domain
      ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
      : undefined,
  };

  // http / https 以外のスキームはフェッチせずフォールバックを返す
  if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
    cache[targetUrl] = fallbackData;
    saveCache();
    return fallbackData;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4秒タイムアウト

    const response = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; PortfolioBot/1.0; +https://github.com)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(
        `[OGP] Fetch failed for ${targetUrl}: HTTP ${response.status}`,
      );
      cache[targetUrl] = fallbackData;
      saveCache();
      return fallbackData;
    }

    const html = await response.text();

    const title =
      extractMeta(html, "title") || extractTitle(html) || fallbackData.title;

    const description = extractMeta(html, "description") || "";

    let image = extractMeta(html, "image") || undefined;
    if (image) {
      image = resolveUrl(image, targetUrl);
    }

    const favicon = domain
      ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
      : undefined;

    const ogpData: OgpData = {
      url: targetUrl,
      title,
      description,
      image,
      domain,
      favicon,
    };

    cache[targetUrl] = ogpData;
    saveCache();
    return ogpData;
  } catch (error) {
    console.warn(`[OGP] Error fetching ${targetUrl}:`, error);
    cache[targetUrl] = fallbackData;
    saveCache();
    return fallbackData;
  }
}
