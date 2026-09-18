import { runDiscovery } from "@/lib/discovery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;

  if (secret && request.headers.get("x-cron-secret") !== secret) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runDiscovery();
    return Response.json({ ok: true, ...result, ranAt: new Date().toISOString() });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "Discovery failed" },
      { status: 500 }
    );
  }
}
