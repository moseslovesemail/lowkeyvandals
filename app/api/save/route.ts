import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const id = String(body.id || "");
    const saved = Boolean(body.saved);

    if (!/^\d+$/.test(id)) {
      return Response.json({ ok: false, error: "Invalid photographer id" }, { status: 400 });
    }

    await db.query(
      `UPDATE photographers
       SET saved = $1, updated_at = NOW()
       WHERE id = $2`,
      [saved, id]
    );

    return Response.json({ ok: true, id, saved });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}
