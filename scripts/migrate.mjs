import pg from "pg";

const { Client } = pg;
const client = new Client({ connectionString: process.env.DATABASE_URL });

await client.connect();

await client.query(`
  CREATE TABLE IF NOT EXISTS photographers (
    id BIGSERIAL PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    city TEXT,
    country TEXT,
    location TEXT NOT NULL,
    description TEXT,
    instagram_handle TEXT,
    instagram_url TEXT,
    website_url TEXT,
    source_url TEXT NOT NULL,
    source_name TEXT,
    tags TEXT[] NOT NULL DEFAULT '{}',
    saved BOOLEAN NOT NULL DEFAULT FALSE,
    hidden BOOLEAN NOT NULL DEFAULT FALSE,
    discovered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS photographers_discovered_at_idx
    ON photographers (discovered_at DESC);

  CREATE INDEX IF NOT EXISTS photographers_saved_idx
    ON photographers (saved);

  CREATE UNIQUE INDEX IF NOT EXISTS photographers_instagram_handle_key
    ON photographers ((LOWER(instagram_handle)))
    WHERE instagram_handle IS NOT NULL;
`);

await client.end();
console.log("LOWKEYVANDALS database ready");
