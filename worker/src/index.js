/**
 * R2 バケット内の最適化済み画像だけを配信する Worker。
 *
 * キーは `images/optimized/...` に固定しているため、`originals/...` に
 * バックアップした元画像が外部から取得されることはない。
 */
const ALLOWED_PREFIX = "images/optimized/";

function notFound() {
  return new Response("Not found", {
    status: 404,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

const handler = {
  async fetch(request, env) {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method not allowed", {
        status: 405,
        headers: { Allow: "GET, HEAD" },
      });
    }

    const url = new URL(request.url);

    let key;
    try {
      key = decodeURIComponent(url.pathname.replace(/^\/+/, ""));
    } catch {
      return notFound();
    }

    if (!key.startsWith(ALLOWED_PREFIX)) {
      return notFound();
    }

    const object = await env.BUCKET.get(key, { onlyIf: request.headers });
    if (!object) {
      return notFound();
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    headers.set(
      "Cache-Control",
      "public, max-age=604800, stale-while-revalidate=86400",
    );
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("Access-Control-Allow-Origin", "*");

    // onlyIf の条件（If-None-Match など）が一致した場合は body が無い
    if (!object.body) {
      return new Response(null, { status: 304, headers });
    }

    if (request.method === "HEAD") {
      headers.set("Content-Length", String(object.size));
      return new Response(null, { status: 200, headers });
    }

    return new Response(object.body, { status: 200, headers });
  },
};

export default handler;
