"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Minus, Plus, Search, ShoppingBag, X } from "lucide-react";
import AppSidebar from "@/src/components/app-sidebar";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { useParams } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/src/lib/auth";
import { listProducts, type Product } from "@/src/lib/products";
import { listClients, type Client } from "@/src/lib/clients";
import { CheckoutError, completeSale, type Checkout, type Payment } from "@/src/lib/sales";

type CartLine = { productId: string; quantity: number };

const money = (amount: number) => amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fieldStyle = "h-10 rounded-lg border-slate-200 bg-white text-sm shadow-none placeholder:text-slate-400 focus-visible:border-red-400 focus-visible:ring-red-100";

export default function NovaVendaPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const saleId = useRef<string | null>(null);
  const pendingCheckout = useRef<Checkout | null>(null);
  const [uncertain, setUncertain] = useState(false);
  const [search, setSearch] = useState("");
  const [customer, setCustomer] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [payment, setPayment] = useState<Payment>("Pix");
  const [saleComplete, setSaleComplete] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      const saved = localStorage.getItem(`pending-sale:${storeId}:${user.uid}`);
      if (saved) {
        try {
          const checkout = JSON.parse(saved) as Checkout;
          if (checkout.storeId === storeId && checkout.saleId.startsWith(`${user.uid}_`) && Array.isArray(checkout.items)) {
            pendingCheckout.current = checkout;
            saleId.current = checkout.saleId;
            setCustomer(checkout.clientId);
            setPayment(checkout.payment);
            setCart(checkout.items.map(({ productId, quantity }) => ({ productId, quantity })));
            setUncertain(true);
            setError("Há uma venda pendente de confirmação. Verifique o resultado antes de continuar.");
          }
        } catch { setError("Não foi possível recuperar a venda pendente neste navegador."); }
      }
      try {
        const [loadedProducts, loadedCustomers] = await Promise.all([listProducts(storeId), listClients(storeId)]);
        setProducts(loadedProducts);
        setCustomers(loadedCustomers);
      } catch {
        setError("Não foi possível carregar produtos e clientes.");
      } finally { setLoading(false); }
    });
  }, [storeId]);

  const visibleProducts = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    return products.filter((product) => `${product.name} ${product.sku}`.toLocaleLowerCase("pt-BR").includes(term));
  }, [search, products]);

  const cartItems = cart.flatMap((line) => {
    const product = products.find((item) => item.id === line.productId);
    return product ? [{ ...product, quantity: line.quantity }] : [];
  });
  const subtotal = cartItems.reduce((total, item) => total + item.salePrice * item.quantity, 0);
  const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);

  function addProduct(product: Product) {
    setCart((current) => {
      const line = current.find((item) => item.productId === product.id);
      if (line) {
        if (line.quantity >= product.stock) return current;
        return current.map((item) => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return product.stock > 0 && current.length < 5 ? [...current, { productId: product.id, quantity: 1 }] : current;
    });
  }

  function changeQuantity(productId: string, amount: number) {
    const product = products.find((item) => item.id === productId);
    setCart((current) => current.flatMap((item) => {
      if (item.productId !== productId) return [item];
      const quantity = item.quantity + amount;
      return quantity <= 0 ? [] : [{ ...item, quantity: Math.min(quantity, product?.stock ?? quantity) }];
    }));
  }

  async function finishSale() {
    if ((!pendingCheckout.current && (!cartItems.length || !customer)) || submittingRef.current || !auth.currentUser) return;
    submittingRef.current = true;
    setSubmitting(true);
    setError("");
    try {
      const checkout = pendingCheckout.current ?? { storeId, clientId: customer, saleId: saleId.current ?? `${auth.currentUser.uid}_${crypto.randomUUID()}`, payment, items: cartItems.map((item) => ({ productId: item.id, quantity: item.quantity, priceCents: Math.round(item.salePrice * 100) })) };
      saleId.current = checkout.saleId;
      pendingCheckout.current = checkout;
      localStorage.setItem(`pending-sale:${storeId}:${auth.currentUser.uid}`, JSON.stringify(checkout));
      await completeSale(checkout);
      localStorage.removeItem(`pending-sale:${storeId}:${auth.currentUser.uid}`);
      setUncertain(false);
      setSaleComplete(true);
    } catch (err) {
      const code = typeof err === "object" && err !== null && "code" in err ? String(err.code) : "";
      if (err instanceof CheckoutError || ["permission-denied", "invalid-argument", "unauthenticated"].includes(code)) {
        if (auth.currentUser) localStorage.removeItem(`pending-sale:${storeId}:${auth.currentUser.uid}`);
        pendingCheckout.current = null;
        setUncertain(false);
        setError(err instanceof Error ? err.message : "Não foi possível finalizar a venda.");
        try { setProducts(await listProducts(storeId)); } catch { /* Preserve cart and retry later. */ }
      } else {
        setUncertain(true);
        setError("Não foi possível confirmar a venda. Tente finalizar novamente para verificar o resultado.");
      }
    } finally { submittingRef.current = false; setSubmitting(false); }
  }

  async function startNextSale() {
    try { setProducts(await listProducts(storeId)); } catch { setError("Não foi possível atualizar os produtos. Recarregue a página antes de registrar outra venda."); }
    setCart([]);
    setCustomer("");
    saleId.current = null;
    pendingCheckout.current = null;
    setPayment("Pix");
    setSaleComplete(false);
  }

  return (
    <div className="flex min-h-screen bg-[#f5f7fb] text-slate-900">
      <AppSidebar className="hidden md:flex" />
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-7 lg:px-8 lg:py-7">
        <div className="mx-auto max-w-6xl">
          <header className="mb-5"><p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Vendas</p><h1 className="text-xl font-bold tracking-tight">Nova venda</h1><p className="mt-1 text-xs text-slate-500">Selecione os produtos e finalize o pedido.</p></header>

          {error && <p role="alert" className="mb-3 text-xs text-red-600">{error}</p>}
          {loading && <p className="mb-3 text-xs text-neutral-500">Carregando produtos e clientes...</p>}
          <fieldset disabled={submitting || uncertain || saleComplete} className="grid w-full items-start gap-4 xl:grid-cols-[minmax(0,1fr)_322px] 2xl:gap-[18px]">
            <section className="min-w-0">
              <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-[240px_minmax(0,1fr)]">
                <label className="relative block"><select aria-label="Cliente da venda" value={customer} onChange={(event) => setCustomer(event.target.value)} className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-8 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"><option value="">Selecione um cliente</option>{customers.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" /></label>
                <label className="relative block"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><Input className={`${fieldStyle} pl-9`} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar produto por nome ou SKU..." /></label>
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {visibleProducts.map((product) => {
                  const line = cart.find((item) => item.productId === product.id);
                  const isUnavailable = product.stock === 0 || (line?.quantity ?? 0) >= product.stock || (!line && cart.length >= 5);
                  return <article key={product.id} className="flex min-h-[76px] items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-slate-300">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-400"><ShoppingBag className="size-4 opacity-0" aria-hidden="true" /></div>
                    <div className="min-w-0 flex-1"><h2 className="truncate text-[10px] font-semibold leading-tight">{product.name}</h2><p className="mt-0.5 text-[9px] text-neutral-400">SKU {product.sku}</p><p className="mt-1 text-[11px] font-bold">{money(product.salePrice)}</p></div>
                    <Button type="button" size="icon-sm" aria-label={`Adicionar ${product.name}`} disabled={isUnavailable} onClick={() => addProduct(product)} className="size-[22px] shrink-0 rounded-full bg-[#ed3838] p-0 text-white hover:bg-red-600 disabled:bg-neutral-300"><Plus className="size-3.5" /></Button>
                  </article>;
                })}
                {visibleProducts.length === 0 && <div className="col-span-full rounded-lg border border-dashed border-neutral-200 py-10 text-center text-[11px] text-neutral-400">Nenhum produto encontrado.</div>}
              </div>
            </section>

            <aside className="flex min-h-[555px] flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <header className="border-b border-neutral-100 pb-2"><p className="mb-1 text-[10px] text-neutral-500">Até 5 produtos diferentes por venda.</p><h2 className="text-[12px] font-bold">Carrinho <span className="ml-1 text-[10px] font-normal text-neutral-400">({totalItems})</span></h2></header>

              <div className="min-h-[92px] flex-1 divide-y divide-neutral-100 overflow-y-auto">
                {cartItems.map((item) => <div key={item.id} className="py-2.5">
                  <div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="truncate text-[10px] font-medium">{item.name}</p><p className="mt-0.5 text-[9px] text-neutral-400">{item.quantity}x · {money(item.salePrice)} un.</p></div><span className="shrink-0 text-[10px] font-semibold">{money(item.salePrice * item.quantity)}</span></div>
                  <div className="mt-1 flex items-center justify-between"><div className="flex items-center gap-1"><button type="button" onClick={() => changeQuantity(item.id, -1)} aria-label={`Diminuir ${item.name}`} className="flex size-5 items-center justify-center rounded border border-neutral-200 text-neutral-500 hover:bg-neutral-50"><Minus className="size-2.5" /></button><span className="min-w-4 text-center text-[9px]">{item.quantity}</span><button type="button" onClick={() => changeQuantity(item.id, 1)} aria-label={`Aumentar ${item.name}`} disabled={item.quantity >= item.stock} className="flex size-5 items-center justify-center rounded border border-neutral-200 text-neutral-500 hover:bg-neutral-50 disabled:opacity-40"><Plus className="size-2.5" /></button></div><button type="button" onClick={() => setCart((current) => current.filter((line) => line.productId !== item.id))} aria-label={`Remover ${item.name}`} className="rounded p-1 text-neutral-400 hover:text-red-500"><X className="size-3" /></button></div>
                </div>)}
                {cartItems.length === 0 && <p className="py-8 text-center text-[10px] text-neutral-400">Adicione produtos para iniciar a venda.</p>}
              </div>

              <div className="border-t border-neutral-100 pt-3">
                <div className="flex justify-between py-1 text-[10px]"><span className="text-neutral-600">Subtotal</span><span>{money(subtotal)}</span></div>
                <div className="flex justify-between py-1 text-[10px]"><span className="text-neutral-600">Desconto</span><span>- {money(0)}</span></div>
                <div className="flex justify-between pb-3 pt-0.5"><span className="text-[14px] font-bold">Total</span><span className="text-[15px] font-extrabold">{money(subtotal)}</span></div>

                <fieldset>
                  <legend className="mb-2 text-[9px] font-medium uppercase text-neutral-400">Forma de pagamento</legend>
                  <div className="grid grid-cols-3 gap-1.5">{(["Dinheiro", "Cartão", "Pix"] as const).map((method) => <button type="button" key={method} onClick={() => setPayment(method)} aria-pressed={payment === method} className={`h-[28px] rounded-md border text-[10px] transition ${payment === method ? "border-[#ed3838] bg-[#ed3838] font-medium text-white" : "border-neutral-200 bg-white hover:bg-neutral-50"}`}>{method}</button>)}</div>
                </fieldset>
                <Button type="button" disabled={loading || submitting || cartItems.length === 0 || !customer} onClick={finishSale} className="mt-2.5 h-[35px] w-full rounded-md bg-[#ed3838] text-[11px] font-semibold text-white hover:bg-red-600 disabled:bg-neutral-300">{submitting ? "Finalizando..." : "Finalizar Venda"}</Button>
              </div>
            </aside>
          </fieldset>
          {uncertain && <Button type="button" disabled={submitting} onClick={finishSale} className="mt-3 bg-red-600 text-white">{submitting ? "Verificando..." : "Verificar venda"}</Button>}
        </div>
      </main>

      {saleComplete && <div role="presentation" className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"><section role="dialog" aria-modal="true" aria-labelledby="sale-confirmation-title" onClick={(event) => event.stopPropagation()} className="w-full max-w-sm rounded-xl bg-white p-6 text-center shadow-xl"><span className="mx-auto mb-3 flex size-11 items-center justify-center rounded-full bg-green-50 text-green-600"><Check className="size-5" /></span><h2 id="sale-confirmation-title" className="text-base font-bold">Venda finalizada</h2><p className="mt-1 text-xs text-neutral-500">Total de {money(subtotal)} · pagamento em {payment}{customer ? ` · ${customers.find((client) => client.id === customer)?.name ?? ""}` : ""}</p><Button type="button" onClick={startNextSale} className="mt-5 h-9 bg-red-600 text-xs text-white hover:bg-red-700">Iniciar nova venda</Button></section></div>}
    </div>
  );
}
