export const commercialLicenseStatuses = [
  "ORIGINAL",
  "COMMERCIAL_LICENSED",
  "PERSONAL_USE_ONLY",
  "UNKNOWN",
] as const;

export type CommercialLicenseStatus =
  (typeof commercialLicenseStatuses)[number];

export type ProductCategory =
  | "Geek"
  | "Juguetes"
  | "Accesorios"
  | "Hogar"
  | "Oficina"
  | "Decoracion"
  | "Regalos";

export type StockMode = "IN_STOCK" | "LOW_STOCK" | "MADE_TO_ORDER" | "SOLD_OUT";

export type Product = {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  description: string;
  category: ProductCategory;
  priceMXN: number;
  compareAtPriceMXN?: number;
  images: string[];
  thumbnail: string;
  colors: string[];
  material: string;
  printTimeHours: number;
  estimatedWeightGrams: number;
  stockMode: StockMode;
  stockQuantity: number;
  madeToOrder: boolean;
  featured: boolean;
  bestSellerRank?: number;
  newArrival: boolean;
  rating: number;
  reviewCount: number;
  commercialLicenseStatus: CommercialLicenseStatus;
  modelSource: string;
  active: boolean;
};

export function isPurchasable(product: Product) {
  return (
    product.active &&
    product.stockMode !== "SOLD_OUT" &&
    (product.commercialLicenseStatus === "ORIGINAL" ||
      product.commercialLicenseStatus === "COMMERCIAL_LICENSED")
  );
}
