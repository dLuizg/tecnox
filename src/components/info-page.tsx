import type { ReactNode } from "react";

export default function InfoPage({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro: string; children: ReactNode }) {
  return (
    <main className="flex-1 bg-white text-neutral-900">
      <div className="mx-auto max-w-4xl px-5 py-14 sm:px-8 sm:py-20">
        <p className="text-sm font-bold uppercase tracking-widest text-red-600">{eyebrow}</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-neutral-600">{intro}</p>
        <div className="mt-12 space-y-10 text-base leading-7 text-neutral-700 [&_a]:font-medium [&_a]:text-red-700 [&_a]:underline [&_a]:underline-offset-4 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-neutral-900 [&_p+p]:mt-3">{children}</div>
      </div>
    </main>
  );
}
