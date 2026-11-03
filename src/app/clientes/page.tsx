"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  Building2,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CreditCard,
  Download,
  Eye,
  Filter,
  House,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Save,
  Search,
  Smartphone,
  UserRound,
  UserRoundPlus,
  X,
} from "lucide-react";
import AppSidebar from "@/src/components/app-sidebar";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { formatCpfCnpjInput } from "@/src/helpers/cpf-cnpj";
import { formatDateInput } from "@/src/helpers/date";
import { formatPhoneInput } from "@/src/helpers/phone";

type CustomerKind = "Pessoa Física" | "Pessoa Jurídica";
type CustomerStatus = "VIP" | "Ativo" | "Novo" | "Inativo";
type Customer = {
  id: number;
  kind: CustomerKind;
  name: string;
  document: string;
  birthDate: string;
  email: string;
  phone: string;
  cellphone: string;
  zipCode: string;
  city: string;
  tags: string[];
  purchases: number;
  purchaseTotal: number;
  lastPurchase: string;
  lastPurchaseNote: string;
  status: CustomerStatus;
  initials: string;
  color: string;
};

const initialCustomers: Customer[] = [
  { id: 1, kind: "Pessoa Física", name: "João da Silva", document: "123.456.789-09", birthDate: "14/03/1990", email: "joao.silva@email.com", phone: "(19) 99876-5432", cellphone: "(19) 99876-5432", zipCode: "13290-000", city: "Vargem Grande do Sul, SP", tags: ["Atacado", "VIP"], purchases: 17, purchaseTotal: 4280, lastPurchase: "12/09/2026", lastPurchaseNote: "Há 6 dias", status: "VIP", initials: "JS", color: "bg-red-500" },
  { id: 2, kind: "Pessoa Física", name: "Maria Oliveira", document: "987.654.321-00", birthDate: "22/07/1985", email: "maria.oliveira@gmail.com", phone: "(19) 98123-4567", cellphone: "(19) 98123-4567", zipCode: "13820-000", city: "São João da Boa Vista, SP", tags: [], purchases: 9, purchaseTotal: 1842, lastPurchase: "28/08/2026", lastPurchaseNote: "Há 21 dias", status: "Ativo", initials: "MO", color: "bg-blue-600" },
  { id: 3, kind: "Pessoa Jurídica", name: "Costa & Filhos LTDA", document: "12.345.678/0001-90", birthDate: "", email: "contato@costafilhos.com.br", phone: "(19) 3641-8899", cellphone: "(19) 3641-8899", zipCode: "13900-000", city: "Águas da Prata, SP", tags: ["Atacado"], purchases: 34, purchaseTotal: 12560, lastPurchase: "17/09/2026", lastPurchaseNote: "Ontem", status: "Ativo", initials: "CF", color: "bg-purple-700" },
  { id: 4, kind: "Pessoa Física", name: "Ana Ferreira", document: "321.654.987-00", birthDate: "08/11/1992", email: "ana.ferreira@outlook.com", phone: "(11) 97654-3210", cellphone: "(11) 97654-3210", zipCode: "01310-100", city: "São Paulo, SP", tags: [], purchases: 5, purchaseTotal: 892, lastPurchase: "05/09/2026", lastPurchaseNote: "Há 13 dias", status: "Ativo", initials: "AF", color: "bg-green-700" },
  { id: 5, kind: "Pessoa Física", name: "Rafael Mendes", document: "456.789.123-55", birthDate: "30/01/1988", email: "rafael.mendes@gmail.com", phone: "(19) 99555-1234", cellphone: "(19) 99555-1234", zipCode: "13730-000", city: "Mococa, SP", tags: [], purchases: 1, purchaseTotal: 149, lastPurchase: "16/09/2026", lastPurchaseNote: "Há 2 dias", status: "Novo", initials: "RM", color: "bg-orange-500" },
  { id: 6, kind: "Pessoa Física", name: "Camila Ribeiro", document: "654.321.987-11", birthDate: "19/06/1996", email: "camila.ribeiro@hotmail.com", phone: "(19) 98812-6677", cellphone: "(19) 98812-6677", zipCode: "13700-000", city: "Casa Branca, SP", tags: [], purchases: 11, purchaseTotal: 2318, lastPurchase: "10/09/2026", lastPurchaseNote: "Há 8 dias", status: "Ativo", initials: "CR", color: "bg-pink-700" },
  { id: 7, kind: "Pessoa Física", name: "Lucas Almeida", document: "789.123.456-22", birthDate: "02/02/1980", email: "lucas.a@email.com", phone: "(19) 97001-2244", cellphone: "(19) 97001-2244", zipCode: "15950-000", city: "Divinolândia, SP", tags: [], purchases: 2, purchaseTotal: 234, lastPurchase: "14/03/2025", lastPurchaseNote: "Há 18 meses", status: "Inativo", initials: "LA", color: "bg-gray-400" },
];

