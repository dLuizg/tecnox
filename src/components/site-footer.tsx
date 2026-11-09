const resources = [
  { label: "GitHub", href: "https://github.com/dLuizg/tecnox" },
  { label: "Projeto Firebase", href: "https://console.firebase.google.com/project/tecnox-1068f/firestore" },
  { label: "Figma", href: "https://www.figma.com/design/tRri6f4owijUU1uFVg6UUB/TECNOX?node-id=0-1&t=lmIVAjkVnXAzM5gz-1" },
  { label: "Unifeob", href: "https://unifeob.edu.br/" },
];
const application = [
  { label: "Ajuda", href: "/ajuda" },
  { label: "Política e privacidade", href: "/politica-e-privacidade" },
  { label: "Sobre", href: "/sobre" },
  { label: "Minhas lojas", href: "/store" },
  { label: "Entre em contato", href: "/contato" },
];

export default function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-[#1d2028] text-neutral-300">
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr]">
          <div>
            <p className="text-xl font-bold tracking-tight text-white">
              Tecnox<span className="text-[#dc3036]">.</span>
            </p>
            <p className="mt-3 max-w-xs text-sm leading-6 text-neutral-400">
              Gestão para sua loja, com mais organização no dia a dia.
            </p>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Recursos</h2>
            <ul className="mt-4 space-y-3 text-sm text-neutral-400">
              {resources.map(({ label, href }) => (
                <li key={href}>
                  <a href={href} target="_blank" rel="noopener noreferrer" className="rounded-sm hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Aplicação</h2>
            <ul className="mt-4 space-y-3 text-sm text-neutral-400">
              {application.map(({ label, href }) => (
                <li key={href}><Link href={href} className="rounded-sm hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">{label}</Link></li>
              ))}
            </ul>
          </div>
        </div>
        <p className="mt-10 border-t border-white/10 pt-6 text-xs text-neutral-400">
          © {new Date().getFullYear()} Tecnox. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
import Link from "next/link";

