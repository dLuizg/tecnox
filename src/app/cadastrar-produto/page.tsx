"use client";

import { useMemo, useRef, useState, type ChangeEvent, type DragEvent, type FormEvent } from "react";
import Image from "next/image";
import {
  Check, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, Ellipsis,
  Pencil, Plus, Search, Upload, X,
} from "lucide-react";
import AppSidebar from "@/src/components/app-sidebar";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { formatCurrencyInput } from "@/src/helpers/currency";

type Product = {
  id: number;
  name: string;
  description: string;
  price: string;
  sku: string;
  stock: number;
  lastPurchase: string;
  lastPurchaseNote: string;
  purchases: number;
  tags: string[];
  image?: string;
};

const seedProducts: Product[] = [
  { id: 1, name: "PELÍCULA S25", description: "Película celular samsung s25", price: "39,90", sku: "PRD-2026-001", stock: 35, lastPurchase: "12/09/2026", lastPurchaseNote: "Há 6 dias", purchases: 17, tags: ["Atacado"] },
  { id: 2, name: "CAPINHA IPHONE 17 PRO MAX", description: "CAPA PROTETORA PARA IPHONE 17 PRO MAX", price: "89,90", sku: "PRD-2026-002", stock: 35, lastPurchase: "28/08/2026", lastPurchaseNote: "Há 21 dias", purchases: 9, tags: ["Acessórios"] },
  { id: 3, name: "CARREGADOR USB-C 25W", description: "Carregador rápido USB-C", price: "119,00", sku: "PRD-2026-003", stock: 18, lastPurchase: "17/09/2026", lastPurchaseNote: "Ontem", purchases: 14, tags: ["Eletrônicos"] },
  { id: 4, name: "CABO USB-C 1M", description: "Cabo reforçado de carregamento", price: "49,90", sku: "PRD-2026-004", stock: 52, lastPurchase: "15/09/2026", lastPurchaseNote: "Há 3 dias", purchases: 31, tags: ["Acessórios"] },
  { id: 5, name: "FONE BLUETOOTH PRO", description: "Fone sem fio com estojo de carga", price: "199,90", sku: "PRD-2026-005", stock: 12, lastPurchase: "14/09/2026", lastPurchaseNote: "Há 4 dias", purchases: 8, tags: ["Eletrônicos"] },
  { id: 6, name: "SUPORTE VEICULAR", description: "Suporte magnético para celular", price: "59,90", sku: "PRD-2026-006", stock: 0, lastPurchase: "02/09/2026", lastPurchaseNote: "Há 16 dias", purchases: 11, tags: ["Acessórios"] },
  { id: 7, name: "PELÍCULA IPHONE 17", description: "Película de vidro temperado", price: "34,90", sku: "PRD-2026-007", stock: 24, lastPurchase: "10/09/2026", lastPurchaseNote: "Há 8 dias", purchases: 22, tags: ["Atacado"] },
];

const emptyForm = { name: "", description: "", price: "", sku: "" };
const inputStyle = "h-9 rounded-lg border-[#dce1e8] bg-white text-xs shadow-none placeholder:text-slate-400 focus-visible:border-red-400 focus-visible:ring-red-100";

