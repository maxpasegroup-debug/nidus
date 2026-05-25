import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f3ea] px-4 text-[#101827]">
      <section className="max-w-lg rounded-lg border border-[#071d36]/10 bg-white p-8 text-center shadow-[0_24px_80px_rgba(7,29,54,0.10)]">
        <Compass className="mx-auto h-10 w-10 text-[#3f4a32]" />
        <h1 className="mt-5 text-2xl font-semibold text-[#071d36]">Page not found</h1>
        <p className="mt-3 text-sm leading-6 text-[#64748b]">This public NIDUS page may have moved. Choose a clear path below.</p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/" className="inline-flex min-h-11 items-center justify-center rounded border border-[#b58b35]/45 bg-[linear-gradient(135deg,#fff3bf_0%,#e7c873_34%,#b9913f_72%,#8a6426_100%)] px-5 py-3 text-sm font-semibold text-[#071d36] shadow-[0_14px_34px_rgba(185,145,63,0.22)]">
            Go Home
          </Link>
          <Link href="/programs" className="inline-flex min-h-11 items-center justify-center rounded border border-[#071d36]/14 bg-white px-5 py-3 text-sm font-semibold text-[#071d36]">
            Explore Academy
          </Link>
        </div>
      </section>
    </main>
  );
}
