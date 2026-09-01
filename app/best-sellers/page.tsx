import { StoreShell } from "@/components/layout/StoreShell";
import { TopStoreBar } from "@/components/layout/TopStoreBar";
import { PageHeader } from "@/components/store/PageHeader";
import { ProductGrid } from "@/components/store/ProductGrid";
import { bestSellers } from "@/lib/products";

export default function BestSellersPage() {
  return (
    <StoreShell>
      <TopStoreBar />
      <PageHeader
        copy="Los favoritos de la tienda, elegidos por clientes que aman los productos 3D útiles, coleccionables y llenos de color."
        title="Más vendidos"
      />
      <ProductGrid products={bestSellers} />
    </StoreShell>
  );
}
