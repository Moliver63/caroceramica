import { lazy, Suspense } from "react";
import { Route, Switch, useLocation } from "wouter";
import Home from "./routes/Home";
import Catalogo from "./routes/Catalogo";
import ProdutoDetalhe from "./routes/ProdutoDetalhe";
import Carrinho from "./routes/Carrinho";
import Checkout from "./routes/Checkout";
import PedidoConfirmado from "./routes/PedidoConfirmado";
import Historia from "./routes/Historia";
import Rastreio from "./routes/Rastreio";
import BotaoWhatsApp from "./components/BotaoWhatsApp";
import MiniCarrinhoDrawer from "./components/MiniCarrinhoDrawer";
import { CarrinhoProvider } from "./lib/carrinho-context";

// Todo o admin é carregado sob demanda — quem visita a loja nunca
// baixa esse código (nem a recharts, que só o financeiro usa e é
// pesada). Sem isso, o bundle público quase dobrava de tamanho por
// causa de uma biblioteca de gráfico que só o admin usa.
const AdminLogin = lazy(() => import("./routes/admin/AdminLogin"));
const AdminProdutos = lazy(() => import("./routes/admin/AdminProdutos"));
const AdminProdutoForm = lazy(() => import("./routes/admin/AdminProdutoForm"));
const AdminLeads = lazy(() => import("./routes/admin/AdminLeads"));
const AdminPedidos = lazy(() => import("./routes/admin/AdminPedidos"));
const AdminPedidoDetalhe = lazy(() => import("./routes/admin/AdminPedidoDetalhe"));
const AdminClientes = lazy(() => import("./routes/admin/AdminClientes"));
const AdminEmails = lazy(() => import("./routes/admin/AdminEmails"));
const AdminCategorias = lazy(() => import("./routes/admin/AdminCategorias"));
const AdminFinanceiro = lazy(() => import("./routes/admin/AdminFinanceiro"));

function CarregandoAdmin() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F4F1] text-sm text-[#8C7A6B]">
      Carregando…
    </div>
  );
}

export default function App() {
  const [location] = useLocation();
  const ehAdmin = location.startsWith("/admin");

  return (
    <CarrinhoProvider>
      <Suspense fallback={ehAdmin ? <CarregandoAdmin /> : null}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/catalogo/:categoria" component={Catalogo} />
          <Route path="/produto/:slug" component={ProdutoDetalhe} />
          <Route path="/carrinho" component={Carrinho} />
          <Route path="/checkout" component={Checkout} />
          <Route path="/pedido/:codigo" component={PedidoConfirmado} />
          <Route path="/historia" component={Historia} />
          <Route path="/rastreio" component={Rastreio} />
          <Route path="/admin/login" component={AdminLogin} />
          <Route path="/admin/produtos" component={AdminProdutos} />
          <Route path="/admin/produtos/novo" component={AdminProdutoForm} />
          <Route path="/admin/produtos/:slug/editar" component={AdminProdutoForm} />
          <Route path="/admin/leads" component={AdminLeads} />
          <Route path="/admin/pedidos" component={AdminPedidos} />
          <Route path="/admin/pedidos/:codigo" component={AdminPedidoDetalhe} />
          <Route path="/admin/clientes" component={AdminClientes} />
          <Route path="/admin/emails" component={AdminEmails} />
          <Route path="/admin/categorias" component={AdminCategorias} />
          <Route path="/admin/financeiro" component={AdminFinanceiro} />
          <Route>
            {() => <div className="p-10 text-center">Página não encontrada</div>}
          </Route>
        </Switch>
      </Suspense>

      {!ehAdmin && <BotaoWhatsApp />}
      {!ehAdmin && <MiniCarrinhoDrawer />}
    </CarrinhoProvider>
  );
}
