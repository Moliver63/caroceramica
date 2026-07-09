import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Extraído da identidade visual Caro Vargas (PDF)
        creme: "#FBF4EE", // fundo claro
        carvao: "#333333", // fundo escuro / contraste
        terracota: "#B08D6E", // cor de destaque / CTA
        marrom: "#8C7A6B", // texto secundário
        "marrom-escuro": "#4A3B31", // texto principal / títulos
        borda: "#E4D9CC",
      },
      fontFamily: {
        serif: ["'Playfair Display'", "serif"], // títulos (estilo do logo)
        sans: ["'Inter'", "sans-serif"], // corpo de texto
      },
    },
  },
  plugins: [],
} satisfies Config;
