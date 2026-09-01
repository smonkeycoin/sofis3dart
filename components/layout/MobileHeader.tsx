"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, ShoppingCart, X } from "lucide-react";
import { Wordmark } from "@/components/brand/Wordmark";
import { sidebarLinks } from "@/lib/navigation";

export function MobileHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-soft-gray bg-white/95 px-5 py-4 backdrop-blur lg:hidden">
      <div className="flex items-center justify-between gap-4">
        <Link href="/" aria-label="Ir al inicio" onClick={() => setOpen(false)}>
          <Wordmark compact />
        </Link>
        <div className="flex items-center gap-2">
          <Link
            aria-label="Abrir carrito"
            className="relative grid h-11 w-11 place-items-center rounded-full border border-soft-gray text-ink"
            href="/cart"
          >
            <ShoppingCart aria-hidden className="h-5 w-5" />
            <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-brand-pink px-1 text-[0.68rem] font-black text-white">
              3
            </span>
          </Link>
          <button
            aria-label={open ? "Cerrar menu" : "Abrir menu"}
            className="grid h-11 w-11 place-items-center rounded-full bg-ink text-white"
            onClick={() => setOpen((value) => !value)}
            type="button"
          >
            {open ? (
              <X aria-hidden className="h-5 w-5" />
            ) : (
              <Menu aria-hidden className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {open ? (
        <div className="absolute left-0 right-0 top-full border-b border-soft-gray bg-white p-5 shadow-soft">
          <nav aria-label="Menu movil" className="grid gap-2">
            {sidebarLinks.map((item) => {
              const Icon = item.icon;
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  className={[
                    "flex h-12 items-center gap-3 rounded-lg px-3 text-sm font-extrabold",
                    active
                      ? "bg-pink-soft text-brand-pink"
                      : "text-ink hover:bg-neutral-50",
                  ].join(" ")}
                  href={item.href}
                  key={item.href}
                  onClick={() => setOpen(false)}
                >
                  <Icon aria-hidden className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
