export const ENV = {
  databaseUrl: process.env.DATABASE_URL ?? "",
  asaasEnv: process.env.ASAAS_ENV ?? "sandbox",
  asaasApiKey: process.env.ASAAS_API_KEY ?? "",
  isProduction: process.env.NODE_ENV === "production",
  port: parseInt(process.env.PORT || "4000", 10),

  adminPassword: process.env.ADMIN_PASSWORD ?? "",
  // Segredo usado pra assinar o cookie de sessão do admin — não é a senha.
  adminSessionSecret: process.env.ADMIN_SESSION_SECRET ?? "",

  cloudflareAccountId: process.env.CLOUDFLARE_ACCOUNT_ID ?? "",
  cloudflareApiToken: process.env.CLOUDFLARE_API_TOKEN ?? "",

  resendApiKey: process.env.RESEND_API_KEY ?? "",
  emailRemetente: process.env.EMAIL_REMETENTE ?? "Caro Vargas Cerâmica <pedidos@carovargas.com.br>",
};
