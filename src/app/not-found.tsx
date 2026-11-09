import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex flex-1 items-center bg-white px-6 py-16 sm:py-20">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-8 md:grid-cols-2 md:gap-12">
        <div className="order-2 text-center md:order-1 md:text-left">
          <p className="mb-5 text-sm font-bold uppercase tracking-[0.2em] text-brand">
            Erro 404
          </p>
          <h1 className="max-w-xl text-4xl font-bold tracking-tight text-navy sm:text-5xl lg:text-6xl">
            Essa página saiu de área.
          </h1>
          <p className="mx-auto mt-6 max-w-md text-base leading-7 text-gray-500 md:mx-0 sm:text-lg">
            Ops, Não encontramos esta página. Ela pode ter sido removida, alterada ou está temporariamente indisponível.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4 md:justify-start">
            <Link
              href="/"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-brand px-6 text-sm font-semibold text-white transition-colors hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Voltar ao início
            </Link>
            <Link
              href="/ajuda"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold text-navy transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              Central de ajuda
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
        <div className="order-1 mx-auto w-full max-w-sm md:order-2 md:max-w-lg">
          <Image
            src="/404.png"
            alt="Ilustração de um celular com a tela quebrada"
            width={1280}
            height={1184}
            className="h-auto w-full"
            priority
          />
        </div>
      </div>
    </main>
  );
}
