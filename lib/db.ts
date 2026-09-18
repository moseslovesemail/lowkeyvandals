import { Pool } from "pg";

const globalForDb = globalThis as unknown as { lowkeyPool?: Pool };

export const db =
  globalForDb.lowkeyPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
  });

if (process.env.NODE_ENV !== "production") globalForDb.lowkeyPool = db;
