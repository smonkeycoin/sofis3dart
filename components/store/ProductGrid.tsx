import { ProductCard } from "@/components/product/ProductCard";
import type { Product } from "@/domain/product";

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 min-[360px]:grid-cols-2 lg:grid-cols-3 lg:gap-5 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
