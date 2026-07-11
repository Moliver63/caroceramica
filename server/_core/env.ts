export const ENV = {
  databaseUrl: process.env.DATABASE_URL ?? "",
  asaasEnv: process.env.ASAAS_ENV ?? "sandbox",
  asaasApiKey: process.env.ASAAS_API_KEY ?? "",
  isProduction: process.env.NODE_ENV === "production",
  port: parseInt(process.env.PORT || "4000", 10),

  adminPassword: process.env.ADMIN_PASSWORD ?? "",
  // Segredo usado pra assinar o cookie de sessão do admin — não é a senha.
  adminSessionSecret: process.env.ADMIN_SESSION_SECRET ?? "",

  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME ?? "",
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY ?? "",
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET ?? "",
};
