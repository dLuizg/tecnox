"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { useParams, useRouter } from "next/navigation";
import { Check, LoaderCircle, Plus } from "lucide-react";
import AppSidebar from "@/src/components/app-sidebar";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { formatCurrencyInput } from "@/src/helpers/currency";
import { formatCnpjInput } from "@/src/helpers/cpf-cnpj";
import { auth } from "@/src/lib/services/auth_service";
import { addStoreCategory, createProduct, getStoreCategories } from "@/src/lib/services/products_service";
import { type ProductInput } from "@/src/lib/types/products_types";
import { listSuppliers } from "@/src/lib/services/suppliers_service";
import { type Supplier } from "@/src/lib/types/suppliers_types";

type FormState = Omit<ProductInput, "purchasePrice" | "salePrice" | "lengthCm" | "widthCm" | "heightCm" | "weightKg" | "isPhysicalProduct"> & {
  purchasePrice: string;
  salePrice: string;
  lengthCm: string;
  widthCm: string;
  heightCm: string;
  weightKg: string;
  isPhysicalProduct: "" | "true" | "false";
};

type Feedback = { kind: "error" | "success"; message: string } | null;

const emptyForm: FormState = {
  name: "", description: "", sku: "", category: "", brand: "", model: "", isPhysicalProduct: "",
  stock: 0, purchasePrice: "", salePrice: "", lengthCm: "", widthCm: "", heightCm: "", weightKg: "", supplier: "",
};
const inputStyle = "h-10 rounded-lg border-[#dce1e8] bg-white text-sm shadow-none placeholder:text-slate-400 focus-visible:border-red-400 focus-visible:ring-red-100";
const selectStyle = `${inputStyle} w-full border px-3`;

