export async function GET() {
  return Response.json({
    ok: true,
    service: "easyinventory-web",
    mode: process.env.NODE_ENV ?? "development",
  });
}
