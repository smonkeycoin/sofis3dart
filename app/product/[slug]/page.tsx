import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShoppingCart, Star } from "lucide-react";
import { isPurchasable } from "@/domain/product";
import { StoreShell } from "@/components/layout/StoreShell";
import { TopStoreBar } from "@/components/layout/TopStoreBar";
import { formatCount, formatMXN } from "@/lib/format";
import { getProductBySlug, products } from "@/lib/products";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    return {
      title: "Producto no encontrado",
    };
  }

  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title: `${product.name} | SOFI'S 3D ART`,
      description: product.description,
      images: [product.thumbnail],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const canBuy = isPurchasable(product);

  return (
    <StoreShell>
      <TopStoreBar selected={product.category} />
      <Link
        className="mt-6 inline-flex items-center gap-2 text-sm font-extrabold text-ink/62 hover:text-brand-pink"
        href="/shop"
      >
        <ArrowLeft aria-hidden className="h-4 w-4" />
        Volver a tienda
      </Link>

      <section className="mt-5 grid gap-8 rounded-[8px] border border-soft-gray bg-white p-5 shadow-subtle lg:grid-cols-[0.92fr_1.08fr] lg:p-8">
        <div className="relative aspect-square overflow-hidden rounded-[8px] bg-neutral-50">
          <Image
            alt={product.name}
            className="object-contain p-8"
            fill
            priority
            sizes="(max-width: 1024px) 90vw, 520px"
            src={product.thumbnail}
          />
        </div>

        <div className="flex flex-col justify-center">
          <span className="w-fit rounded-full bg-pink-soft px-3 py-1 text-xs font-black text-brand-pink">
            {product.category}
          </span>
          <h1 className="mt-4 text-4xl font-black leading-tight text-ink lg:text-5xl">
            {product.name}
          </h1>
          <p className="mt-4 max-w-xl text-base font-semibold leading-relaxed text-ink/70">
            {product.description}
          </p>

          <div className="mt-5 flex items-center gap-2 text-sm font-bold text-muted">
            <span className="flex text-brand-yellow">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star
                  aria-hidden
                  className="h-4 w-4 fill-current"
                  key={index}
                  strokeWidth={0}
                />
              ))}
            </span>
            {product.rating} ({formatCount(product.reviewCount)} resenas)
          </div>

          <div className="mt-6 flex flex-wrap items-end gap-3">
            <p className="text-3xl font-black text-ink">
              {formatMXN(product.priceMXN)}
            </p>
            {product.compareAtPriceMXN ? (
              <p className="pb-1 text-lg font-black text-muted line-through">
                {formatMXN(product.compareAtPriceMXN)}
              </p>
            ) : null}
          </div>

          <dl className="mt-7 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            {[
              ["Material", product.material],
              ["Impresion", `${product.printTimeHours} h`],
              ["Peso", `${product.estimatedWeightGrams} g`],
              ["Stock", product.madeToOrder ? "Bajo pedido" : `${product.stockQuantity}`],
            ].map(([label, value]) => (
              <div className="rounded-[8px] bg-neutral-50 p-4" key={label}>
                <dt className="font-black text-muted">{label}</dt>
                <dd className="mt-1 font-black text-ink">{value}</dd>
              </div>
            ))}
          </dl>

          <button
            className="mt-7 inline-flex h-13 w-fit items-center gap-3 rounded-lg bg-brand-pink px-6 font-black text-white shadow-pink disabled:cursor-not-allowed disabled:bg-muted disabled:shadow-none"
            disabled={!canBuy}
            type="button"
          >
            <ShoppingCart aria-hidden className="h-5 w-5" />
            {canBuy ? "Agregar al carrito" : "No disponible"}
          </button>
        </div>
      </section>
    </StoreShell>
  );
}
