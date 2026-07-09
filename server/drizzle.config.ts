import type { Config } from "drizzle-kit";
import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// drizzle-kit é um processo CLI separado do app — precisa carregar o .env aqui também
config({ path: path.resolve(__dirname, ".env") });

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL não encontrada. Verifique se server/.env existe e contém a linha DATABASE_URL=..."
  );
}

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
} satisfies Config;
