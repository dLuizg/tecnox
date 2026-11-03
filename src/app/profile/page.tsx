"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { BriefcaseBusiness, LoaderCircle, Mail, Phone, UserRound } from "lucide-react";
import { onAuthStateChanged, updateProfile, type User } from "firebase/auth";
import AppSidebar from "@/src/components/app-sidebar";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { formatPhoneInput } from "@/src/helpers/phone";
import { auth, getUserProfile, updateUserProfile } from "@/src/lib/auth";

type Feedback = { kind: "error" | "success"; message: string } | null;
type ProfileForm = { name: string; email: string; phone: string; jobTitle: string };

const fieldClass = "h-[34px] rounded-md border-[#dedede] pl-8 pr-2 text-[11px] shadow-none placeholder:text-neutral-400 focus-visible:border-red-400 focus-visible:ring-red-100 disabled:bg-neutral-50 disabled:text-neutral-500";
const emptyForm: ProfileForm = { name: "", email: "", phone: "", jobTitle: "" };

function getRoleLabel(role?: string) {
  if (role === "store_admin") return "Administrador da loja";
  if (role === "employee") return "Funcionário";
  return "";
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  useEffect(() => {
    let cancelled = false;
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.replace("/signin");
        return;
      }

      setUser(currentUser);
      setIsLoading(true);
      try {
        const profile = await getUserProfile(currentUser);
        if (cancelled) return;
        setForm({
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          jobTitle: getRoleLabel(profile.role),
        });
      } catch {
        if (!cancelled) setFeedback({ kind: "error", message: "Não foi possível carregar os dados do perfil." });
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [router]);

  function changeField(field: keyof ProfileForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setFeedback(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;

    setFeedback(null);
    setIsSaving(true);
    try {
      await updateUserProfile(user, form);
      if (user.displayName !== form.name.trim()) {
        await updateProfile(user, { displayName: form.name.trim() });
      }
      setFeedback({ kind: "success", message: "Perfil salvo com sucesso." });
    } catch {
      setFeedback({ kind: "error", message: "Não foi possível salvar as alterações. Tente novamente." });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-white text-[#171717]">
      <AppSidebar className="hidden md:flex" />

      <main className="min-w-0 flex-1 px-5 py-7 sm:px-8 lg:px-[clamp(28px,4vw,52px)] lg:py-10">
        <div className="mx-auto max-w-[1500px]">
          <header className="mb-5">
            <h1 className="text-[17px] font-extrabold tracking-tight">PERFIL</h1>
          </header>

          <form onSubmit={handleSubmit} className="w-full max-w-[421px]">
            <Card className="rounded-lg border border-[#e5e5e5] bg-white px-[18px] pb-5 pt-4 shadow-none ring-0">
              <h2 className="border-b border-neutral-200 pb-2 text-[11px] font-medium">Meu Perfil</h2>

              <div className="space-y-2 pt-4">
                <ProfileField label="Nome completo" icon={UserRound}>
                  <Input id="profile-name" autoComplete="name" required minLength={2} value={form.name} onChange={(event) => changeField("name", event.target.value)} disabled={isLoading} className={fieldClass} placeholder="Seu nome" />
                </ProfileField>
                <ProfileField label="E-mail" icon={Mail}>
                  <Input id="profile-email" type="email" value={form.email} readOnly disabled={isLoading} className={fieldClass} />
                </ProfileField>
                <ProfileField label="Telefone" icon={Phone}>
                  <Input id="profile-phone" type="tel" autoComplete="tel" value={form.phone} onChange={(event) => changeField("phone", formatPhoneInput(event.target.value))} disabled={isLoading} className={fieldClass} placeholder="(11) 90000-0000" />
                </ProfileField>
                <ProfileField label="Cargo" icon={BriefcaseBusiness}>
                  <Input id="profile-job-title" value={form.jobTitle} readOnly disabled={isLoading} className={fieldClass} aria-readonly="true" />
                </ProfileField>
              </div>
            </Card>

            {feedback && (
              <p role="status" aria-live="polite" className={`mt-3 rounded-md px-3 py-2 text-[11px] ${feedback.kind === "error" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
                {feedback.message}
              </p>
            )}

            <div className="mt-4 flex justify-center sm:justify-end">
              <Button type="submit" disabled={isLoading || isSaving} className="h-[34px] w-[154px] rounded-md bg-[#ed3535] text-[10px] font-medium text-white hover:bg-red-600">
                {isLoading ? <><LoaderCircle className="mr-2 size-3.5 animate-spin" /> Carregando...</> : isSaving ? <><LoaderCircle className="mr-2 size-3.5 animate-spin" /> Salvando...</> : "Salvar Alterações"}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

function ProfileField({ label, icon: Icon, children }: {
  label: string;
  icon: typeof UserRound;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-0.5 block text-[9px] font-medium uppercase">{label}</span>
      <span className="relative block">
        <Icon aria-hidden="true" className="pointer-events-none absolute left-2.5 top-1/2 z-10 size-3.5 -translate-y-1/2 text-neutral-400" strokeWidth={1.7} />
        {children}
      </span>
    </label>
  );
}
