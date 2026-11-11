"use client";

import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  Search,
} from "lucide-react";
import AppSidebar from "@/src/components/app-sidebar";
import { StockActions } from "@/src/components/stock-actions";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { auth } from "@/src/lib/services/auth_service";
import { listProducts } from "@/src/lib/services/products_service";
import { type Product } from "@/src/lib/types/products_types";
import { listSuppliers } from "@/src/lib/services/suppliers_service";
import { type Supplier } from "@/src/lib/types/suppliers_types";

const pageSize = 8;

export default function ProductListPage() {
  const router = useRouter();
  const routeStoreId = useParams<{ storeId: string }>().storeId;
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [referenceNow, setReferenceNow] = useState(0);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos os status");
  const [periodFilter, setPeriodFilter] = useState("Todo período");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.replace("/signin");
        return;
      }
      try {
        const [records, storeSuppliers] = await Promise.all([
          listProducts(routeStoreId),
          listSuppliers(routeStoreId),
        ]);
        if (active) {
          setProducts(records);
          setSuppliers(storeSuppliers);
          setReferenceNow(Date.now());
        }
      } catch {
        if (active)
          setError(
            "Não foi possível carregar os produtos. Atualize a página e tente novamente.",
          );
      } finally {
        if (active) setLoading(false);
      }
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [router, routeStoreId]);

  const filtered = useMemo(
    () =>
      products.filter((product) => {
        const needle = query.trim().toLocaleLowerCase("pt-BR");
        const supplierName =
          suppliers.find((supplier) => supplier.id === product.supplier)
            ?.name ?? product.supplier;
        const matchesText =
          !needle ||
          `${product.name} ${product.sku} ${product.description} ${product.category} ${product.brand} ${product.model} ${supplierName}`
            .toLocaleLowerCase("pt-BR")
            .includes(needle);
        const matchesStatus =
          statusFilter === "Todos os status" ||
          (statusFilter === "Com estoque"
            ? product.stock > 0
            : product.stock === 0);
        const createdAt = product.createdAt?.toDate().getTime();
        const daysOld =
          createdAt === undefined
            ? Number.POSITIVE_INFINITY
            : (referenceNow - createdAt) / 86_400_000;
        const matchesPeriod =
          periodFilter === "Todo período" ||
          (periodFilter === "Últimos 7 dias" ? daysOld <= 7 : daysOld <= 30);
        return matchesText && matchesStatus && matchesPeriod;
      }),
    [products, suppliers, query, statusFilter, periodFilter, referenceNow],
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visibleProducts = filtered.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  function exportProducts() {
    const rows = [
      [
        "Nome",
        "Categoria",
        "Marca",
        "Modelo",
        "Produto físico",
        "Estoque",
        "Valor de compra",
        "Valor de venda",
        "Comprimento (L, cm)",
        "Altura (A, cm)",
        "Profundidade (P, cm)",
        "Peso (kg)",
        "Fornecedor",
        "SKU",
        "Descrição",
      ],
      ...filtered.map((product) => [
        product.name,
        product.category,
        product.brand,
        product.model,
        product.isPhysicalProduct ? "Sim" : "Não",
        String(product.stock),
        formatBRL(product.purchasePrice),
        formatBRL(product.salePrice),
        optionalValue(product.lengthCm),
        optionalValue(product.heightCm),
        optionalValue(product.widthCm),
        optionalValue(product.weightKg),
        suppliers.find((supplier) => supplier.id === product.supplier)?.name ??
          product.supplier,
        product.sku,
        product.description,
      ]),
    ];
    const csv = rows
      .map((row) =>
        row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(";"),
      )
      .join("\n");
    const url = URL.createObjectURL(
      new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }),
    );
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
        <div className="mx-auto flex min-h-[calc(100vh-56px)] max-w-6xl flex-col">
          <header className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Administração
              </p>
              <h1 className="text-xl font-bold leading-tight tracking-tight sm:text-[23px]">
                Produtos cadastrados
              </h1>
              <p className="mt-1 text-[11px] text-slate-500">
                Consulte os produtos e acompanhe preços e níveis de estoque.
              </p>
            </div>
            <Button
              type="button"
              onClick={() =>
                router.push(
                  `/store/${encodeURIComponent(routeStoreId)}/produtos`,
                )
              }
              className="h-9 rounded-lg bg-red-600 px-3 text-xs font-semibold text-white hover:bg-red-700"
            >
              Cadastrar produto
            </Button>
          </header>

          <section className="flex min-h-[520px] flex-1 flex-col rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_4px_18px_rgba(15,23,42,0.04)] sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-[15px] font-bold">Catálogo da loja</h2>
                <p className="mt-0.5 text-[10px] text-slate-500">
                  Busca e filtros consideram os produtos salvos no Firestore.
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1.5 text-[9px] font-bold uppercase">
                {products.length.toLocaleString("pt-BR")} registros
              </span>
            </div>

            <div className="mb-3 flex flex-wrap items-center gap-2">
              <label className="relative min-w-[190px] flex-1">
                <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                <Input
                  className="h-9 border-slate-200 pl-8 text-xs shadow-none"
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Buscar por nome, SKU, categoria, marca..."
                />
              </label>
              <label className="relative">
                <select
                  aria-label="Filtrar estoque"
                  value={statusFilter}
                  onChange={(event) => {
                    setStatusFilter(event.target.value);
                    setPage(1);
                  }}
                  className="h-9 w-[135px] appearance-none rounded-md border border-slate-200 bg-white px-2.5 pr-7 text-[11px] text-slate-600 outline-none focus:border-red-300"
                >
                  <option>Todos os status</option>
                  <option>Com estoque</option>
                  <option>Sem estoque</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3 -translate-y-1/2 text-slate-500" />
              </label>
              <label className="relative">
                <select
                  aria-label="Filtrar período de cadastro"
                  value={periodFilter}
                  onChange={(event) => {
                    setPeriodFilter(event.target.value);
                    setPage(1);
                  }}
                  className="h-9 w-[145px] appearance-none rounded-md border border-slate-200 bg-white px-2.5 pr-7 text-[11px] text-slate-600 outline-none focus:border-red-300"
                >
                  <option>Todo período</option>
                  <option>Últimos 7 dias</option>
                  <option>Últimos 30 dias</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3 -translate-y-1/2 text-slate-500" />
              </label>
              <Button
                type="button"
                onClick={exportProducts}
                disabled={filtered.length === 0}
                className="h-9 rounded-md bg-red-600 px-3 text-[11px] font-semibold text-white hover:bg-red-700"
              >
                Exportar
              </Button>
            </div>

            {error && (
              <p
                role="status"
                className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700"
              >
                {error}
              </p>
            )}
            <div className="min-w-0 flex-1 overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full min-w-[950px] table-fixed text-left">
                <colgroup>
                  <col className="w-[29%]" />
                  <col className="w-[16%]" />
                  <col className="w-[19%]" />
                  <col className="w-[18%]" />
                  <col className="w-[9%]" />
                  <col className="w-[9%]" />
                  <col className="w-[18%]" />
                </colgroup>
                <thead className="bg-slate-50 text-[9px] font-semibold uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-3">Produto</th>
                    <th className="px-2 py-3">Categoria</th>
                    <th className="px-2 py-3">Compra / venda</th>
                    <th className="px-2 py-3">Fornecedor</th>
                    <th className="px-2 py-3">Estoque</th>
                    <th className="px-2 py-3">Cadastro</th>
                    <th className="px-3 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-14 text-center text-xs text-slate-400"
                      >
                        <LoaderCircle className="mr-2 inline size-4 animate-spin" />
                        Carregando produtos...
                      </td>
                    </tr>
                  )}
                  {!loading &&
                    visibleProducts.map((product) => (
                      <tr
                        key={product.id}
                        className="h-[58px] border-t border-slate-200 text-[10px]"
                      >
                        <td className="px-3 py-2">
                          <span className="block truncate font-bold text-slate-900">
                            {product.name}
                          </span>
                          <span className="mt-0.5 block truncate text-[9px] text-slate-500">
                            {[product.brand, product.model, product.sku]
                              .filter(Boolean)
                              .join(" · ") ||
                              product.description ||
                              "Sem detalhes"}
                          </span>
                        </td>
                        <td className="px-2 py-2">
                          <span className="block truncate font-medium">
                            {product.category}
                          </span>
                          <span className="mt-0.5 block text-[9px] text-slate-500">
                            {product.isPhysicalProduct
                              ? "Físico"
                              : "Não físico"}
                          </span>
                        </td>
                        <td className="px-2 py-2">
                          <span className="block whitespace-nowrap">
                            Compra: {formatBRL(product.purchasePrice)}
                          </span>
                          <span className="mt-0.5 block whitespace-nowrap font-semibold text-slate-800">
                            Venda: {formatBRL(product.salePrice)}
                          </span>
                        </td>
                        <td className="px-2 py-2">
                          <span className="block truncate">
                            {suppliers.find(
                              (supplier) => supplier.id === product.supplier,
                            )?.name ??
                              (product.supplier || "—")}
                          </span>
                        </td>
                        <td className="px-2 py-2">
                          <span
                            className={`inline-flex min-w-7 justify-center rounded-full px-2 py-1 text-[9px] font-semibold ${product.stock > 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}
                          >
                            {product.stock}
                          </span>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-slate-600">
                          {product.createdAt
                            ? product.createdAt
                                .toDate()
                                .toLocaleDateString("pt-BR")
                            : "—"}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <StockActions
                            product={product}
                            onStockChange={(stock) =>
                              setProducts((current) =>
                                current.map((item) =>
                                  item.id === product.id
                                    ? { ...item, stock }
                                    : item,
                                ),
                              )
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  {!loading && visibleProducts.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-14 text-center text-xs text-slate-400"
                      >
                        {error ? "" : "Nenhum produto encontrado."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <footer className="flex flex-wrap items-center justify-between gap-3 pt-3 text-[10px] text-slate-500">
              <span>
                Mostrando {filtered.length ? (page - 1) * pageSize + 1 : 0}-
                {Math.min(page * pageSize, filtered.length)} de{" "}
                {filtered.length} produtos
              </span>
              <nav
                aria-label="Paginação de produtos"
                className="flex items-center gap-1"
              >
                <Button
                  type="button"
                  variant="outline"
                  size="icon-xs"
                  aria-label="Página anterior"
                  disabled={page === 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  className="size-7 rounded-md border-slate-200"
                >
                  <ChevronLeft className="size-3.5" />
                </Button>
                {Array.from({ length: pageCount }, (_, index) => index + 1).map(
                  (pageNumber) => (
                    <Button
                      key={pageNumber}
                      type="button"
                      variant={page === pageNumber ? "default" : "outline"}
                      size="icon-xs"
                      aria-current={page === pageNumber ? "page" : undefined}
                      onClick={() => setPage(pageNumber)}
                      className={`size-7 rounded-md text-[10px] ${page === pageNumber ? "border-red-600 bg-red-600 text-white hover:bg-red-700" : "border-slate-200"}`}
                    >
                      {pageNumber}
                    </Button>
                  ),
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="icon-xs"
                  aria-label="Próxima página"
                  disabled={page === pageCount}
                  onClick={() =>
                    setPage((current) => Math.min(pageCount, current + 1))
                  }
                  className="size-7 rounded-md border-slate-200"
                >
                  <ChevronRight className="size-3.5" />
                </Button>
              </nav>
            </footer>
          </section>
        </div>
      </main>
    </div>
  );
}

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function optionalValue(value: number | null | undefined) {
  return value === null || value === undefined
    ? ""
    : String(value).replace(".", ",");
}
