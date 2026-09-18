import fs from "node:fs/promises";
import pg from "pg";

const { Client } = pg;
const client = new Client({ connectionString: process.env.DATABASE_URL });
const data = JSON.parse(
  await fs.readFile(new URL("../data/photographers.json", import.meta.url), "utf8")
);

await client.connect();

for (const p of data) {
  await client.query(
    `INSERT INTO photographers
      (slug, name, city, country, location, description, instagram_handle, instagram_url,
       website_url, source_url, source_name, tags)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     ON CONFLICT (slug) DO UPDATE SET
       name = EXCLUDED.name,
       city = EXCLUDED.city,
       country = EXCLUDED.country,
       location = EXCLUDED.location,
       description = EXCLUDED.description,
       instagram_handle = EXCLUDED.instagram_handle,
       instagram_url = EXCLUDED.instagram_url,
       website_url = EXCLUDED.website_url,
       source_url = EXCLUDED.source_url,
       source_name = EXCLUDED.source_name,
       tags = EXCLUDED.tags,
       updated_at = NOW()`,
    [
      p.slug, p.name, p.city, p.country, p.location, p.description,
      p.instagramHandle, p.instagramUrl, p.websiteUrl, p.sourceUrl,
      p.sourceName, p.tags
    ]
  );
}

await client.end();
console.log(`Seeded ${data.length} verified photographer profiles`);
