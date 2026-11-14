import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Markdown negotiation。
 *
 * `Accept: text/markdown`（`text/html` より優先）で HTML ページに来た
 * AI エージェントを `/api/markdown` に内部リライトし、Markdown を返す。
 * ブラウザは `text/html` を優先するため通常の HTML が返る。
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isHtmlRoute(pathname)) {
    return NextResponse.next();
  }

  const accept = request.headers.get("accept") ?? "";
  const markdownQuality = getQuality(accept, "text/markdown");
  const htmlQuality = getQuality(accept, "text/html");
  const wantsMarkdown = markdownQuality > 0 && markdownQuality >= htmlQuality;

  if (wantsMarkdown) {
    const url = new URL("/api/markdown", request.url);
    // キャッシュキーをページごとに分けるため、クエリにもパスを入れる。
    url.searchParams.set("path", pathname);

    // Proxy のリライトでは route handler 側でクエリが失われることがあるため、
    // 対象パスはヘッダーでも渡す（/api/markdown はクエリも受け付ける）。
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-markdown-path", pathname);

    return NextResponse.rewrite(url, {
      request: { headers: requestHeaders },
    });
  }

  const response = NextResponse.next();

  // HTML ページから Markdown 版とサイト要約を発見できるようにする
  const alternate = new URL("/api/markdown", request.url);
  alternate.searchParams.set("path", pathname);
  response.headers.set(
    "Link",
    [
      `<${request.nextUrl.origin}${alternate.pathname}${alternate.search}>; rel="alternate"; type="text/markdown"`,
      `<${request.nextUrl.origin}/llms.txt>; rel="describedby"; type="text/plain"`,
    ].join(", "),
  );

  return response;
}

function isHtmlRoute(pathname: string): boolean {
  if (pathname === "/" || pathname === "/blog" || pathname === "/photography") {
    return true;
  }

  return /^\/blog\/[a-zA-Z0-9_-]+$/.test(pathname);
}

/** Accept ヘッダーから media type の q 値を取得する（未指定は 1、無ければ 0）。 */
function getQuality(accept: string, type: string): number {
  for (const part of accept.split(",")) {
    const [mediaType, ...params] = part.trim().split(";");
    if (mediaType.trim().toLowerCase() !== type) {
      continue;
    }

    const q = params
      .map((param) => param.trim())
      .find((param) => param.toLowerCase().startsWith("q="));

    if (!q) {
      return 1;
    }

    const value = Number.parseFloat(q.slice(2));
    return Number.isNaN(value) ? 1 : value;
  }

  return 0;
}

export const config = {
  matcher: [
    /*
     * HTML ページだけを対象にする。
     * - api / _next / 画像などのアセット
     * - robots.txt, sitemap.xml, llms.txt などのファイル
     * - /.well-known/**
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*/|.*\\.[^/]+$|\\.well-known).*)",
  ],
};
