import { useState } from "react";
import { trpc } from "../../lib/trpc";
import { CATEGORIAS, type Categoria } from "@shared/const";
import AdminGuard from "./AdminGuard";
import AdminLayout from "./AdminLayout";
import { Card, Botao } from "./AdminUI";

function CartaoCategoria({
  valor,
  label,
  descricao,
}: {
  valor: Categoria;
  label: string;
  descricao: string;
}) {
  const utils = trpc.useUtils();
  const { data: banners } = trpc.categorias.listarBanners.useQuery();
  const bannerAtual = banners?.[valor];

  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const gerarUpload = trpc.admin.gerarUploadCloudflare.useMutation();
  const definirBanner = trpc.categorias.definirBanner.useMutation({
    onSuccess: () => utils.categorias.listarBanners.invalidate(),
  });
  const removerBanner = trpc.categorias.removerBanner.useMutation({
    onSuccess: () => utils.categorias.listarBanners.invalidate(),
  });

  async function handleUpload(arquivo: File) {
    setErro(null);
    setEnviando(true);
    try {
      const { uploadURL } = await gerarUpload.mutateAsync();
      const formData = new FormData();
      formData.append("file", arquivo);

      const resposta = await fetch(uploadURL, { method: "POST", body: formData });
      const dados = await resposta.json();

      if (!resposta.ok || !dados.success) {
        throw new Error(dados?.errors?.[0]?.message ?? "Falha no upload da imagem.");
      }

      const urlImagem = dados.result.variants[0] as string;
      await definirBanner.mutateAsync({ categoria: valor, imagemUrl: urlImagem });
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha no upload da imagem.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Card className="overflow-hidden">
      <div
        className="flex h-40 items-end bg-carvao bg-cover bg-center p-4"
        style={bannerAtual ? { backgroundImage: `url(${bannerAtual})` } : undefined}
      >
        <div className="rounded-lg bg-black/40 px-3 py-1.5">
          <p className="font-serif text-lg text-creme">{label}</p>
        </div>
      </div>
      <div className="p-4">
        <p className="text-xs text-[#8C7A6B]">{descricao}</p>
        <div className="mt-3 flex items-center gap-2">
          <label className="cursor-pointer">
            <span className="inline-flex items-center justify-center rounded-lg border border-black/10 bg-white px-4 py-2 text-sm font-medium text-[#2B2420] hover:bg-black/[0.03]">
              {enviando ? "Enviando…" : bannerAtual ? "Trocar imagem" : "Enviar imagem"}
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={enviando}
              onChange={(e) => {
                const arquivo = e.target.files?.[0];
                if (arquivo) handleUpload(arquivo);
                e.target.value = "";
              }}
            />
          </label>
          {bannerAtual && (
            <Botao
              variante="fantasma"
              onClick={() => removerBanner.mutate({ categoria: valor })}
              disabled={removerBanner.isPending}
            >
              Remover
            </Botao>
          )}
        </div>
        {erro && <p className="mt-2 text-xs text-red-600">{erro}</p>}
      </div>
    </Card>
  );
}

function GerenciarBanners() {
  return (
    <AdminLayout titulo="Banners das categorias">
      <p className="-mt-3 mb-6 text-sm text-[#8C7A6B]">
        Foto de fundo de cada categoria na Home. Sem imagem, fica só a cor sólida
        de sempre.
      </p>

      <div className="grid gap-6 md:grid-cols-3">
        {CATEGORIAS.map((c) => (
          <CartaoCategoria key={c.valor} valor={c.valor} label={c.label} descricao={c.descricao} />
        ))}
      </div>
    </AdminLayout>
  );
}

export default function AdminCategorias() {
  return (
    <AdminGuard>
      <GerenciarBanners />
    </AdminGuard>
  );
}
