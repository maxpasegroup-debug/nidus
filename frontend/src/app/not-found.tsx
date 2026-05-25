import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f3ec] px-4 text-[#111827]">
      <section className="max-w-lg rounded-lg border border-[#263a8f]/10 bg-white p-8 text-center shadow-[0_24px_80px_rgba(19,35,72,0.10)]">
        <Compass className="mx-auto h-10 w-10 text-[#263a8f]" />
        <h1 className="mt-5 text-2xl font-semibold">Page not found</h1>
        <p className="mt-3 text-sm leading-6 text-[#536072]">This public NIDUS page may have moved. Choose a clear path below.</p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/" className="inline-flex min-h-11 items-center justify-center rounded bg-[#263a8f] px-5 py-3 text-sm font-semibold text-white">
            Go Home
          </Link>
          <Link href="/programs" className="inline-flex min-h-11 items-center justify-center rounded border border-[#263a8f]/15 bg-white px-5 py-3 text-sm font-semibold text-[#263a8f]">
            Explore Academy
          </Link>
        </div>
      </section>
    </main>
  );
}
