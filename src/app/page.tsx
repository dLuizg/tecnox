"use client";

import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/src/lib/auth";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      router.replace(user ? "/dashboard" : "/login");
    });

    return unsubscribe;
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-white text-sm text-zinc-600">
      Carregando...
    </main>
  );
}