export default function CadastrarProdutoPage() {
  const router = useRouter();
  const routeStoreId = useParams<{ storeId: string }>().storeId;
  const [user, setUser] = useState<User | null>(null);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [categories, setCategories] = useState<string[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.replace("/signin");
        return;
      }
      setUser(currentUser);
      try {
        setStoreId(routeStoreId);
        const [storeCategories, storeSuppliers] = await Promise.all([getStoreCategories(routeStoreId), listSuppliers(routeStoreId)]);
        setCategories(storeCategories);
        setSuppliers(storeSuppliers);
      } catch {
        if (active) setFeedback({ kind: "error", message: "Não foi possível carregar os dados da loja. Atualize a página e tente novamente." });
      } finally {
        if (active) setLoading(false);
      }
    });
    return () => { active = false; unsubscribe(); };
  }, [router, routeStoreId]);

  function update<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleAddCategory() {
    if (!storeId) return;
    setFeedback(null);
    try {
      const category = await addStoreCategory(storeId, newCategory);
      setCategories((current) => current.some((item) => item.toLocaleLowerCase("pt-BR") === category.toLocaleLowerCase("pt-BR")) ? current : [...current, category]);
      update("category", category);
      setNewCategory("");
      setAddingCategory(false);
    } catch {
      setFeedback({ kind: "error", message: "Não foi possível salvar a categoria. Confira sua conexão e tente novamente." });
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    if (!user || !storeId) return;
    if (!form.category) {
      setFeedback({ kind: "error", message: "Selecione uma categoria ou adicione uma nova antes de registrar." });
      return;
    }
    if (form.isPhysicalProduct === "") return;
    const purchasePrice = parseCurrency(form.purchasePrice);
    const salePrice = parseCurrency(form.salePrice);
    if (purchasePrice === null || salePrice === null || !Number.isInteger(Number(form.stock)) || Number(form.stock) < 0) {
      setFeedback({ kind: "error", message: "Informe estoque inteiro e valores válidos, iguais ou maiores que zero." });
      return;
    }

    setSaving(true);
    try {
      await createProduct(storeId, {
        name: form.name,
        description: form.description,
        sku: form.sku,
        category: form.category,
        brand: form.brand,
        model: form.model,
        isPhysicalProduct: form.isPhysicalProduct === "true",
        stock: Number(form.stock),
        purchasePrice,
        salePrice,
        lengthCm: parseOptionalNumber(form.lengthCm),
        widthCm: parseOptionalNumber(form.widthCm),
        heightCm: parseOptionalNumber(form.heightCm),
        weightKg: parseOptionalNumber(form.weightKg),
        supplier: form.supplier,
      });
      setForm(emptyForm);
      setFeedback({ kind: "success", message: "Produto cadastrado com sucesso." });
    } catch {
      setFeedback({ kind: "error", message: "Não foi possível cadastrar o produto. Confira sua conexão e tente novamente." });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <main className="grid min-h-screen place-items-center bg-[#f5f7fb] text-sm text-slate-600"><LoaderCircle className="mr-2 inline size-4 animate-spin" />Carregando cadastro...</main>;

  return (
    <div className="flex min-h-screen bg-[#f5f7fb] text-slate-900">
      <AppSidebar className="hidden md:flex" />
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-7 lg:px-8 lg:py-7">
        <div className="mx-auto max-w-5xl">
          <header className="mb-5">
            <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Administração</p>
            <h1 className="text-xl font-bold leading-tight tracking-tight sm:text-[23px]">Cadastro de produtos</h1>
            <p className="mt-1 text-[11px] text-slate-500">Registre produtos, preços e informações de estoque da sua loja.</p>
          </header>

          <section className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_4px_18px_rgba(15,23,42,0.04)] sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div><h2 className="text-[15px] font-bold text-[#321e1e]">Cadastrar produto</h2><p className="mt-0.5 text-[11px] text-slate-500">Preencha os dados para adicionar um item ao catálogo.</p></div>
              <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1.5 text-[9px] font-bold uppercase">Novo registro</span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nome do produto" required><Input className={inputStyle} placeholder="Digite o nome do produto" value={form.name} onChange={(event) => update("name", event.target.value)} required /></Field>
                <Field label="Categoria" required>
                  <select className={selectStyle} value={addingCategory ? "__add_category__" : form.category} required={!addingCategory} onChange={(event) => {
                    if (event.target.value === "__add_category__") { setAddingCategory(true); update("category", ""); }
                    else update("category", event.target.value);
                  }}>
                    <option value="" disabled>Selecione uma categoria</option>
                    {categories.map((category) => <option key={category} value={category}>{category}</option>)}
                    <option value="__add_category__">＋ Adicionar categoria</option>
                  </select>
                  {addingCategory && <div className="mt-2 flex gap-2"><Input autoFocus className={`${inputStyle} min-w-0`} placeholder="Nome da categoria" value={newCategory} onChange={(event) => setNewCategory(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void handleAddCategory(); } }} /><Button type="button" variant="outline" onClick={() => void handleAddCategory()} className="h-10 shrink-0 border-slate-300"><Plus className="size-4" />Adicionar</Button></div>}
                </Field>
              </div>

              <Field label="Descrição do produto"><Textarea className="min-h-[74px] resize-y rounded-lg border-[#dce1e8] bg-white text-sm shadow-none placeholder:text-slate-400 focus-visible:border-red-400 focus-visible:ring-red-100" placeholder="Características, materiais, compatibilidade e benefícios." value={form.description} onChange={(event) => update("description", event.target.value)} /></Field>

              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Marca"><Input className={inputStyle} placeholder="Marca" value={form.brand} onChange={(event) => update("brand", event.target.value)} /></Field>
                <Field label="Modelo"><Input className={inputStyle} placeholder="Modelo" value={form.model} onChange={(event) => update("model", event.target.value)} /></Field>
                <Field label="Código SKU"><Input className={inputStyle} placeholder="Ex.: PRD-2026-001" value={form.sku} onChange={(event) => update("sku", event.target.value.toUpperCase())} /></Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Produto físico" required><select className={selectStyle} value={form.isPhysicalProduct} onChange={(event) => update("isPhysicalProduct", event.target.value as FormState["isPhysicalProduct"])} required><option value="" disabled>Selecione Sim ou Não</option><option value="true">Sim</option><option value="false">Não</option></select></Field>
                <Field label="Estoque" required><Input className={inputStyle} type="number" inputMode="numeric" min="0" step="1" placeholder="0" value={form.stock} onChange={(event) => update("stock", event.target.value === "" ? 0 : Number(event.target.value))} required /></Field>
                <Field label="Fornecedor"><select className={selectStyle} value={form.supplier} onChange={(event) => update("supplier", event.target.value)}><option value="">Sem fornecedor</option>{suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name} — {formatCnpjInput(supplier.cnpj)}</option>)}</select></Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <CurrencyField label="Valor de compra" value={form.purchasePrice} required onChange={(value) => update("purchasePrice", value)} />
                <CurrencyField label="Valor de venda" value={form.salePrice} required onChange={(value) => update("salePrice", value)} />
              </div>

              <fieldset className="rounded-lg border border-slate-200 p-3 sm:p-4">
                <legend className="px-1 text-[11px] font-semibold">Dimensões e peso <span className="font-normal text-slate-500">(opcional)</span></legend>
                <div className="grid gap-3 sm:grid-cols-4">
                  <NumberField label="Comprimento (L, cm)" value={form.lengthCm} onChange={(value) => update("lengthCm", value)} />
                  <NumberField label="Altura (cm)" value={form.heightCm} onChange={(value) => update("heightCm", value)} />
                  <NumberField label="Profundidade (P, cm)" value={form.widthCm} onChange={(value) => update("widthCm", value)} />
                  <NumberField label="Peso (kg)" value={form.weightKg} onChange={(value) => update("weightKg", value)} />
                </div>
              </fieldset>

              {feedback && <p role="status" aria-live="polite" className={`rounded-lg px-3 py-2 text-xs ${feedback.kind === "error" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>{feedback.message}</p>}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <span className="text-[10px] text-slate-500">Campos com * são obrigatórios.</span>
                <div className="ml-auto flex gap-2"><Button type="button" variant="outline" onClick={() => { setForm(emptyForm); setFeedback(null); }} className="h-10 border-slate-300 px-4 text-xs">Limpar</Button><Button type="submit" disabled={saving || !user || !storeId} className="h-10 rounded-lg bg-red-600 px-4 text-xs font-semibold text-white hover:bg-red-700">{saving ? <><LoaderCircle className="size-4 animate-spin" />Salvando...</> : <><Check className="size-4" />Registrar produto</>}</Button></div>
              </div>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return <label className="block min-w-0"><span className="mb-1.5 block text-[11px] font-semibold">{label}{required && <span className="ml-0.5 text-red-600">*</span>}</span>{children}</label>;
}

function CurrencyField({ label, value, required, onChange }: { label: string; value: string; required: boolean; onChange: (value: string) => void }) {
  return <Field label={label} required={required}><div className="relative"><span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">R$</span><Input className={`${inputStyle} pl-9`} inputMode="decimal" placeholder="0,00" value={value} onChange={(event) => onChange(event.target.value.replace(/\D/g, "") ? formatCurrencyInput(event.target.value) : "")} required /></div></Field>;
}

function NumberField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <Field label={label}><Input className={inputStyle} type="number" min="0" step="0.01" placeholder="—" value={value} onChange={(event) => onChange(event.target.value)} /></Field>;
}

function parseCurrency(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value.replaceAll(".", "").replace(",", "."));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function parseOptionalNumber(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}
