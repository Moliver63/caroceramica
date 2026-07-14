import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../shared/schema";
import { ENV } from "./_core/env";

// Remove qualquer "sslmode" que já venha na DATABASE_URL. Versões do
// driver `pg` tratam sslmode=require/prefer/verify-ca como equivalentes
// a verify-full (exige validar a cadeia de certificado), o que rejeita
// o certificado autoassinado do Postgres gerenciado (Render/Supabase/
// Neon) mesmo com `ssl: { rejectUnauthorized: false }` abaixo. Tirando
// o sslmode da URL, só o objeto `ssl` explícito controla o
// comportamento — sem ambiguidade entre os dois.
function urlSemSslMode(url: string): string {
  try {
    const u = new URL(url);
    u.searchParams.delete("sslmode");
    return u.toString();
  } catch {
    return url;
  }
}

const pool = new Pool({
  connectionString: urlSemSslMode(ENV.databaseUrl),
  // Bancos gerenciados (Render, Supabase, Neon) exigem SSL em conexão
  // externa. Em desenvolvimento local sem SSL, isso não atrapalha.
  ssl: ENV.databaseUrl.includes("localhost")
    ? false
    : { rejectUnauthorized: false },
});

export const db = drizzle(pool, { schema });
