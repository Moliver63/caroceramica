import type { Config } from "tailwindcss";

export default {
  content: ["./client/index.html", "./client/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Extraído da identidade visual Caro Vargas (PDF)
        creme: "#FBF4EE", // fundo claro
        carvao: "#2B2420", // fundo escuro / contraste — tom de queima, não preto puro
        terracota: "#B08D6E", // cor de destaque / CTA
        marrom: "#8C7A6B", // texto secundário
        "marrom-escuro": "#4A3B31", // texto principal / títulos
        borda: "#E4D9CC",
        // Segundo acento — referência ao vidrado cerâmico, usado com moderação
        // em badges e detalhes (evita que tudo dependa só do terracota)
        esmalte: "#6B7B67",
        "esmalte-claro": "#E7EBE3",
      },
      fontFamily: {
        serif: ["'Playfair Display'", "serif"], // títulos (estilo do logo)
        sans: ["'Inter'", "sans-serif"], // corpo de texto
      },
    },
  },
  plugins: [],
} satisfies Config;
