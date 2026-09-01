import { Heart, LockKeyhole, ShieldCheck, Truck } from "lucide-react";

const items = [
  {
    icon: Truck,
    color: "text-brand-green",
    text: "Envíos a todo México",
  },
  {
    icon: ShieldCheck,
    color: "text-brand-purple",
    text: "Impresión 3D de alta calidad",
  },
  {
    icon: LockKeyhole,
    color: "text-brand-yellow",
    text: "Pagos seguros y protegidos",
  },
  {
    icon: Heart,
    color: "text-brand-pink",
    text: "Hecho con amor y creatividad",
  },
];

export function TrustStrip() {
  return (
    <section
      aria-label="Beneficios de compra"
      className="mt-6 grid gap-4 rounded-[8px] border border-soft-gray bg-white px-6 py-6 shadow-subtle sm:grid-cols-2 xl:grid-cols-4"
    >
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div className="flex items-center justify-center gap-4" key={item.text}>
            <Icon aria-hidden className={`h-7 w-7 ${item.color}`} />
            <p className="max-w-[150px] text-sm font-bold leading-snug text-ink/75">
              {item.text}
            </p>
          </div>
        );
      })}
    </section>
  );
}
