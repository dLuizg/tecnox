"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import AppSidebar from "@/src/components/app-sidebar";
import { Card } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";

const helpTopics = [
  {
    number: 1,
    title: "Como cadastrar produtos",
    description: "Aprenda a cadastrar produtos, categorias, preços e estoque no catálogo.",
    href: "/produtos",
    keywords: "produto produtos cadastro sku categoria preço estoque catálogo",
  },
  {
    number: 2,
    title: "Como registrar uma venda",
    description: "Passo a passo para criar uma nova venda no PDV.",
    href: "/nova-venda",
    keywords: "venda vendas registrar nova pdv",
  },
  {
    number: 3,
    title: "Configurar formas de pagamento",
    description: "Ative e configure os métodos de pagamento aceitos.",
    href: "/formas-de-pagamento",
    keywords: "pagamento pagamentos configurar métodos",
  },
  {
    number: 4,
    title: "Gerar relatórios financeiros",
    description: "Exporte DRE, fluxo de caixa e relatórios de vendas.",
    href: "/relatorios-financeiros",
    keywords: "relatórios financeiros dre fluxo caixa vendas",
  },
  {
    number: 5,
    title: "Gerenciar usuários da equipe",
    description: "Adicione colaboradores e defina permissões de acesso.",
    href: "/equipe",
    keywords: "gerenciar usuários equipe colaboradores permissões acesso",
  },
  {
    number: 6,
    title: "Emitir devoluções e trocas",
    description: "Como processar devoluções e trocas de produtos.",
    href: "/devolucoes-trocas",
    keywords: "emitir devoluções trocas produtos",
  },
];

export default function AjudaPage() {
  const [search, setSearch] = useState("");
  const visibleTopics = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("pt-BR");
    if (!query) return helpTopics;

    return helpTopics.filter(({ title, description, keywords }) =>
      `${title} ${description} ${keywords}`.toLocaleLowerCase("pt-BR").includes(query),
    );
  }, [search]);

  return (
    <div className="flex min-h-screen bg-white text-neutral-900">
      <AppSidebar className="hidden md:flex" />

      <main className="min-w-0 flex-1 px-5 py-6 sm:px-8 lg:px-[clamp(28px,4vw,54px)] lg:py-6">
        <div className="mx-auto max-w-[1500px]">
          <h1 className="mb-10 text-[17px] font-extrabold tracking-tight">AJUDA</h1>

          <label className="relative mb-5 block">
            <Search aria-hidden="true" className="absolute left-4 top-1/2 size-3.5 -translate-y-1/2 text-neutral-500" strokeWidth={1.8} />
            <Input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar na central de ajuda..."
              aria-label="Buscar na central de ajuda"
              className="h-[32px] rounded-lg border-[#dedede] pl-9 text-[10px] shadow-none placeholder:text-neutral-400 focus-visible:border-red-300 focus-visible:ring-red-100"
            />
          </label>

          {visibleTopics.length ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visibleTopics.map(({ number, title, description, href }) => (
                <Link key={number} href={href} className="group rounded-[9px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e14646] focus-visible:ring-offset-2">
                  <Card className="min-h-[91px] rounded-[9px] border border-[#dedede] bg-white p-4 shadow-none ring-0 transition-colors group-hover:border-[#c9c9c9] group-hover:bg-neutral-50">
                    <span className="mb-2 flex size-[28px] items-center justify-center rounded-full bg-[#fae7e7] text-[11px] font-semibold text-[#ed3838]">
                      {number}
                    </span>
                    <h2 className="text-[11px] font-bold leading-tight">{title}</h2>
                    <p className="mt-0.5 text-[10px] leading-snug text-neutral-500">{description}</p>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-neutral-200 px-4 py-8 text-center text-[11px] text-neutral-500">
              Nenhum tópico encontrado para “{search}”.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
