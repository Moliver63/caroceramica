import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// .env fica na raiz de server/ (mesmo nível de package.json)
config({ path: path.resolve(__dirname, "../.env") });
