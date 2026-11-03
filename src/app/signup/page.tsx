"use client";

import { useState, type FormEvent } from "react";
import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { auth, saveUserProfile, signInWithGoogle, signUpWithEmail, type UserProfileInput, type UserRole } from "@/src/lib/auth";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";

type Feedback = { kind: "error" | "success"; message: string } | null;

function getAuthErrorMessage(error: unknown) {
  const code = typeof error === "object" && error !== null && "code" in error
    ? String(error.code)
    : "";

  switch (code) {
    case "auth/email-already-in-use":
      return "Já existe uma conta com este e-mail. Entre ou use outro endereço.";
    case "auth/invalid-email":
      return "Digite um endereço de e-mail válido.";
    case "auth/weak-password":
      return "Escolha uma senha com pelo menos 6 caracteres.";
    case "auth/popup-closed-by-user":
      return "A janela do Google foi fechada antes da conclusão.";
    case "auth/popup-blocked":
      return "Seu navegador bloqueou a janela do Google. Permita pop-ups e tente novamente.";
    case "auth/network-request-failed":
      return "Não foi possível conectar. Verifique sua internet e tente novamente.";
    default:
      return "Não foi possível criar sua conta agora. Tente novamente em instantes.";
  }
}

export default function CadastroPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<UserRole | "">("");
  const [isGoogleProfileCompletion, setIsGoogleProfileCompletion] = useState(false);
  const [pendingProfile, setPendingProfile] = useState<UserProfileInput | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("completeProfile") !== "1") return;
    return onAuthStateChanged(auth, (user) => {
      if (!user) return;
      setIsGoogleProfileCompletion(true);
      setUsername(user.displayName ?? "");
      setEmail(user.email ?? "");
    });
  }, []);

  async function finishProfile(profile: UserProfileInput) {
    const user = auth.currentUser;
    if (!user) {
      setFeedback({ kind: "error", message: "Sua sessão expirou. Entre novamente para concluir o cadastro." });
      setPendingProfile(null);
      return;
    }

    setPendingProfile(profile);
    try {
      await saveUserProfile(user, profile);
      router.push("/dashboard");
    } catch {
      setFeedback({ kind: "error", message: "Sua conta foi criada, mas não foi possível salvar seu perfil. Tente novamente." });
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    if (password !== confirmPassword) {
      setFeedback({ kind: "error", message: "As senhas não coincidem. Confira e tente novamente." });
      return;
    }
    if (!role) {
      setFeedback({ kind: "error", message: "Selecione o tipo de acesso para continuar." });
      return;
    }

    setIsLoading(true);
    try {
      const credential = await signUpWithEmail(email.trim(), password);
      const profile = { name: username.trim(), email: credential.user.email ?? email.trim(), role };
      setPendingProfile(profile);
      try {
        await saveUserProfile(credential.user, profile);
        router.push("/dashboard");
      } catch {
        setFeedback({ kind: "error", message: "Sua conta foi criada, mas não foi possível salvar seu perfil. Tente novamente." });
      }
    } catch (error) {
      setFeedback({ kind: "error", message: getAuthErrorMessage(error) });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleSignUp() {
    setFeedback(null);
    if (!role) {
      setFeedback({ kind: "error", message: "Selecione o tipo de acesso antes de continuar com o Google." });
      return;
    }
    setIsLoading(true);
    try {
      const { credential, isNewUser } = await signInWithGoogle();
      if (isNewUser) {
        const profile = {
          name: credential.user.displayName ?? username.trim() ?? "",
          email: credential.user.email ?? "",
          role,
        };
        setPendingProfile(profile);
        try {
          await saveUserProfile(credential.user, profile);
          router.push("/dashboard");
        } catch {
          setFeedback({ kind: "error", message: "Sua conta foi criada, mas não foi possível salvar seu perfil. Tente novamente." });
        }
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      setFeedback({ kind: "error", message: getAuthErrorMessage(error) });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCompleteGoogleProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    if (!role) {
      setFeedback({ kind: "error", message: "Selecione o tipo de acesso para continuar." });
      return;
    }
    const user = auth.currentUser;
    if (!user) {
      setFeedback({ kind: "error", message: "Sua sessão expirou. Entre novamente para concluir o cadastro." });
      return;
    }
    setIsLoading(true);
    await finishProfile({ name: username.trim() || user.displayName || "", email: user.email ?? email.trim(), role });
    setIsLoading(false);
  }

  async function handleRetryProfile() {
    if (!pendingProfile) return;
    setFeedback(null);
    setIsLoading(true);
    await finishProfile(pendingProfile);
    setIsLoading(false);
  }

  return (
    <main className="grid min-h-screen bg-white text-black lg:grid-cols-[1.05fr_0.95fr]">
      <div
        aria-label="Bancada de manutenção de celulares"
        role="img"
        className="min-h-[30vh] bg-cover bg-center sm:min-h-[38vh] lg:min-h-screen"
        style={{ backgroundImage: "url('/celular.png')" }}
      />
      <section className="flex items-center justify-center px-5 py-8 sm:px-10 sm:py-10 lg:px-12">
        <div className="w-full max-w-[390px] rounded-[30px] bg-white px-6 py-6 shadow-[0_12px_35px_rgba(0,0,0,0.16)] sm:px-8 sm:py-7">
          <div className="mb-4 text-center text-[27px] font-medium tracking-[0.12em]" aria-label="Tecnox">
            TECNO<span className="-ml-1.5 text-[#e52225]">X</span>
          </div>
          <h1 className="mb-5 text-center text-base font-bold">{isGoogleProfileCompletion ? "Conclua seu cadastro" : "Crie sua conta"}</h1>

          <form className="space-y-3" onSubmit={isGoogleProfileCompletion ? handleCompleteGoogleProfile : handleSubmit}>
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-xs font-normal text-[#333]">Nome de usuário</Label>
              <Input id="username" name="username" type="text" autoComplete="username" required minLength={2} value={username} onChange={(event) => setUsername(event.target.value)} className="h-[38px] rounded-lg border-[#aaa] px-2.5 text-sm shadow-none focus-visible:ring-1 focus-visible:ring-[#888]" />
            </div>
            {!isGoogleProfileCompletion && <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-normal text-[#333]">E-mail</Label>
              <Input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="h-[38px] rounded-lg border-[#aaa] px-2.5 text-sm shadow-none focus-visible:ring-1 focus-visible:ring-[#888]" />
            </div>}
            {!isGoogleProfileCompletion && <>
              <PasswordField id="password" label="Senha" autoComplete="new-password" value={password} onChange={setPassword} visible={showPassword} onToggle={() => setShowPassword((shown) => !shown)} />
              <PasswordField id="confirm-password" label="Repita a sua senha" autoComplete="new-password" value={confirmPassword} onChange={setConfirmPassword} visible={showConfirmPassword} onToggle={() => setShowConfirmPassword((shown) => !shown)} />
            </>}

            <div className="space-y-1.5">
              <Label htmlFor="role" className="text-xs font-normal text-[#333]">Tipo de acesso</Label>
              <select id="role" name="role" required value={role} onChange={(event) => setRole(event.target.value as UserRole | "")} className="h-[38px] w-full rounded-lg border border-[#aaa] bg-white px-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#888]">
                <option value="" disabled>Selecione uma opção</option>
                <option value="store_admin">Administrador da loja</option>
                <option value="employee">Funcionário</option>
              </select>
            </div>

            <div className="-mt-1">
              {!isGoogleProfileCompletion && <Link href="/signin" className="text-xs text-[#444] underline">Esqueci minha senha</Link>}
            </div>

            {feedback && <p role="status" aria-live="polite" className={`rounded-lg px-3 py-2 text-xs leading-5 ${feedback.kind === "error" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>{feedback.message}</p>}

            {pendingProfile && <Button type="button" variant="outline" disabled={isLoading} onClick={handleRetryProfile} className="h-[38px] w-full rounded-lg border-[#aaa] text-sm">Tentar salvar perfil novamente</Button>}

            <Button type="submit" disabled={isLoading || Boolean(pendingProfile)} className="h-[38px] w-full rounded-lg bg-[#e51f23] text-sm font-semibold text-white hover:bg-[#ca1b1f]">
              {isLoading ? <><LoaderCircle className="mr-2 size-4 animate-spin" /> Salvando...</> : isGoogleProfileCompletion ? "Concluir cadastro" : "Cadastrar"}
            </Button>
          </form>

          {!isGoogleProfileCompletion && <>
            <div className="mb-2 mt-4 text-xs text-[#444]">Ou cadastre-se com</div>
            <Button type="button" variant="outline" disabled={isLoading || Boolean(pendingProfile)} onClick={handleGoogleSignUp} className="relative h-[36px] w-full rounded-lg border-[#aaa] bg-white text-xs font-normal text-black hover:bg-gray-50">
              <GoogleMark />
              Google
            </Button>
          </>}
          <p className="mt-4 text-center text-xs text-[#555]">
            Já tem uma conta? <Link href="/signin" className="font-semibold text-[#222] underline">Entrar</Link>
          </p>
        </div>
      </section>
    </main>
  );
}

function PasswordField({
  id,
  label,
  autoComplete,
  value,
  onChange,
  visible,
  onToggle,
}: {
  id: string;
  label: string;
  autoComplete: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-normal text-[#333]">{label}</Label>
      <div className="relative">
        <Input id={id} name={id} type={visible ? "text" : "password"} autoComplete={autoComplete} required minLength={6} value={value} onChange={(event) => onChange(event.target.value)} className="h-[38px] rounded-lg border-[#aaa] px-2.5 pr-10 text-sm shadow-none focus-visible:ring-1 focus-visible:ring-[#888]" />
        <button type="button" onClick={onToggle} aria-label={visible ? "Ocultar senha" : "Mostrar senha"} className="absolute right-1 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-gray-500 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500">
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
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
