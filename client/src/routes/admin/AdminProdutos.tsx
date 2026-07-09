import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import type { Produto } from "../../lib/types";

export default function AdminProdutos() {
  const [produtos, setProdutos] = useState<Produto[]>([]);

  useEffect(() => {
    api.listarProdutos().then(setProdutos);
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="font-serif text-2xl text-marrom-escuro">Admin — Produtos</h1>

      <table className="mt-6 w-full text-sm">
        <thead>
          <tr className="border-b border-borda text-left text-marrom">
            <th className="py-2">Nome</th>
            <th>Categoria</th>
            <th>Preço</th>
            <th>Personalizável</th>
            <th>Kit</th>
            <th>Ativo</th>
          </tr>
        </thead>
        <tbody>
          {produtos.map((p) => (
            <tr key={p.id} className="border-b border-borda/50">
              <td className="py-2">{p.nome}</td>
              <td>{p.categoria}</td>
              <td>R$ {Number(p.precoBase).toFixed(2).replace(".", ",")}</td>
              <td>{p.personalizavel ? "Sim" : "Não"}</td>
              <td>{p.ehKit ? "Sim" : "Não"}</td>
              <td>{p.ativo ? "Ativo" : "Inativo"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="mt-6 text-xs text-marrom">
        Edição inline, upload de imagens e aprovação de arte de carimbo ainda
        não implementados nesta versão.
      </p>
    </div>
  );
}
