import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import { bestSellers } from "@/lib/products";

export function BestSellers() {
  return (
    <section className="mt-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="text-2xl font-black tracking-normal text-ink">
          Más vendidos <span aria-hidden>🔥</span>
        </h2>
        <Link
          className="inline-flex items-center gap-2 text-sm font-extrabold text-ink/65 hover:text-brand-pink"
          href="/best-sellers"
        >
          Ver todos <ArrowRight aria-hidden className="h-4 w-4" />
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-4 min-[360px]:grid-cols-2 lg:grid-cols-3 lg:gap-5 xl:grid-cols-5">
        {bestSellers.slice(0, 5).map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
