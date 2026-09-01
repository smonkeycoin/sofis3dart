import { StoreShell } from "@/components/layout/StoreShell";
import { TopStoreBar } from "@/components/layout/TopStoreBar";
import { PageHeader } from "@/components/store/PageHeader";

export default function AboutPage() {
  return (
    <StoreShell>
      <TopStoreBar />
      <PageHeader
        copy="SOFI'S 3D ART nace para convertir ideas simples en objetos alegres, practicos y coleccionables hechos con impresion 3D de alta calidad."
        title="Sobre nosotros"
      />
      <div className="grid gap-5 lg:grid-cols-3">
        {[
          ["Hecho en Mexico", "Produccion pequena, cercana y lista para crecer con cuidado."],
          ["Producto primero", "Cada pieza se muestra con claridad para que sepas que estas comprando."],
          ["Catalogo responsable", "El catalogo prioriza disenos originales y licencias comerciales claras."],
        ].map(([title, copy]) => (
          <section
            className="rounded-[8px] border border-soft-gray bg-white p-6 shadow-subtle"
            key={title}
          >
            <h2 className="text-xl font-black text-ink">{title}</h2>
            <p className="mt-3 text-sm font-semibold leading-relaxed text-ink/68">
              {copy}
            </p>
          </section>
        ))}
      </div>
    </StoreShell>
  );
}
