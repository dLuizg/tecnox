"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useParams, useRouter } from "next/navigation";
import { Building2, Download, LoaderCircle, Mail, MapPin, Pencil, Phone, Plus, Search } from "lucide-react";
import AppSidebar from "@/src/components/app-sidebar";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { formatCnpjInput, isValidCnpj } from "@/src/helpers/cpf-cnpj";
import { formatPhoneInput } from "@/src/helpers/phone";
import { auth } from "@/src/lib/services/auth_service";
import { listSuppliers, saveSupplier } from "@/src/lib/services/suppliers_service";
import { type Supplier, type SupplierInput } from "@/src/lib/types/suppliers_types";

const emptyForm: SupplierInput = { name: "", cnpj: "", address: "", email: "", phone: "", description: "" };
const inputClass = "h-10 rounded-lg border-slate-200 bg-white text-sm shadow-none focus-visible:border-red-400 focus-visible:ring-red-100";

export default function FornecedoresPage() {
  const router = useRouter();
  const storeId = useParams<{ storeId: string }>().storeId;
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [form, setForm] = useState<SupplierInput>(emptyForm);
  const [editing, setEditing] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function refresh() {
    setSuppliers(await listSuppliers(storeId));
  }

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.replace("/signin"); return; }
      try {
        const records = await listSuppliers(storeId);
        if (active) setSuppliers(records);
      } catch {
        if (active) setError("Não foi possível carregar os fornecedores. Atualize a página e tente novamente.");
      } finally { if (active) setLoading(false); }
    });
    return () => { active = false; unsubscribe(); };
  }, [router, storeId]);

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    return suppliers.filter((supplier) => `${supplier.name} ${supplier.cnpj} ${supplier.email} ${supplier.phone}`.toLocaleLowerCase("pt-BR").includes(term));
  }, [suppliers, search]);

  function update<K extends keyof SupplierInput>(key: K, value: SupplierInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function reset() { setForm(emptyForm); setEditing(""); }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(""); setNotice("");
    if (!isValidCnpj(form.cnpj)) { setError("Informe um CNPJ válido."); return; }
    setSaving(true);
    try {
      await saveSupplier(storeId, form);
      await refresh();
      reset();
      setNotice("Fornecedor salvo com sucesso.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível salvar o fornecedor. Confira sua conexão e tente novamente.");
    } finally { setSaving(false); }
  }

  function edit(supplier: Supplier) {
    setEditing(supplier.id);
    setForm({ name: supplier.name, cnpj: supplier.cnpj, address: supplier.address, email: supplier.email, phone: supplier.phone, description: supplier.description });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function exportCsv() {
    const rows = [["Nome", "CNPJ", "Endereço", "E-mail", "Telefone", "Descrição"], ...filtered.map((item) => [item.name, item.cnpj, item.address, item.email, item.phone, item.description])];
    const csv = rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(";")).join("\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "fornecedores-tecnox.csv"; anchor.click(); URL.revokeObjectURL(url);
  }

  return <div className="flex min-h-screen bg-[#f5f7fb] text-slate-900">
    <AppSidebar className="hidden md:flex" />
    <main className="min-w-0 flex-1 px-4 py-6 sm:px-7 lg:px-8 lg:py-7">
      <div className="mx-auto max-w-6xl">
        <header className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Administração</p><h1 className="text-xl font-bold tracking-tight">Fornecedores</h1><p className="mt-1 text-xs text-slate-500">Cadastre e consulte os fornecedores desta loja.</p></div><Button onClick={exportCsv} variant="outline" className="h-9 border-slate-300 text-xs" disabled={!filtered.length}><Download className="size-4" />Exportar CSV</Button></header>
        <div className="grid items-start gap-5 lg:grid-cols-[350px_minmax(0,1fr)]">
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><h2 className="mb-4 flex items-center gap-2 text-sm font-semibold"><Building2 className="size-4 text-red-600" />{editing ? "Editar fornecedor" : "Novo fornecedor"}</h2>
            <form onSubmit={submit} className="space-y-3">
              <Field label="Nome" required><Input className={inputClass} value={form.name} onChange={(event) => update("name", event.target.value)} required placeholder="Razão social ou nome" /></Field>
              <Field label="CNPJ" required><Input className={inputClass} value={form.cnpj} onChange={(event) => update("cnpj", formatCnpjInput(event.target.value))} required readOnly={Boolean(editing)} inputMode="numeric" placeholder="00.000.000/0000-00" /></Field>
              <Field label="Telefone" required><Input className={inputClass} value={form.phone} onChange={(event) => update("phone", formatPhoneInput(event.target.value))} required inputMode="tel" placeholder="(00) 00000-0000" /></Field>
              <Field label="E-mail"><Input className={inputClass} value={form.email} onChange={(event) => update("email", event.target.value)} type="email" placeholder="contato@empresa.com.br" /></Field>
              <Field label="Endereço"><div className="relative"><MapPin className="absolute left-3 top-3 size-4 text-slate-400" /><Input className={`${inputClass} pl-9`} value={form.address} onChange={(event) => update("address", event.target.value)} placeholder="Endereço completo" /></div></Field>
              <Field label="Descrição"><Textarea className="min-h-20 resize-y rounded-lg border-slate-200 text-sm shadow-none focus-visible:border-red-400 focus-visible:ring-red-100" value={form.description} onChange={(event) => update("description", event.target.value)} placeholder="Observações sobre o fornecedor (opcional)" /></Field>
              {error && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
              {notice && <p role="status" className="rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{notice}</p>}
              <div className="flex justify-end gap-2 pt-1"><Button type="button" variant="outline" className="h-9 border-slate-300 text-xs" onClick={() => { reset(); setError(""); }}>Limpar</Button><Button type="submit" disabled={saving} className="h-9 bg-red-600 text-xs text-white hover:bg-red-700">{saving ? <LoaderCircle className="size-4 animate-spin" /> : editing ? <Pencil className="size-4" /> : <Plus className="size-4" />}{saving ? "Salvando..." : editing ? "Salvar alterações" : "Cadastrar fornecedor"}</Button></div>
            </form>
          </section>
          <section className="min-w-0 rounded-xl border border-slate-200 bg-white shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4"><div><h2 className="text-sm font-semibold">Fornecedores cadastrados</h2><p className="mt-0.5 text-[11px] text-slate-500">{suppliers.length} fornecedor(es)</p></div><div className="relative w-full sm:w-64"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><Input className={`${inputClass} pl-9`} placeholder="Buscar fornecedor" value={search} onChange={(event) => setSearch(event.target.value)} /></div></div>
            {loading ? <div className="flex items-center justify-center gap-2 p-12 text-sm text-slate-500"><LoaderCircle className="size-4 animate-spin" />Carregando fornecedores...</div> : filtered.length === 0 ? <div className="p-12 text-center text-sm text-slate-500">{search ? "Nenhum fornecedor encontrado." : "Ainda não há fornecedores cadastrados."}</div> : <div className="divide-y divide-slate-100">{filtered.map((supplier) => <article key={supplier.id} className="flex flex-wrap items-start justify-between gap-3 p-4"><div className="min-w-0"><h3 className="truncate text-sm font-semibold">{supplier.name}</h3><p className="mt-1 text-xs text-slate-500">CNPJ {supplier.cnpj}</p><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">{supplier.phone && <span className="inline-flex items-center gap-1"><Phone className="size-3.5" />{supplier.phone}</span>}{supplier.email && <span className="inline-flex items-center gap-1"><Mail className="size-3.5" />{supplier.email}</span>}{supplier.address && <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" />{supplier.address}</span>}</div>{supplier.description && <p className="mt-2 max-w-2xl text-xs text-slate-500">{supplier.description}</p>}</div><Button type="button" variant="outline" className="h-8 shrink-0 border-slate-300 text-xs" onClick={() => edit(supplier)}><Pencil className="size-3.5" />Editar</Button></article>)}</div>}
          </section>
        </div>
      </div>
    </main>
  </div>;
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-[11px] font-semibold">{label}{required && <span className="ml-0.5 text-red-600">*</span>}</span>{children}</label>;
}
