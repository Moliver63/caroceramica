export default function Footer() {
  return (
    <footer className="mt-20 border-t border-borda bg-creme py-10 text-center text-sm text-marrom">
      <p>Cada peça possui pequenas variações de forma, textura e tonalidade —</p>
      <p>marcas do processo artesanal e da singularidade de cada criação.</p>
      <p className="mt-4">© {new Date().getFullYear()} Caro Cerâmica. Feito à mão, com carinho.</p>
    </footer>
  );
}
