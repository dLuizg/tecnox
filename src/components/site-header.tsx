"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { ChevronDown, LogOut, UserRound } from "lucide-react";
import { DropdownMenu } from "radix-ui";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/src/lib/firebase";
import { auth, signOutUser } from "@/src/lib/services/auth_service";
import { type UserRole } from "@/src/lib/types/auth_types";

export default function SiteHeader() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>();
  const [storeId, setStoreId] = useState<string>();
  const [ready, setReady] = useState(false);
  const [profileName, setProfileName] = useState("");
  useEffect(() => {
    let stopProfile = () => {};
    const stopAuth = onAuthStateChanged(auth, (current) => {
      stopProfile();
      setUser(current);
      setRole(undefined);
      setStoreId(undefined);
      setProfileName("");
      setReady(true);
      if (current) stopProfile = onSnapshot(doc(db, "users", current.uid), (snapshot) => {
        const data = snapshot.data();
        const value = data?.role;
        setProfileName(typeof data?.name === "string" ? data.name : "");
        setStoreId(value === "employee" && typeof data?.storeId === "string" && data.storeId ? data.storeId : undefined);
        setRole(value === "store_admin" || value === "employee" ? value : undefined);
      }, () => { setRole(undefined); setStoreId(undefined); });
    });
    return () => { stopProfile(); stopAuth(); };
  }, []);
  const displayName = profileName.trim() || user?.displayName?.trim() || user?.email?.split("@")[0] || "Usuário";
  const initials = displayName.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toLocaleUpperCase("pt-BR");
  const storeHref = role === "store_admin" ? "/store" : role === "employee" && storeId ? `/store/${encodeURIComponent(storeId)}/produtos` : undefined;

  return (
    <header className="relative z-30 border-b border-white/5 bg-[#1d2028] text-white">
      <nav aria-label="Navegação da conta" className="mx-auto flex min-h-[68px] max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2 sm:px-8">
        <Link href="/" aria-label="Tecnox, início" className="relative block h-11 w-36 shrink-0 overflow-hidden sm:w-40">
          <Image src="/logo.png" alt="Tecnox" width={160} height={160} priority className="absolute left-0 top-1/2 h-auto w-full -translate-y-1/2" />
        </Link>
        {ready && <div className="ml-auto flex flex-wrap items-center justify-end gap-3 text-sm font-medium sm:gap-5">
          {user ? <>
            {storeHref && <Link href={storeHref} className="rounded-full bg-[#dc3036] px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:px-5 sm:text-sm">{role === "store_admin" ? "Minhas lojas" : "Ir para a loja"}</Link>}
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button type="button" aria-label="Abrir menu da conta" className="flex items-center gap-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#1d2028]">
                  <span aria-hidden="true" className="grid size-9 place-items-center rounded-full border border-white/20 bg-[#383b43] text-xs font-semibold text-white">{initials || "U"}</span>
                  <ChevronDown aria-hidden="true" className="size-4 text-neutral-300" />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content align="end" sideOffset={10} className="z-50 min-w-52 rounded-xl border border-neutral-200 bg-white p-1.5 text-neutral-900 shadow-xl outline-none">
                  <DropdownMenu.Label className="max-w-64 truncate px-3 py-2 text-xs font-semibold text-neutral-500">{displayName}</DropdownMenu.Label>
                  <DropdownMenu.Separator className="my-1 h-px bg-neutral-100" />
                  <DropdownMenu.Item asChild><Link href="/profile" className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm outline-none data-highlighted:bg-neutral-100"><UserRound aria-hidden="true" className="size-4" />Minha conta</Link></DropdownMenu.Item>
                  <DropdownMenu.Item onSelect={() => { void signOutUser(); }} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-red-700 outline-none data-highlighted:bg-red-50"><LogOut aria-hidden="true" className="size-4" />Sair</DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </> : <><Link className="rounded-md px-2 py-2 text-neutral-100 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white" href="/signin">Entrar</Link><Link className="rounded-full bg-[#dc3036] px-4 py-2.5 text-xs font-semibold text-white hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:px-5 sm:text-sm" href="/signup">Cadastrar</Link></>}
        </div>}
      </nav>
    </header>
  );
}
