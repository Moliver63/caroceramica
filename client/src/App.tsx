import { Route, Switch, useLocation } from "wouter";
import Home from "./routes/Home";
import Catalogo from "./routes/Catalogo";
import ProdutoDetalhe from "./routes/ProdutoDetalhe";
import Carrinho from "./routes/Carrinho";
import Checkout from "./routes/Checkout";
import PedidoConfirmado from "./routes/PedidoConfirmado";
import Historia from "./routes/Historia";
import Rastreio from "./routes/Rastreio";
import AdminLogin from "./routes/admin/AdminLogin";
import AdminProdutos from "./routes/admin/AdminProdutos";
import AdminProdutoForm from "./routes/admin/AdminProdutoForm";
import AdminLeads from "./routes/admin/AdminLeads";
import AdminPedidos from "./routes/admin/AdminPedidos";
import AdminPedidoDetalhe from "./routes/admin/AdminPedidoDetalhe";
import AdminClientes from "./routes/admin/AdminClientes";
import AdminEmails from "./routes/admin/AdminEmails";
import AdminCategorias from "./routes/admin/AdminCategorias";
import BotaoWhatsApp from "./components/BotaoWhatsApp";
import MiniCarrinhoDrawer from "./components/MiniCarrinhoDrawer";
import { CarrinhoProvider } from "./lib/carrinho-context";

export default function App() {
  const [location] = useLocation();
  const ehAdmin = location.startsWith("/admin");

  return (
    <CarrinhoProvider>
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
        <Route>
          {() => <div className="p-10 text-center">Página não encontrada</div>}
        </Route>
      </Switch>

      {!ehAdmin && <BotaoWhatsApp />}
      {!ehAdmin && <MiniCarrinhoDrawer />}
    </CarrinhoProvider>
  );
}
