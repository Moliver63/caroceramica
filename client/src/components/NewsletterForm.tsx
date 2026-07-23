import { useState, type FormEvent } from "react";
import { trpc } from "../lib/trpc";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const cadastrar = trpc.leads.cadastrar.useMutation();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    cadastrar.mutate({ email });
  }

  if (cadastrar.isSuccess) {
    return (
      <p className="text-sm text-creme/80">
        Combinado, você vai receber nossas novidades por e-mail. 🌿
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="seu@email.com"
        className="min-w-0 flex-1 rounded-full border border-creme/20 bg-transparent px-4 py-2.5 text-sm text-creme placeholder:text-creme/40 focus:border-terracota focus:outline-none"
      />
      <button
        type="submit"
        disabled={cadastrar.isPending}
        className="rounded-full bg-terracota px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {cadastrar.isPending ? "Enviando…" : "Quero receber novidades"}
      </button>
      {cadastrar.isError && (
        <p className="text-xs text-red-300 sm:hidden">Não foi possível cadastrar. Tente de novo.</p>
      )}
    </form>
  );
}
