import { StoreShell } from "@/components/layout/StoreShell";
import { TopStoreBar } from "@/components/layout/TopStoreBar";
import { PageHeader } from "@/components/store/PageHeader";
import { ProductGrid } from "@/components/store/ProductGrid";
import { newArrivals } from "@/lib/products";

export default function NewArrivalsPage() {
  return (
    <StoreShell>
      <TopStoreBar />
      <PageHeader
        copy="Lo mas reciente del taller: piezas nuevas, colores frescos y productos listos para personalizar."
        title="Nuevos ingresos"
      />
      <ProductGrid products={newArrivals} />
    </StoreShell>
  );
}
