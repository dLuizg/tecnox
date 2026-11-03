"use client";

import { useMemo, useState } from "react";
import {
  Bell,
  ChevronDown,
  CircleDollarSign,
  PackageCheck,
  ReceiptText,
  Search,
  ShoppingCart,
} from "lucide-react";
import AppSidebar from "@/src/components/app-sidebar";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";

type Product = {
  sku: string;
  name: string;
  units: number;
  revenue: number;
};

const products: Product[] = [
  { sku: "408", name: "Cabo Turbo Metal Waves - Preto", units: 6, revenue: 239.4 },
  { sku: "412", name: "Cabo USB-C Nylon 2m - Grafite", units: 5, revenue: 174.5 },
  { sku: "215", name: "Carregador Turbo 25W - Branco", units: 5, revenue: 449.5 },
  { sku: "517", name: "Fone Bluetooth Pods Pro", units: 4, revenue: 599.6 },
  { sku: "330", name: "Suporte Veicular Magnético", units: 4, revenue: 199.6 },
  { sku: "771", name: "Bateria iPhone 11 Original", units: 3, revenue: 567 },
  { sku: "664", name: "Tela iPhone XR Incell", units: 3, revenue: 747 },
  { sku: "233", name: "Capa Silicone iPhone 15", units: 3, revenue: 119.7 },
  { sku: "305", name: "Carregador Turbo 20W", units: 2, revenue: 119.8 },
  { sku: "187", name: "Película 3D Vidro Temperado", units: 2, revenue: 49.8 },
];

