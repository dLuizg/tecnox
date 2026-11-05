"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { AlignLeft, BadgeCheck, Building2, Hash, LoaderCircle, Mail, Map, MapPin, MapPinned, Phone, Route, Store, type LucideIcon } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { formatCnpjInput } from "@/src/helpers/cpf-cnpj";
import { formatCepInput, getCepDigits } from "@/src/helpers/cep";
import { formatPhoneInput } from "@/src/helpers/phone";
import { auth, createStoreProfile, getUserProfile, type StoreProfileInput } from "@/src/lib/auth";
import { useCepLookup } from "@/src/hooks/use-cep-lookup";

type Feedback = { kind: "error" | "success"; message: string } | null;
type StoreForm = StoreProfileInput;

const emptyForm: StoreForm = {
  name: "", cnpj: "",
  address: { cep: "", street: "", number: "", complement: "", neighborhood: "", city: "", state: "" },
  phone: "", email: "",
};

const inputClass = "h-10 rounded-lg border-neutral-300 bg-white text-sm shadow-none focus-visible:ring-1 focus-visible:ring-red-400";
const brazilianStates = [
  ["AC", "Acre"], ["AL", "Alagoas"], ["AP", "Amapá"], ["AM", "Amazonas"],
  ["BA", "Bahia"], ["CE", "Ceará"], ["DF", "Distrito Federal"], ["ES", "Espírito Santo"],
  ["GO", "Goiás"], ["MA", "Maranhão"], ["MT", "Mato Grosso"], ["MS", "Mato Grosso do Sul"],
  ["MG", "Minas Gerais"], ["PA", "Pará"], ["PB", "Paraíba"], ["PR", "Paraná"],
  ["PE", "Pernambuco"], ["PI", "Piauí"], ["RJ", "Rio de Janeiro"], ["RN", "Rio Grande do Norte"],
  ["RS", "Rio Grande do Sul"], ["RO", "Rondônia"], ["RR", "Roraima"], ["SC", "Santa Catarina"],
  ["SP", "São Paulo"], ["SE", "Sergipe"], ["TO", "Tocantins"],
] as const;

