export function formatCurrency(amount: number, currency = 'ARS', locale = 'es-AR') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount || 0)
}
