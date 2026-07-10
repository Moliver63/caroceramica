// Wrapper mínimo da API Asaas — único gateway ativo na fase 1
// (Stripe fica só com a interface reservada, sem implementação, até
// existir demanda internacional real — decisão do Conselho).

const ASAAS_BASE_URL =
  process.env.ASAAS_ENV === "production"
    ? "https://api.asaas.com/v3"
    : "https://api-sandbox.asaas.com/v3";

const ASAAS_API_KEY = process.env.ASAAS_API_KEY as string;

interface AsaasCliente {
  id: string;
  name: string;
  email: string;
  cpfCnpj: string;
}

interface CriarClienteInput {
  nome: string;
  email: string;
  documento: string; // CPF/CNPJ
  telefone?: string;
}

interface CriarCobrancaInput {
  clienteAsaasId: string;
  valor: number; // em reais, ex: 208.00
  descricao: string;
  metodoPagamento: "PIX" | "BOLETO" | "CREDIT_CARD";
  vencimento: string; // "YYYY-MM-DD"
  referenciaExterna: string; // codigoPedido interno
}

interface AsaasCobrancaResponse {
  id: string;
  status: string;
  invoiceUrl: string;
  bankSlipUrl?: string;
  pixQrCodeId?: string;
}

async function asaasFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${ASAAS_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      access_token: ASAAS_API_KEY,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const erro = await res.text();
    throw new Error(`Asaas API erro (${res.status}): ${erro}`);
  }

  return res.json() as Promise<T>;
}

export async function buscarOuCriarCliente(
  input: CriarClienteInput
): Promise<AsaasCliente> {
  const busca = await asaasFetch<{ data: AsaasCliente[] }>(
    `/customers?cpfCnpj=${input.documento}`
  );

  if (busca.data.length > 0) return busca.data[0];

  return asaasFetch<AsaasCliente>("/customers", {
    method: "POST",
    body: JSON.stringify({
      name: input.nome,
      email: input.email,
      cpfCnpj: input.documento,
      mobilePhone: input.telefone,
    }),
  });
}

export async function criarCobranca(
  input: CriarCobrancaInput
): Promise<AsaasCobrancaResponse> {
  return asaasFetch<AsaasCobrancaResponse>("/payments", {
    method: "POST",
    body: JSON.stringify({
      customer: input.clienteAsaasId,
      billingType: input.metodoPagamento,
      value: input.valor,
      dueDate: input.vencimento,
      description: input.descricao,
      externalReference: input.referenciaExterna,
    }),
  });
}

export async function buscarQrCodePix(cobrancaId: string) {
  return asaasFetch<{ encodedImage: string; payload: string }>(
    `/payments/${cobrancaId}/pixQrCode`
  );
}

// Chamado pelo endpoint de webhook (server/src/routes/checkout.ts)
export function validarWebhookAsaas(payload: unknown): boolean {
  // Asaas não assina webhook por padrão — recomenda-se validar por
  // token de URL secreto (?token=) configurado no painel Asaas.
  return true;
}

// ── Reservado para fase 2 — NÃO implementar agora ──
// export async function criarCobrancaStripe(...) {}
