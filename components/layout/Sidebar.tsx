"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart } from "lucide-react";
import { Wordmark } from "@/components/brand/Wordmark";
import { brand } from "@/lib/brand";
import { sidebarLinks } from "@/lib/navigation";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden min-h-screen w-[376px] shrink-0 border-r border-soft-gray/70 bg-white px-12 py-20 lg:sticky lg:top-0 lg:block">
      <Link href="/" aria-label="Ir al inicio">
        <Wordmark />
      </Link>
      <p className="mt-2 text-lg font-semibold text-muted">{brand.tagline}</p>

      <div className="relative mx-auto mt-6 h-[245px] w-full">
        <Image
          alt="Impresora 3D creando una figura pequena rodeada de piezas coloridas"
          className="object-contain"
          fill
          priority
          sizes="280px"
          src="/brand/sidebar-printer-scene.png"
        />
      </div>

      <nav aria-label="Navegacion principal" className="mt-8 space-y-2">
        {sidebarLinks.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

          return (
            <Link
              className={[
                "flex h-11 items-center gap-4 rounded-lg px-3 text-[0.95rem] font-bold transition",
                active
                  ? "bg-pink-soft text-brand-pink"
                  : "text-ink/80 hover:bg-neutral-50 hover:text-brand-pink",
              ].join(" ")}
              href={item.href}
              key={item.href}
            >
              <Icon aria-hidden className="h-5 w-5" strokeWidth={2.3} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 overflow-hidden rounded-[8px] bg-brand-purple p-5 text-white shadow-soft">
        <div className="flex items-start gap-3">
          <Heart aria-hidden className="mt-1 h-5 w-5 text-white" />
          <p className="text-[0.98rem] font-extrabold leading-snug">
            Hecho con amor y una impresora 3D
          </p>
        </div>
        <div className="mt-4 grid grid-cols-[1fr_92px] items-end gap-3">
          <p className="text-sm font-medium leading-relaxed text-white/88">
            Todos nuestros productos son impresos con materiales de alta calidad.
          </p>
          <Image
            alt="Figura 3D pequena de color verde"
            className="drop-shadow-sm"
            height={92}
            src="/products/mini-robot-articulado.png"
            width={92}
          />
        </div>
      </div>
    </aside>
  );
}
