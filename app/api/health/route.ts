export const dynamic = "force-static";

/**
 * /api/health — API health status endpoint for API Catalog (RFC 9727).
 */
export async function GET() {
  return Response.json(
    {
      status: "pass",
      timestamp: new Date().toISOString(),
      service: "canooopus-api",
      version: "1.0.0",
    },
    {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=60",
        "Access-Control-Allow-Origin": "*",
      },
    },
  );
}
