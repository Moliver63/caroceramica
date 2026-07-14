import { Resend } from "resend";
import { ENV } from "../_core/env";

let clienteResend: Resend | null = null;
function getResend(): Resend | null {
  if (!ENV.resendApiKey) return null;
  if (!clienteResend) clienteResend = new Resend(ENV.resendApiKey);
  return clienteResend;
}

/**
 * Envia um e-mail via Resend. Se RESEND_API_KEY não estiver configurada,
 * só loga um aviso e segue em frente — nunca derruba o fluxo principal
 * (criar pedido, mudar status) por causa de e-mail.
 */
export async function enviarEmail(params: {
  para: string;
  assunto: string;
  html: string;
}) {
  const resend = getResend();

  if (!resend) {
    console.warn(
      `[email] RESEND_API_KEY não configurada — e-mail para ${params.para} ("${params.assunto}") não foi enviado.`
    );
    return;
  }

  try {
    await resend.emails.send({
      from: ENV.emailRemetente,
      to: params.para,
      subject: params.assunto,
      html: params.html,
    });
  } catch (erro) {
    // E-mail é "melhor esforço" — se falhar, loga e segue. O pedido já
    // foi salvo no banco, não faz sentido quebrar a compra por causa
    // de um e-mail que não saiu.
    console.error(`[email] Falha ao enviar e-mail para ${params.para}:`, erro);
  }
}

function envelopeHtml(conteudo: string) {
  return `
    <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; color: #4A3B31;">
      <p style="font-size: 22px; color: #B08D6E; margin-bottom: 24px;">Caro Vargas Cerâmica</p>
      ${conteudo}
      <p style="margin-top: 32px; font-size: 13px; color: #8C7A6B;">
        Feito à mão, com carinho — Caro Vargas Cerâmica
      </p>
    </div>
  `;
}

export function emailPedidoRecebido(params: {
  nomeCliente: string;
  codigoPedido: string;
  prazoProducaoDias: number;
}) {
  return envelopeHtml(`
    <h1 style="font-size: 20px; color: #4A3B31;">Seu pedido está sendo preparado 🏺</h1>
    <p>Olá, ${params.nomeCliente}!</p>
    <p>
      Recebemos seu pedido <strong>${params.codigoPedido}</strong> e ele já está
      na fila de produção do nosso ateliê. Cada peça é feita à mão, uma de cada
      vez — o prazo estimado de produção é de até <strong>${params.prazoProducaoDias} dias</strong>.
    </p>
    <p>Assim que sua peça for despachada, você recebe um novo e-mail com o código de rastreio.</p>
  `);
}

export function emailPedidoEnviado(params: {
  nomeCliente: string;
  codigoPedido: string;
  transportadora?: string | null;
  codigoRastreio?: string | null;
}) {
  return envelopeHtml(`
    <h1 style="font-size: 20px; color: #4A3B31;">Sua peça está a caminho! 📦</h1>
    <p>Olá, ${params.nomeCliente}!</p>
    <p>Seu pedido <strong>${params.codigoPedido}</strong> acabou de ser despachado.</p>
    ${
      params.codigoRastreio
        ? `<p>Transportadora: <strong>${params.transportadora ?? "—"}</strong><br/>
           Código de rastreio: <strong>${params.codigoRastreio}</strong></p>`
        : ""
    }
    <p>Você pode acompanhar o status do seu pedido a qualquer momento na nossa página de rastreio.</p>
  `);
}
