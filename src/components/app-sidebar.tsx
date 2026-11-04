"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/src/lib/firebase";
import {
  CircleHelp,
  Clock3,
  LayoutDashboard,
  List,
  LogOut,
  Package,
  RotateCcw,
  ShoppingCart,
  UserRoundPlus,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { auth, signOutUser } from "@/src/lib/auth";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  badgeTone?: "red" | "green";
};

const sections: { label?: string; items: NavItem[] }[] = [
  { items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }] },
  {
    label: "Cadastro",
    items: [
      { label: "Cadastrar produto", href: "/produtos", icon: Package },
      { label: "Listagem de produtos", href: "/produtos/listagem", icon: List },
      { label: "Clientes", href: "/clientes", icon: UserRoundPlus },
      { label: "Fornecedores", href: "/fornecedores", icon: UsersRound },
      { label: "Usuários/Equipe", href: "/equipe", icon: UsersRound },
    ],
  },
  {
    label: "Vendas",
    items: [
      { label: "Nova venda", href: "/nova-venda", icon: ShoppingCart },
      { label: "Histórico de vendas", href: "/historico-de-vendas", icon: Clock3 },
      { label: "Devoluções / Trocas", href: "/devolucoes-trocas", icon: RotateCcw },
    ],
  },
  {
    label: "Ajustes",
    items: [
      { label: "Ajuda", href: "/ajuda", icon: CircleHelp },
    ],
  },
];

type AppSidebarProps = {
  className?: string;
};

export function AppSidebar({ className = "" }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const storeBase = pathname.match(/^\/store\/([^/]+)/)?.[0];
  const [user, setUser] = useState<User | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    let stopProfile = () => {};
    const stopAuth = onAuthStateChanged(auth, (current) => {
      stopProfile();
      setUser(current);
      setIsOwner(false);
      if (current) stopProfile = onSnapshot(doc(db, "users", current.uid), (snapshot) => setIsOwner(snapshot.data()?.role === "store_admin"), () => setIsOwner(false));
    });
    return () => { stopProfile(); stopAuth(); };
  }, []);

  async function handleSignOut() {
    await signOutUser();
    router.replace("/signin");
  }

  const displayName = user?.displayName || user?.email?.split("@")[0] || "Usuário";
  const email = user?.email || "";
  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toLocaleUpperCase("pt-BR");

  return (
    <aside
      className={`flex h-screen w-[236px] shrink-0 flex-col border-r border-[#2b2b2d] bg-[#1d2028] text-[#c8c8cc] ${className}`}
      aria-label="Navegação principal"
    >
      <nav className="min-h-0 flex-1 overflow-y-auto px-[10px] py-2 [scrollbar-width:thin] [scrollbar-color:#414145_transparent]">
        {sections.map((section, sectionIndex) => (
          <div key={section.label ?? "main"} className={sectionIndex === 0 ? "mb-1" : "mb-2.5"}>
            {section.label && (
              <h2 className="mb-1 mt-1 px-2.5 pt-1 text-[9px] font-medium uppercase tracking-wide text-[#68686e]">
                {section.label}
              </h2>
            )}
            <ul className="space-y-0.5">
              {section.items.filter((item) => item.href !== "/equipe" || isOwner).map(({ label, href, icon: Icon, badge, badgeTone }) => {
                const destination = href === "/ajuda" ? href : storeBase ? `${storeBase}${href}` : "/store";
                const active = pathname === destination || (href !== "/dashboard" && href !== "/produtos" && pathname.startsWith(`${destination}/`));
                return (
                  <li key={href}>
                    <Link
                      href={destination}
                      aria-current={active ? "page" : undefined}
                      className={`group relative flex h-[31px] items-center gap-2.5 rounded-[9px] px-2.5 text-[11px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e14646] ${
                        active
                          ? "bg-[#c43c3d] text-white"
                          : "text-[#c5c5c9] hover:bg-[#252527] hover:text-white"
                      }`}
                    >
                      {active && <span className="absolute -left-[10px] h-4 w-[3px] rounded-r bg-[#ed3237]" />}
                      <Icon aria-hidden="true" className="size-[14px] shrink-0 text-[#aeb0b6] group-hover:text-current" strokeWidth={1.8} />
                      <span className="min-w-0 flex-1 truncate">{label}</span>
                      {badge && (
                        <span className={`flex size-[18px] shrink-0 items-center justify-center rounded-full text-[9px] ${badgeTone === "green" ? "bg-[#075b27] text-[#5bea7e]" : "bg-[#542023] text-[#ff6b70]"}`}>
                          {badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="mx-[17px] flex min-h-[77px] shrink-0 items-center gap-2.5 border-t border-[#2a2a2c]">
        <div className="relative flex size-[34px] shrink-0 items-center justify-center rounded-full border border-[#27e877] text-[10px] text-white">
          {initials || "U"}
          <span className="absolute bottom-0 right-0 size-2 rounded-full border border-[#1d2028] bg-[#27e877]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] font-medium text-white">{displayName}</p>
          <p className="truncate text-[9px] text-[#77777d]">{email}</p>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          aria-label="Sair da conta"
          title="Sair"
          className="flex size-[30px] shrink-0 items-center justify-center rounded-lg bg-[#29292d] text-[#aeb0b6] transition-colors hover:bg-[#38383d] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e14646]"
        >
          <LogOut aria-hidden="true" className="size-4" strokeWidth={1.8} />
        </button>
      </div>
    </aside>
  );
}

export default AppSidebar;
