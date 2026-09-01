import { StoreShell } from "@/components/layout/StoreShell";
import { TopStoreBar } from "@/components/layout/TopStoreBar";
import { PageHeader } from "@/components/store/PageHeader";
import { ProductGrid } from "@/components/store/ProductGrid";
import { getProductsByCategory } from "@/lib/products";

type Props = {
  searchParams: Promise<{ category?: string }>;
};

export default async function ShopPage({ searchParams }: Props) {
  const { category = "Todos" } = await searchParams;
  const products = getProductsByCategory(category);

  return (
    <StoreShell>
      <TopStoreBar selected={category} />
      <PageHeader
        copy="Explora productos originales impresos en 3D para casa, escritorio, regalos y momentos divertidos."
        title={category === "Todos" ? "Tienda" : category}
      />
      <ProductGrid products={products} />
    </StoreShell>
  );
}
