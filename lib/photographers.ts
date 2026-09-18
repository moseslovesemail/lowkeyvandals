import seed from "@/data/photographers.json";
import { db } from "@/lib/db";

export type PhotographerRecord = {
  id: string;
  slug: string;
  name: string;
  city: string | null;
  country: string | null;
  location: string;
  description: string | null;
  instagramHandle: string | null;
  instagramUrl: string | null;
  websiteUrl: string | null;
  sourceUrl: string;
  sourceName: string | null;
  tags: string[];
  saved: boolean;
  discoveredAt: string;
};

export async function getPhotographers(): Promise<PhotographerRecord[]> {
  try {
    const result = await db.query(`
      SELECT
        id::text,
        slug,
        name,
        city,
        country,
        location,
        description,
        instagram_handle AS "instagramHandle",
        instagram_url AS "instagramUrl",
        website_url AS "websiteUrl",
        source_url AS "sourceUrl",
        source_name AS "sourceName",
        tags,
        saved,
        discovered_at AS "discoveredAt"
      FROM photographers
      WHERE hidden = FALSE
      ORDER BY discovered_at DESC, id DESC
    `);

    return result.rows.map((row) => ({
      ...row,
      discoveredAt: new Date(row.discoveredAt).toISOString(),
    }));
  } catch {
    return seed.map((p, index) => ({
      id: `seed-${index}`,
      ...p,
      saved: false,
      discoveredAt: new Date().toISOString(),
    }));
  }
}
