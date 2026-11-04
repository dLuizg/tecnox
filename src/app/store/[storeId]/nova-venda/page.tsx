"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, Minus, Plus, Search, ShoppingBag, X } from "lucide-react";
import AppSidebar from "@/src/components/app-sidebar";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";

type Product = { id: number; name: string; sku: string; price: number; stock: number };
type CartLine = { productId: number; quantity: number };

const products: Product[] = [
  { id: 1, name: "Cabo Turbo Metal Waves - Preto", sku: "408", price: 45, stock: 24 },
  { id: 2, name: "Fone Bluetooth TWS Pro", sku: "512", price: 129.9, stock: 18 },
  { id: 3, name: "Capa Silicone iPhone 15", sku: "233", price: 39.9, stock: 30 },
  { id: 4, name: "Película 3D Vidro Temperado", sku: "187", price: 24.9, stock: 42 },
  { id: 5, name: "Carregador Turbo 20W", sku: "305", price: 59.9, stock: 16 },
  { id: 6, name: "Bateria iPhone 11 Original", sku: "771", price: 189, stock: 9 },
  { id: 7, name: "Tela iPhone XR Incell", sku: "664", price: 249, stock: 7 },
  { id: 8, name: "Suporte Veicular Magnético", sku: "902", price: 34.9, stock: 21 },
];

const customers = ["Venda Avulsa (sem cliente)", "João da Silva", "Maria Oliveira", "Costa & Filhos LTDA", "Ana Ferreira"];
const money = (amount: number) => amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fieldStyle = "h-[32px] rounded-md border-[#dedede] bg-white text-[10px] shadow-none placeholder:text-neutral-400 focus-visible:border-red-400 focus-visible:ring-red-100";

