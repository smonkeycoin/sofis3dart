import Link from "next/link";
import { ArrowRight, ShoppingCart } from "lucide-react";
import { StoreShell } from "@/components/layout/StoreShell";
import { TopStoreBar } from "@/components/layout/TopStoreBar";
import { PageHeader } from "@/components/store/PageHeader";

export default function CartPage() {
  return (
    <StoreShell>
      <TopStoreBar />
      <PageHeader
        copy="El carrito esta listo como superficie visual de Phase 0A. La infraestructura de pagos vendra en una fase posterior."
        title="Carrito"
      />
      <section className="rounded-[8px] border border-soft-gray bg-white p-8 text-center shadow-subtle">
        <ShoppingCart aria-hidden className="mx-auto h-10 w-10 text-brand-pink" />
        <p className="mt-4 text-lg font-black text-ink">
          Tu carrito visual esta preparado.
        </p>
        <Link
          className="mt-5 inline-flex h-12 items-center gap-3 rounded-lg bg-brand-pink px-5 font-black text-white shadow-pink"
          href="/shop"
        >
          Ver tienda <ArrowRight aria-hidden className="h-5 w-5" />
        </Link>
      </section>
    </StoreShell>
  );
}