const emptyForm = {
  kind: "Pessoa Física" as CustomerKind,
  name: "",
  document: "",
  birthDate: "",
  email: "",
  phone: "",
  cellphone: "",
  zipCode: "",
  city: "",
};

const fieldClass = "h-[30px] rounded-md border-[#dedede] bg-white px-2 text-[10px] shadow-none placeholder:text-neutral-400 focus-visible:border-red-400 focus-visible:ring-red-100";
const currency = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function Field({ label, icon: Icon, children, className = "" }: {
  label: string;
  icon: typeof UserRound;
      children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block min-w-0 ${className}`}>
      <span className="mb-0.5 block text-[9px] font-medium uppercase text-neutral-600">{label}</span>
      <span className="relative flex h-[30px] items-center">
        <Icon aria-hidden="true" className="pointer-events-none absolute left-2 size-3.5 text-neutral-400" strokeWidth={1.7} />
        {children}
      </span>
    </label>
  );
}

export default function ClientesPage() {
  const [customers, setCustomers] = useState(initialCustomers);
  const [form, setForm] = useState(emptyForm);
  const [tags, setTags] = useState(["Atacado", "VIP"]);
  const [tagInput, setTagInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [viewing, setViewing] = useState<Customer | null>(null);
  const pageSize = 7;

  const filteredCustomers = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    return customers.filter((customer) => {
      const matchesText = !term || `${customer.name} ${customer.document} ${customer.email}`.toLocaleLowerCase("pt-BR").includes(term);
      const matchesStatus = statusFilter === "Todos" || customer.status === statusFilter;
      return matchesText && matchesStatus;
    });
  }, [customers, search, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredCustomers.length / pageSize));
  const visibleCustomers = filteredCustomers.slice((page - 1) * pageSize, page * pageSize);

  function changeForm<Key extends keyof typeof emptyForm>(key: Key, value: (typeof emptyForm)[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function resetForm() {
    setForm(emptyForm);
    setTags(["Atacado", "VIP"]);
    setTagInput("");
    setEditingId(null);
  }

  function saveCustomer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.name.trim()) return;

    const normalizedName = form.name.trim();
    const initials = normalizedName.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toLocaleUpperCase("pt-BR");
    const existing = customers.find((customer) => customer.id === editingId);
    const customer: Customer = {
      id: editingId ?? Date.now(),
      ...form,
      name: normalizedName,
      tags,
      purchases: existing?.purchases ?? 0,
      purchaseTotal: existing?.purchaseTotal ?? 0,
      lastPurchase: existing?.lastPurchase ?? "—",
      lastPurchaseNote: existing?.lastPurchaseNote ?? "Sem compras",
      status: existing?.status ?? "Novo",
      initials,
      color: existing?.color ?? "bg-red-500",
    };

    setCustomers((current) => editingId
      ? current.map((item) => item.id === editingId ? customer : item)
      : [customer, ...current]);
    resetForm();
    setPage(1);
  }

  function editCustomer(customer: Customer) {
    setEditingId(customer.id);
    setForm({
      kind: customer.kind,
      name: customer.name,
      document: customer.document,
      birthDate: customer.birthDate,
      email: customer.email,
      phone: customer.phone,
      cellphone: customer.cellphone,
      zipCode: customer.zipCode,
      city: customer.city,
    });
    setTags(customer.tags);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function addTag() {
    const nextTag = tagInput.trim();
    if (nextTag && !tags.some((tag) => tag.toLocaleLowerCase("pt-BR") === nextTag.toLocaleLowerCase("pt-BR"))) {
      setTags((current) => [...current, nextTag]);
    }
    setTagInput("");
  }

  function exportCustomers() {
    const rows = [
      ["Nome", "Tipo", "CPF/CNPJ", "E-mail", "Telefone", "Celular", "Cidade", "Status"],
      ...filteredCustomers.map((customer) => [customer.name, customer.kind, customer.document, customer.email, customer.phone, customer.cellphone, customer.city, customer.status]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(";")).join("\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "clientes-tecnox.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function updateFilter(value: string, filter: "search" | "status") {
    if (filter === "search") setSearch(value);
    else setStatusFilter(value);
    setPage(1);
  }

  return (
    <div className="flex min-h-screen bg-white text-[#171717]">
      <AppSidebar className="hidden md:flex" />
      <main className="min-w-0 flex-1 px-5 py-7 sm:px-8 lg:px-[clamp(28px,4vw,52px)] lg:py-10">
        <div className="mx-auto max-w-[1500px]">
          <header className="mb-5">
            <h1 className="text-[17px] font-extrabold tracking-tight">CLIENTES</h1>
          </header>

          <div className="grid items-start gap-5 xl:grid-cols-[317px_minmax(0,1fr)] 2xl:gap-6">
            <section>
              <Card className="gap-0 rounded-lg border border-[#e5e5e5] bg-white px-[18px] pb-5 pt-4 shadow-none ring-0">
                <div className="mb-2 flex items-center gap-2 border-b border-neutral-100 pb-2.5">
                  <UserRoundPlus className="size-4 text-[#ed3333]" strokeWidth={1.8} />
                  <h2 className="text-[11px] font-medium">{editingId ? "Editar Cliente" : "Novo Cliente"}</h2>
                </div>

                <form onSubmit={saveCustomer} className="space-y-1.5">
                  <fieldset>
                    <legend className="mb-1 text-[9px] font-medium uppercase text-neutral-600">Tipo de pessoa</legend>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(["Pessoa Física", "Pessoa Jurídica"] as const).map((kind) => {
                        const Icon = kind === "Pessoa Física" ? UserRound : Building2;
                        return (
                          <button
                            key={kind}
                            type="button"
                            aria-pressed={form.kind === kind}
                            onClick={() => changeForm("kind", kind)}
                            className={`flex h-[28px] items-center justify-center gap-1.5 rounded-md border px-1.5 text-[10px] transition-colors ${form.kind === kind ? "border-[#e63838] bg-[#e63838] font-medium text-white" : "border-[#dedede] text-neutral-600 hover:bg-neutral-50"}`}
                          >
                            <Icon className="size-3.5" />{kind}
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>

                  <Field label={form.kind === "Pessoa Física" ? "Nome completo" : "Razão social"} icon={UserRound}>
                    <Input className={`${fieldClass} pl-7`} placeholder={form.kind === "Pessoa Física" ? "Ex: João da Silva" : "Ex: Empresa LTDA"} value={form.name} onChange={(event) => changeForm("name", event.target.value)} required />
                  </Field>

                  <div className="grid grid-cols-2 gap-2">
                    <Field label={form.kind === "Pessoa Física" ? "CPF" : "CNPJ"} icon={CreditCard}>
                      <Input className={`${fieldClass} pl-7`} placeholder={form.kind === "Pessoa Física" ? "000.000.000-00" : "00.000.000/0000-00"} value={form.document} onChange={(event) => changeForm("document", formatCpfCnpjInput(event.target.value))} />
                    </Field>
                    {form.kind === "Pessoa Física" && (
                      <Field label="Data nascimento" icon={CalendarDays}>
                        <Input className={`${fieldClass} pl-7`} placeholder="dd/mm/aaaa" value={form.birthDate} onChange={(event) => changeForm("birthDate", formatDateInput(event.target.value))} />
                      </Field>
                    )}
                    {form.kind === "Pessoa Jurídica" && (
                      <Field label="CEP" icon={MapPin}>
                        <Input className={`${fieldClass} pl-7`} placeholder="00000-000" value={form.zipCode} onChange={(event) => changeForm("zipCode", event.target.value)} />
                      </Field>
                    )}
                  </div>

                  <Field label="E-mail" icon={Mail}>
                    <Input type="email" className={`${fieldClass} pl-7`} placeholder="cliente@email.com" value={form.email} onChange={(event) => changeForm("email", event.target.value)} />
                  </Field>

                  <div className="grid grid-cols-2 gap-2">
                    <Field label="Telefone" icon={Phone}>
                      <Input type="tel" className={`${fieldClass} pl-7`} placeholder="(00) 0000-0000" value={form.phone} onChange={(event) => changeForm("phone", formatPhoneInput(event.target.value))} />
                    </Field>
                    <Field label="Celular / WhatsApp" icon={Smartphone}>
                      <Input type="tel" className={`${fieldClass} pl-7`} placeholder="(00) 90000-0000" value={form.cellphone} onChange={(event) => changeForm("cellphone", formatPhoneInput(event.target.value))} />
                    </Field>
                  </div>

                  {form.kind === "Pessoa Física" && (
                    <div className="grid grid-cols-2 gap-2">
                      <Field label="CEP" icon={MapPin}>
                        <Input className={`${fieldClass} pl-7`} placeholder="00000-000" value={form.zipCode} onChange={(event) => changeForm("zipCode", event.target.value)} />
                      </Field>
                      <Field label="Cidade / UF" icon={House}>
                        <Input className={`${fieldClass} pl-7`} placeholder="Vargem Grande, SP" value={form.city} onChange={(event) => changeForm("city", event.target.value)} />
                      </Field>
                    </div>
                  )}
                  {form.kind === "Pessoa Jurídica" && (
                    <Field label="Cidade / UF" icon={House}>
                      <Input className={`${fieldClass} pl-7`} placeholder="Vargem Grande, SP" value={form.city} onChange={(event) => changeForm("city", event.target.value)} />
                    </Field>
                  )}

                  <div className="pt-0.5">
                    <span className="mb-1 block text-[9px] font-medium uppercase text-neutral-600">Tags / grupos</span>
                    <div className="flex min-h-[25px] flex-wrap items-center gap-1.5">
                      {tags.map((tag) => (
                        <button key={tag} type="button" onClick={() => setTags((current) => current.filter((item) => item !== tag))} className="inline-flex h-[22px] items-center gap-1 rounded-full bg-blue-50 px-2.5 text-[9px] font-medium text-blue-700 hover:bg-blue-100">
                          {tag}<X className="size-3" />
                        </button>
                      ))}
                      <div className="flex items-center gap-1">
                        <Input aria-label="Nova tag" className="h-[22px] w-[82px] border-dashed border-neutral-300 px-2 text-[9px] shadow-none" placeholder="Nova tag" value={tagInput} onChange={(event) => setTagInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addTag(); } }} />
                        <Button type="button" variant="outline" size="icon-xs" aria-label="Adicionar tag" onClick={addTag} className="size-[22px] rounded-full border-neutral-200"><Plus className="size-3" /></Button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={resetForm} className="h-[30px] rounded-md border-[#dedede] text-[10px] font-normal">Cancelar</Button>
                    <Button type="submit" className="h-[30px] rounded-md bg-[#ed3535] text-[10px] font-medium text-white hover:bg-red-600"><Save className="size-3.5" />{editingId ? "Salvar alterações" : "Salvar Cliente"}</Button>
                  </div>
                </form>

                <aside className="mt-3 flex gap-2 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-2 text-[9px] text-neutral-600">
                  <CircleAlert className="mt-0.5 size-3.5 shrink-0 text-orange-500" />
                  <span><strong className="block font-semibold text-orange-600">Dica</strong>Cadastre pelo menos nome e celular para liberar vendas rápidas neste cliente.</span>
                </aside>
              </Card>

              <Button type="button" variant="outline" onClick={exportCustomers} className="mt-3 h-[29px] rounded-md border-[#dedede] px-3 text-[10px] font-normal text-neutral-700">
                <Download className="size-3.5" />Exportar
              </Button>
            </section>

            <section className="flex min-h-[522px] min-w-0 flex-col rounded-lg border border-[#e5e5e5] bg-white">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 px-5 py-3.5">
                <h2 className="text-[11px] font-medium">Clientes Cadastrados</h2>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="relative block w-[220px] max-w-full">
                    <Search aria-hidden="true" className="absolute left-2.5 top-1/2 size-3 -translate-y-1/2 text-neutral-400" />
                    <Input value={search} onChange={(event) => updateFilter(event.target.value, "search")} placeholder="Buscar por nome, CPF ou e-mail..." className="h-[26px] rounded-md border-[#dedede] pl-7 text-[9px] shadow-none placeholder:text-neutral-400 focus-visible:border-red-400 focus-visible:ring-red-100" />
                  </label>
                  <label className="relative flex h-[26px] w-[93px] items-center gap-1.5 rounded-md border border-[#dedede] px-2">
                    <Filter aria-hidden="true" className="size-3 shrink-0" />
                    <select aria-label="Filtrar clientes por status" value={statusFilter} onChange={(event) => updateFilter(event.target.value, "status")} className="w-full appearance-none bg-transparent text-[9px] outline-none">
                      <option>Todos</option><option>VIP</option><option>Ativo</option><option>Novo</option><option>Inativo</option>
                    </select>
                    <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-1 size-3" />
                  </label>
                </div>
              </div>

              <div className="min-w-0 flex-1 overflow-x-auto">
                <table className="w-full min-w-[680px] table-fixed text-left">
                  <colgroup><col className="w-[35%]" /><col className="w-[19%]" /><col className="w-[12%]" /><col className="w-[14%]" /><col className="w-[10%]" /><col className="w-[10%]" /></colgroup>
                  <thead className="h-[29px] bg-[#fafafa] text-[8px] font-medium uppercase text-neutral-500">
                    <tr><th className="px-4">Cliente</th><th className="px-2">Contato</th><th className="px-2">Compras</th><th className="px-2">Última compra</th><th className="px-2">Status</th><th className="px-2 text-center">Ações</th></tr>
                  </thead>
                  <tbody>
                    {visibleCustomers.map((customer) => (
                      <tr key={customer.id} className={`h-[48px] border-b border-neutral-100 last:border-0 ${customer.status === "Inativo" ? "text-neutral-400" : ""}`}>
                        <td className="px-3 py-1.5">
                          <div className="flex min-w-0 items-center gap-2">
                            <span className={`flex size-[27px] shrink-0 items-center justify-center rounded-full text-[9px] font-medium text-white ${customer.color}`}>{customer.kind === "Pessoa Jurídica" ? <Building2 className="size-3.5" /> : customer.initials}</span>
                            <span className="min-w-0"><span className="block truncate text-[10px] font-medium text-neutral-800">{customer.name}</span><span className="block truncate text-[9px] text-neutral-400">{customer.email}</span></span>
                          </div>
                        </td>
                        <td className="px-2 py-1.5"><span className="block whitespace-nowrap text-[9px] text-neutral-700">{customer.cellphone || customer.phone || "—"}</span><span className="block truncate text-[8px] text-neutral-400">{customer.city || "Cidade não informada"}</span></td>
                        <td className="px-2 py-1.5"><span className="block whitespace-nowrap text-[9px] font-medium text-neutral-800">{currency(customer.purchaseTotal)}</span><span className="block text-[8px] text-neutral-400">{customer.purchases} {customer.purchases === 1 ? "pedido" : "pedidos"}</span></td>
                        <td className="px-2 py-1.5"><span className="block whitespace-nowrap text-[9px] text-neutral-700">{customer.lastPurchase}</span><span className="block text-[8px] text-neutral-400">{customer.lastPurchaseNote}</span></td>
                        <td className="px-2 py-1.5"><span className={`inline-flex min-w-[42px] justify-center rounded-full px-2 py-1 text-[8px] font-medium ${customer.status === "VIP" ? "bg-orange-50 text-orange-600" : customer.status === "Novo" ? "bg-sky-100 text-sky-700" : customer.status === "Inativo" ? "bg-neutral-100 text-neutral-500" : "bg-green-50 text-green-700"}`}>{customer.kind === "Pessoa Jurídica" ? "PJ" : customer.status}</span></td>
                        <td className="px-2 py-1.5"><div className="flex items-center justify-center gap-2"><button type="button" aria-label={`Ver ${customer.name}`} onClick={() => setViewing(customer)} className="text-neutral-500 hover:text-neutral-900"><Eye className="size-3.5" /></button><button type="button" aria-label={`Editar ${customer.name}`} onClick={() => editCustomer(customer)} className="text-neutral-500 hover:text-red-600"><Pencil className="size-3.5" /></button></div></td>
                      </tr>
                    ))}
                    {visibleCustomers.length === 0 && <tr><td colSpan={6} className="py-16 text-center text-[11px] text-neutral-400">Nenhum cliente encontrado.</td></tr>}
                  </tbody>
                </table>
              </div>

              <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 px-5 py-3 text-[9px] text-neutral-400">
                <span>Mostrando {filteredCustomers.length === 0 ? 0 : (page - 1) * pageSize + 1}-{Math.min(page * pageSize, filteredCustomers.length)} de {filteredCustomers.length} clientes</span>
                <nav aria-label="Paginação de clientes" className="flex items-center gap-1">
                  <button type="button" aria-label="Página anterior" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} className="flex size-6 items-center justify-center rounded-md border border-neutral-200 text-neutral-700 hover:bg-neutral-50 disabled:opacity-40"><ChevronLeft className="size-3.5" /></button>
                  {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => <button type="button" key={pageNumber} onClick={() => setPage(pageNumber)} aria-current={page === pageNumber ? "page" : undefined} className={`size-6 rounded-md border text-[9px] ${page === pageNumber ? "border-[#e63838] bg-[#e63838] text-white" : "border-neutral-200 text-neutral-700 hover:bg-neutral-50"}`}>{pageNumber}</button>)}
                  <button type="button" aria-label="Próxima página" onClick={() => setPage((current) => Math.min(pageCount, current + 1))} disabled={page === pageCount} className="flex size-6 items-center justify-center rounded-md border border-neutral-200 text-neutral-700 hover:bg-neutral-50 disabled:opacity-40"><ChevronRight className="size-3.5" /></button>
                </nav>
              </footer>
            </section>
          </div>

          {viewing && (
            <div role="presentation" onClick={() => setViewing(null)} className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
              <section role="dialog" aria-modal="true" aria-labelledby="customer-dialog-title" onClick={(event) => event.stopPropagation()} className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl">
                <div className="mb-4 flex items-center justify-between"><h2 id="customer-dialog-title" className="text-sm font-semibold">Detalhes do cliente</h2><button type="button" onClick={() => setViewing(null)} aria-label="Fechar" className="rounded p-1 text-neutral-500 hover:bg-neutral-100"><X className="size-4" /></button></div>
                <div className="flex items-center gap-3"><span className={`flex size-10 items-center justify-center rounded-full text-xs text-white ${viewing.color}`}>{viewing.kind === "Pessoa Jurídica" ? <Building2 className="size-4" /> : viewing.initials}</span><div className="min-w-0"><p className="truncate text-sm font-medium">{viewing.name}</p><p className="truncate text-xs text-neutral-500">{viewing.email}</p></div></div>
                <dl className="mt-4 space-y-2 text-xs"><div className="flex justify-between gap-3 border-t pt-2"><dt className="text-neutral-500">CPF/CNPJ</dt><dd className="text-right">{viewing.document || "—"}</dd></div><div className="flex justify-between gap-3"><dt className="text-neutral-500">Telefone</dt><dd className="text-right">{viewing.phone || "—"}</dd></div><div className="flex justify-between gap-3"><dt className="text-neutral-500">Celular</dt><dd className="text-right">{viewing.cellphone || "—"}</dd></div><div className="flex justify-between gap-3"><dt className="text-neutral-500">Cidade</dt><dd className="text-right">{viewing.city || "—"}</dd></div><div className="flex justify-between gap-3"><dt className="text-neutral-500">Status</dt><dd className="text-right">{viewing.status}</dd></div></dl>
                <div className="mt-4 flex justify-end"><Button type="button" variant="outline" onClick={() => setViewing(null)} className="h-8 text-xs">Fechar</Button></div>
              </section>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
