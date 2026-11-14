import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const accept = request.headers.get("accept") || "";

  // Accept ヘッダーに text/markdown が要求されている場合、Markdown レスポンスへ内部リライト
  if (accept.includes("text/markdown") || accept.includes("text/x-markdown")) {
    const { pathname } = request.nextUrl;

    // API ルート、Next.js 内部アセット、静的ファイル（拡張子あり）は除外
    if (
      pathname.startsWith("/api/") ||
      pathname.startsWith("/_next/") ||
      pathname.startsWith("/images/") ||
      pathname.includes(".")
    ) {
      return NextResponse.next();
    }

    const rewriteUrl = new URL(`/api/markdown`, request.url);
    rewriteUrl.searchParams.set("path", pathname);
    return NextResponse.rewrite(rewriteUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for static files:
     * - _next/static
     * - _next/image
     * - favicon.ico
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
