import * as cheerio from "cheerio";
import { db } from "@/lib/db";

const AASPI_INDEX = "https://www.aaspi.com.au/membergalleries";
const SPLENDID_INDEX = "https://splendid.nz/blogs/news/tagged/photographer-of-the-month";

type Candidate = {
  name: string;
  city: string | null;
  country: string;
  description: string;
  instagramHandle: string;
  instagramUrl: string;
  websiteUrl: string | null;
  sourceUrl: string;
  sourceName: string;
  tags: string[];
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function inferCity(text: string, country: "New Zealand" | "Australia") {
  const cities =
    country === "New Zealand"
      ? ["Auckland", "Wellington", "Christchurch", "Dunedin", "Tauranga", "Queenstown", "Hamilton", "Napier", "Nelson", "Blenheim"]
      : ["Melbourne", "Sydney", "Brisbane", "Adelaide", "Perth", "Hobart", "Canberra", "Gold Coast"];

  return cities.find((city) => new RegExp(`\\b${city}\\b`, "i").test(text)) || null;
}

function styleTags(text: string, base: string[]) {
  const lower = text.toLowerCase();
  const tags = new Set(base);

  const checks: Array<[string, string]> = [
    ["street", "street"],
    ["documentary", "documentary"],
    ["portrait", "portrait"],
    ["fashion", "fashion"],
    ["film", "film"],
    ["analogue", "analogue"],
    ["analog", "analogue"],
    ["music", "music"],
    ["night", "nightlife"],
    ["candid", "candid"],
    ["skate", "skate"],
    ["car", "cars"],
  ];

  for (const [needle, tag] of checks) {
    if (lower.includes(needle)) tags.add(tag);
  }

  return Array.from(tags).slice(0, 7);
}

async function fetchHtml(url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "LOWKEYVANDALS/0.3 (+public photographer discovery index)",
      Accept: "text/html,application/xhtml+xml",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(12000),
  });

  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  return response.text();
}

async function addCandidate(candidate: Candidate) {
  const slug = slugify(candidate.name);

  const exists = await db.query(
    `SELECT id FROM photographers
     WHERE slug = $1 OR LOWER(instagram_handle) = LOWER($2)
     LIMIT 1`,
    [slug, candidate.instagramHandle]
  );

  if (exists.rowCount) return false;

  await db.query(
    `INSERT INTO photographers
      (slug, name, city, country, location, description, instagram_handle,
       instagram_url, website_url, source_url, source_name, tags)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    [
      slug,
      candidate.name,
      candidate.city,
      candidate.country,
      candidate.city ? `${candidate.city}, ${candidate.country}` : candidate.country,
      candidate.description,
      candidate.instagramHandle,
      candidate.instagramUrl,
      candidate.websiteUrl,
      candidate.sourceUrl,
      candidate.sourceName,
      candidate.tags,
    ]
  );

  return true;
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
      if (!["www.aaspi.com.au", "aaspi.com.au"].includes(url.hostname)) return;

      const parts = url.pathname.split("/").filter(Boolean);
      if (parts.length !== 1) return;

      const excluded = new Set([
        "about",
        "contact",
        "membergalleries",
        "membership",
        "events",
        "links",
        "home",
      ]);

      if (excluded.has(parts[0].toLowerCase())) return;
      links.add(url.toString());
    } catch {}
  });

  let checked = 0;
  let added = 0;

  for (const url of Array.from(links).slice(0, 50)) {
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
      const city = inferCity(text, "Australia");

      const wasAdded = await addCandidate({
        name,
        city,
        country: "Australia",
        description:
          "Street photographer discovered through the Australian Association of Street Photographers.",
        instagramHandle: handle,
        instagramUrl: `https://www.instagram.com/${instagramMatch[1]}/`,
        websiteUrl: url,
        sourceUrl: url,
        sourceName: "Australian Association of Street Photographers",
        tags: styleTags(text, ["street", "urban", "candid"]),
      });

      if (wasAdded) added += 1;
    } catch {}
  }

  return { source: "AASPI", checked, added };
}

function nameFromSplendid(page: cheerio.CheerioAPI, text: string) {
  const explicit = text.match(
    /Name\s*:\s*([A-Za-zÀ-ž0-9'’ .-]{2,80}?)(?=\s+Instagram|\s+Website|\s+How\s|\s+Image)/i
  );

  if (explicit?.[1]) return explicit[1].trim();

  let title = page("h1").first().text().replace(/\s+/g, " ").trim();
  title = title.replace(/^\(analogue\)\s*/i, "");
  title = title.replace(/^Photog(?:rapher)? of the Month\s*(?:\([^)]*\))?\s*[-–—]?\s*/i, "");
  title = title.replace(/\s*\((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[^)]*\)\s*$/i, "");
  return title.trim();
}

export async function discoverFromSplendid() {
  const indexHtml = await fetchHtml(SPLENDID_INDEX);
  const $ = cheerio.load(indexHtml);
  const links = new Set<string>();

  $("a[href]").each((_, element) => {
    const href = $(element).attr("href");
    if (!href) return;

    try {
      const url = new URL(href, SPLENDID_INDEX);
      if (url.hostname !== "splendid.nz") return;
      if (!url.pathname.startsWith("/blogs/news/")) return;
      if (url.pathname.includes("/tagged/")) return;
      links.add(url.toString());
    } catch {}
  });

  let checked = 0;
  let added = 0;

  for (const url of Array.from(links).slice(0, 45)) {
    try {
      const html = await fetchHtml(url);
      const page = cheerio.load(html);
      const text = page("body").text().replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
      const instagramMatch = text.match(/Instagram\s*(?:handle)?\s*:\s*@([A-Za-z0-9._]+)/i);
      if (!instagramMatch) continue;

      const name = nameFromSplendid(page, text);
      if (!name || name.length > 120) continue;

      checked += 1;
      const city = inferCity(text, "New Zealand");
      const handle = `@${instagramMatch[1]}`;

      const wasAdded = await addCandidate({
        name,
        city,
        country: "New Zealand",
        description:
          "Analogue photographer discovered through Splendid Photo's New Zealand photographer archive.",
        instagramHandle: handle,
        instagramUrl: `https://www.instagram.com/${instagramMatch[1]}/`,
        websiteUrl: null,
        sourceUrl: url,
        sourceName: "Splendid Photo",
        tags: styleTags(text, ["film", "analogue"]),
      });

      if (wasAdded) added += 1;
    } catch {}
  }

  return { source: "Splendid Photo", checked, added };
}

export async function runDiscovery() {
  const results = [];

  try {
    results.push(await discoverFromSplendid());
  } catch (error) {
    results.push({
      source: "Splendid Photo",
      checked: 0,
      added: 0,
      error: error instanceof Error ? error.message : "Source failed",
    });
  }

  try {
    results.push(await discoverFromAASPI());
  } catch (error) {
    results.push({
      source: "AASPI",
      checked: 0,
      added: 0,
      error: error instanceof Error ? error.message : "Source failed",
    });
  }

  return {
    sources: results,
    checked: results.reduce((sum, result) => sum + result.checked, 0),
    added: results.reduce((sum, result) => sum + result.added, 0),
  };
}
