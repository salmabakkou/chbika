/**
 * Formats a numeric price into a currency string (default Moroccan Dirham DH).
 * @param {number} price 
 * @param {string} currency - 'MAD' or 'EUR'
 * @returns {string}
 */
export function formatPrice(price, currency = 'MAD') {
  if (price === undefined || price === null) return '';
  
  const numPrice = Number(price);
  if (isNaN(numPrice)) return '';

  if (currency === 'EUR') {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(numPrice);
  }

  // Default: Moroccan Dirham (MAD) formatted as '1 250 DH' or '1,250 DH'
  const formattedVal = new Intl.NumberFormat('fr-MA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(numPrice);
  
  return `${formattedVal} DH`;
}
