"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { UserRound } from "lucide-react";
import AppSidebar from "@/src/components/app-sidebar";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { formatPhoneInput } from "@/src/helpers/phone";

const fieldClass = "h-[29px] rounded-md border-[#dedede] px-2 text-[10px] shadow-none placeholder:text-neutral-400 focus-visible:border-red-400 focus-visible:ring-red-100";

export default function ProfilePage() {
  const [photo, setPhoto] = useState<string | null>(null);
  const [phone, setPhone] = useState("");

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file?.type.startsWith("image/")) setPhoto(URL.createObjectURL(file));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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

              <div className="flex flex-col items-center pb-2 pt-4">
                <div className="flex size-[56px] items-center justify-center overflow-hidden rounded-full border border-[#dedede] bg-[#eeeeee] text-neutral-400">
                  {photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photo} alt="Prévia da foto de perfil" className="size-full object-cover" />
                  ) : (
                    <UserRound aria-hidden="true" className="size-6" strokeWidth={1.4} />
                  )}
                </div>
                <label className="mt-1 cursor-pointer text-[9px] font-medium text-[#ed3535] hover:text-red-700">
                  Alterar foto
                  <input type="file" accept="image/*" onChange={handlePhotoChange} className="sr-only" aria-label="Alterar foto de perfil" />
                </label>
              </div>

              <div className="space-y-1.5">
                <label className="block">
                  <span className="mb-0.5 block text-[9px] font-medium uppercase">Nome completo</span>
                  <Input className={fieldClass} placeholder="Nicolas Souza" />
                </label>
                <label className="block">
                  <span className="mb-0.5 block text-[9px] font-medium uppercase">E-mail</span>
                  <Input type="email" className={fieldClass} placeholder="nicolassouza.adm@adm.com" />
                </label>
                <label className="block">
                  <span className="mb-0.5 block text-[9px] font-medium uppercase">Telefone</span>
                  <Input
                    type="tel"
                    className={fieldClass}
                    placeholder="(11) 90000-0000"
                    value={phone}
                    onChange={(event) => setPhone(formatPhoneInput(event.target.value))}
                  />
                </label>
                <label className="block">
                  <span className="mb-0.5 block text-[9px] font-medium uppercase">Cargo</span>
                  <Input className={fieldClass} placeholder="Administrador" />
                </label>
              </div>
            </Card>

            <Card className="mt-5 rounded-lg border border-[#e5e5e5] bg-white px-[18px] pb-5 pt-4 shadow-none ring-0">
              <h2 className="mb-3 border-b border-neutral-200 pb-2 text-[11px] font-medium">Alterar Senha</h2>
              <div className="space-y-1.5">
                <label className="block">
                  <span className="mb-0.5 block text-[9px] font-medium uppercase">Senha atual</span>
                  <Input type="password" className={fieldClass} placeholder="••••••••" />
                </label>
                <label className="block">
                  <span className="mb-0.5 block text-[9px] font-medium uppercase">Nova senha</span>
                  <Input type="password" className={fieldClass} placeholder="••••••••" />
                </label>
                <label className="block">
                  <span className="mb-0.5 block text-[9px] font-medium uppercase">Confirmar nova senha</span>
                  <Input type="password" className={fieldClass} placeholder="••••••••" />
                </label>
              </div>
            </Card>

            <div className="mt-4 flex justify-center sm:justify-end">
              <Button type="submit" className="h-[31px] w-[154px] rounded-md bg-[#ed3535] text-[10px] font-medium text-white hover:bg-red-600">
                Salvar Alterações
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
