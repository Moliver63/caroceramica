import { Route, Switch } from "wouter";
import Home from "./routes/Home";
import Catalogo from "./routes/Catalogo";
import ProdutoDetalhe from "./routes/ProdutoDetalhe";
import Carrinho from "./routes/Carrinho";
import Checkout from "./routes/Checkout";
import PedidoConfirmado from "./routes/PedidoConfirmado";
import AdminProdutos from "./routes/admin/AdminProdutos";
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
        <Route path="/admin/produtos" component={AdminProdutos} />
        <Route>
          {() => <div className="p-10 text-center">Página não encontrada</div>}
        </Route>
      </Switch>
    </CarrinhoProvider>
  );
}
