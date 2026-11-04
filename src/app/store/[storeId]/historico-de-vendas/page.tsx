"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown, ChevronLeft, ChevronRight, Download, Eye, Printer, Search, X,
} from "lucide-react";
import AppSidebar from "@/src/components/app-sidebar";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { useParams } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/src/lib/auth";
import { listSales, type Sale } from "@/src/lib/sales";

const saleDate = (sale: Sale) => sale.createdAt?.toDate().toLocaleString("pt-BR") ?? "—";
const itemCount = (sale: Sale) => sale.items.reduce((sum, item) => sum + item.quantity, 0);
const currency = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const inputClass = "h-[30px] rounded-md border-slate-200 bg-white text-[10px] shadow-none placeholder:text-neutral-400 focus-visible:border-red-400 focus-visible:ring-red-100";

export default function HistoricoDeVendasPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(0);
  const [error, setError] = useState("");
  useEffect(() => onAuthStateChanged(auth, async (user) => {
    if (!user) return;
    try { setSales(await listSales(storeId)); setNow(Date.now()); setError(""); }
    catch { setError("Não foi possível carregar o histórico de vendas."); }
    finally { setLoading(false); }
  }), [storeId]);
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState("Últimos 30 dias");
  const [payment, setPayment] = useState("Todos");
  const [page, setPage] = useState(1);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const pageSize = 7;

  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      const term = search.trim().toLocaleLowerCase("pt-BR");
      const matchesSearch = !term || `${sale.orderNumber ?? ""} ${sale.customer}`.toLocaleLowerCase("pt-BR").includes(term);
      const matchesPayment = payment === "Todos" || sale.payment === payment;
      const daysAgo = (now - (sale.createdAt?.toMillis() ?? 0)) / 86_400_000;
      const matchesPeriod = period === "Todo período" || (daysAgo >= 0 && daysAgo <= (period === "Últimos 7 dias" ? 7 : 30));
      return matchesSearch && matchesPayment && matchesPeriod;
    });
  }, [sales, search, period, payment, now]);

  const pageCount = Math.max(1, Math.ceil(filteredSales.length / pageSize));
  const visibleSales = filteredSales.slice((page - 1) * pageSize, page * pageSize);

  function exportSales() {
    const rows = [["Pedido", "Cliente", "Data/hora", "Itens", "Valor total", "Pagamento", "Status"], ...filteredSales.map((sale) => [String(sale.orderNumber ?? ""), sale.customer, saleDate(sale), String(itemCount(sale)), currency(sale.totalCents / 100), sale.payment, sale.status])];
    const csv = rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(";")).join("\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "historico-de-vendas.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function updateFilter<T>(setter: (value: T) => void, value: T) {
    setter(value);
    setPage(1);
  }

  return (
    <div className="flex min-h-screen bg-white text-neutral-900">
      <AppSidebar className="hidden md:flex" />
      <main className="min-w-0 flex-1 px-5 py-8 sm:px-8 lg:px-[clamp(28px,4vw,54px)] lg:py-11">
        <div className="mx-auto flex min-h-[calc(100vh-88px)] max-w-[1500px] flex-col">
          <h1 className="mb-5 text-[17px] font-extrabold tracking-tight">HISTÓRICO DE VENDAS</h1>

          <div className="mb-3 flex flex-wrap items-center gap-2.5">
            <label className="relative min-w-[220px] flex-1 md:max-w-[290px]"><Search className="absolute left-2.5 top-1/2 size-3 -translate-y-1/2 text-neutral-400" /><Input className={`${inputClass} pl-7`} value={search} onChange={(event) => updateFilter(setSearch, event.target.value)} placeholder="Buscar por nº do pedido ou cliente..." /></label>
            <label className="relative"><select aria-label="Filtrar por período" className="h-[30px] w-[152px] appearance-none rounded-md border border-slate-200 bg-white px-2.5 pr-7 text-[10px] outline-none focus:border-red-300" value={period} onChange={(event) => updateFilter(setPeriod, event.target.value)}><option value="Últimos 30 dias">Período: Últimos 30 dias</option><option value="Últimos 7 dias">Período: Últimos 7 dias</option><option value="Todo período">Período: Todo período</option></select><ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3 -translate-y-1/2" /></label>
            <label className="relative"><select aria-label="Filtrar por pagamento" className="h-[30px] w-[152px] appearance-none rounded-md border border-slate-200 bg-white px-2.5 pr-7 text-[10px] outline-none focus:border-red-300" value={payment} onChange={(event) => updateFilter(setPayment, event.target.value)}><option value="Todos">Pagamento: Todos</option><option>Pix</option><option>Cartão</option><option>Dinheiro</option></select><ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3 -translate-y-1/2" /></label>
            <Button type="button" variant="outline" onClick={exportSales} className="ml-auto h-[30px] rounded-md border-slate-200 px-3 text-[10px]"><Download className="size-3" />Exportar</Button>
          </div>

          {error && <p role="alert" className="mb-3 text-xs text-red-600">{error}</p>}
          {loading && <p className="mb-3 text-xs text-neutral-500">Carregando vendas...</p>}
          <section className="flex min-h-[570px] flex-1 flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white">
            <div className="min-w-0 flex-1 overflow-x-auto">
              <table className="w-full min-w-[850px] table-fixed text-left">
                <colgroup><col className="w-[9%]" /><col className="w-[17%]" /><col className="w-[15%]" /><col className="w-[8%]" /><col className="w-[10%]" /><col className="w-[10%]" /><col className="w-[20%]" /><col className="w-[11%]" /></colgroup>
                <thead className="h-[31px] bg-[#fafafa] text-[9px] font-medium uppercase text-neutral-500"><tr><th className="px-3">Pedido #</th><th className="px-3">Cliente</th><th className="px-3">Data/hora</th><th className="px-3">Itens</th><th className="px-3">Valor total</th><th className="px-3">Pagamento</th><th className="px-3">Status</th><th className="px-3 text-center">Ações</th></tr></thead>
                <tbody>
                  {visibleSales.map((sale) => <tr key={sale.id} className="h-[43px] border-t border-neutral-100 text-[10px]">
                    <td className="px-3 font-semibold">#{sale.orderNumber ?? "—"}</td>
                    <td className="truncate px-3">{sale.customer}</td>
                    <td className="whitespace-nowrap px-3">{saleDate(sale)}</td>
                    <td className="px-3">{itemCount(sale)} {itemCount(sale) === 1 ? "item" : "itens"}</td>
                    <td className="whitespace-nowrap px-3 font-semibold">{currency(sale.totalCents / 100)}</td>
                    <td className="px-3">{sale.payment}</td>
                    <td className="px-3"><span className={`inline-flex min-w-[62px] justify-center rounded px-2 py-1 text-[9px] font-medium ${"bg-[#e7f4e9] text-[#20813a]"}`}>{sale.status}</span></td>
                    <td className="px-3"><div className="flex items-center justify-center gap-2"><button type="button" aria-label={`Ver pedido ${sale.orderNumber ?? "sem número"}`} onClick={() => setSelectedSale(sale)} className="rounded p-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"><Eye className="size-3" /></button><button type="button" aria-label={`Imprimir pedido ${sale.orderNumber ?? "sem número"}`} onClick={() => window.print()} className="rounded p-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"><Printer className="size-3" /></button></div></td>
                  </tr>)}
                  {!loading && !error && visibleSales.length === 0 && <tr><td colSpan={8} className="py-16 text-center text-xs text-neutral-400">Nenhuma venda encontrada para esses filtros.</td></tr>}
                </tbody>
              </table>
            </div>

            <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 px-4 py-2.5 text-[10px] text-neutral-400">
              <span>Mostrando {filteredSales.length ? (page - 1) * pageSize + 1 : 0}-{Math.min(page * pageSize, filteredSales.length)} de {filteredSales.length} vendas</span>
              <nav aria-label="Paginação de vendas" className="flex items-center gap-1"><Button type="button" variant="outline" size="icon-xs" aria-label="Página anterior" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="size-[23px] rounded-md border-neutral-200"><ChevronLeft className="size-3" /></Button>{Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => <Button type="button" key={number} variant={page === number ? "default" : "outline"} size="icon-xs" aria-current={page === number ? "page" : undefined} onClick={() => setPage(number)} className={`size-[23px] rounded-md text-[10px] ${page === number ? "bg-[#ed3535] text-white hover:bg-red-600" : "border-neutral-200"}`}>{number}</Button>)}<Button type="button" variant="outline" size="icon-xs" aria-label="Próxima página" disabled={page === pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))} className="size-[23px] rounded-md border-neutral-200"><ChevronRight className="size-3" /></Button></nav>
            </footer>
          </section>
        </div>
      </main>

      {selectedSale && <div role="presentation" onClick={() => setSelectedSale(null)} className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"><section role="dialog" aria-modal="true" aria-labelledby="sale-dialog-title" onClick={(event) => event.stopPropagation()} className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl"><header className="mb-4 flex items-center justify-between"><div><h2 id="sale-dialog-title" className="text-sm font-bold">Pedido #{selectedSale.orderNumber ?? "—"}</h2><p className="mt-1 text-xs text-neutral-500">Detalhes da venda</p></div><button type="button" onClick={() => setSelectedSale(null)} aria-label="Fechar" className="rounded-md p-1 text-neutral-500 hover:bg-neutral-100"><X className="size-4" /></button></header><dl className="space-y-2 text-xs"><div className="flex justify-between border-b pb-2"><dt className="text-neutral-500">Cliente</dt><dd className="font-medium">{selectedSale.customer}</dd></div><div className="flex justify-between border-b pb-2"><dt className="text-neutral-500">Data e hora</dt><dd>{saleDate(selectedSale)}</dd></div><div className="flex justify-between border-b pb-2"><dt className="text-neutral-500">Pagamento</dt><dd>{selectedSale.payment}</dd></div><div className="flex justify-between border-b pb-2"><dt className="text-neutral-500">Status</dt><dd>{selectedSale.status}</dd></div><div className="pt-1"><dt className="mb-2 text-neutral-500">Itens</dt><dd className="space-y-1">{selectedSale.items.map((item) => <p key={item.productId} className="rounded bg-neutral-50 px-2 py-1.5">{item.quantity} × {item.name} · {currency(item.unitPriceCents / 100)} un. · {currency(item.totalCents / 100)}</p>)}</dd></div><div className="flex justify-between border-t pt-3 text-sm font-bold"><dt>Total</dt><dd>{currency(selectedSale.totalCents / 100)}</dd></div></dl><div className="mt-4 flex justify-end"><Button type="button" variant="outline" onClick={() => setSelectedSale(null)} className="h-8 text-xs">Fechar</Button></div></section></div>}
    </div>
  );
}
