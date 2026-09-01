import { StoreShell } from "@/components/layout/StoreShell";
import { TopStoreBar } from "@/components/layout/TopStoreBar";
import { PageHeader } from "@/components/store/PageHeader";
import { ProductGrid } from "@/components/store/ProductGrid";
import { products } from "@/lib/products";

export default function CollectionsPage() {
  return (
    <StoreShell>
      <TopStoreBar />
      <PageHeader
        copy="Colecciones pensadas para navegar facil: juguetes flexi, hogar colorido, escritorio ordenado y regalos personalizados."
        title="Colecciones"
      />
      <ProductGrid products={products.slice(0, 8)} />
    </StoreShell>
  );
}
