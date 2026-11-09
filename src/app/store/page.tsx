"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { ArrowRight, Plus, Store } from "lucide-react";
import { auth, listOwnedStores } from "@/src/lib/auth";
import { db } from "@/src/lib/firebase";

type StoreItem = Awaited<ReturnType<typeof listOwnedStores>>[number];
type LoadError = { stage: "profile" | "stores"; code: string };

function errorMessage(error: LoadError) {
  const subject = error.stage === "profile" ? "seu perfil" : "suas lojas";
  if (error.code === "permission-denied") return `Sua conta não tem permissão para carregar ${subject}. Verifique o acesso e tente novamente.`;
  if (error.code === "unavailable" || error.code === "deadline-exceeded") return `Não foi possível conectar para carregar ${subject}. Verifique sua conexão e tente novamente.`;
  if (error.code === "invalid-role") return "O tipo de acesso da sua conta é inválido. Verifique seus dados de perfil.";
  return `Não foi possível carregar ${subject}. Tente novamente.`;
}

export default function StorePicker() {
  const router = useRouter();
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [status, setStatus] = useState<"loading" | "owner" | "waiting" | "error">("loading");
  const [loadError, setLoadError] = useState<LoadError | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let stopProfile = () => {};
    let active = true;
    let generation = 0;
    let authGeneration = 0;
    function fail(stage: LoadError["stage"], error: unknown) {
      if (!active) return;
      const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "unknown";
      console.error(`Falha ao carregar ${stage === "profile" ? "perfil" : "lojas"}:`, error);
      setLoadError({ stage, code });
      setStatus("error");
    }
    const stopAuth = onAuthStateChanged(auth, (user) => {
      stopProfile();
      const currentAuth = ++authGeneration;
      generation++;
      if (!user) { router.replace("/signin"); return; }
      stopProfile = onSnapshot(doc(db, "users", user.uid), (snapshot) => {
        if (!active || currentAuth !== authGeneration) return;
        const currentGeneration = ++generation;
        if (!snapshot.exists() || !snapshot.data().role) { router.replace("/signup?completeProfile=1"); return; }
        const profile = snapshot.data();
        if (profile.role === "employee") {
          if (typeof profile.storeId === "string" && profile.storeId) router.replace(`/store/${encodeURIComponent(profile.storeId)}/produtos`);
          else setStatus("waiting");
          return;
        }
        if (profile.role !== "store_admin") { fail("profile", { code: "invalid-role" }); return; }
        void listOwnedStores(user).then((result) => {
          if (active && currentGeneration === generation) { setStores(result); setStatus("owner"); }
        }).catch((error: unknown) => {
          if (active && currentGeneration === generation) fail("stores", error);
        });
      }, (error) => { if (active && currentAuth === authGeneration) { generation++; fail("profile", error); } });
    });
    return () => { active = false; generation++; stopProfile(); stopAuth(); };
  }, [router, attempt]);

  function retry() {
    setLoadError(null);
    setStatus("loading");
    setAttempt((current) => current + 1);
  }
  return <main className="min-h-[calc(100vh-4rem)] bg-neutral-50 px-5 py-12 text-neutral-900"><div className="mx-auto max-w-5xl">
    {status === "loading" && <p role="status">Carregando sua conta...</p>}
    {status === "error" && loadError && <div role="alert" className="rounded-xl bg-red-50 p-4 text-red-700"><p>{errorMessage(loadError)}</p><button type="button" onClick={retry} className="mt-3 rounded-md border border-red-300 px-3 py-2 text-sm font-semibold hover:bg-red-100">Tentar novamente</button></div>}
    {status === "waiting" && <section className="rounded-2xl border bg-white p-8"><h1 className="text-2xl font-bold">Aguardando convite</h1><p className="mt-3 text-neutral-600">Quando o administrador convidar o e-mail da sua conta, sua loja aparecerá aqui.</p></section>}
    {status === "owner" && <><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold text-red-600">SUAS LOJAS</p><h1 className="mt-2 text-3xl font-bold">Escolha uma loja</h1><p className="mt-2 text-neutral-600">Acesse a operação que deseja gerenciar.</p></div><Link href="/store-setup" className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700"><Plus size={18} /> Cadastrar loja</Link></div>
      {stores.length === 0 ? <div className="mt-8 rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-neutral-600">Você ainda não cadastrou uma loja. Cadastre a primeira para começar.</div> : <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{stores.map((store) => <Link key={store.id} href={`/store/${encodeURIComponent(store.id)}/produtos`} className="group rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:border-red-300 hover:shadow-md"><Store className="size-8 text-red-600" /><h2 className="mt-5 text-lg font-bold">{store.name}</h2><p className="mt-1 text-sm text-neutral-500">{[store.city, store.state].filter(Boolean).join(" - ")}</p><span className="mt-6 flex items-center gap-2 text-sm font-semibold text-red-600">Acessar loja <ArrowRight size={16} /></span></Link>)}</div>}
    </>}
  </div></main>;
}
