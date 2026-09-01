import Link from "next/link";
import { StoreShell } from "@/components/layout/StoreShell";
import { TopStoreBar } from "@/components/layout/TopStoreBar";

export default function NotFound() {
  return (
    <StoreShell>
      <TopStoreBar />
      <section className="mt-8 rounded-[8px] border border-soft-gray bg-white p-8 text-center shadow-subtle">
        <h1 className="text-3xl font-black text-ink">Pagina no encontrada</h1>
        <p className="mt-3 font-semibold text-ink/65">
          La ruta que buscas no existe todavia.
        </p>
        <Link
          className="mt-5 inline-flex h-12 items-center rounded-lg bg-brand-pink px-5 font-black text-white shadow-pink"
          href="/"
        >
          Volver al inicio
        </Link>
      </section>
    </StoreShell>
  );
}