export default function NovaVendaPage() {
  const [search, setSearch] = useState("");
  const [customer, setCustomer] = useState(customers[0]);
  const [cart, setCart] = useState<CartLine[]>([
    { productId: 1, quantity: 2 },
    { productId: 2, quantity: 1 },
  ]);
  const [payment, setPayment] = useState<"Dinheiro" | "Cartão" | "Pix">("Pix");
  const [saleComplete, setSaleComplete] = useState(false);

  const visibleProducts = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    return products.filter((product) => `${product.name} ${product.sku}`.toLocaleLowerCase("pt-BR").includes(term));
  }, [search]);

  const cartItems = cart.flatMap((line) => {
    const product = products.find((item) => item.id === line.productId);
    return product ? [{ ...product, quantity: line.quantity }] : [];
  });
  const subtotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);

  function addProduct(product: Product) {
    setCart((current) => {
      const line = current.find((item) => item.productId === product.id);
      if (line) {
        if (line.quantity >= product.stock) return current;
        return current.map((item) => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return product.stock > 0 ? [...current, { productId: product.id, quantity: 1 }] : current;
    });
  }

  function changeQuantity(productId: number, amount: number) {
    const product = products.find((item) => item.id === productId);
    setCart((current) => current.flatMap((item) => {
      if (item.productId !== productId) return [item];
      const quantity = item.quantity + amount;
      return quantity <= 0 ? [] : [{ ...item, quantity: Math.min(quantity, product?.stock ?? quantity) }];
    }));
  }

  function finishSale() {
    if (!cartItems.length) return;
    setSaleComplete(true);
  }

  function startNextSale() {
    setCart([]);
    setCustomer(customers[0]);
    setPayment("Pix");
    setSaleComplete(false);
  }

  return (
    <div className="flex min-h-screen bg-white text-neutral-900">
      <AppSidebar className="hidden md:flex" />
      <main className="min-w-0 flex-1 px-5 py-8 sm:px-7 lg:px-[clamp(28px,4vw,52px)] lg:py-11">
        <div className="mx-auto max-w-[1500px]">
          <h1 className="mb-4 text-[17px] font-extrabold tracking-tight">NOVA VENDA</h1>

          <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_322px] 2xl:gap-[18px]">
            <section className="min-w-0">
              <div className="mb-3 grid grid-cols-1 gap-2.5 sm:grid-cols-[188px_minmax(0,1fr)]">
                <label className="relative block"><select aria-label="Cliente da venda" value={customer} onChange={(event) => setCustomer(event.target.value)} className="h-[32px] w-full appearance-none rounded-md border border-[#dedede] bg-white px-2.5 pr-7 text-[10px] outline-none focus:border-red-300"><option>{customers[0]}</option>{customers.slice(1).map((name) => <option key={name}>{name}</option>)}</select><ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3 -translate-y-1/2 text-neutral-500" /></label>
                <label className="relative block"><Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-neutral-400" /><Input className={`${fieldStyle} pl-7`} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar produto por nome, SKU ou código de barras..." /></label>
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {visibleProducts.map((product) => {
                  const line = cart.find((item) => item.productId === product.id);
                  const isUnavailable = product.stock === 0 || (line?.quantity ?? 0) >= product.stock;
                  return <article key={product.id} className="flex min-h-[65px] items-center gap-2 rounded-lg border border-[#e8e8e8] bg-white px-2 py-1.5 transition hover:border-neutral-300">
                    <div className="flex size-[49px] shrink-0 items-center justify-center rounded-md bg-[#eeeeee] text-neutral-400"><ShoppingBag className="size-4 opacity-0" aria-hidden="true" /></div>
                    <div className="min-w-0 flex-1"><h2 className="truncate text-[10px] font-semibold leading-tight">{product.name}</h2><p className="mt-0.5 text-[9px] text-neutral-400">SKU {product.sku}</p><p className="mt-1 text-[11px] font-bold">{money(product.price)}</p></div>
                    <Button type="button" size="icon-sm" aria-label={`Adicionar ${product.name}`} disabled={isUnavailable} onClick={() => addProduct(product)} className="size-[22px] shrink-0 rounded-full bg-[#ed3838] p-0 text-white hover:bg-red-600 disabled:bg-neutral-300"><Plus className="size-3.5" /></Button>
                  </article>;
                })}
                {visibleProducts.length === 0 && <div className="col-span-full rounded-lg border border-dashed border-neutral-200 py-10 text-center text-[11px] text-neutral-400">Nenhum produto encontrado.</div>}
              </div>
            </section>

            <aside className="flex min-h-[555px] flex-col rounded-lg border border-[#dedede] bg-white p-4">
              <header className="border-b border-neutral-100 pb-2"><h2 className="text-[12px] font-bold">Carrinho <span className="ml-1 text-[10px] font-normal text-neutral-400">({totalItems})</span></h2></header>

              <div className="min-h-[92px] flex-1 divide-y divide-neutral-100 overflow-y-auto">
                {cartItems.map((item) => <div key={item.id} className="py-2.5">
                  <div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="truncate text-[10px] font-medium">{item.name}</p><p className="mt-0.5 text-[9px] text-neutral-400">{item.quantity}x · {money(item.price)} un.</p></div><span className="shrink-0 text-[10px] font-semibold">{money(item.price * item.quantity)}</span></div>
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
                <Button type="button" disabled={cartItems.length === 0} onClick={finishSale} className="mt-2.5 h-[35px] w-full rounded-md bg-[#ed3838] text-[11px] font-semibold text-white hover:bg-red-600 disabled:bg-neutral-300">Finalizar Venda</Button>
              </div>
            </aside>
          </div>
        </div>
      </main>

      {saleComplete && <div role="presentation" onClick={() => setSaleComplete(false)} className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"><section role="dialog" aria-modal="true" aria-labelledby="sale-confirmation-title" onClick={(event) => event.stopPropagation()} className="w-full max-w-sm rounded-xl bg-white p-6 text-center shadow-xl"><span className="mx-auto mb-3 flex size-11 items-center justify-center rounded-full bg-green-50 text-green-600"><Check className="size-5" /></span><h2 id="sale-confirmation-title" className="text-base font-bold">Venda finalizada</h2><p className="mt-1 text-xs text-neutral-500">Total de {money(subtotal)} · pagamento em {payment}{customer !== customers[0] ? ` · ${customer}` : ""}</p><Button type="button" onClick={startNextSale} className="mt-5 h-9 bg-red-600 text-xs text-white hover:bg-red-700">Iniciar nova venda</Button></section></div>}
    </div>
  );
}
