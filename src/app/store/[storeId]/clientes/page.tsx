"use client";

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { useParams, useRouter } from "next/navigation";
import {
  AlignLeft, Building2, CalendarDays, ChevronLeft, ChevronRight, CreditCard,
  Download, Eye, Hash, LoaderCircle, Mail, MapPin, MapPinned, Pencil,
  Phone, Route, Save, Search, UserRound, UserRoundPlus, X, type LucideIcon,
} from "lucide-react";
import AppSidebar from "@/src/components/app-sidebar";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { auth } from "@/src/lib/services/auth_service";
import { createClient, listClients, updateClient, type Client, type ClientAddress, type ClientInput } from "@/src/lib/clients";
import { formatCepInput, getCepDigits } from "@/src/helpers/cep";
import { formatCpfInput, isValidCpf } from "@/src/helpers/cpf-cnpj";
import { formatDateInput } from "@/src/helpers/date";
import { formatPhoneInput } from "@/src/helpers/phone";
import { useCepLookup } from "@/src/hooks/use-cep-lookup";

type ClientForm = ClientInput;
type Feedback = { kind: "error" | "success"; message: string } | null;

const emptyAddress: ClientAddress = {
  cep: "", street: "", number: "", complement: "", neighborhood: "", city: "", state: "",
};
const emptyForm: ClientForm = {
  name: "", cpf: "", birthDate: "", email: "", phone: "", address: emptyAddress,
};
const fieldClass = "h-10 rounded-lg border-slate-200 bg-white px-3 text-sm shadow-none placeholder:text-slate-400 focus-visible:border-red-400 focus-visible:ring-red-100";

function Field({ label, icon: Icon, children, className = "" }: {
  label: string; icon: LucideIcon; children: ReactNode; className?: string;
}) {
  return (
    <label className={`block min-w-0 ${className}`}>
      <span className="mb-1.5 block text-[11px] font-semibold text-slate-700">{label}</span>
      <span className="relative flex h-10 items-center">
        <Icon aria-hidden="true" className="pointer-events-none absolute left-3 size-4 text-slate-400" strokeWidth={1.7} />
        {children}
      </span>
    </label>
  );
}

function displayDate(isoDate: string) {
  const [year, month, day] = isoDate.split("-");
  return year && month && day ? `${day}/${month}/${year}` : isoDate;
}

function toIsoDate(value: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return null;
  const [, day, month, year] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  if (date.getFullYear() !== Number(year) || date.getMonth() !== Number(month) - 1 || date.getDate() !== Number(day)) return null;
  return `${year}-${month}-${day}`;
}

