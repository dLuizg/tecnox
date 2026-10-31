"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  Bell, BriefcaseBusiness, CalendarDays, ChevronDown, ChevronLeft, ChevronRight,
  CircleAlert, Download, Eye, Filter, Grid2X2, House, Mail, MapPin,
  Search, ShieldCheck, Smartphone, UserRound, UserRoundPlus, X, Pencil,
} from "lucide-react";
import AppSidebar from "@/src/components/app-sidebar";
import { formatPhoneInput } from "@/src/helpers/phone";

type TeamMember = {
  id: number;
  name: string;
  email: string;
  role: string;
  department: string;
  phone: string;
  lastAccess: string;
  accessNote: string;
  status: "Ativo" | "Inativo";
  color: string;
  initials: string;
};

const initialMembers: TeamMember[] = [
  { id: 1, name: "Carla Souza", email: "carla.souza@tecnox.com", role: "Gerente", department: "Vendas", phone: "(19) 99876-5432", lastAccess: "12/09/2026", accessNote: "Há 6 dias", status: "Ativo", color: "bg-red-500", initials: "CS" },
  { id: 2, name: "Marcos Rocha", email: "marcos.rocha@tecnox.com", role: "Vendedor", department: "Vendas", phone: "(19) 98123-4567", lastAccess: "28/08/2026", accessNote: "Há 21 dias", status: "Ativo", color: "bg-blue-600", initials: "MR" },
  { id: 3, name: "Paulo Costa", email: "paulo.costa@tecnox.com", role: "Técnico", department: "Assist. Técnica", phone: "(19) 3641-8899", lastAccess: "17/09/2026", accessNote: "Ontem", status: "Ativo", color: "bg-purple-700", initials: "PC" },
  { id: 4, name: "Ana Ferreira", email: "ana.ferreira@tecnox.com", role: "Financeiro", department: "Financeiro", phone: "—", lastAccess: "05/09/2026", accessNote: "Há 13 dias", status: "Ativo", color: "bg-green-700", initials: "AF" },
  { id: 5, name: "Rafael Mendes", email: "rafael.mendes@tecnox.com", role: "Administrador", department: "Diretoria", phone: "—", lastAccess: "16/09/2026", accessNote: "Há 2 dias", status: "Ativo", color: "bg-orange-500", initials: "RM" },
  { id: 6, name: "Camila Ribeiro", email: "camila.ribeiro@tecnox.com", role: "Vendedor", department: "Vendas", phone: "(19) 98812-6677", lastAccess: "10/09/2026", accessNote: "Há 8 dias", status: "Ativo", color: "bg-pink-700", initials: "CR" },
  { id: 7, name: "Lucas Almeida", email: "lucas.almeida@tecnox.com", role: "Técnico", department: "Assist. Técnica", phone: "(19) 97001-2244", lastAccess: "14/03/2025", accessNote: "Há 18 meses", status: "Inativo", color: "bg-gray-400", initials: "LA" },
  { id: 8, name: "Juliana Martins", email: "juliana.martins@tecnox.com", role: "Financeiro", department: "Financeiro", phone: "(19) 99102-4531", lastAccess: "18/09/2026", accessNote: "Hoje", status: "Ativo", color: "bg-teal-600", initials: "JM" },
  { id: 9, name: "Bruno Carvalho", email: "bruno.carvalho@tecnox.com", role: "Vendedor", department: "Vendas", phone: "(19) 99731-0554", lastAccess: "17/09/2026", accessNote: "Ontem", status: "Ativo", color: "bg-indigo-600", initials: "BC" },
  { id: 10, name: "Fernanda Lima", email: "fernanda.lima@tecnox.com", role: "Gerente", department: "Operações", phone: "(19) 99145-2088", lastAccess: "09/09/2026", accessNote: "Há 9 dias", status: "Ativo", color: "bg-amber-600", initials: "FL" },
  { id: 11, name: "Diego Santos", email: "diego.santos@tecnox.com", role: "Técnico", department: "Assist. Técnica", phone: "(19) 98231-7790", lastAccess: "02/08/2026", accessNote: "Há 47 dias", status: "Inativo", color: "bg-cyan-700", initials: "DS" },
  { id: 12, name: "Patrícia Nunes", email: "patricia.nunes@tecnox.com", role: "Financeiro", department: "Financeiro", phone: "(19) 99564-1098", lastAccess: "16/09/2026", accessNote: "Há 2 dias", status: "Ativo", color: "bg-rose-600", initials: "PN" },
];

