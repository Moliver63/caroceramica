import type { Config } from "drizzle-kit";
import "dotenv/config";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL não encontrada. Verifique se .env existe na raiz e contém a linha DATABASE_URL=..."
  );
}

// Mesmo ajuste de server/db.ts: remove sslmode da URL pra evitar que o
// driver trate require/prefer/verify-ca como verify-full e rejeite o
// certificado autoassinado do Postgres gerenciado.
function urlSemSslMode(url: string): string {
  try {
    const u = new URL(url);
    u.searchParams.delete("sslmode");
    return u.toString();
  } catch {
    return url;
  }
}

export default {
  schema: "./shared/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: urlSemSslMode(process.env.DATABASE_URL),
    ssl: process.env.DATABASE_URL.includes("localhost")
      ? false
      : { rejectUnauthorized: false },
  },
} satisfies Config;