export default function StoreSetupPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [form, setForm] = useState<StoreForm>(emptyForm);
  const [isChecking, setIsChecking] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const { lookupCep, status: cepLookupStatus, message: cepLookupMessage } = useCepLookup();

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.replace("/signin");
        return;
      }
      setUser(currentUser);
      try {
        const profile = await getUserProfile(currentUser);
        if (!active) return;
        if (profile.role !== "store_admin") {
          router.replace("/store");
        }
      } catch {
        if (active) setFeedback({ kind: "error", message: "Não foi possível verificar sua conta. Atualize a página e tente novamente." });
      } finally {
        if (active) setIsChecking(false);
      }
    });
    return () => { active = false; unsubscribe(); };
  }, [router]);

  function updateAddress(field: keyof StoreForm["address"], value: string) {
    setForm((current) => ({ ...current, address: { ...current.address, [field]: value } }));
  }

  function handleCepChange(value: string) {
    const digits = getCepDigits(value);
    const cep = digits.length > 8 ? digits.slice(0, 9) : formatCepInput(value);
    setForm((current) => ({ ...current, address: { ...current.address, cep } }));

    void lookupCep(value).then((address) => {
      if (!address) return;
      setForm((current) => {
        if (getCepDigits(current.address.cep) !== digits) return current;
        return { ...current, address: { ...current.address, ...address } };
      });
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    if (!user) return;
    const cnpjCharacters = form.cnpj.replace(/[^0-9A-Z]/gi, "");
    if (cnpjCharacters.length !== 14) {
      setFeedback({ kind: "error", message: "Informe um CNPJ completo com 14 caracteres." });
      return;
    }
    if (getCepDigits(form.address.cep).length !== 8) {
      setFeedback({ kind: "error", message: "Informe um CEP válido com 8 dígitos." });
      return;
    }

    setIsSaving(true);
    try {
      const storeId = await createStoreProfile(user, form);
      router.replace(`/store/${storeId}/dashboard`);
    } catch {
      setFeedback({ kind: "error", message: "Não foi possível salvar os dados da loja. Confira sua conexão e tente novamente." });
    } finally {
      setIsSaving(false);
    }
  }

  if (isChecking) {
    return <main className="grid min-h-screen place-items-center bg-[#f4f4f5] text-sm text-neutral-600"><LoaderCircle className="mr-2 inline size-4 animate-spin" /> Verificando sua conta...</main>;
  }

  return (
    <main className="min-h-screen bg-[#f4f4f5] px-4 py-8 text-neutral-900 sm:px-6 sm:py-12">
      <section className="mx-auto max-w-2xl rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-8">
        <div className="mb-6 flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-red-50 text-[#e51f23]"><Store className="size-5" /></span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#e51f23]">Configuração inicial</p>
            <h1 className="mt-1 text-xl font-bold sm:text-2xl">Cadastre sua loja</h1>
            <p className="mt-1 text-sm text-neutral-500">Esses dados identificam a loja e serão usados para organizar sua equipe e operação.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <fieldset className="space-y-4">
            <legend className="mb-3 text-sm font-semibold">Dados da loja</legend>
            <p className="-mt-2 text-[11px] text-neutral-500"><span aria-hidden="true" className="font-bold text-red-600">*</span> Campos obrigatórios</p>
            <Field label="Nome da loja" htmlFor="store-name" icon={Store} required><Input id="store-name" required minLength={2} autoComplete="organization" placeholder="Nome da loja" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className={`${inputClass} pl-9`} /></Field>
            <Field label="CNPJ" htmlFor="store-cnpj" icon={BadgeCheck} required><Input id="store-cnpj" required inputMode="text" autoComplete="off" placeholder="00.000.000/0000-00" value={form.cnpj} onChange={(event) => setForm((current) => ({ ...current, cnpj: formatCnpjInput(event.target.value) }))} className={`${inputClass} pl-9`} /></Field>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="mb-3 text-sm font-semibold">Endereço</legend>
            <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
              <Field label="CEP" htmlFor="store-cep" icon={MapPin} required><Input id="store-cep" required inputMode="numeric" autoComplete="postal-code" maxLength={9} placeholder="00000-000" value={form.address.cep} onChange={(event) => handleCepChange(event.target.value)} className={`${inputClass} pl-9`} /></Field>
              <Field label="Rua" htmlFor="store-street" icon={Route} required><Input id="store-street" required autoComplete="address-line1" placeholder="Rua" value={form.address.street} onChange={(event) => updateAddress("street", event.target.value)} className={`${inputClass} pl-9`} /></Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Número" htmlFor="store-number" icon={Hash} required><Input id="store-number" required placeholder="Número" value={form.address.number} onChange={(event) => updateAddress("number", event.target.value)} className={`${inputClass} pl-9`} /></Field>
              <Field label="Complemento (opcional)" htmlFor="store-complement" icon={AlignLeft}><Input id="store-complement" autoComplete="address-line2" placeholder="Complemento" value={form.address.complement} onChange={(event) => updateAddress("complement", event.target.value)} className={`${inputClass} pl-9`} /></Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Bairro" htmlFor="store-neighborhood" icon={MapPinned} required><Input id="store-neighborhood" required autoComplete="address-level3" placeholder="Bairro" value={form.address.neighborhood} onChange={(event) => updateAddress("neighborhood", event.target.value)} className={`${inputClass} pl-9`} /></Field>
              <Field label="Cidade" htmlFor="store-city" icon={Building2} required><Input id="store-city" required autoComplete="address-level2" placeholder="Cidade" value={form.address.city} onChange={(event) => updateAddress("city", event.target.value)} className={`${inputClass} pl-9`} /></Field>
            </div>
            <Field label="Estado (UF)" htmlFor="store-state" icon={Map} required>
              <select id="store-state" required autoComplete="address-level1" value={form.address.state} onChange={(event) => updateAddress("state", event.target.value)} className={`${inputClass} w-full appearance-none pl-9 pr-2.5 sm:max-w-56`}>
                <option value="" disabled>UF</option>
                {brazilianStates.map(([uf, name]) => <option key={uf} value={uf}>{name} ({uf})</option>)}
              </select>
            </Field>
            {cepLookupStatus === "loading" && <p role="status" aria-live="polite" className="flex items-center gap-2 text-xs text-neutral-500"><LoaderCircle aria-hidden="true" className="size-3.5 animate-spin" />Consultando o CEP...</p>}
            {cepLookupMessage && cepLookupStatus !== "loading" && <p role="status" aria-live="polite" className={`text-xs ${cepLookupStatus === "error" || cepLookupStatus === "not-found" || cepLookupStatus === "invalid" ? "text-amber-700" : "text-neutral-500"}`}>{cepLookupMessage}</p>}
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="mb-3 text-sm font-semibold">Contato <span className="font-normal text-neutral-500">(opcional)</span></legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Telefone" htmlFor="store-phone" icon={Phone}><Input id="store-phone" type="tel" autoComplete="tel" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: formatPhoneInput(event.target.value) }))} className={`${inputClass} pl-9`} /></Field>
              <Field label="E-mail" htmlFor="store-email" icon={Mail}><Input id="store-email" type="email" autoComplete="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} className={`${inputClass} pl-9`} /></Field>
            </div>
          </fieldset>

          {feedback && <p role="status" aria-live="polite" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{feedback.message}</p>}
          <Button type="submit" disabled={isSaving || !user} className="h-11 w-full rounded-lg bg-[#e51f23] font-semibold text-white hover:bg-[#ca1b1f]">
            {isSaving ? <><LoaderCircle className="mr-2 size-4 animate-spin" /> Salvando loja...</> : "Salvar e acessar o dashboard"}
          </Button>
        </form>
      </section>
    </main>
  );
}

function Field({ label, htmlFor, icon: Icon, required = false, children }: { label: string; htmlFor: string; icon: LucideIcon; required?: boolean; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-xs font-medium text-neutral-700">{label} {required && <span aria-hidden="true" className="font-bold text-red-600">*</span>}</Label>
      <span className="relative block"><Icon aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />{children}</span>
    </div>
  );
}
