export function formatMXN(price: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatCount(count: number) {
  return new Intl.NumberFormat("es-MX").format(count);
}
