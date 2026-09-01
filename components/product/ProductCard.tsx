import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Star } from "lucide-react";
import { isPurchasable, type Product } from "@/domain/product";
import { formatCount, formatMXN } from "@/lib/format";

const categoryColors: Record<Product["category"], string> = {
  Geek: "bg-pink-soft text-brand-pink",
  Juguetes: "bg-purple-soft text-brand-purple",
  Accesorios: "bg-yellow-soft text-[#a26f00]",
  Hogar: "bg-green-soft text-brand-green",
  Oficina: "bg-blue-soft text-brand-blue",
  Decoracion: "bg-pink-soft text-brand-pink",
  Regalos: "bg-purple-soft text-brand-purple",
};

const rankColors = [
  "bg-brand-pink",
  "bg-brand-purple",
  "bg-brand-yellow",
  "bg-brand-green",
  "bg-brand-blue",
];

export function ProductCard({ product }: { product: Product }) {
  const canBuy = isPurchasable(product);
  const rank = product.bestSellerRank;

  return (
    <article className="relative flex min-h-[330px] flex-col overflow-hidden rounded-[8px] border border-soft-gray bg-white p-3 shadow-subtle transition hover:-translate-y-1 hover:shadow-soft">
      {rank ? (
        <span
          className={[
            "absolute left-3 top-3 z-10 grid h-7 min-w-7 place-items-center rounded-full px-2 text-sm font-black text-white",
            rankColors[rank - 1] ?? "bg-brand-pink",
          ].join(" ")}
        >
          {rank}
        </span>
      ) : null}

      <Link
        className="relative block aspect-square rounded-[8px] bg-neutral-50"
        href={`/product/${product.slug}`}
      >
        <Image
          alt={product.name}
          className="object-contain p-3"
          fill
          priority={Boolean(product.bestSellerRank && product.bestSellerRank <= 5)}
          sizes="(max-width: 640px) 46vw, (max-width: 1280px) 30vw, 190px"
          src={product.thumbnail}
        />
      </Link>

      <div className="flex flex-1 flex-col px-1 pb-1 pt-3">
        <span
          className={[
            "w-fit rounded-full px-2 py-1 text-[0.62rem] font-black",
            categoryColors[product.category],
          ].join(" ")}
        >
          {product.category === "Decoracion" ? "Decoración" : product.category}
        </span>

        <Link
          className="mt-2 line-clamp-3 text-[0.96rem] font-black leading-tight text-ink hover:text-brand-pink"
          href={`/product/${product.slug}`}
        >
          {product.name}
        </Link>

        <div className="mt-auto pr-11 pt-4">
          <div>
            <p className="text-base font-black text-ink">
              {formatMXN(product.priceMXN)}
            </p>
            <div className="mt-1 flex items-center gap-1 text-[0.72rem] font-bold text-muted">
              <span className="flex text-brand-yellow" aria-label={`${product.rating} de 5`}>
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star
                    aria-hidden
                    className="h-3.5 w-3.5 fill-current"
                    key={index}
                    strokeWidth={0}
                  />
                ))}
              </span>
              <span className="hidden sm:inline">
                ({formatCount(product.reviewCount)})
              </span>
            </div>
          </div>
        </div>
        <button
          aria-label={`Agregar ${product.name} al carrito`}
          className="absolute bottom-4 right-4 grid h-10 w-10 place-items-center rounded-lg bg-brand-pink text-white shadow-pink transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-muted disabled:shadow-none"
          disabled={!canBuy}
          type="button"
        >
          <ShoppingCart aria-hidden className="h-5 w-5" />
        </button>
      </div>
    </article>
  );
}
