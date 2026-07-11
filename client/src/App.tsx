import { Route, Switch } from "wouter";
import Home from "./routes/Home";
import Catalogo from "./routes/Catalogo";
import ProdutoDetalhe from "./routes/ProdutoDetalhe";
import Carrinho from "./routes/Carrinho";
import Checkout from "./routes/Checkout";
import PedidoConfirmado from "./routes/PedidoConfirmado";
import AdminLogin from "./routes/admin/AdminLogin";
import AdminProdutos from "./routes/admin/AdminProdutos";
import AdminProdutoForm from "./routes/admin/AdminProdutoForm";
import { CarrinhoProvider } from "./lib/carrinho-context";

export default function App() {
  return (
    <CarrinhoProvider>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/catalogo/:categoria" component={Catalogo} />
        <Route path="/produto/:slug" component={ProdutoDetalhe} />
        <Route path="/carrinho" component={Carrinho} />
        <Route path="/checkout" component={Checkout} />
        <Route path="/pedido/:codigo" component={PedidoConfirmado} />
        <Route path="/admin/login" component={AdminLogin} />
        <Route path="/admin/produtos" component={AdminProdutos} />
        <Route path="/admin/produtos/novo" component={AdminProdutoForm} />
        <Route path="/admin/produtos/:slug/editar" component={AdminProdutoForm} />
        <Route>
          {() => <div className="p-10 text-center">Página não encontrada</div>}
        </Route>
      </Switch>
    </CarrinhoProvider>
  );
}