const roles = ["Administrador", "Gerente", "Vendedor", "Financeiro", "Técnico"];
const permissions = ["Vendas", "Produtos", "Clientes", "Relatórios"];

const emptyForm = {
  name: "", email: "", role: "", permission: "", phone: "", temporaryPassword: "",
  admissionDate: "", location: "", status: "Ativo" as TeamMember["status"],
};

function Field({ label, icon: Icon, children, className = "" }: {
  label: string; icon?: typeof UserRound; children: ReactNode; className?: string;
}) {
  return (
    <label className={`block min-w-0 ${className}`}>
      <span className="mb-1 block text-[10px] font-medium uppercase text-neutral-600">{label}</span>
      <span className="relative flex h-[29px] items-center">
        {Icon && <Icon className="pointer-events-none absolute left-2 size-3.5 text-neutral-500" strokeWidth={1.7} />}
        {children}
      </span>
    </label>
  );
}

const fieldClass = "h-full w-full rounded-md border border-[#dedede] bg-white px-2 text-[11px] text-neutral-700 outline-none placeholder:text-neutral-400 focus:border-red-400 focus:ring-2 focus:ring-red-100";

export default function TeamPage() {
  const [members, setMembers] = useState(initialMembers);
  const [form, setForm] = useState(emptyForm);
  const [selectedPermissions, setSelectedPermissions] = useState(["Vendas"]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("Cargo");
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [viewing, setViewing] = useState<TeamMember | null>(null);
  const pageSize = 7;

  const filteredMembers = useMemo(() => members.filter((member) => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    const matchesSearch = !term || `${member.name} ${member.email} ${member.role}`.toLocaleLowerCase("pt-BR").includes(term);
    return matchesSearch && (roleFilter === "Cargo" || member.role === roleFilter);
  }), [members, roleFilter, search]);
  const pageCount = Math.max(1, Math.ceil(filteredMembers.length / pageSize));
  const visibleMembers = filteredMembers.slice((page - 1) * pageSize, page * pageSize);

  function changeForm(key: keyof typeof emptyForm, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function saveMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;
    const base = editingId ? members.find((member) => member.id === editingId) : undefined;
    const member: TeamMember = {
      id: editingId ?? Date.now(), name: form.name.trim(), email: form.email.trim(),
      role: form.role || "Vendedor", department: form.location || form.role || "Vendas",
      phone: form.phone || "—", lastAccess: base?.lastAccess ?? "—", accessNote: base?.accessNote ?? "Ainda não acessou",
      status: form.status, color: base?.color ?? "bg-red-500",
      initials: form.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase(),
    };
    setMembers((current) => editingId ? current.map((item) => item.id === editingId ? member : item) : [member, ...current]);
    setForm(emptyForm);
    setSelectedPermissions(["Vendas"]);
    setEditingId(null);
    setPage(1);
  }

  function editMember(member: TeamMember) {
    setEditingId(member.id);
    setForm({ name: member.name, email: member.email, role: member.role, permission: "", phone: member.phone === "—" ? "" : member.phone,
      temporaryPassword: "", admissionDate: "", location: member.department, status: member.status });
  }

  function exportMembers() {
    const rows = [["Nome", "E-mail", "Cargo", "Telefone", "Status"], ...filteredMembers.map((member) => [member.name, member.email, member.role, member.phone, member.status])];
    const csv = rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(";")).join("\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = "equipe-tecnox.csv"; anchor.click(); URL.revokeObjectURL(url);
  }

  return (
    <div className="flex min-h-screen bg-white text-[#171717]">
      <AppSidebar className="hidden md:flex" />
      <main className="min-w-0 flex-1 px-5 py-7 sm:px-8 lg:px-[clamp(28px,4vw,52px)] lg:py-10">
        <div className="mx-auto max-w-[1500px]">
          <header className="mb-5 flex items-center justify-between">
            <h1 className="text-[17px] font-extrabold tracking-tight">USUÁRIOS/EQUIPE</h1>
            <button aria-label="Notificações" className="hidden rounded-md p-2 text-neutral-400 hover:bg-neutral-100"><Bell className="size-4" /></button>
          </header>

          <div className="grid items-start gap-5 xl:grid-cols-[304px_minmax(0,1fr)] 2xl:gap-6">
            <section className="rounded-lg border border-[#e5e5e5] bg-white px-[18px] pb-5 pt-4">
              <div className="mb-2 flex items-center gap-2 border-b border-neutral-100 pb-2.5">
                <UserRoundPlus className="size-4 text-[#ed3333]" strokeWidth={1.8} />
                <h2 className="text-[11px] font-medium">{editingId ? "Editar Usuário" : "Novo Usuário"}</h2>
              </div>
              <form onSubmit={saveMember} className="space-y-2">
                <fieldset>
                  <legend className="mb-1 text-[10px] font-medium uppercase text-neutral-600">Status</legend>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(["Ativo", "Inativo"] as const).map((status) => (
                      <button key={status} type="button" onClick={() => changeForm("status", status)} className={`flex h-[27px] items-center gap-2 rounded-md border px-2.5 text-[11px] ${form.status === status ? "border-[#e63838] bg-[#e63838] text-white" : "border-[#dedede] text-neutral-600 hover:bg-neutral-50"}`}>
                        {status === "Ativo" ? <UserRound className="size-3.5" /> : <Grid2X2 className="size-3.5" />}{status}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <Field label="Nome completo" icon={UserRound}><input className={`${fieldClass} pl-7`} placeholder="Ex: Carla Souza" value={form.name} onChange={(event) => changeForm("name", event.target.value)} required /></Field>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Cargo" icon={BriefcaseBusiness}><select className={`${fieldClass} appearance-none pl-7 pr-5`} value={form.role} onChange={(event) => changeForm("role", event.target.value)}><option value="">Selecione um cargo</option>{roles.map((role) => <option key={role}>{role}</option>)}</select><ChevronDown className="pointer-events-none absolute right-2 size-3 text-neutral-500" /></Field>
                  <Field label="Permissão" icon={CalendarDays}><select className={`${fieldClass} appearance-none pl-7 pr-5`} value={form.permission} onChange={(event) => changeForm("permission", event.target.value)}><option value="">Selecione o nível</option><option>Personalizado</option><option>Completo</option></select><ChevronDown className="pointer-events-none absolute right-2 size-3 text-neutral-500" /></Field>
                </div>
                <Field label="E-mail" icon={Mail}><input className={`${fieldClass} pl-7`} type="email" placeholder="usuario@tecnox.com" value={form.email} onChange={(event) => changeForm("email", event.target.value)} required /></Field>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Telefone" icon={Smartphone}><input className={`${fieldClass} pl-7`} type="tel" placeholder="(00) 00000-0000" value={form.phone} onChange={(event) => changeForm("phone", formatPhoneInput(event.target.value))} /></Field>
                  <Field label="Senha temporária" icon={ShieldCheck}><input className={`${fieldClass} pl-7`} type="password" placeholder="••••••••" value={form.temporaryPassword} onChange={(event) => changeForm("temporaryPassword", event.target.value)} /></Field>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Data de admissão" icon={MapPin}><input className={`${fieldClass} pl-7`} placeholder="dd/mm/aaaa" value={form.admissionDate} onChange={(event) => changeForm("admissionDate", event.target.value)} /></Field>
                  <Field label="Loja / unidade" icon={House}><input className={`${fieldClass} pl-7`} placeholder="Matriz - Vargem Grande, SP" value={form.location} onChange={(event) => changeForm("location", event.target.value)} /></Field>
                </div>

                <div className="pt-0.5">
                  <span className="mb-1.5 block text-[10px] font-medium uppercase text-neutral-600">Permissões</span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {selectedPermissions.map((permission) => <button type="button" key={permission} onClick={() => setSelectedPermissions((current) => current.filter((item) => item !== permission))} className="inline-flex h-[22px] items-center gap-1 rounded-full bg-blue-50 px-2.5 text-[10px] font-medium text-blue-700 hover:bg-blue-100">{permission}<X className="size-3" /></button>)}
                    <select aria-label="Adicionar permissão" className="h-[22px] max-w-[130px] rounded-full border border-dashed border-neutral-300 bg-white px-2 text-[10px] text-neutral-500 outline-none" value="" onChange={(event) => { if (event.target.value) setSelectedPermissions((current) => current.includes(event.target.value) ? current : [...current, event.target.value]); }}><option value="">+ Nova permissão</option>{permissions.filter((permission) => !selectedPermissions.includes(permission)).map((permission) => <option key={permission}>{permission}</option>)}</select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button type="button" onClick={() => { setForm(emptyForm); setEditingId(null); }} className="h-[30px] rounded-md border border-[#dedede] text-[11px] hover:bg-neutral-50">Cancelar</button>
                  <button type="submit" className="flex h-[30px] items-center justify-center gap-1.5 rounded-md bg-[#ed3535] text-[11px] font-medium text-white hover:bg-red-600"><Download className="size-3.5" />{editingId ? "Salvar alterações" : "Salvar Usuário"}</button>
                </div>
              </form>

              <aside className="mt-3 flex gap-2 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-2 text-[10px] text-neutral-600">
                <CircleAlert className="mt-0.5 size-3.5 shrink-0 text-orange-500" />
                <span><strong className="block font-semibold text-orange-600">Dica</strong>Defina senha temporária e permissões para liberar o primeiro acesso do usuário.</span>
              </aside>
            </section>

            <section className="flex min-h-[500px] min-w-0 flex-col rounded-lg border border-[#e5e5e5] bg-white">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 px-5 py-3.5">
                <h2 className="text-[11px] font-medium">Usuários Cadastrados</h2>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="relative block w-[188px]">
                    <Search className="absolute left-2.5 top-1/2 size-3 -translate-y-1/2 text-neutral-500" />
                    <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Buscar por nome, cargo ou e-mail..." className="h-[25px] w-full rounded-md border border-[#dedede] pl-7 pr-2 text-[10px] outline-none placeholder:text-neutral-400 focus:border-red-400" />
                  </label>
                  <label className="relative flex h-[25px] w-[82px] items-center gap-1.5 rounded-md border border-[#dedede] px-2">
                    <Filter className="size-3 shrink-0" />
                    <select aria-label="Filtrar por cargo" value={roleFilter} onChange={(event) => { setRoleFilter(event.target.value); setPage(1); }} className="w-full appearance-none bg-transparent text-[10px] outline-none"><option>Cargo</option>{roles.map((role) => <option key={role}>{role}</option>)}</select>
                    <ChevronDown className="pointer-events-none absolute right-1 size-3" />
                  </label>
                </div>
              </div>

              <div className="min-w-0 flex-1 overflow-x-auto">
                <table className="w-full min-w-[660px] table-fixed text-left">
                  <colgroup><col className="w-[31%]"/><col className="w-[16%]"/><col className="w-[14%]"/><col className="w-[14%]"/><col className="w-[11%]"/><col className="w-[14%]"/></colgroup>
                  <thead className="bg-[#fafafa] text-[9px] uppercase text-neutral-500"><tr><th className="px-5 py-2.5 font-medium">Usuário</th><th className="px-2 py-2.5 font-medium">Cargo</th><th className="px-2 py-2.5 font-medium">Telefone</th><th className="px-2 py-2.5 font-medium">Último acesso</th><th className="px-2 py-2.5 font-medium">Status</th><th className="px-2 py-2.5 text-center font-medium">Ações</th></tr></thead>
                  <tbody>
                    {visibleMembers.map((member) => <tr key={member.id} className={`h-[46px] border-b border-neutral-100 last:border-0 ${member.status === "Inativo" ? "text-neutral-400" : ""}`}>
                      <td className="px-4 py-1.5"><div className="flex min-w-0 items-center gap-2"><span className={`relative flex size-[25px] shrink-0 items-center justify-center rounded-full text-[9px] font-medium text-white ${member.color}`}>{member.initials}{member.id === 1 && <span className="absolute -right-0.5 -top-0.5 flex size-3 items-center justify-center rounded-full border border-white bg-orange-500 text-[9px]">✦</span>}</span><span className="min-w-0"><span className="block truncate text-[11px] font-medium text-neutral-800">{member.name}</span><span className="block max-w-[150px] truncate text-[9px] text-neutral-400">{member.email}</span></span></div></td>
                      <td className="px-2 py-1.5"><span className="block text-[10px] text-neutral-700">{member.role}</span><span className="block text-[9px] text-neutral-400">{member.department}</span></td>
                      <td className="px-2 py-1.5"><span className="block text-[10px] text-neutral-700">{member.phone}</span>{member.phone !== "—" && <span className="block text-[9px] text-neutral-400">{member.department === "Vendas" ? "Loja Matriz" : member.department}</span>}</td>
                      <td className="px-2 py-1.5"><span className="block text-[10px] text-neutral-700">{member.lastAccess}</span><span className="block text-[9px] text-neutral-400">{member.accessNote}</span></td>
                      <td className="px-2 py-1.5"><span className={`inline-flex min-w-[43px] justify-center rounded-full px-2 py-0.5 text-[9px] ${member.status === "Ativo" ? "bg-green-50 text-green-700" : "bg-neutral-100 text-neutral-500"}`}>{member.status}</span></td>
                      <td className="px-2 py-1.5"><div className="flex items-center justify-center gap-2.5"><button aria-label={`Ver ${member.name}`} onClick={() => setViewing(member)} className="text-neutral-500 hover:text-neutral-900"><Eye className="size-3.5" /></button><button aria-label={`Editar ${member.name}`} onClick={() => editMember(member)} className="text-neutral-500 hover:text-red-600"><Pencil className="size-3.5" /></button></div></td>
                    </tr>)}
                    {visibleMembers.length === 0 && <tr><td colSpan={6} className="py-16 text-center text-xs text-neutral-400">Nenhum usuário encontrado.</td></tr>}
                  </tbody>
                </table>
              </div>

              <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 px-5 py-3 text-[10px] text-neutral-400">
                <span>Mostrando {filteredMembers.length === 0 ? 0 : (page - 1) * pageSize + 1}-{Math.min(page * pageSize, filteredMembers.length)} de {filteredMembers.length} usuários</span>
                <nav aria-label="Paginação" className="flex items-center gap-1">
                  <button aria-label="Página anterior" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} className="flex size-6 items-center justify-center rounded-md border border-neutral-200 text-neutral-700 hover:bg-neutral-50 disabled:opacity-40"><ChevronLeft className="size-3.5" /></button>
                  {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => <button key={pageNumber} onClick={() => setPage(pageNumber)} aria-current={page === pageNumber ? "page" : undefined} className={`size-6 rounded-md border text-[10px] ${page === pageNumber ? "border-[#e63838] bg-[#e63838] text-white" : "border-neutral-200 text-neutral-700 hover:bg-neutral-50"}`}>{pageNumber}</button>)}
                  <button aria-label="Próxima página" onClick={() => setPage((current) => Math.min(pageCount, current + 1))} disabled={page === pageCount} className="flex size-6 items-center justify-center rounded-md border border-neutral-200 text-neutral-700 hover:bg-neutral-50 disabled:opacity-40"><ChevronRight className="size-3.5" /></button>
                </nav>
              </footer>
            </section>
          </div>

          <button onClick={exportMembers} className="mt-3 inline-flex h-[29px] items-center gap-2 rounded-md border border-[#dedede] px-3 text-[11px] text-neutral-700 hover:bg-neutral-50"><Download className="size-3.5" />Exportar</button>
        </div>
      </main>

      {viewing && <div role="presentation" onClick={() => setViewing(null)} className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"><section role="dialog" aria-modal="true" aria-labelledby="member-dialog-title" onClick={(event) => event.stopPropagation()} className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl"><div className="mb-4 flex items-center justify-between"><h2 id="member-dialog-title" className="text-sm font-semibold">Detalhes do usuário</h2><button onClick={() => setViewing(null)} aria-label="Fechar" className="rounded p-1 text-neutral-500 hover:bg-neutral-100"><X className="size-4" /></button></div><div className="flex items-center gap-3"><span className={`flex size-10 items-center justify-center rounded-full text-xs text-white ${viewing.color}`}>{viewing.initials}</span><div><p className="text-sm font-medium">{viewing.name}</p><p className="text-xs text-neutral-500">{viewing.email}</p></div></div><dl className="mt-4 space-y-2 text-xs"><div className="flex justify-between border-t pt-2"><dt className="text-neutral-500">Cargo</dt><dd>{viewing.role}</dd></div><div className="flex justify-between"><dt className="text-neutral-500">Telefone</dt><dd>{viewing.phone}</dd></div><div className="flex justify-between"><dt className="text-neutral-500">Status</dt><dd>{viewing.status}</dd></div><div className="flex justify-between"><dt className="text-neutral-500">Último acesso</dt><dd>{viewing.lastAccess}</dd></div></dl></section></div>}
    </div>
  );
}
