import "../env";
import { db } from "./index";
import { produtos, variantesCor, itensKit } from "./schema";

async function seed() {
  console.log("Populando catálogo Caro Cerâmica...");

  // ── Consultório ──
  const [prato] = await db
    .insert(produtos)
    .values({
      nome: "Prato Oval Personalizado",
      slug: "prato-oval-personalizado",
      categoria: "consultorio",
      descricao:
        "Uma composição delicada para acolher ou presentear pacientes, transmitindo cuidado nos detalhes.",
      precoBase: "74.00",
      personalizavel: true,
      custoPersonalizacao: "50.00", // carimbo exclusivo
      ehKit: false,
      prazoProducaoDias: 30,
      imagens: [],
    })
    .returning();

  const [amassadinho] = await db
    .insert(produtos)
    .values({
      nome: "Amassadinho P",
      slug: "amassadinho-p",
      categoria: "consultorio",
      descricao: "Peça pequena e versátil, ideal para compor com o prato oval.",
      precoBase: "38.90",
      personalizavel: true,
      custoPersonalizacao: "50.00",
      ehKit: false,
      prazoProducaoDias: 30,
      imagens: [],
    })
    .returning();

  await db.insert(produtos).values({
    nome: "Kit Consultório (Prato Oval + Amassadinho P)",
    slug: "kit-consultorio",
    categoria: "consultorio",
    descricao: "Composição completa para acolher ou presentear pacientes.",
    precoBase: "112.90",
    personalizavel: true,
    custoPersonalizacao: "50.00",
    ehKit: true,
    prazoProducaoDias: 30,
    imagens: [],
  });

  // Cores sugeridas para linha consultório
  await db.insert(variantesCor).values([
    { produtoId: prato.id, nome: "Azul Caca Bein Blue", codigoFornecedor: "SC076", codigoHex: "#6E8CA0" },
    { produtoId: prato.id, nome: "Verde Sea Breeze", codigoFornecedor: "SC091", codigoHex: "#A9B8A0" },
    { produtoId: prato.id, nome: "Dourado Café Olé", codigoFornecedor: "SC092", codigoHex: "#C9A26A" },
  ]);

  // ── Casa ──
  const [caneca] = await db
    .insert(produtos)
    .values({
      nome: "Caneca",
      slug: "caneca",
      categoria: "casa",
      descricao: "Peça pensada para mesas afetivas e encontros tranquilos.",
      precoBase: "52.00",
      personalizavel: false,
      ehKit: false,
      prazoProducaoDias: 30,
      imagens: [],
    })
    .returning();

  const [pratoOrganico] = await db
    .insert(produtos)
    .values({
      nome: "Prato Orgânico P",
      slug: "prato-organico-p",
      categoria: "casa",
      precoBase: "78.00",
      personalizavel: false,
      ehKit: false,
      prazoProducaoDias: 30,
      imagens: [],
    })
    .returning();

  const [bowl] = await db
    .insert(produtos)
    .values({
      nome: "Bowl",
      slug: "bowl",
      categoria: "casa",
      precoBase: "78.00",
      personalizavel: false,
      ehKit: false,
      prazoProducaoDias: 30,
      imagens: [],
    })
    .returning();

  const [kitCasa] = await db
    .insert(produtos)
    .values({
      nome: "Kit Casa (Caneca + Prato Orgânico P + Bowl)",
      slug: "kit-casa",
      categoria: "casa",
      precoBase: "208.00",
      personalizavel: false,
      ehKit: true,
      prazoProducaoDias: 30,
      imagens: [],
    })
    .returning();

  await db.insert(itensKit).values([
    { kitId: kitCasa.id, produtoId: caneca.id, quantidade: 1 },
    { kitId: kitCasa.id, produtoId: pratoOrganico.id, quantidade: 1 },
    { kitId: kitCasa.id, produtoId: bowl.id, quantidade: 1 },
  ]);

  await db.insert(produtos).values({
    nome: "Porta Guardanapo",
    slug: "porta-guardanapo",
    categoria: "casa",
    precoBase: "96.00",
    personalizavel: false,
    ehKit: false,
    prazoProducaoDias: 30,
    imagens: [],
  });

  // Cores sugeridas para linha casa
  await db.insert(variantesCor).values([
    { produtoId: caneca.id, nome: "Cinza Urbano", codigoHex: "#B8AFA3" },
    { produtoId: caneca.id, nome: "Cáctus", codigoHex: "#8FA69B" },
  ]);

  console.log("Seed concluído.");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
