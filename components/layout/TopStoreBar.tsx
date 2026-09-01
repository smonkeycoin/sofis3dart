import Link from "next/link";
import { Search, ShoppingCart, UserRound } from "lucide-react";
import { categoryLinks } from "@/lib/navigation";

export function TopStoreBar({ selected = "Todos" }: { selected?: string }) {
  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex items-center gap-6">
        <label className="relative block min-w-0 flex-1">
          <span className="sr-only">Buscar productos</span>
          <Search
            aria-hidden
            className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted"
          />
          <input
            className="h-14 w-full rounded-full border border-soft-gray bg-white pl-14 pr-5 text-[0.98rem] font-semibold outline-none transition placeholder:text-muted focus:border-brand-pink focus:ring-4 focus:ring-pink-soft"
            placeholder="Buscar productos divertidos..."
            type="search"
          />
        </label>
        <Link
          className="hidden items-center gap-3 text-sm font-extrabold text-ink/80 hover:text-brand-pink sm:flex"
          href="/account"
        >
          <UserRound aria-hidden className="h-5 w-5" />
          Mi cuenta
        </Link>
        <Link
          aria-label="Abrir carrito"
          className="relative hidden h-12 w-12 place-items-center rounded-full border border-soft-gray text-ink hover:border-brand-pink hover:text-brand-pink sm:grid"
          href="/cart"
        >
          <ShoppingCart aria-hidden className="h-6 w-6" />
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-brand-pink px-1 text-[0.68rem] font-black text-white">
            3
          </span>
        </Link>
      </div>

      <nav
        aria-label="Categorias"
        className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-1 sm:mx-0 sm:px-0"
      >
        {categoryLinks.map((category) => {
          const active = category === selected;
          return (
            <Link
              className={[
                "flex h-10 shrink-0 items-center rounded-full px-5 text-sm font-extrabold transition",
                active
                  ? "bg-brand-pink text-white shadow-pink"
                  : "text-ink hover:bg-neutral-50 hover:text-brand-pink",
              ].join(" ")}
              href={category === "Todos" ? "/shop" : `/shop?category=${category}`}
              key={category}
            >
              {category === "Decoracion" ? "Decoración" : category}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