const months = ["Out", "Nov", "Dez", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set"];
const currentRevenue = [0, 7, 15, 12, 16, 23, 31, 38, 42, 48, 55, 64];
const previousRevenue = [0, 8, 17, 21, 23, 26, 31, 35, 39, 44, 52, 64];
const formatCurrency = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const metrics = [
  { label: "Produtos vendidos", value: "150", change: "5,6%", goal: "Meta 319 un.", progress: 34, icon: PackageCheck },
  { label: "Valor total", value: "R$ 4.150,00", change: "12,4%", goal: "Meta R$ 6.300", progress: 45, icon: CircleDollarSign },
  { label: "Ticket médio", value: "R$ 138,33", change: "3,1%", goal: "Meta R$ 155,00", progress: 62, icon: ReceiptText },
  { label: "Quantidade de pedidos", value: "30", change: "8,0%", goal: "Meta 136 pedidos", progress: 23, icon: ShoppingCart },
];

function chartPoint(index: number, value: number) {
  const x = 54 + index * 55.5;
  const y = 205 - value * 2.75;
  return `${x},${y}`;
}

function linePath(values: number[]) {
  return values.map((value, index) => `${index === 0 ? "M" : "L"} ${chartPoint(index, value)}`).join(" ");
}

function areaPath(values: number[]) {
  return `${linePath(values)} L ${chartPoint(values.length - 1, 0)} L ${chartPoint(0, 0)} Z`;
}

export default function DashboardPage() {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"Mais vendidos" | "Maior faturamento">("Mais vendidos");
  const [showAllProducts, setShowAllProducts] = useState(false);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    return products
      .filter((product) => `${product.name} ${product.sku}`.toLocaleLowerCase("pt-BR").includes(term))
      .sort((first, second) => sortBy === "Mais vendidos" ? second.units - first.units : second.revenue - first.revenue);
  }, [search, sortBy]);

  const visibleProducts = showAllProducts || search.trim() ? filteredProducts : filteredProducts.slice(0, 5);

  return (
    <div className="flex min-h-screen bg-[#f4f4f5] text-[#171717]">
      <AppSidebar className="hidden md:flex" />
      <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:px-[22px] lg:py-5">
        <div className="mx-auto max-w-[1600px]">
          <header className="mb-4 flex items-center justify-between border-b border-[#e5e5e7] pb-3">
            <h1 className="text-[17px] font-extrabold tracking-tight text-[#111827]">DASHBOARD</h1>
            <Button type="button" variant="outline" size="icon-sm" aria-label="Notificações" title="Notificações" className="size-[30px] rounded-lg border-[#e5e5e7] bg-white text-neutral-500 hover:bg-neutral-50">
              <Bell className="size-3.5" />
            </Button>
          </header>

          <section aria-label="Indicadores de vendas" className="mb-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map(({ label, value, change, goal, progress, icon: Icon }) => (
              <Card key={label} variant="dark" className="gap-2 rounded-xl border-0 bg-[#1d1d1f] px-3.5 py-3 text-white shadow-none ring-1 ring-black/5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[9px] text-[#a1a1aa]">{label}</p>
                    <p className="mt-1 text-[22px] font-bold leading-none tracking-tight">{value}</p>
                  </div>
                  <span className="flex size-[22px] shrink-0 items-center justify-center rounded-md bg-[#06361d] text-[#00e565]"><Icon className="size-3.5" strokeWidth={2} /></span>
                </div>
                <div className="flex items-center justify-between gap-2 text-[8px]">
                  <span className="font-medium text-[#00e565]">{change}</span>
                  <span className="truncate text-[#77777d]">{goal}</span>
                </div>
                <div className="flex h-[5px] gap-1">
                  <span className="w-[28%] rounded-full bg-[#3b3b3f]" />
                  <span className="rounded-full bg-[#00df61]" style={{ width: `${progress}%` }} />
                </div>
              </Card>
            ))}
          </section>

          <div className="grid items-start gap-2.5 xl:grid-cols-[minmax(390px,0.92fr)_minmax(0,1.08fr)]">
            <Card variant="dark" className="gap-0 min-w-0 rounded-xl border-0 bg-[#1d1d1f] p-4 text-white shadow-none ring-1 ring-black/5">
              <header className="mb-2.5 flex items-center justify-between gap-3">
                <h2 className="text-[11px] font-medium">Top 10 SKUs mais vendidos</h2>
                <span className="shrink-0 text-[8px] text-[#85858b]">{filteredProducts.length} de 10 SKUs</span>
              </header>

              <div className="mb-2.5 flex flex-wrap gap-1.5">
                <label className="relative min-w-[160px] flex-1">
                  <Search className="absolute left-2.5 top-1/2 size-3 -translate-y-1/2 text-[#88888f]" />
                  <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nome ou SKU" className="h-[30px] rounded-lg border-[#353538] bg-[#151517] pl-7 text-[9px] text-white shadow-none placeholder:text-[#77777d] focus-visible:border-[#00d95f] focus-visible:ring-[#00d95f]/20" />
                </label>
                <label className="relative flex h-[30px] min-w-[118px] items-center rounded-lg border border-[#353538] bg-[#151517] px-2.5">
                  <select aria-label="Ordenar produtos" value={sortBy} onChange={(event) => setSortBy(event.target.value as typeof sortBy)} className="w-full appearance-none bg-transparent pr-4 text-[9px] text-white outline-none">
                    <option className="bg-[#1d1d1f]">Mais vendidos</option>
                    <option className="bg-[#1d1d1f]">Maior faturamento</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 size-3 text-[#99999f]" />
                </label>
              </div>

              <div className="space-y-1.5">
                {visibleProducts.map((product, index) => {
                  const maxRevenue = Math.max(...filteredProducts.map((item) => item.revenue), 1);
                  const barWidth = sortBy === "Mais vendidos" ? `${Math.max(14, product.units / 6 * 100)}%` : `${product.revenue / maxRevenue * 100}%`;
                  return (
                    <article key={product.sku} className={`flex min-h-[45px] items-center gap-2 rounded-lg border px-2.5 py-1.5 transition-colors ${index === 0 ? "border-[#155d34] bg-[#202023]" : "border-[#2e2e32] bg-[#1b1b1e]"}`}>
                      <span className={`w-3 shrink-0 text-center text-[9px] ${index === 0 ? "text-[#00e565]" : "text-[#8a8a90]"}`}>{index + 1}</span>
                      <span className="flex size-[35px] shrink-0 items-center justify-center rounded-md bg-[#e9e9ed] text-[#58585f]"><PackageCheck className="size-4" strokeWidth={1.8} /></span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[8px] text-[#8a8a90]">{product.sku}</p>
                        <h3 className="truncate text-[9px] font-medium text-[#e7e7e9]">{product.name}</h3>
                        <p className="text-[8px] text-[#85858b]">{product.units} unidades vendidas</p>
                      </div>
                      <div className="w-[90px] shrink-0 text-right">
                        <p className="text-[9px] text-[#e7e7e9]">{formatCurrency(product.revenue)}</p>
                        <div className="mt-1 ml-auto h-[3px] w-full rounded-full bg-[#36363a]"><span className="block h-full rounded-full bg-[#00df61]" style={{ width: barWidth }} /></div>
                      </div>
                    </article>
                  );
                })}
                {visibleProducts.length === 0 && <p className="rounded-lg border border-dashed border-[#3a3a3e] py-10 text-center text-[10px] text-[#85858b]">Nenhum SKU encontrado.</p>}
              </div>

              <footer className="mt-3 flex items-center justify-between gap-3 text-[8px] text-[#85858b]">
                <span>Mostrando {visibleProducts.length} de {filteredProducts.length} SKUs</span>
                {!search.trim() && <Button type="button" variant="ghost" onClick={() => setShowAllProducts((show) => !show)} className="h-[24px] rounded-md bg-[#2b2b2f] px-3 text-[8px] font-normal text-[#e4e4e7] hover:bg-[#37373c] hover:text-white">{showAllProducts ? "Ver menos" : "Ver todos"}</Button>}
              </footer>
            </Card>

            <Card variant="dark" className="gap-0 min-w-0 rounded-xl border-0 bg-[#1d1d1f] p-4 text-white shadow-none ring-1 ring-black/5">
              <header className="mb-2 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-[11px] font-semibold">Evolução de vendas</h2>
                  <p className="mt-0.5 text-[8px] text-[#85858b]">Últimos 12 meses (R$)</p>
                </div>
                <div className="flex items-center gap-3 text-[8px] text-[#a1a1aa]">
                  <span className="inline-flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-[#00e565]" />Receita atual</span>
                  <span className="inline-flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-[#73737c]" />Ano anterior</span>
                </div>
              </header>

              <div className="overflow-hidden rounded-lg border border-[#2c2c30] bg-[#151517] px-2 pt-2">
                <svg viewBox="0 0 720 230" className="block h-[174px] w-full sm:h-[210px]" role="img" aria-label="Gráfico de evolução mensal das vendas comparando receita atual e ano anterior">
                  {[30, 74, 118, 162, 206].map((y, index) => (
                    <g key={y}>
                      <line x1="48" x2="700" y1={y} y2={y} stroke="#2b2b2f" strokeWidth="1" />
                      <text x="4" y={y + 3} fill="#73737c" fontSize="10">{["50k", "37,5k", "25k", "12,5k", "0"][index]}</text>
                    </g>
                  ))}
                  <path d={areaPath(currentRevenue)} fill="url(#revenueFill)" />
                  <path d={linePath(previousRevenue)} fill="none" stroke="#71717a" strokeWidth="1.5" strokeDasharray="5 4" />
                  <path d={linePath(currentRevenue)} fill="none" stroke="#00e565" strokeWidth="2.5" />
                  <defs>
                    <linearGradient id="revenueFill" x1="0" x2="0" y1="0" y2="1" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#00e565" stopOpacity="0.34" />
                      <stop offset="1" stopColor="#00e565" stopOpacity="0.015" />
                    </linearGradient>
                  </defs>
                  {months.map((month, index) => <text key={month} x={54 + index * 55.5} y="224" textAnchor="middle" fill="#73737c" fontSize="10">{month}</text>)}
                  <circle cx="664.5" cy={205 - currentRevenue[currentRevenue.length - 1] * 2.75} r="3.5" fill="#00e565" stroke="#151517" strokeWidth="1.5" />
                </svg>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 text-[8px]">
                <div><p className="text-[#85858b]">Total 12 meses</p><p className="mt-0.5 text-[10px] font-semibold text-white">R$ 411 k</p></div>
                <div><p className="text-[#85858b]">Melhor mês</p><p className="mt-0.5 text-[10px] font-semibold text-white">Setembro</p></div>
                <div><p className="text-[#85858b]">vs ano anterior</p><p className="mt-0.5 text-[10px] font-semibold text-[#00e565]">+49%</p></div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
