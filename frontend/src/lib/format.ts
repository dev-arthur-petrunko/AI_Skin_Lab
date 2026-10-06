export function formatPrice(value: number): string {
  return new Intl.NumberFormat("uk-UA", {
    maximumFractionDigits: 0,
  }).format(value);
}
