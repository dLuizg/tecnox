"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import {
  adjustStock,
  getProductStock,
  listStockMovements,
  StockChangedError,
  type Product,
  type StockMovement,
  type StockMovementType,
} from "@/src/lib/products";

type ManualType = Exclude<StockMovementType, "sale">;
const labels: Record<StockMovementType, string> = {
  entry: "Entrada",
  removal: "Saída",
  count: "Contagem",
  sale: "Venda",
};

export function StockActions({
  product,
  onStockChange,
}: {
  product: Product;
  onStockChange: (stock: number) => void;
}) {
  const [view, setView] = useState<"adjust" | "history" | null>(null);
  const [type, setType] = useState<ManualType>("entry");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [current, setCurrent] = useState(product.stock);
  const [updatedAt, setUpdatedAt] = useState(product.updatedAt);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const amount = quantity === "" ? NaN : Number(quantity);
  const result =
    type === "entry"
      ? current + amount
      : type === "removal"
        ? current - amount
        : amount;
  const valid =
    Number.isSafeInteger(amount) &&
    amount >= (type === "count" ? 0 : 1) &&
    Number.isSafeInteger(result) &&
    result >= 0;

  async function openAdjust() {
    setType("entry");
    setQuantity("");
    setReason("");
    setCurrent(product.stock);
    setUpdatedAt(product.updatedAt);
    setError("");
    setNotice("");
    setView("adjust");
    setBusy(true);
    try {
      const latest = await getProductStock(product.id);
      setCurrent(latest.stock);
      setUpdatedAt(latest.updatedAt);
      onStockChange(latest.stock);
    } catch {
      setView(null);
      setNotice("Não foi possível carregar o estoque. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }
  async function openHistory() {
    setError("");
    setNotice("");
    setMovements([]);
    setView("history");
    setBusy(true);
    try {
      setMovements(await listStockMovements(product.id));
    } catch {
      setError("Não foi possível carregar o histórico. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }
  async function save() {
    if (!valid) {
      setError(
        "Informe uma quantidade válida que não deixe o estoque negativo.",
      );
      return;
    }
    setBusy(true);
    setError("");
    try {
      const stock = await adjustStock(
        product.storeId,
        product.id,
        type,
        amount,
        reason,
        current,
        updatedAt,
      );
      onStockChange(stock);
      setView(null);
      setNotice("Estoque atualizado com sucesso.");
    } catch (err) {
      if (err instanceof StockChangedError) {
        setCurrent(err.latestStock);
        setUpdatedAt(err.latestUpdatedAt);
        onStockChange(err.latestStock);
        setError(err.message);
      } else
        setError(
          err instanceof Error && !("code" in err)
            ? err.message
            : "Não foi possível atualizar o estoque. Tente novamente.",
        );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="flex flex-wrap gap-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 text-[10px]"
          onClick={openAdjust}
        >
          Ajustar estoque
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 text-[10px]"
          onClick={openHistory}
        >
          Histórico
        </Button>
      </div>
      {notice && (
        <span role="status" className="text-[10px] text-emerald-700">
          {notice}
        </span>
      )}
      <Dialog
        open={view !== null}
        onOpenChange={(open) => {
          if (!open && !busy) setView(null);
        }}
      >
        <DialogContent
          className="max-h-[85vh] overflow-y-auto sm:max-w-lg"
          showCloseButton={!busy}
        >
          <DialogHeader>
            <DialogTitle>
              {view === "adjust" ? "Ajustar estoque" : "Histórico de estoque"}
            </DialogTitle>
            <DialogDescription>
              {product.name}
              {product.sku ? ` · ${product.sku}` : ""}
            </DialogDescription>
          </DialogHeader>
          {view === "adjust" ? (
            <div className="space-y-3">
              <p>
                Estoque atual: <strong>{current}</strong>
              </p>
              <label className="block space-y-1">
                <span>Tipo de ajuste</span>
                <select
                  className="h-9 w-full rounded-md border border-slate-200 bg-white px-2"
                  value={type}
                  onChange={(event) =>
                    setType(event.target.value as ManualType)
                  }
                >
                  <option value="entry">Entrada</option>
                  <option value="removal">Saída</option>
                  <option value="count">Ajuste por contagem</option>
                </select>
              </label>
              <label className="block space-y-1">
                <span>
                  {type === "count" ? "Quantidade contada" : "Quantidade"}
                </span>
                <Input
                  type="number"
                  min={type === "count" ? 0 : 1}
                  step="1"
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                />
              </label>
              <label className="block space-y-1">
                <span>Motivo (opcional)</span>
                <Input
                  value={reason}
                  maxLength={500}
                  onChange={(event) => setReason(event.target.value)}
                />
              </label>
              <p>
                Estoque atual: {current} → Novo estoque:{" "}
                <strong>{valid ? result : "—"}</strong>
              </p>
            </div>
          ) : (
            <div className="space-y-3" aria-live="polite">
              {busy ? (
                <p>Carregando histórico...</p>
              ) : !error && movements.length === 0 ? (
                <p>Nenhuma movimentação registrada.</p>
              ) : (
                movements.map((movement) => (
                  <div
                    key={movement.id}
                    className="rounded-md border p-3 text-xs"
                  >
                    <p className="font-semibold">
                      {labels[movement.type]} · {movement.quantity}{" "}
                      {movement.quantity === 1 ? "unidade" : "unidades"}
                    </p>
                    <p>
                      Estoque: {movement.previousStock} →{" "}
                      {movement.resultingStock}
                    </p>
                    <p>
                      {movement.createdAt?.toDate().toLocaleString("pt-BR") ??
                        "Data indisponível"}{" "}
                      · Usuário: {movement.createdBy}
                    </p>
                    {movement.reason && <p>Motivo: {movement.reason}</p>}
                    {movement.saleId && <p>Venda: {movement.saleId}</p>}
                  </div>
                ))
              )}
            </div>
          )}
          {error && (
            <p role="alert" className="rounded-md bg-red-50 p-2 text-red-700">
              {error}
            </p>
          )}
          {view === "adjust" && (
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => setView(null)}
              >
                Cancelar
              </Button>
              <Button type="button" disabled={busy || !valid} onClick={save}>
                {busy ? "Salvando..." : "Salvar ajuste"}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
