import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../shared/schema";
import { ENV } from "./_core/env";

const pool = new Pool({
  connectionString: ENV.databaseUrl,
  // Bancos gerenciados (Render, Supabase, Neon) exigem SSL em conexão
  // externa. Em desenvolvimento local sem SSL, isso não atrapalha.
  ssl: ENV.databaseUrl.includes("localhost")
    ? false
    : { rejectUnauthorized: false },
});

export const db = drizzle(pool, { schema });
