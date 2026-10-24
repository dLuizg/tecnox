"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { sendPasswordReset, signInWithEmail, signInWithGoogle } from "@/src/lib/auth";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";

type Feedback = { kind: "error" | "success"; message: string } | null;

function getAuthErrorMessage(error: unknown) {
  const code = typeof error === "object" && error !== null && "code" in error
    ? String(error.code)
    : "";

  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "E-mail ou senha incorretos. Confira seus dados e tente novamente.";
    case "auth/invalid-email":
      return "Digite um endereço de e-mail válido.";
    case "auth/too-many-requests":
      return "Muitas tentativas. Aguarde um pouco antes de tentar novamente.";
    case "auth/popup-closed-by-user":
      return "A janela de login do Google foi fechada antes da conclusão.";
    case "auth/popup-blocked":
      return "Seu navegador bloqueou a janela do Google. Permita pop-ups e tente novamente.";
    case "auth/network-request-failed":
      return "Não foi possível conectar. Verifique sua internet e tente novamente.";
    default:
      return "Não foi possível entrar agora. Tente novamente em instantes.";
  }
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setIsLoading(true);

    try {
      await signInWithEmail(email.trim(), password);
      router.push("/dashboard");
    } catch (error) {
      setFeedback({ kind: "error", message: getAuthErrorMessage(error) });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setFeedback(null);
    setIsLoading(true);

    try {
      await signInWithGoogle();
      router.push("/dashboard");
    } catch (error) {
      setFeedback({ kind: "error", message: getAuthErrorMessage(error) });
    } finally {
      setIsLoading(false);
    }
  }

  async function handlePasswordReset() {
    setFeedback(null);
    if (!email.trim()) {
      setFeedback({ kind: "error", message: "Informe seu e-mail para receber o link de redefinição." });
      return;
    }

    setIsResetting(true);
    try {
      await sendPasswordReset(email.trim());
      setFeedback({ kind: "success", message: "Enviamos um link de redefinição para seu e-mail." });
    } catch (error) {
      setFeedback({ kind: "error", message: getAuthErrorMessage(error) });
    } finally {
      setIsResetting(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-white text-black lg:grid-cols-[1.05fr_0.95fr]">
      <div
        aria-label="Bancada de manutenção de celulares"
        role="img"
        className="min-h-[34vh] bg-cover bg-center lg:min-h-screen"
        style={{ backgroundImage: "url('/celular.png')" }}
      />
      <section className="flex items-center justify-center px-5 py-10 sm:px-10 lg:px-12">
        <div className="w-full max-w-[390px] rounded-[30px] bg-white px-6 py-7 shadow-[0_12px_35px_rgba(0,0,0,0.16)] sm:px-8 sm:py-8">
          <div className="mb-5 text-center text-[27px] font-medium tracking-[0.12em]" aria-label="Tecnox">
            TECNO<span className="-ml-1.5 text-[#e52225]">X</span>
          </div>
          <h1 className="mb-8 text-center text-base font-bold">Acesse sua conta</h1>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-normal text-[#333]">E-mail ou usuário</Label>
              <Input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="h-[38px] rounded-lg border-[#aaa] px-2.5 text-sm shadow-none focus-visible:ring-1 focus-visible:ring-[#888]" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-normal text-[#333]">Senha</Label>
              <div className="relative">
                <Input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="h-[38px] rounded-lg border-[#aaa] px-2.5 pr-10 text-sm shadow-none focus-visible:ring-1 focus-visible:ring-[#888]" />
                <button type="button" onClick={() => setShowPassword((shown) => !shown)} aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"} className="absolute right-1 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-gray-500 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="-mt-1">
              <button type="button" onClick={handlePasswordReset} disabled={isResetting || isLoading} className="text-xs text-[#444] underline disabled:opacity-60">
                {isResetting ? "Enviando link..." : "Esqueci minha senha"}
              </button>
            </div>

            {feedback && <p role="status" aria-live="polite" className={`rounded-lg px-3 py-2 text-xs leading-5 ${feedback.kind === "error" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>{feedback.message}</p>}

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <Button type="submit" disabled={isLoading || isResetting} className="h-[38px] rounded-lg bg-[#e51f23] text-sm font-semibold text-white hover:bg-[#ca1b1f]">
                {isLoading ? <><LoaderCircle className="mr-2 size-4 animate-spin" /> Entrando...</> : "Entrar"}
              </Button>
              <Link href="/cadastro" className="inline-flex h-[38px] items-center justify-center rounded-lg border border-[#777] text-sm font-semibold hover:bg-gray-50">
                Cadastrar
              </Link>
            </div>
          </form>

          <div className="mb-2 mt-9 text-xs text-[#444]">Ou acesse via</div>
          <Button type="button" variant="outline" disabled={isLoading || isResetting} onClick={handleGoogleSignIn} className="relative h-[36px] w-full rounded-lg border-[#aaa] bg-white text-xs font-normal text-black hover:bg-gray-50">
            <GoogleMark />
            Google
          </Button>
        </div>
      </section>
    </main>
  );
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className="mr-2 size-[18px]">
      <path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.7c3.9-3.6 6-8.9 6-15Z" />
      <path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.7-5.1c-1.8 1.2-4 1.9-6.8 1.9-5.2 0-9.6-3.5-11.2-8.2H5.9v5.3A20 20 0 0 0 24 44Z" />
      <path fill="#FBBC05" d="M12.8 27.7a12 12 0 0 1 0-7.4V15H5.9a20 20 0 0 0 0 17.9l6.9-5.2Z" />
      <path fill="#EA4335" d="M24 12.1c3 0 5.7 1 7.8 3.1l5.9-5.9A19.7 19.7 0 0 0 24 4 20 20 0 0 0 5.9 15l6.9 5.3c1.6-4.7 6-8.2 11.2-8.2Z" />
    </svg>
  );
}