export default function CadastrarProdutoPage() {
  const [products, setProducts] = useState(seedProducts);
  const [form, setForm] = useState(emptyForm);
  const [tags, setTags] = useState(["Atacado"]);
  const [tagInput, setTagInput] = useState("");
  const [image, setImage] = useState<string | undefined>();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos os status");
  const [periodFilter, setPeriodFilter] = useState("Todo período");
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const pageSize = 7;

  const filtered = useMemo(() => products.filter((product) => {
    const needle = query.trim().toLocaleLowerCase("pt-BR");
    const matchesText = !needle || `${product.name} ${product.sku} ${product.description}`.toLocaleLowerCase("pt-BR").includes(needle);
    const matchesStatus = statusFilter === "Todos os status" || (statusFilter === "Com estoque" ? product.stock > 0 : product.stock === 0);
    const purchaseDate = product.lastPurchase === "—" ? null : new Date(product.lastPurchase.split("/").reverse().join("-"));
    const daysAgo = purchaseDate ? (Date.now() - purchaseDate.getTime()) / 86_400_000 : Number.POSITIVE_INFINITY;
    const matchesPeriod = periodFilter === "Todo período" || (periodFilter === "Últimos 7 dias" ? daysAgo <= 7 : daysAgo <= 30);
    return matchesText && matchesStatus && matchesPeriod;
  }), [products, query, statusFilter, periodFilter]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visibleProducts = filtered.slice((page - 1) * pageSize, page * pageSize);

  function chooseImage(file?: File) {
    if (!file || !file.type.startsWith("image/")) return;
    setImage(URL.createObjectURL(file));
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    chooseImage(event.target.files?.[0]);
  }

  function handleDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    chooseImage(event.dataTransfer.files[0]);
  }

  function addTag() {
    const nextTag = tagInput.trim();
    if (nextTag && !tags.some((tag) => tag.toLocaleLowerCase() === nextTag.toLocaleLowerCase())) setTags((current) => [...current, nextTag]);
    setTagInput("");
  }

  function resetForm() {
    setForm(emptyForm);
    setTags(["Atacado"]);
    setImage(undefined);
    setEditingId(null);
    if (fileInput.current) fileInput.current.value = "";
  }

  function submitProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.name.trim() || !form.price.trim() || !form.sku.trim()) return;
    if (editingId) {
      setProducts((current) => current.map((product) => product.id === editingId ? { ...product, ...form, name: form.name.trim(), description: form.description.trim(), tags, image: image ?? product.image } : product));
    } else {
      setProducts((current) => [{ id: Date.now(), ...form, name: form.name.trim(), description: form.description.trim(), stock: 0, lastPurchase: "—", lastPurchaseNote: "Sem compras", purchases: 0, tags, image }, ...current]);
    }
    resetForm();
    setPage(1);
  }

  function editProduct(product: Product) {
    setEditingId(product.id);
    setForm({ name: product.name, description: product.description, price: product.price, sku: product.sku });
    setTags(product.tags);
    setImage(product.image);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function exportProducts() {
    const rows = [["Produto", "Descrição", "Preço", "SKU", "Estoque", "Tags"], ...filtered.map((product) => [product.name, product.description, `R$ ${product.price}`, product.sku, String(product.stock), product.tags.join(", ")])];
    const csv = rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(";")).join("\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "produtos-tecnox.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex min-h-screen bg-[#f5f7fb] text-slate-900">
      <AppSidebar className="hidden md:flex" />
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-7 lg:px-8 lg:py-7">
        <div className="mx-auto flex min-h-[calc(100vh-56px)] max-w-[1600px] flex-col">
          <header className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Administração</p>
              <h1 className="text-xl font-bold leading-tight tracking-tight sm:text-[23px]">Cadastro e gerenciamento de produtos</h1>
              <p className="mt-1 text-[11px] text-slate-500">Registre novos produtos, organize tags, acompanhe estoque e revise a movimentação dos itens cadastrados.</p>
            </div>
            <div className="hidden shrink-0 items-center gap-2 sm:flex">
              <span className="inline-flex h-7 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 text-[10px] font-medium"><span className="size-1.5 rounded-full bg-emerald-500" />Sistema operacional</span>
              <Button type="button" variant="outline" size="sm" className="h-7 rounded-full border-slate-200 bg-white text-[10px]"><CircleHelp className="size-3.5" />Ajuda</Button>
            </div>
          </header>

          <div className="grid flex-1 items-stretch gap-4 xl:grid-cols-[minmax(380px,0.98fr)_minmax(480px,1.05fr)]">
            <section className="flex flex-col rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_4px_18px_rgba(15,23,42,0.04)] sm:p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div><h2 className="text-[15px] font-bold text-[#321e1e]">{editingId ? "Editar produto" : "Cadastrar produto"}</h2><p className="mt-0.5 text-[10px] text-slate-500">Preencha os dados principais para criar um novo item no catálogo.</p></div>
                <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1.5 text-[9px] font-bold uppercase">{editingId ? "Editando" : "Novo registro"}</span>
              </div>

              <form className="flex flex-1 flex-col" onSubmit={submitProduct}>
                <div className="space-y-2.5">
                  <label className="block"><span className="mb-1 block text-[10px] font-semibold">Nome do produto</span><Input className={inputStyle} placeholder="Digite o nome do produto" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required /></label>
                  <label className="block"><span className="mb-1 block text-[10px] font-semibold">Descrição do produto</span><Textarea className="min-h-[78px] resize-y rounded-lg border-[#dce1e8] bg-white text-xs shadow-none placeholder:text-slate-400 focus-visible:border-red-400 focus-visible:ring-red-100" placeholder="Descreva características, materiais, compatibilidade e benefícios do produto." value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} /></label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <label className="block"><span className="mb-1 block text-[10px] font-semibold">Valor</span><div className="relative"><span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">R$</span><Input className={`${inputStyle} pl-7`} inputMode="decimal" placeholder="0,00" value={form.price} onChange={(event) => setForm((current) => ({ ...current, price: formatCurrencyInput(event.target.value) }))} required /></div></label>
                    <label className="block"><span className="mb-1 block text-[10px] font-semibold">Código SKU</span><Input className={inputStyle} placeholder="Ex.: PRD-2026-001" value={form.sku} onChange={(event) => setForm((current) => ({ ...current, sku: event.target.value.toUpperCase() }))} required /></label>
                  </div>

                  <div>
                    <span className="mb-1 block text-[10px] font-semibold">Upload de imagem</span>
                    <input ref={fileInput} type="file" accept="image/*" className="sr-only" onChange={handleFileChange} />
                    <button type="button" onClick={() => fileInput.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={handleDrop} className="flex min-h-[91px] w-full flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-[#f8fafc] px-4 py-3 text-center transition hover:border-red-300 hover:bg-red-50/30">
                      {image ? <><Image src={image} alt="Prévia do produto" width={120} height={48} unoptimized className="mb-1 h-12 max-w-[120px] rounded object-contain" /><span className="text-[10px] font-medium text-slate-600">Imagem selecionada · clique para trocar</span></> : <><span className="mb-1.5 flex size-7 items-center justify-center rounded-full bg-blue-50 text-red-500"><Upload className="size-4" /></span><span className="text-[11px] font-semibold">Arraste uma imagem ou faça upload</span><span className="mt-1 max-w-[250px] text-[10px] leading-tight text-slate-500">Use imagens quadradas ou retangulares para manter a proporção do produto.</span></>}
                    </button>
                  </div>

                  <div>
                    <span className="mb-1 block text-[10px] font-semibold">Tags</span>
                    <div className="flex min-h-[39px] flex-wrap items-center gap-1.5 rounded-lg border border-[#dce1e8] px-2 py-1.5">
                      {tags.map((tag) => <button type="button" key={tag} onClick={() => setTags((current) => current.filter((item) => item !== tag))} className="inline-flex h-6 items-center gap-1 rounded-full bg-sky-50 px-2 text-[10px] font-medium text-red-600 hover:bg-sky-100">{tag}<X className="size-3" /></button>)}
                      <div className="flex items-center gap-1"><Input aria-label="Nova tag" className="h-6 w-[92px] border-dashed border-slate-300 px-2 text-[10px] shadow-none" placeholder="Nova tag" value={tagInput} onChange={(event) => setTagInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addTag(); } }} /><Button type="button" variant="outline" size="icon-xs" aria-label="Adicionar tag" onClick={addTag} className="size-6 rounded-full border-slate-200"><Plus className="size-3" /></Button></div>
                      <span className="hidden text-[10px] text-slate-400 2xl:inline">Adicione categorias, coleções ou segmentos para facilitar a busca.</span>
                    </div>
                  </div>
                </div>

                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5">
                  <span className="text-[10px] text-slate-500">Campos com * são obrigatórios.</span>
                  <div className="ml-auto flex gap-2"><Button type="button" variant="outline" onClick={resetForm} className="h-[30px] border-slate-300 px-3 text-[11px]">Cancelar</Button><Button type="submit" className="h-[30px] rounded-lg bg-red-600 px-3.5 text-[11px] font-semibold text-white shadow-[0_3px_10px_rgba(220,38,38,0.18)] hover:bg-red-700"><Check className="size-3.5" />{editingId ? "Salvar alterações" : "Registrar produto"}</Button></div>
                </div>
              </form>
            </section>

            <section className="flex min-h-[520px] min-w-0 flex-col rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_4px_18px_rgba(15,23,42,0.04)] sm:p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div><h2 className="text-[15px] font-bold">Produtos cadastrados</h2><p className="mt-0.5 text-[10px] text-slate-500">Acompanhe compras, estoque e movimentação dos produtos vinculados.</p></div>
                <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1.5 text-[9px] font-bold uppercase">{products.length.toLocaleString("pt-BR")} registros</span>
              </div>

              <div className="mb-3 flex flex-wrap items-center gap-2">
                <label className="relative min-w-[170px] flex-1"><Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" /><Input className="h-[30px] border-slate-200 pl-7 text-[10px] shadow-none" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Buscar por nome, SKU ou descrição..." /></label>
                <label className="relative"><select aria-label="Filtrar estoque" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }} className="h-[30px] w-[106px] appearance-none rounded-md border border-slate-200 bg-white px-2.5 pr-6 text-[10px] text-slate-500 outline-none focus:border-red-300"><option>Todos os status</option><option>Com estoque</option><option>Sem estoque</option></select><ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3 -translate-y-1/2 text-slate-500" /></label>
                <label className="relative"><select aria-label="Filtrar período" value={periodFilter} onChange={(event) => setPeriodFilter(event.target.value)} className="h-[30px] w-[106px] appearance-none rounded-md border border-slate-200 bg-white px-2.5 pr-6 text-[10px] text-slate-500 outline-none focus:border-red-300"><option>Todo período</option><option>Últimos 7 dias</option><option>Últimos 30 dias</option></select><ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3 -translate-y-1/2 text-slate-500" /></label>
                <Button type="button" onClick={exportProducts} className="h-[30px] rounded-md bg-red-600 px-3 text-[10px] font-semibold text-white hover:bg-red-700">Exportar</Button>
              </div>

              <div className="min-w-0 flex-1 overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full min-w-[540px] table-fixed text-left">
                  <colgroup><col className="w-[34%]" /><col className="w-[18%]" /><col className="w-[21%]" /><col className="w-[13%]" /><col className="w-[14%]" /></colgroup>
                  <thead className="bg-slate-50 text-[9px] font-semibold uppercase text-slate-500"><tr><th className="px-2.5 py-2.5 sm:px-3">Produto</th><th className="px-2 py-2.5">Compras</th><th className="px-2 py-2.5">Última compra</th><th className="px-2 py-2.5">Estoque</th><th className="px-2 py-2.5 text-center">Ações</th></tr></thead>
                  <tbody>{visibleProducts.map((product) => <tr key={product.id} className="h-[53px] border-t border-slate-200 text-[10px]">
                    <td className="px-2.5 py-2 sm:px-3"><span className="block truncate font-bold text-slate-900">{product.name}</span><span className="mt-0.5 block truncate text-[9px] text-slate-500">{product.description}</span></td>
                    <td className="px-2 py-2"><span className="block whitespace-nowrap font-bold">R$ {product.price}</span><span className="mt-0.5 block text-[9px] text-slate-500">{product.purchases} pedidos</span></td>
                    <td className="px-2 py-2"><span className="block whitespace-nowrap font-semibold">{product.lastPurchase}</span><span className="mt-0.5 block text-[9px] text-slate-500">{product.lastPurchaseNote}</span></td>
                    <td className="px-2 py-2"><span className={`inline-flex min-w-6 justify-center rounded-full px-2 py-1 text-[9px] font-semibold ${product.stock > 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>{product.stock}</span></td>
                    <td className="px-2 py-2"><div className="relative flex justify-center gap-1.5"><Button type="button" variant="outline" size="icon-xs" aria-label={`Editar ${product.name}`} onClick={() => editProduct(product)} className="size-[23px] rounded-md border-slate-200 text-slate-500 hover:text-red-600"><Pencil className="size-3" /></Button><Button type="button" variant="outline" size="icon-xs" aria-label={`Mais ações para ${product.name}`} onClick={() => setOpenMenu((current) => current === product.id ? null : product.id)} className="size-[23px] rounded-md border-slate-200 text-slate-500"><Ellipsis className="size-3.5" /></Button>{openMenu === product.id && <div className="absolute right-0 top-7 z-10 w-32 rounded-md border border-slate-200 bg-white p-1 shadow-lg"><button onClick={() => { setProducts((current) => current.map((item) => item.id === product.id ? { ...item, stock: item.stock + 1 } : item)); setOpenMenu(null); }} className="w-full rounded px-2 py-1.5 text-left text-[10px] hover:bg-slate-50">Adicionar unidade</button><button onClick={() => { setProducts((current) => current.filter((item) => item.id !== product.id)); setOpenMenu(null); }} className="w-full rounded px-2 py-1.5 text-left text-[10px] text-red-600 hover:bg-red-50">Remover produto</button></div>}</div></td>
                  </tr>)}
                  {visibleProducts.length === 0 && <tr><td colSpan={5} className="py-14 text-center text-xs text-slate-400">Nenhum produto encontrado.</td></tr>}</tbody>
                </table>
              </div>

              <footer className="flex flex-wrap items-center justify-between gap-3 pt-3 text-[10px] text-slate-500">
                <span>Mostrando {filtered.length ? (page - 1) * pageSize + 1 : 0}-{Math.min(page * pageSize, filtered.length)} de {filtered.length} produtos</span>
                <nav aria-label="Paginação de produtos" className="flex items-center gap-1"><Button type="button" variant="outline" size="icon-xs" aria-label="Página anterior" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="size-6 rounded-md border-slate-200"><ChevronLeft className="size-3.5" /></Button>{Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => <Button key={pageNumber} type="button" variant={page === pageNumber ? "default" : "outline"} size="icon-xs" aria-current={page === pageNumber ? "page" : undefined} onClick={() => setPage(pageNumber)} className={`size-6 rounded-md text-[10px] ${page === pageNumber ? "border-red-600 bg-red-600 text-white hover:bg-red-700" : "border-slate-200"}`}>{pageNumber}</Button>)}<Button type="button" variant="outline" size="icon-xs" aria-label="Próxima página" disabled={page === pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))} className="size-6 rounded-md border-slate-200"><ChevronRight className="size-3.5" /></Button></nav>
              </footer>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
