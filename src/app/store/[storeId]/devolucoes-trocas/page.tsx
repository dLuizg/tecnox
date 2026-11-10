"use client";

import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useParams } from "next/navigation";
import { CircleCheck, RotateCcw, Search } from "lucide-react";
import AppSidebar from "@/src/components/app-sidebar";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { auth } from "@/src/lib/auth";
import { cancelSale, listSales, type Sale } from "@/src/lib/sales";

const reasons = [
  "Produto não serve",
  "Diferente do esperado",
  "Compra por engano",
  "Outro motivo",
];

const currency = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const date = (sale: Sale) =>
  sale.createdAt?.toDate().toLocaleString("pt-BR") ?? "—";

export default function DevolucoesTrocasPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Sale | null>(null);
  const [reason, setReason] = useState("");
  const [otherReason, setOtherReason] = useState("");
  const [restoreStock, setRestoreStock] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState<Sale | null>(null);

  useEffect(
    () =>
      onAuthStateChanged(auth, async (user) => {
        if (!user) {
          setLoading(false);
          setError("Faça login para consultar as vendas.");
          return;
        }

        setLoading(true);

        try {
          setSales(await listSales(storeId));
          setError("");
        } catch {
          setError("Não foi possível carregar as vendas. Tente novamente.");
        } finally {
          setLoading(false);
        }
      }),
    [storeId],
  );

  const available = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");

    return sales.filter(
      (sale) =>
        sale.status === "Concluída" &&
        !sale.cancelled &&
        `${sale.orderNumber} ${sale.customer}`
          .toLocaleLowerCase("pt-BR")
          .includes(term),
    );
  }, [sales, search]);

  async function submit() {
    if (!selected || submitting) return;

    const value = reason === "Outro motivo" ? otherReason.trim() : reason;

    if (!value) {
      setError("Informe o motivo do cancelamento.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await cancelSale({
        storeId,
        saleId: selected.id,
        reason: value,
        restoreStock,
      });

      setSales((current) => current.filter((sale) => sale.id !== selected.id));
      setCompleted(selected);
    } catch (cause) {
      setError(
        cause instanceof Error && !("code" in cause)
          ? cause.message
          : "Não foi possível cancelar a venda. Verifique os dados e tente novamente.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setSelected(null);
    setReason("");
    setOtherReason("");
    setRestoreStock(true);
    setCompleted(null);
    setSearch("");
    setError("");
  }

  return (
    <div className="flex min-h-screen bg-[#f5f7fb] text-slate-900">
      <AppSidebar className="hidden md:flex" />

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-7 lg:px-8 lg:py-7">
        <div className="mx-auto max-w-6xl">
          <h1 className="mb-4 text-[17px] font-extrabold tracking-tight">
            DEVOLUÇÃO DE VENDA
          </h1>

          <section className="w-full max-w-[555px] rounded-lg border border-neutral-200 bg-white p-4">
            {completed ? (
              <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
                <CircleCheck className="mb-3 size-10 text-emerald-600" />

                <h2 className="text-sm font-bold">Venda cancelada</h2>

                <p className="mt-2 text-xs text-neutral-500">
                  A venda #{completed.orderNumber} foi cancelada
                  {restoreStock ? " e os itens foram devolvidos ao estoque" : ""}.
                </p>

                <Button
                  type="button"
                  onClick={reset}
                  className="mt-5 text-xs"
                >
                  Cancelar outra venda
                </Button>
              </div>
            ) : (
              <>
                <h2 className="text-sm font-bold">Cancelar venda</h2>

                <p className="mt-1 text-xs text-neutral-500">
                  Selecione uma venda e informe o motivo do cancelamento.
                </p>

                <div className="mt-4">
                  <label
                    htmlFor="sale-search"
                    className="mb-1.5 block text-[10px] font-semibold uppercase text-slate-500"
                  >
                    1. Selecione a venda
                  </label>

                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-neutral-400" />

                    <Input
                      id="sale-search"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Buscar por número ou cliente..."
                      className="h-9 pl-8 text-xs"
                    />
                  </div>

                  {loading ? (
                    <p className="mt-2 text-xs text-neutral-500">
                      Carregando vendas...
                    </p>
                  ) : (
                    <div className="mt-2 max-h-48 overflow-y-auto rounded-md border border-neutral-200">
                      {available.map((sale) => (
                        <button
                          key={sale.id}
                          type="button"
                          aria-pressed={selected?.id === sale.id}
                          onClick={() => setSelected(sale)}
                          className={`block w-full border-b border-neutral-100 px-3 py-2 text-left text-xs last:border-0 hover:bg-neutral-50 ${
                            selected?.id === sale.id ? "bg-slate-100" : ""
                          }`}
                        >
                          <span className="font-semibold">
                            #{sale.orderNumber} · {sale.customer}
                          </span>

                          <span className="mt-1 block text-neutral-500">
                            {date(sale)} · {currency(sale.totalCents)}
                          </span>
                        </button>
                      ))}

                      {!available.length && (
                        <p className="p-3 text-xs text-neutral-500">
                          Nenhuma venda disponível para cancelamento.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {selected && (
                  <div className="mt-3 rounded-md bg-neutral-50 p-3 text-xs">
                    <p className="font-semibold">
                      Venda #{selected.orderNumber} · {selected.customer}
                    </p>

                    <p className="mt-1 text-neutral-500">{date(selected)}</p>

                    <ul className="mt-2 space-y-1">
                      {selected.items.map((item) => (
                        <li key={item.productId}>
                          {item.quantity} × {item.name} ·{" "}
                          {currency(item.totalCents)}
                        </li>
                      ))}
                    </ul>

                    <p className="mt-2 font-semibold">
                      Total: {currency(selected.totalCents)}
                    </p>
                  </div>
                )}

                <fieldset className="mt-4">
                  <legend className="mb-1.5 text-[10px] font-semibold uppercase text-slate-500">
                    2. Motivo do cancelamento
                  </legend>

                  <div className="flex flex-wrap gap-1.5">
                    {reasons.map((option) => (
                      <button
                        key={option}
                        type="button"
                        aria-pressed={reason === option}
                        onClick={() => setReason(option)}
                        className={`rounded-full border px-2.5 py-1.5 text-[10px] ${
                          reason === option
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-neutral-200 hover:bg-neutral-50"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>

                  {reason === "Outro motivo" && (
                    <textarea
                      aria-label="Descreva o motivo"
                      value={otherReason}
                      onChange={(event) => setOtherReason(event.target.value)}
                      maxLength={500}
                      placeholder="Descreva o motivo do cancelamento..."
                      className="mt-2 min-h-[58px] w-full rounded-md border border-neutral-200 p-2 text-xs"
                    />
                  )}
                </fieldset>

                <label className="mt-4 flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={restoreStock}
                    onChange={(event) => setRestoreStock(event.target.checked)}
                    className="size-4 accent-slate-900"
                  />
                  Devolver itens ao estoque
                </label>

                {error && (
                  <p role="alert" className="mt-3 text-xs text-red-600">
                    {error}
                  </p>
                )}

                <div className="mt-4 flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={reset}
                    disabled={submitting}
                    className="text-xs"
                  >
                    Limpar
                  </Button>

                  <Button
                    type="button"
                    onClick={submit}
                    disabled={
                      !selected ||
                      !reason ||
                      (reason === "Outro motivo" && !otherReason.trim()) ||
                      submitting
                    }
                    className="flex-1 bg-slate-900 text-xs text-white"
                  >
                    <RotateCcw className="size-3.5" />
                    {submitting ? "Cancelando..." : "Cancelar venda"}
                  </Button>
                </div>
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
