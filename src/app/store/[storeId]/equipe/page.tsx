"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { BriefcaseBusiness, LoaderCircle, Mail, Search, UserRoundPlus } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import AppSidebar from "@/src/components/app-sidebar";
import { auth, createStoreInvitation, getUserProfile, subscribeToStoreTeam } from "@/src/lib/services/auth_service";
import { type TeamEntry } from "@/src/lib/types/auth_types";

const roles = ["Administrador", "Gerente", "Vendedor", "Financeiro", "Técnico"];

function errorMessage(error: unknown) {
  const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
  if (error instanceof Error && !code) return error.message;
  if (code.includes("permission-denied")) return "Somente o administrador da loja pode gerenciar a equipe.";
  if (code.includes("invalid-argument")) return "Confira o e-mail e o cargo selecionado.";
  return "Não foi possível carregar ou salvar a equipe. Tente novamente.";
}

export default function TeamPage() {
  const router = useRouter();
  const routeStoreId = useParams<{ storeId: string }>().storeId;
  const [members, setMembers] = useState<TeamEntry[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "error" | "success"; message: string } | null>(null);

  useEffect(() => {
    let active = true;
    let unsubscribeTeam = () => {};
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      unsubscribeTeam();
      unsubscribeTeam = () => {};
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
          return;
        }
        unsubscribeTeam = subscribeToStoreTeam(routeStoreId, (result) => {
          if (active) setMembers(result);
        }, (error) => {
          if (active) {
            setFeedback({ kind: "error", message: errorMessage(error) });
            setIsLoading(false);
          }
        }, () => {
          if (active) setIsLoading(false);
        });
      } catch (error) {
        if (active) {
          setFeedback({ kind: "error", message: errorMessage(error) });
          router.replace("/store");
        }
      }
    });
    return () => { active = false; unsubscribeTeam(); unsubscribe(); };
  }, [router, routeStoreId]);

  const filteredMembers = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    return members.filter((member) => !term || `${member.name} ${member.email} ${member.jobTitle}`.toLocaleLowerCase("pt-BR").includes(term));
  }, [members, search]);

  async function submitInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    if (!user) return;
    setIsSaving(true);
    try {
      await createStoreInvitation(user, routeStoreId, email, jobTitle);
      setEmail("");
      setJobTitle("");
      setFeedback({ kind: "success", message: "Convite salvo. O acesso será liberado quando a pessoa estiver online ou entrar na próxima vez." });
    } catch (error) {
      setFeedback({ kind: "error", message: errorMessage(error) });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-[#f5f7fb] text-slate-900">
      <AppSidebar className="hidden md:flex" />
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-7 lg:px-8 lg:py-7">
        <div className="mx-auto max-w-6xl">
          <header className="mb-5"><p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Administração</p><h1 className="text-xl font-bold tracking-tight">Equipe</h1><p className="mt-1 text-xs text-slate-500">Cadastre e consulte a equipe desta loja.</p></header>
          <div className="grid items-start gap-5 lg:grid-cols-[350px_minmax(0,1fr)]">
            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3"><UserRoundPlus className="size-4 text-red-600" /><h2 className="text-sm font-semibold">Adicionar à equipe</h2></div>
              <form onSubmit={submitInvite} className="space-y-3">
                <label className="block"><span className="mb-1.5 block text-[11px] font-semibold text-slate-700">E-mail da conta</span><span className="relative block"><Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="funcionario@exemplo.com" className="h-10 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100" /></span></label>
                <label className="block"><span className="mb-1.5 block text-[11px] font-semibold text-slate-700">Cargo / função</span><span className="relative block"><BriefcaseBusiness className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><select required value={jobTitle} onChange={(event) => setJobTitle(event.target.value)} className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"><option value="">Selecione um cargo</option>{roles.map((role) => <option key={role}>{role}</option>)}</select></span></label>
                {feedback && <p role="status" aria-live="polite" className={`rounded-md px-2.5 py-2 text-[11px] ${feedback.kind === "error" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>{feedback.message}</p>}
                <button type="submit" disabled={isSaving || !user} className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-red-600 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60">{isSaving ? <><LoaderCircle className="size-4 animate-spin" />Salvando...</> : "Adicionar à loja"}</button>
              </form>
              <p className="mt-3 text-xs leading-5 text-slate-500">O acesso é liberado automaticamente para quem estiver usando o app. Quem estiver offline recebe acesso na próxima entrada com este e-mail.</p>
            </section>

            <section className="flex min-h-[420px] min-w-0 flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4"><div><h2 className="text-sm font-semibold">Equipe da loja</h2><p className="mt-0.5 text-[11px] text-slate-500">{members.filter((member) => !member.pending).length} vinculados · {members.filter((member) => member.pending).length} convites pendentes</p></div><label className="relative block w-[220px]"><Search className="absolute left-2.5 top-1/2 size-3 -translate-y-1/2 text-neutral-500" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nome, cargo ou e-mail" className="h-10 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-red-400" /></label></div>
              <div className="min-w-0 flex-1 overflow-x-auto"><table className="w-full min-w-[520px] text-left"><thead className="bg-slate-50 text-[11px] font-semibold uppercase text-slate-500"><tr><th className="px-5 py-3 font-semibold">Usuário</th><th className="px-2 py-3 font-medium">Cargo / função</th><th className="px-2 py-3 font-medium">Status</th></tr></thead><tbody>
                {isLoading && <tr><td colSpan={3} className="py-16 text-center text-sm text-slate-500"><LoaderCircle className="mr-2 inline size-4 animate-spin" />Carregando equipe...</td></tr>}
                {!isLoading && filteredMembers.map((member) => <tr key={member.id} className="h-12 border-b border-neutral-100 last:border-0"><td className="px-5 py-2"><span className="block text-sm font-semibold">{member.name || "Funcionário"}</span><span className="block text-xs text-slate-500">{member.email}</span></td><td className="px-2 py-2 text-sm">{member.jobTitle}</td><td className="px-2 py-2"><span className={`rounded-full px-2 py-1 text-[11px] ${member.pending ? "bg-amber-50 text-amber-700" : "bg-green-50 text-green-700"}`}>{member.status}</span></td></tr>)}
                {!isLoading && filteredMembers.length === 0 && <tr><td colSpan={3} className="py-16 text-center text-sm text-slate-500">{members.length ? "Nenhum usuário encontrado." : "Sua equipe ainda não tem usuários vinculados."}</td></tr>}
              </tbody></table></div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
