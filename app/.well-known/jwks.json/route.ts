export const dynamic = "force-static";

/**
 * /.well-known/jwks.json — JSON Web Key Set endpoint.
 */
export async function GET() {
  return Response.json(
    {
      keys: [],
    },
    {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=86400",
        "Access-Control-Allow-Origin": "*",
      },
    },
  );
}
