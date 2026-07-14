import { useState } from "react";
import { trpc } from "../../lib/trpc";
import type { VarianteArgila, VarianteCor } from "../../lib/types";
import { Card, campoBase } from "./AdminUI";

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
        className="h-9 w-9 cursor-pointer rounded-lg border border-black/10"
      />
      <input
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        placeholder="Nome da cor (ex: Terracota)"
        className={`${campoBase} mt-0 flex-1`}
      />
      <button
        type="button"
        disabled={!nome.trim() || enviando}
        onClick={() => {
          onAdicionar(nome.trim(), hex);
          setNome("");
        }}
        className="rounded-lg border border-black/10 px-3.5 py-2.5 text-sm font-medium text-[#2B2420] disabled:opacity-40"
      >
        + Adicionar
      </button>
    </div>
  );
}

function Grupo({
  titulo,
  variantes,
  onRemover,
}: {
  titulo: string;
  variantes: (VarianteArgila | VarianteCor)[];
  onRemover: (id: number) => void;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-[#2B2420]">{titulo}</p>
      {variantes.length === 0 && (
        <p className="mt-2 text-xs text-[#8C7A6B]">Nenhuma cor cadastrada ainda.</p>
      )}
      <div className="mt-2 space-y-1.5">
        {variantes.map((v) => (
          <div key={v.id} className="flex items-center gap-2.5 rounded-lg px-1 py-1">
            <span
              className="h-5 w-5 flex-shrink-0 rounded-full border border-black/10"
              style={{ backgroundColor: v.codigoHex ?? "#ccc" }}
            />
            <span className="flex-1 text-sm text-[#2B2420]">{v.nome}</span>
            <button
              type="button"
              onClick={() => onRemover(v.id)}
              className="text-xs text-[#8C7A6B] hover:text-red-600"
            >
              Remover
            </button>
          </div>
        ))}
      </div>
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
    <Card className="p-6">
      <p className="text-sm font-semibold text-[#2B2420]">Variantes de cor</p>
      <p className="mt-0.5 text-xs text-[#8C7A6B]">
        Argila é a cor do barro, esmalte é o vidrado por cima.
      </p>

      <div className="mt-5 space-y-6">
        <div className="space-y-3">
          <Grupo titulo="Cores de argila" variantes={variantesArgila} onRemover={(id) => removerArgila.mutate({ id })} />
          <LinhaNovaVariante
            enviando={criarArgila.isPending}
            onAdicionar={(nome, hex) => criarArgila.mutate({ produtoId, nome, codigoHex: hex })}
          />
        </div>

        <div className="space-y-3 border-t border-black/5 pt-6">
          <Grupo titulo="Cores de esmalte" variantes={variantesCor} onRemover={(id) => removerCor.mutate({ id })} />
          <LinhaNovaVariante
            enviando={criarCor.isPending}
            onAdicionar={(nome, hex) => criarCor.mutate({ produtoId, nome, codigoHex: hex })}
          />
        </div>
      </div>

      <p className="mt-5 border-t border-black/5 pt-4 text-xs text-[#8C7A6B]">
        Pra trocar a foto automaticamente quando o cliente escolher uma cor, associe
        uma imagem específica à variante — por enquanto isso ainda depende de acesso
        direto ao banco.
      </p>
    </Card>
  );
}
