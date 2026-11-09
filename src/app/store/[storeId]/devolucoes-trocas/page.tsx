"use client";

import { useState } from "react";
import {
  Check,
  ChevronDown,
  CircleCheck,
  CircleHelp,
  Package,
  RotateCcw,
} from "lucide-react";
import AppSidebar from "@/src/components/app-sidebar";
import { Button } from "@/src/components/ui/button";

type RequestType = "Devolução" | "Troca";

type Order = {
  id: string;
  itemCount: number;
  date: string;
  status: string;
  items: string[];
};

const orders: Order[] = [
  { id: "10482", itemCount: 2, date: "12/03/2026", status: "Entregue", items: ["Película S25", "Cabo USB-C 1m"] },
  { id: "10477", itemCount: 3, date: "08/03/2026", status: "Entregue", items: ["Carregador USB-C 25W", "Cabo USB-C 1m", "Película S25"] },
  { id: "10471", itemCount: 1, date: "02/03/2026", status: "Entregue", items: ["Fone Bluetooth Pro"] },
];

const reasons = ["Produto não serve", "Diferente do esperado", "Compra por engano", "Outro motivo"];

const stepClass = "flex min-h-[48px] items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-[11px]";

export default function DevolucoesTrocasPage() {
  const [selectedOrder, setSelectedOrder] = useState(orders[0]);
  const [orderPickerOpen, setOrderPickerOpen] = useState(false);
  const [reason, setReason] = useState(reasons[0]);
  const [requestType, setRequestType] = useState<RequestType>("Troca");
  const [submitted, setSubmitted] = useState(false);

  function resetRequest() {
    setSelectedOrder(orders[0]);
    setOrderPickerOpen(false);
    setReason(reasons[0]);
    setRequestType("Troca");
    setSubmitted(false);
  }

  function submitRequest() {
    setSubmitted(true);
  }

  return (
    <div className="flex min-h-screen bg-[#f5f7fb] text-slate-900">
      <AppSidebar className="hidden md:flex" />
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-7 lg:px-8 lg:py-7">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto w-full max-w-4xl">
            <header className="mb-5"><p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Vendas</p><h1 className="text-xl font-bold tracking-tight">Devolu&ccedil;&otilde;es e trocas</h1><p className="mt-1 text-xs text-slate-500">Registre uma solicita&ccedil;&atilde;o para um pedido conclu&iacute;do.</p></header>

          <section className="w-full rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            {submitted ? (
              <div className="flex min-h-[445px] flex-col items-center justify-center px-4 text-center">
                <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><CircleCheck className="size-6" /></span>
                <h2 className="text-base font-bold">Solicitação enviada</h2>
                <p className="mt-1 max-w-[350px] text-sm leading-relaxed text-slate-500">
                  Sua solicitação de {requestType.toLocaleLowerCase("pt-BR")} para o pedido #{selectedOrder.id} foi registrada. Nossa equipe analisará o pedido e entrará em contato em até 2 dias úteis.
                </p>
                <div className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-left text-sm">
                  <p><span className="text-neutral-500">Motivo:</span> {reason}</p>
                  <p className="mt-1"><span className="text-neutral-500">Itens:</span> {selectedOrder.items.join(", ")}</p>
                  <p className="mt-1"><span className="text-neutral-500">Protocolo:</span> DEV-{selectedOrder.id}-01</p>
                </div>
                <Button type="button" onClick={resetRequest} className="mt-5 h-[34px] rounded-md bg-[#111827] px-5 text-[10px] text-white hover:bg-slate-800">
                  Nova solicitação
                </Button>
              </div>
            ) : (
              <>
                <header className="mb-3 flex items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700"><CircleHelp className="size-5" /></span>
                  <div>
                    <h2 className="text-base font-bold leading-tight">Devolução / Troca</h2>
                    <p className="mt-0.5 text-xs text-slate-500">Selecione o pedido, o motivo e o tipo de solicitação para continuar.</p>
                  </div>
                </header>

                <div className="mb-3 grid grid-cols-3 gap-1.5">
                  {["Pedido", "Motivo", "Tipo"].map((step, index) => (
                    <div key={step} className={stepClass}>
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#111827] text-[9px] font-semibold text-white">{index + 1}</span>
                      <span className="min-w-0"><span className="block font-semibold text-[#111827]">{step}</span><span className="block truncate text-slate-500">{index === 0 ? "Selecione o pedido" : index === 1 ? "Escolha o motivo" : "Devolução ou troca"}</span></span>
                    </div>
                  ))}
                </div>

                <section className="mb-3" aria-labelledby="select-order-title">
                  <h3 id="select-order-title" className="mb-1.5 text-[11px] font-semibold uppercase text-slate-500">1. Selecione o pedido</h3>
                  <button type="button" onClick={() => setOrderPickerOpen((open) => !open)} aria-expanded={orderPickerOpen} className="flex min-h-16 w-full items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 text-left transition-colors hover:border-slate-300">
                    <span className="flex size-[31px] shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-800"><Package className="size-4" /></span>
                    <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">Pedido #{selectedOrder.id}</span><span className="mt-0.5 block text-xs text-slate-500">{selectedOrder.itemCount} {selectedOrder.itemCount === 1 ? "item" : "itens"} · {selectedOrder.date} · {selectedOrder.status}</span></span>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">{selectedOrder.status}</span>
                    <ChevronDown className={`ml-1 size-3.5 shrink-0 text-slate-500 transition-transform ${orderPickerOpen ? "rotate-180" : ""}`} />
                  </button>
                  {orderPickerOpen && (
                    <div className="mt-1 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
                      {orders.map((order) => (
                        <button key={order.id} type="button" onClick={() => { setSelectedOrder(order); setOrderPickerOpen(false); }} className={`flex w-full items-center gap-2 border-b border-neutral-100 px-2.5 py-2 text-left last:border-0 hover:bg-neutral-50 ${order.id === selectedOrder.id ? "bg-neutral-50" : ""}`}>
                          <Package className="size-3.5 shrink-0 text-neutral-500" />
                          <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">Pedido #{order.id}</span><span className="block text-xs text-slate-500">{order.itemCount} {order.itemCount === 1 ? "item" : "itens"} · {order.date}</span></span>
                          {order.id === selectedOrder.id && <Check className="size-3.5 text-emerald-600" />}
                        </button>
                      ))}
                    </div>
                  )}
                </section>

                <section className="mb-3" aria-labelledby="reason-title">
                  <h3 id="reason-title" className="mb-1.5 text-[11px] font-semibold uppercase text-slate-500">2. Motivo da solicitação</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {reasons.map((option) => (
                      <button key={option} type="button" aria-pressed={reason === option} onClick={() => setReason(option)} className={`h-9 rounded-full border px-3 text-xs font-medium transition-colors ${reason === option ? "border-[#111827] bg-[#111827] text-white" : "border-[#e5e7eb] bg-white text-[#111827] hover:bg-neutral-50"}`}>
                        {option}
                      </button>
                    ))}
                  </div>
                  {reason === "Outro motivo" && <textarea aria-label="Descreva o motivo" placeholder="Conte um pouco mais sobre o motivo..." className="mt-2 min-h-20 w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none placeholder:text-neutral-400 focus:border-red-400 focus:ring-2 focus:ring-red-100" />}
                </section>

                <section className="mb-3" aria-labelledby="request-type-title">
                  <h3 id="request-type-title" className="mb-1.5 text-[11px] font-semibold uppercase text-slate-500">3. Tipo de solicitação</h3>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <button type="button" aria-pressed={requestType === "Devolução"} onClick={() => setRequestType("Devolução")} className={`min-h-[68px] rounded-lg border px-3 py-3 text-left transition-colors ${requestType === "Devolução" ? "border-[#111827] bg-[#111827] text-white" : "border-[#e5e7eb] bg-white text-[#111827] hover:bg-neutral-50"}`}>
                      <span className="flex items-center gap-2 text-sm font-semibold"><span className={`flex size-3.5 items-center justify-center rounded-full border ${requestType === "Devolução" ? "border-white bg-white" : "border-neutral-300"}`}>{requestType === "Devolução" && <span className="size-1.5 rounded-full bg-[#111827]" />}</span>Devolução</span>
                      <span className={`mt-1 block pl-[22px] text-xs ${requestType === "Devolução" ? "text-white/75" : "text-slate-500"}`}>Solicitar reembolso do valor pago.</span>
                    </button>
                    <button type="button" aria-pressed={requestType === "Troca"} onClick={() => setRequestType("Troca")} className={`min-h-[68px] rounded-lg border px-3 py-3 text-left transition-colors ${requestType === "Troca" ? "border-[#111827] bg-[#111827] text-white" : "border-[#e5e7eb] bg-white text-[#111827] hover:bg-neutral-50"}`}>
                      <span className="flex items-center gap-2 text-sm font-semibold"><span className={`flex size-3.5 items-center justify-center rounded-full border ${requestType === "Troca" ? "border-white bg-white" : "border-neutral-300"}`}>{requestType === "Troca" && <span className="size-1.5 rounded-full bg-[#111827]" />}</span>Troca</span>
                      <span className={`mt-1 block pl-[22px] text-xs ${requestType === "Troca" ? "text-white/75" : "text-slate-500"}`}>Trocar por tamanho, cor ou modelo.</span>
                    </button>
                  </div>
                </section>

                <div className="grid grid-cols-[123px_minmax(0,1fr)] gap-2">
                  <Button type="button" variant="outline" onClick={resetRequest} className="h-10 rounded-lg border-slate-300 text-xs">Cancelar</Button>
                  <Button type="button" onClick={submitRequest} className="h-10 rounded-lg bg-red-600 text-xs font-semibold text-white hover:bg-red-700"><span className="inline-flex items-center gap-2"><RotateCcw className="size-4" />Enviar solicitação</span></Button>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-slate-500">Ao enviar, nossa equipe analisará sua solicitação e entrará em contato em até 2 dias úteis.</p>
              </>
            )}
          </section>
          </div>
        </div>
      </main>
    </div>
  );
}
