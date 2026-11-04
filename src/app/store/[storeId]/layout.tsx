"use client";

import { useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useParams, usePathname, useRouter } from "next/navigation";
import { auth, canAccessStore, getUserProfile } from "@/src/lib/auth";

export default function StoreLayout({ children }: { children: ReactNode }) {
  const { storeId } = useParams<{ storeId: string }>();
  const router = useRouter();
  const pathname = usePathname();
  const isTeamPage = pathname === `/store/${storeId}/equipe` || pathname.startsWith(`/store/${storeId}/equipe/`);
  const accessKey = `${storeId}:${isTeamPage ? "team" : "store"}`;
  const [allowedId, setAllowedId] = useState<string | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    let generation = 0;
    const stop = onAuthStateChanged(auth, (user) => {
      const currentGeneration = ++generation;
      setAllowedId(null);
      setError(false);
      if (!user) { router.replace("/signin"); return; }
      void canAccessStore(user, storeId).then(async (allowed) => allowed && (!isTeamPage || (await getUserProfile(user)).role === "store_admin")).then((allowed) => {
        if (!active || currentGeneration !== generation) return;
        if (allowed) setAllowedId(accessKey);
        else router.replace("/store");
      }).catch((err: unknown) => {
        if (!active || currentGeneration !== generation) return;
        if (typeof err === "object" && err !== null && "code" in err && err.code === "permission-denied") router.replace("/store");
        else setError(true);
      });
    });
    return () => { active = false; stop(); };
  }, [router, storeId, isTeamPage, accessKey]);
  if (error) return <main role="alert" className="p-8">Não foi possível verificar o acesso à loja. Atualize a página e tente novamente.</main>;
  if (allowedId !== accessKey) return <main className="grid min-h-screen place-items-center text-sm text-neutral-600">Verificando acesso à loja...</main>;
  return children;
}
