# Relatório do Projeto — Caro Vargas Cerâmica

> Documento de referência com tudo que foi feito no site, na ordem em que
> aconteceu. Atualizado em 13/07/2026.

## Visão geral

- **Stack:** pacote único na raiz (sem workspaces), React + Vite no client,
  Express + tRPC no server, Drizzle ORM + PostgreSQL, deploy no Render.
- **Repositório:** `github.com/Moliver63/caroceramica`, branch `main`.
- **URL em produção:** `https://caroceramica.onrender.com`

---

## 1. Migração de arquitetura

O projeto começou como dois pacotes npm separados (`client/` e `server/`,
cada um com seu próprio `package.json`), comunicando via REST puro.

Foi migrado para o mesmo padrão usado no projeto Shadia Hasan (já validado
em produção):

- Pacote único na raiz, sem `npm workspaces`
- `server/_core/`: bootstrap, env, context, trpc, vite (dev em middleware
  mode), index (entrypoint único pra dev e produção)
- `server/routers/`: rotas REST viraram **procedures tRPC** tipadas
  ponta-a-ponta (produtos, checkout, admin)
- `shared/schema.ts`: schema do Drizzle como fonte única de verdade — o
  client deriva os tipos direto do `AppRouter` via `inferRouterOutputs`,
  sem risco de dessincronizar do banco real
- Webhook do Asaas continua REST simples (chamada externa, não passa
  pelo tRPC)
- Client: `fetch` manual trocado por hooks `trpc.*.useQuery` /
  `useMutation`

**Build:** `vite build` (client) + `esbuild` (bundle do server em ESM
único). Dev e produção rodam no mesmo processo Express, na mesma porta.

---

## 2. Redesign visual (formato de e-commerce)

O site tinha estrutura básica de loja, mas visual mais "institucional".
Foi refeito mantendo a paleta de marca original (creme/terracota/serif,
extraída do PDF de identidade visual do cliente):

- **Header:** ícone de sacola com contador do carrinho, sticky, menu
  mobile (hambúrguer)
- **Footer:** rodapé escuro (contraponto visual, referência à queima),
  3 colunas (marca, navegação, atendimento)
- **ProdutoCard:** badge "Personalizável", overlay "Ver peça" no hover,
  label de categoria
- **Home:** hero com divisor orgânico (elemento de assinatura,
  referência à borda irregular de uma peça feita no torno), tiles
  grandes de categoria, seção de destaques
- **Catálogo:** ordenação (relevância / menor preço / maior preço /
  nome), skeleton de carregamento
- Segundo acento de cor (**esmalte**, verde — referência ao vidrado
  cerâmico), pra não depender só do terracota em badges e detalhes

---

## 3. Identidade visual (logo e elementos da marca)

A partir dos arquivos de logo enviados (`logo.png`, `elementos.png`),
foram extraídos e aplicados:

- **Favicon** e **apple-touch-icon**, gerados do ícone casa+flor
- **Ícone da marca** (flor + moldura pontilhada) no Header
- Mesmo ícone recolorido pra creme, usado no Footer (fundo escuro)
- **Selo circular "CV"**, usado como fechamento visual na tela de
  confirmação de pedido
- Nome ajustado pra bater com a logo real: **Caro Vargas** como nome
  principal, **Cerâmica** como categoria/subtítulo (antes o site usava
  só "Caro Cerâmica" de forma inconsistente com a marca)

---

## 4. Painel administrativo (`/admin`)

Construído do zero — antes não existia nenhuma forma de cadastrar
produtos fora do banco direto.

- **Login por senha única** (`ADMIN_PASSWORD`), sessão via cookie
  assinado com HMAC-SHA256 (`ADMIN_SESSION_SECRET`), sem tabela de
  usuários
- `/admin/produtos`: lista todos os produtos, com link de editar
- `/admin/produtos/novo` e `/admin/produtos/:slug/editar`: formulário
  completo (nome, slug auto-gerado, categoria, descrição, preço,
  personalização, prazo, observação artesanal, imagens, ativo/inativo)
- **Upload de imagem** direto pro Cloudinary (upload assinado — o
  servidor gera uma assinatura temporária, o navegador sobe a imagem
  direto pro Cloudinary sem passar pelo nosso backend)
- Upload de **múltiplas imagens de uma vez** (até 10 por peça, com
  barra de progresso)
- Acesso pelo site: ícone de cadeado discreto no menu (Header), tanto
  desktop quanto mobile
- **Carrossel de imagens** na página de produto (setas, miniaturas,
  indicadores), aparece automaticamente quando a peça tem mais de 1 foto

### Segurança do admin (auditoria)

