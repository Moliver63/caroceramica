export const ENV = {
  databaseUrl: process.env.DATABASE_URL ?? "",
  asaasEnv: process.env.ASAAS_ENV ?? "sandbox",
  asaasApiKey: process.env.ASAAS_API_KEY ?? "",
  isProduction: process.env.NODE_ENV === "production",
  port: parseInt(process.env.PORT || "4000", 10),
};
