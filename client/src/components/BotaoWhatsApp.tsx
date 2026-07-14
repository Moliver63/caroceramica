const NUMERO_WHATSAPP = "5551982110006"; // 55 (Brasil) + 51 (RS) + 982110006
const MENSAGEM_PADRAO = "Olá! Gostaria de saber mais sobre as peças da Caro Vargas Cerâmica.";

export default function BotaoWhatsApp() {
  const link = `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(MENSAGEM_PADRAO)}`;

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
      className="group fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center"
    >
      {/* Anel pulsante atrás do botão — chama atenção de forma contínua e suave */}
      <span className="absolute inset-0 animate-ping rounded-full bg-[#25D366] opacity-40" />

      {/* Botão em si — vibra periodicamente (a cada poucos segundos) */}
      <span className="animate-vibrar-whatsapp relative flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] shadow-lg transition-transform group-hover:scale-105">
        <svg viewBox="0 0 32 32" className="h-7 w-7 fill-white">
          <path d="M16.001 3C9.373 3 4 8.373 4 15c0 2.386.697 4.61 1.898 6.48L4 29l7.72-1.867A11.93 11.93 0 0 0 16.001 27C22.63 27 28 21.627 28 15S22.63 3 16.001 3Zm6.994 16.876c-.297.836-1.47 1.53-2.404 1.727-.638.133-1.472.24-4.28-.918-3.593-1.486-5.907-5.13-6.088-5.365-.174-.235-1.472-1.962-1.472-3.744 0-1.783.925-2.656 1.253-3.02.328-.364.717-.455.956-.455.238 0 .478.003.687.013.22.01.516-.084.807.616.297.717 1.01 2.474 1.098 2.655.089.18.148.392.03.63-.12.238-.18.386-.358.596-.18.209-.377.467-.538.627-.18.18-.367.376-.158.735.208.359.927 1.532 1.99 2.481 1.368 1.222 2.523 1.6 2.882 1.78.359.18.567.15.777-.09.209-.24.895-1.043 1.134-1.401.238-.359.477-.298.805-.18.328.12 2.075.98 2.432 1.158.358.18.596.269.686.418.09.15.09.867-.207 1.702Z" />
        </svg>
      </span>
    </a>
  );
}