Numa auditoria específica, dois problemas reais foram encontrados e
corrigidos:

1. **CORS permissivo** (`origin: true` + `credentials: true`) — sobrou
   de quando client/server eram processos separados. Permitia que
   qualquer site externo fizesse requisições autenticadas usando o
   cookie do admin. Removido por completo (não é mais necessário, tudo
   roda no mesmo processo/origem).
2. **Sem limite de tentativas de login** — a senha podia ser tentada
   infinitas vezes. Adicionado rate limit em memória: 8 tentativas
   erradas por IP a cada 15 minutos, depois bloqueia (inclusive a senha
   certa) até a janela expirar.

O que já estava certo desde o início: `produtos.criar`/`atualizar`
exigem autenticação **no servidor** (não só escondidos no front),
cookie `httpOnly` + `secure` em produção, comparação de sessão
timing-safe.

---

## 5. Categorias do catálogo

Reestruturação completa, mantendo compatibilidade com os produtos já
cadastrados:

| Categoria (antes) | Categoria (agora) |
|---|---|
| Consultório | **Personalizados** (renomeado — produtos existentes migram sozinhos) |
| — | **Pronta Entrega** (nova) |
| Casa | Casa (sem alteração) |

- Ordem de exibição: Pronta Entrega → Personalizados → Casa
- "Feitos no Torno" nunca existiu no código — nada precisou ser
  removido
- Toda a informação de categoria (valor, rótulo, descrição, ordem) foi
  centralizada em `shared/const.ts` — antes estava duplicada
  hardcoded em 6 arquivos diferentes (Header, Home, Footer, Catálogo,
  ProdutoCard, ProdutoDetalhe, formulário admin)
- Migration de banco em 2 etapas (`drizzle/0001` e `0002`): adiciona
  "pronta-entrega" e renomeia "consultorio" → "personalizados" via
  `ALTER TYPE ... RENAME VALUE`, que atualiza automaticamente os
  produtos já cadastrados sem precisar de `UPDATE` manual

---

## 6. Limpeza de código morto

Encontrado e removido durante as auditorias:

- `client/src/lib/api.ts`: sobrou da época do REST, não era mais
  importado em lugar nenhum desde a migração pro tRPC
- Tipo `Categoria` duplicado em `client/src/lib/types.ts` (a fonte real
  passou a ser `@shared/const`)
- `server/dist/` antigo (artefato de build da arquitetura anterior)

---

## 7. Infraestrutura e serviços externos

| Serviço | Uso | Status |
|---|---|---|
| **Render** | Hospedagem (web service) | No ar, `Root Directory` e `Build/Start Command` corrigidos pra arquitetura de pacote único |
| **PostgreSQL** | Banco de dados | Em uso, schema gerenciado via Drizzle migrations |
| **Cloudinary** | Upload/hospedagem de imagem dos produtos | Configurado (conta compartilhada com o projeto Thomé Empreendimentos) |
| **Asaas** | Gateway de pagamento (PIX/boleto/cartão) | Integrado no checkout |

### Histórico de imagem: Cloudflare Images → Cloudinary

Chegou a ser implementado upload via **Cloudflare Images**, mas a conta
não tinha esse produto contratado (é separado do Cloudflare Stream, que
já é usado no Shadia Hasan). Revertido para **Cloudinary**, que já é
usado em outros projetos (Thomé, Docce&Luxxo) e tem free tier suficiente
para o volume do Caro Cerâmica.

---

## 8. Pendências conhecidas

- ⚠️ **`CLOUDINARY_CLOUD_NAME`** precisa ser corrigido para `dzty82u60`
  (valor errado configurado anteriormente) — local (`.env`) e no Render
  (Environment)
- ⚠️ **Migration de categorias** (`npm run db:migrate`) ainda não
  confirmada como aplicada com sucesso no banco de produção — houve um
  erro (`[prodenv:...] Request forbidden`) de origem não identificada,
  possivelmente relacionado ao ambiente local (antivírus/firewall) e
  não ao banco em si. Precisa reexecutar e confirmar.
- Sem página "Sobre" ou uso do wordmark completo da logo (`CARO VARGAS`
  com o "O" estilizado) — só o ícone foi aplicado até agora
- Rate limit de login é em memória (adequado para instância única no
  Render; se o tráfego crescer muito, migrar para algo persistente tipo
  Redis)

---

## 9. Variáveis de ambiente necessárias

