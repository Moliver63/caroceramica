import { useState } from "react";
import { trpc } from "../../lib/trpc";
import type { VarianteArgila, VarianteCor } from "../../lib/types";

function LinhaNovaVariante({
  onAdicionar,
  enviando,
}: {
  onAdicionar: (nome: string, hex: string) => void;
  enviando: boolean;
}) {
  const [nome, setNome] = useState("");
  const [hex, setHex] = useState("#B08D6E");

  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={hex}
        onChange={(e) => setHex(e.target.value)}
        className="h-9 w-9 cursor-pointer rounded border border-borda"
      />
      <input
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        placeholder="Nome da cor (ex: Terracota)"
        className="flex-1 rounded-lg border border-borda bg-creme px-3 py-2 text-sm text-marrom-escuro"
      />
      <button
        type="button"
        disabled={!nome.trim() || enviando}
        onClick={() => {
          onAdicionar(nome.trim(), hex);
          setNome("");
        }}
        className="rounded-lg border border-borda px-3 py-2 text-sm text-marrom-escuro disabled:opacity-40"
      >
        + Add
      </button>
    </div>
  );
}

export default function GerenciarVariantes({
  produtoId,
  variantesArgila,
  variantesCor,
}: {
  produtoId: number;
  variantesArgila: VarianteArgila[];
  variantesCor: VarianteCor[];
}) {
  const utils = trpc.useUtils();

  const criarArgila = trpc.produtos.criarVarianteArgila.useMutation({
    onSuccess: () => utils.produtos.buscarPorSlug.invalidate(),
  });
  const removerArgila = trpc.produtos.removerVarianteArgila.useMutation({
    onSuccess: () => utils.produtos.buscarPorSlug.invalidate(),
  });
  const criarCor = trpc.produtos.criarVarianteCor.useMutation({
    onSuccess: () => utils.produtos.buscarPorSlug.invalidate(),
  });
  const removerCor = trpc.produtos.removerVarianteCor.useMutation({
    onSuccess: () => utils.produtos.buscarPorSlug.invalidate(),
  });

  return (
    <div className="space-y-6 rounded-lg border border-borda p-4">
      <div>
        <p className="text-sm font-medium text-marrom-escuro">Cores de argila</p>
        <div className="mt-2 space-y-2">
          {variantesArgila.map((v) => (
            <div key={v.id} className="flex items-center gap-2">
              <span
                className="h-6 w-6 rounded-full border border-borda"
                style={{ backgroundColor: v.codigoHex ?? "#ccc" }}
              />
              <span className="flex-1 text-sm text-marrom-escuro">{v.nome}</span>
              <button
                type="button"
                onClick={() => removerArgila.mutate({ id: v.id })}
                className="text-xs text-marrom/60 hover:text-red-600"
              >
                Remover
              </button>
            </div>
          ))}
        </div>
        <div className="mt-3">
          <LinhaNovaVariante
            enviando={criarArgila.isPending}
            onAdicionar={(nome, hex) =>
              criarArgila.mutate({ produtoId, nome, codigoHex: hex })
            }
          />
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-marrom-escuro">Cores de esmalte</p>
        <div className="mt-2 space-y-2">
          {variantesCor.map((v) => (
            <div key={v.id} className="flex items-center gap-2">
              <span
                className="h-6 w-6 rounded-full border border-borda"
                style={{ backgroundColor: v.codigoHex ?? "#ccc" }}
              />
              <span className="flex-1 text-sm text-marrom-escuro">{v.nome}</span>
              <button
                type="button"
                onClick={() => removerCor.mutate({ id: v.id })}
                className="text-xs text-marrom/60 hover:text-red-600"
              >
                Remover
              </button>
            </div>
          ))}
        </div>
        <div className="mt-3">
          <LinhaNovaVariante
            enviando={criarCor.isPending}
            onAdicionar={(nome, hex) => criarCor.mutate({ produtoId, nome, codigoHex: hex })}
          />
        </div>
      </div>

      <p className="text-xs text-marrom">
        Pra trocar a foto automaticamente quando o cliente escolher uma cor, edite
        a peça depois de criar a variante e associe uma imagem específica a ela
        (em breve direto aqui — por ora, isso pode ser feito por acesso direto ao banco).
      </p>
    </div>
  );
}
