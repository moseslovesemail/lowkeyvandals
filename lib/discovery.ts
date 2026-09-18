import * as cheerio from "cheerio";
import { db } from "@/lib/db";

const AASPI_INDEX = "https://www.aaspi.com.au/membergalleries";

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function inferCity(text: string) {
  const cities = ["Melbourne", "Sydney", "Brisbane", "Adelaide", "Perth", "Hobart", "Canberra"];
  return cities.find((city) => new RegExp(city, "i").test(text)) || null;
}

async function fetchHtml(url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "LOWKEYVANDALS/0.2 (+photographer discovery index)",
      "Accept": "text/html,application/xhtml+xml",
    },
    cache: "no-store",
  });

  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  return response.text();
}

export async function discoverFromAASPI() {
  const indexHtml = await fetchHtml(AASPI_INDEX);
  const $ = cheerio.load(indexHtml);
  const links = new Set<string>();

  $("a[href]").each((_, element) => {
    const href = $(element).attr("href");
    if (!href) return;

    try {
      const url = new URL(href, AASPI_INDEX);
      if (url.hostname !== "www.aaspi.com.au" && url.hostname !== "aaspi.com.au") return;

      const parts = url.pathname.split("/").filter(Boolean);
      if (parts.length !== 1) return;

      const excluded = new Set([
        "about","contact","membergalleries","membership","events","links","home"
      ]);
      if (excluded.has(parts[0].toLowerCase())) return;

      links.add(url.toString());
    } catch {}
  });

  let checked = 0;
  let added = 0;

  for (const url of Array.from(links).slice(0, 40)) {
    try {
      const html = await fetchHtml(url);
      const page = cheerio.load(html);
      const text = page("body").text().replace(/\s+/g, " ").trim();
      const instagramMatch = text.match(/Instagram\s*:\s*@([A-Za-z0-9._]+)/i);
      if (!instagramMatch) continue;

      const name = page("h1").first().text().trim();
      if (!name || name.length > 120) continue;

      checked += 1;

      const handle = `@${instagramMatch[1]}`;
      const instagramUrl = `https://www.instagram.com/${instagramMatch[1]}/`;
      const city = inferCity(text);
      const slug = slugify(name);

      const exists = await db.query(
        `SELECT id FROM photographers
         WHERE slug = $1 OR LOWER(instagram_handle) = LOWER($2)
         LIMIT 1`,
        [slug, handle]
      );

      if (exists.rowCount) continue;

      await db.query(
        `INSERT INTO photographers
          (slug, name, city, country, location, description, instagram_handle,
           instagram_url, website_url, source_url, source_name, tags)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [
          slug,
          name,
          city,
          "Australia",
          city ? `${city}, Australia` : "Australia",
          "Street photographer discovered through the Australian Association of Street Photographers.",
          handle,
          instagramUrl,
          url,
          url,
          "Australian Association of Street Photographers",
          ["street", "urban", "candid"],
        ]
      );

      added += 1;
    } catch {}
  }

  return { source: "AASPI", checked, added };
}
