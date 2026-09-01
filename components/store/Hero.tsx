import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function Hero() {
  return (
    <section className="mt-5 overflow-hidden rounded-[8px] bg-hero-lilac lg:mt-6">
      <div className="grid min-h-[330px] items-center gap-4 px-8 py-8 sm:px-12 lg:grid-cols-[0.78fr_1.22fr] lg:px-16 lg:py-9">
        <div className="relative z-10">
          <h1 className="text-[2.72rem] font-black leading-[0.98] tracking-normal text-ink sm:text-[3.35rem] lg:text-[3.55rem] xl:text-[3.85rem]">
            <span className="block whitespace-nowrap">Dale vida a</span>
            <span className="block whitespace-nowrap text-brand-pink">
              tus ideas
            </span>
          </h1>
          <p className="mt-5 max-w-[390px] text-lg font-bold leading-snug text-ink/78">
            Productos 3D únicos, divertidos y hechos especialmente para vos.
          </p>
          <Link
            className="mt-6 inline-flex h-12 items-center gap-3 rounded-lg bg-brand-purple px-5 text-base font-black text-white shadow-purple transition hover:-translate-y-0.5 hover:bg-[#6645df]"
            href="/shop"
          >
            Ver más <ArrowRight aria-hidden className="h-5 w-5" />
          </Link>
        </div>

        <div className="relative min-h-[215px] lg:h-[300px]">
          <Image
            alt="Dinosaurio, pulpo, cohete y maceta impresos en 3D"
            className="object-contain object-center"
            fill
            priority
            sizes="(max-width: 1024px) 90vw, 650px"
            src="/brand/hero-objects.png"
          />
        </div>
      </div>
    </section>
  );
}