export default function ClientesPage() {
  const router = useRouter();
  const routeStoreId = useParams<{ storeId: string }>().storeId;
  const [user, setUser] = useState<User | null>(null);
  const [storeId, setStoreId] = useState("");
  const [customers, setCustomers] = useState<Client[]>([]);
  const [form, setForm] = useState<ClientForm>(emptyForm);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewing, setViewing] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const { lookupCep, status: cepStatus, message: cepMessage } = useCepLookup();
  const pageSize = 7;

  async function refreshClients(id: string) {
    setCustomers(await listClients(id));
  }

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.replace("/signin");
        return;
      }
      setUser(currentUser);
      try {
        if (!routeStoreId) {
          router.replace("/store-setup");
          return;
        }
        setStoreId(routeStoreId);
        setCustomers(await listClients(routeStoreId));
      } catch {
        if (active) setFeedback({ kind: "error", message: "Não foi possível carregar os clientes. Verifique sua conexão e tente novamente." });
      } finally {
        if (active) setIsLoading(false);
      }
    });
    return () => { active = false; unsubscribe(); };
  }, [router, routeStoreId]);

  const filteredCustomers = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    return customers.filter((customer) => `${customer.name} ${customer.cpf} ${customer.email} ${customer.phone}`
      .toLocaleLowerCase("pt-BR").includes(term));
  }, [customers, search]);
  const pageCount = Math.max(1, Math.ceil(filteredCustomers.length / pageSize));
  const visibleCustomers = filteredCustomers.slice((page - 1) * pageSize, page * pageSize);

  function changeForm<Key extends keyof ClientForm>(key: Key, value: ClientForm[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function changeAddress<Key extends keyof ClientAddress>(key: Key, value: ClientAddress[Key]) {
    setForm((current) => ({ ...current, address: { ...current.address, [key]: value } }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setFeedback(null);
  }

  async function saveCustomer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    if (!user || !storeId) return;
    if (!isValidCpf(form.cpf)) {
      setFeedback({ kind: "error", message: "Informe um CPF válido." });
      return;
    }
    const isoBirthDate = toIsoDate(form.birthDate);
    if (!isoBirthDate) {
      setFeedback({ kind: "error", message: "Informe uma data de nascimento válida no formato dd/mm/aaaa." });
      return;
    }
    if (getCepDigits(form.address.cep).length !== 8) {
      setFeedback({ kind: "error", message: "Informe um CEP válido com 8 dígitos." });
      return;
    }
    const payload: ClientInput = { ...form, birthDate: isoBirthDate };
    setIsSaving(true);
    try {
      if (editingId) await updateClient(editingId, payload);
      else await createClient(storeId, payload);
      await refreshClients(storeId);
      resetForm();
      setPage(1);
      setFeedback({ kind: "success", message: editingId ? "Cliente atualizado." : "Cliente cadastrado." });
    } catch {
      setFeedback({ kind: "error", message: "Não foi possível salvar o cliente. Verifique sua conexão e tente novamente." });
    } finally {
      setIsSaving(false);
    }
  }

  function editCustomer(customer: Client) {
    setEditingId(customer.id);
    setForm({
      name: customer.name,
      cpf: formatCpfInput(customer.cpf),
      birthDate: displayDate(customer.birthDate),
      email: customer.email ?? "",
      phone: customer.phone ?? "",
      address: { ...emptyAddress, ...customer.address },
    });
    setFeedback(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleCepChange(value: string) {
    const cep = formatCepInput(value);
    changeAddress("cep", cep);
    const address = await lookupCep(cep);
    if (address) {
      setForm((current) => getCepDigits(current.address.cep) === getCepDigits(cep)
        ? { ...current, address: { ...current.address, ...address } }
        : current);
    }
  }

  function exportCustomers() {
    const rows = [
      ["Nome", "CPF", "Data de nascimento", "E-mail", "Telefone", "CEP", "Rua", "Número", "Complemento", "Bairro", "Cidade", "UF"],
      ...filteredCustomers.map((customer) => [customer.name, formatCpfInput(customer.cpf), displayDate(customer.birthDate), customer.email ?? "", customer.phone ?? "", customer.address.cep, customer.address.street, customer.address.number, customer.address.complement, customer.address.neighborhood, customer.address.city, customer.address.state]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(";")).join("\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "clientes-tecnox.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  if (isLoading) return <main className="grid min-h-screen place-items-center text-sm text-neutral-600"><LoaderCircle className="mr-2 inline size-4 animate-spin" /> Carregando clientes...</main>;

  return (
    <div className="flex min-h-screen bg-[#f5f7fb] text-slate-900">
      <AppSidebar className="hidden md:flex" />
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-7 lg:px-8 lg:py-7">
        <div className="mx-auto max-w-6xl">
          <header className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Administração</p><h1 className="text-xl font-bold tracking-tight">Clientes</h1><p className="mt-1 text-xs text-slate-500">Cadastre e consulte os clientes desta loja.</p></div><Button type="button" variant="outline" onClick={exportCustomers} className="h-9 border-slate-300 text-xs" disabled={!filteredCustomers.length}><Download className="size-4" />Exportar CSV</Button></header>
          <div className="grid items-start gap-5 lg:grid-cols-[350px_minmax(0,1fr)]">
            <section>
              <Card className="gap-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 ring-0">
                <div className="mb-2 flex items-center gap-2 border-b border-neutral-100 pb-2.5"><UserRoundPlus className="size-4 text-[#ed3333]" strokeWidth={1.8} /><h2 className="text-[11px] font-medium">{editingId ? "Editar Cliente" : "Novo Cliente"}</h2></div>
                <form onSubmit={saveCustomer} className="space-y-3">
                  <Field label="Nome completo" icon={UserRound}><Input className={`${fieldClass} pl-9`} placeholder="Ex: João da Silva" value={form.name} onChange={(event) => changeForm("name", event.target.value)} required /></Field>
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="CPF" icon={CreditCard}><Input className={`${fieldClass} pl-9`} inputMode="numeric" placeholder="000.000.000-00" value={form.cpf} onChange={(event) => changeForm("cpf", formatCpfInput(event.target.value))} required /></Field>
                    <Field label="Data de nascimento" icon={CalendarDays}><Input className={`${fieldClass} pl-9`} inputMode="numeric" placeholder="dd/mm/aaaa" value={form.birthDate} onChange={(event) => changeForm("birthDate", formatDateInput(event.target.value))} required /></Field>
                  </div>
                  <Field label="E-mail (opcional)" icon={Mail}><Input type="email" className={`${fieldClass} pl-9`} placeholder="cliente@email.com" value={form.email} onChange={(event) => changeForm("email", event.target.value)} /></Field>
                  <Field label="Telefone (opcional)" icon={Phone}><Input type="tel" className={`${fieldClass} pl-9`} placeholder="(00) 00000-0000" value={form.phone} onChange={(event) => changeForm("phone", formatPhoneInput(event.target.value))} /></Field>
                  <div className="border-t border-slate-100 pt-3"><h3 className="mb-1.5 text-[11px] font-semibold text-slate-700">Endereço</h3>
                    <Field label="CEP" icon={MapPin}><Input className={`${fieldClass} pl-9`} inputMode="numeric" maxLength={9} placeholder="00000-000" value={form.address.cep} onChange={(event) => void handleCepChange(event.target.value)} required /></Field>
                    {cepMessage && <p className={`mt-1 text-[9px] ${cepStatus === "error" || cepStatus === "not-found" || cepStatus === "invalid" ? "text-amber-700" : "text-neutral-500"}`}>{cepMessage}</p>}
                  </div>
                  <Field label="Rua" icon={Route}><Input className={`${fieldClass} pl-9`} placeholder="Nome da rua" value={form.address.street} onChange={(event) => changeAddress("street", event.target.value)} required /></Field>
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="Número" icon={Hash}><Input className={`${fieldClass} pl-9`} placeholder="Número" value={form.address.number} onChange={(event) => changeAddress("number", event.target.value)} required /></Field>
                    <Field label="Complemento (opcional)" icon={AlignLeft}><Input className={`${fieldClass} pl-9`} placeholder="Apto, bloco..." value={form.address.complement} onChange={(event) => changeAddress("complement", event.target.value)} /></Field>
                  </div>
                  <Field label="Bairro" icon={MapPinned}><Input className={`${fieldClass} pl-9`} placeholder="Bairro" value={form.address.neighborhood} onChange={(event) => changeAddress("neighborhood", event.target.value)} required /></Field>
                  <div className="grid grid-cols-[1fr_72px] gap-2">
                    <Field label="Cidade" icon={Building2}><Input className={`${fieldClass} pl-9`} placeholder="Cidade" value={form.address.city} onChange={(event) => changeAddress("city", event.target.value)} required /></Field>
                    <Field label="UF" icon={MapPin}><Input className={`${fieldClass} pl-9 uppercase`} placeholder="SP" maxLength={2} value={form.address.state} onChange={(event) => changeAddress("state", event.target.value.toUpperCase())} required /></Field>
                  </div>
                  {feedback && <p role="status" className={`text-[10px] ${feedback.kind === "error" ? "text-red-600" : "text-green-700"}`}>{feedback.message}</p>}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={resetForm} className="h-9 border-slate-300 text-xs">Cancelar</Button>
                    <Button type="submit" disabled={isSaving} className="h-9 bg-red-600 text-xs font-semibold text-white hover:bg-red-700"><Save className="size-4" />{isSaving ? "Salvando..." : editingId ? "Salvar alterações" : "Salvar cliente"}</Button>
                  </div>
                </form>
              </Card>
            </section>

            <section className="flex min-h-[522px] min-w-0 flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
                <h2 className="text-sm font-semibold">Clientes cadastrados</h2>
                <label className="relative block w-[220px] max-w-full"><Search aria-hidden="true" className="absolute left-2.5 top-1/2 size-3 -translate-y-1/2 text-neutral-400" /><Input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Buscar por nome, CPF, e-mail ou telefone..." className="h-[26px] rounded-md border-[#dedede] pl-9 text-[9px] shadow-none placeholder:text-neutral-400 focus-visible:border-red-400 focus-visible:ring-red-100" /></label>
              </div>
              <div className="min-w-0 flex-1 overflow-x-auto">
                <table className="w-full min-w-[600px] table-fixed text-left">
                  <colgroup><col className="w-[36%]" /><col className="w-[22%]" /><col className="w-[25%]" /><col className="w-[17%]" /></colgroup>
                  <thead className="h-[29px] bg-[#fafafa] text-[11px] font-semibold uppercase text-neutral-500"><tr><th className="px-4">Cliente</th><th className="px-2">CPF</th><th className="px-2">Telefone</th><th className="px-2 text-center">Ações</th></tr></thead>
                  <tbody>
                    {visibleCustomers.map((customer) => <tr key={customer.id} className="h-[48px] border-b border-neutral-100 last:border-0">
                      <td className="px-3 py-1.5"><div className="flex min-w-0 items-center gap-2"><span className="flex size-[27px] shrink-0 items-center justify-center rounded-full bg-red-500 text-[9px] font-medium text-white">{customer.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toLocaleUpperCase("pt-BR")}</span><span className="min-w-0"><span className="block truncate text-sm font-semibold text-slate-800">{customer.name}</span><span className="block truncate text-xs text-slate-500">{customer.email || "Sem e-mail"}</span></span></div></td>
                      <td className="px-2 py-2 text-xs text-slate-700">{formatCpfInput(customer.cpf)}</td><td className="px-2 py-2 text-xs text-slate-700">{customer.phone || "—"}</td>
                      <td className="px-2 py-1.5"><div className="flex items-center justify-center gap-2"><button type="button" aria-label={`Ver ${customer.name}`} onClick={() => setViewing(customer)} className="text-neutral-500 hover:text-neutral-900"><Eye className="size-3.5" /></button><button type="button" aria-label={`Editar ${customer.name}`} onClick={() => editCustomer(customer)} className="text-neutral-500 hover:text-red-600"><Pencil className="size-3.5" /></button></div></td>
                    </tr>)}
                    {visibleCustomers.length === 0 && <tr><td colSpan={4} className="py-16 text-center text-[11px] text-neutral-400">{search ? "Nenhum cliente encontrado." : "Ainda não há clientes cadastrados."}</td></tr>}
                  </tbody>
                </table>
              </div>
              <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 px-5 py-3 text-xs text-slate-500"><span>Mostrando {filteredCustomers.length === 0 ? 0 : (page - 1) * pageSize + 1}-{Math.min(page * pageSize, filteredCustomers.length)} de {filteredCustomers.length} clientes</span><nav aria-label="Paginação de clientes" className="flex items-center gap-1"><button type="button" aria-label="Página anterior" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} className="flex size-6 items-center justify-center rounded-md border border-neutral-200 text-neutral-700 hover:bg-neutral-50 disabled:opacity-40"><ChevronLeft className="size-3.5" /></button>{Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => <button type="button" key={pageNumber} onClick={() => setPage(pageNumber)} aria-current={page === pageNumber ? "page" : undefined} className={`size-6 rounded-md border text-[9px] ${page === pageNumber ? "border-[#e63838] bg-[#e63838] text-white" : "border-neutral-200 text-neutral-700 hover:bg-neutral-50"}`}>{pageNumber}</button>)}<button type="button" aria-label="Próxima página" onClick={() => setPage((current) => Math.min(pageCount, current + 1))} disabled={page === pageCount} className="flex size-6 items-center justify-center rounded-md border border-neutral-200 text-neutral-700 hover:bg-neutral-50 disabled:opacity-40"><ChevronRight className="size-3.5" /></button></nav></footer>
            </section>
          </div>
          {viewing && <div role="presentation" onClick={() => setViewing(null)} className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"><section role="dialog" aria-modal="true" aria-labelledby="customer-dialog-title" onClick={(event) => event.stopPropagation()} className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between"><h2 id="customer-dialog-title" className="text-sm font-semibold">Detalhes do cliente</h2><button type="button" onClick={() => setViewing(null)} aria-label="Fechar" className="rounded p-1 text-neutral-500 hover:bg-neutral-100"><X className="size-4" /></button></div>
            <div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-full bg-red-500 text-xs text-white">{viewing.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toLocaleUpperCase("pt-BR")}</span><div className="min-w-0"><p className="truncate text-sm font-medium">{viewing.name}</p><p className="truncate text-xs text-neutral-500">{viewing.email || "Sem e-mail"}</p></div></div>
            <dl className="mt-4 space-y-2 text-xs"><div className="flex justify-between gap-3 border-t pt-2"><dt className="text-neutral-500">CPF</dt><dd className="text-right">{formatCpfInput(viewing.cpf)}</dd></div><div className="flex justify-between gap-3"><dt className="text-neutral-500">Nascimento</dt><dd className="text-right">{displayDate(viewing.birthDate)}</dd></div><div className="flex justify-between gap-3"><dt className="text-neutral-500">Telefone</dt><dd className="text-right">{viewing.phone || "—"}</dd></div><div className="flex justify-between gap-3"><dt className="text-neutral-500">Endereço</dt><dd className="max-w-[65%] text-right">{viewing.address.street}, {viewing.address.number}{viewing.address.complement ? `, ${viewing.address.complement}` : ""}<br />{viewing.address.neighborhood} · {viewing.address.city}/{viewing.address.state}<br />CEP {viewing.address.cep}</dd></div></dl>
            <div className="mt-4 flex justify-end"><Button type="button" variant="outline" onClick={() => setViewing(null)} className="h-8 text-xs">Fechar</Button></div>
          </section></div>}
        </div>
      </main>
    </div>
  );
}