```env
DATABASE_URL=
ASAAS_API_KEY=
ASAAS_ENV=sandbox
PORT=4000
NODE_ENV=production

ADMIN_PASSWORD=
ADMIN_SESSION_SECRET=

CLOUDINARY_CLOUD_NAME=dzty82u60
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Precisam existir tanto no `.env` local quanto no Render → Environment.

---

## 10. Auditoria de 14/07/2026

Auditoria completa do estado atual do projeto após a migração de
arquitetura (seção 1). Resultado: build e typecheck passam limpos
(`npm run check`, `npm run build`), e os testes manuais contra o
tRPC (produtos, checkout, login admin) confirmaram que o servidor não
cai mesmo com payload inválido ou falha do gateway Asaas — a correção
de estabilidade aplicada antes da migração (try/catch no checkout,
error handler global em `server/_core/index.ts`, `unhandledRejection`/
`uncaughtException`) sobreviveu integralmente ao rewrite para tRPC.

### 🔴 Crítico — credenciais reais expostas no repositório público

O arquivo **`server/env`** (sem o ponto — por isso não caía na regra
`server/.env` do `.gitignore`) estava commitado no `main` com a
`DATABASE_URL` **real** de produção (usuário e senha do Postgres do
Render) em texto puro, em repositório **público** no GitHub.

- Removido do controle de versão e do disco (`git rm --cached server/env`)
- Adicionada a entrada `server/env` ao `.gitignore`
- **Ação recomendada fora deste repositório, ainda pendente:** trocar a
  senha do usuário `caro_ceramica_user` no painel do Render (rotação de
  credencial), já que ela ficou exposta publicamente por algum tempo —
  qualquer pessoa com acesso ao histórico do Git tem essa senha.

### ✅ Pendência da seção 8 resolvida — migração de categorias

Conectado diretamente no Postgres de produção (Render) pra checar o
enum `categoria`: ele **ainda estava no estado antigo**
(`consultorio`, `casa`, sem `pronta-entrega`) — a suspeita da seção 8
estava correta, a migration nunca tinha sido aplicada em produção.

Executado `drizzle-kit migrate` contra a `DATABASE_URL` de produção.
Resultado confirmado depois:

```
categoria (enum): personalizados, casa, pronta-entrega
produtos: casa=5, personalizados=3
```

O catálogo em produção já reflete a categoria "Personalizados" —
sem essa correção, o filtro por categoria no site ao vivo estaria
quebrado (a UI usa os valores novos, o banco tinha os antigos).

### Arquivos duplicados/obsoletos removidos

Sobraram da época em que `client/` e `server/` eram pacotes npm
separados; a raiz já tem os equivalentes corretos e nenhum script
referenciava os antigos (confirmado com `npm run build`/`npm run check`
antes e depois da remoção):

- `server/drizzle.config.ts` e `server/drizzle/` (config e migration
  antiga do schema pré-mudança — o correto é `./drizzle.config.ts` e
  `./drizzle/`, apontando pra `shared/schema.ts`)
- `client/tailwind.config.ts` (o correto é `./tailwind.config.ts`)
- `server/package-lock.json` (sobra do `server/` como pacote próprio)
- `server/README.md` (34 bytes, conteúdo corrompido/UTF-16 ilegível,
  sem informação real)
- `server/.env.example` (desatualizado — faltavam as variáveis de
  admin e Cloudinary; o `.env.example` da raiz já está completo)

### Pontos verificados e confirmados como corretos

- **CORS**: não existe mais nenhum middleware de CORS no server — client
  e server rodam no mesmo processo/origem, então não é necessário
  (confirma a correção já registrada na seção 4)
- **Rate limit de login**: testado manualmente — senha errada retorna
  `401 Senha incorreta`, senha certa retorna sucesso; a lógica de
  bloqueio por IP em `server/routers/admin.ts` está ativa
- **Relação `itensKitRelations`** (fix de auditoria anterior) presente
  e correta em `shared/schema.ts` após o rename de
  `server/src/db/schema.ts`
- **Webhook Asaas** (`server/routes/asaas-webhook.ts`) trata erro
  internamente e sempre responde `200`, evitando reenvio agressivo do
  gateway
- Nenhum uso de `<a>` manual dentro de `<Link>` do wouter nos
  componentes atuais (Header, ProdutoCard, Home, Carrinho) — o bug de
  auditorias anteriores não foi reintroduzido no redesign

### Pendências que continuam abertas (não resolvidas nesta auditoria)

- ⚠️ `CLOUDINARY_CLOUD_NAME` — não foi possível confirmar o valor
  correto (`dzty82u60`) no Render → Environment a partir deste
  ambiente; precisa ser conferido/corrigido diretamente no painel do
  Render
- Rotação da senha do Postgres exposta (ver item crítico acima) —
  requer acesso ao painel do Render, fora do escopo deste sandbox
- Sem página "Sobre" / wordmark completo (já registrado na seção 8)
