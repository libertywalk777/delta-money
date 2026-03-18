import { Asset, CurrencyRates } from './types';

export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
}

export const CURRENCIES: CurrencyInfo[] = [
  { code: 'USD', symbol: '$', name: 'Доллар США' },
  { code: 'EUR', symbol: '€', name: 'Евро' },
  { code: 'RUB', symbol: '₽', name: 'Рубль' },
  { code: 'UZS', symbol: 'сум', name: 'Узбекский сум' },
];

export function formatCurrency(
  amount: number,
  currency: string,
  compact: boolean = false
): string {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    RUB: '₽',
    UZS: '',
  };
  
  const symbol = symbols[currency] || '';
  
  if (compact && Math.abs(amount) >= 1000000) {
    return `${symbol}${(amount / 1000000).toFixed(1)}M`;
  }
  if (compact && Math.abs(amount) >= 1000) {
    return `${symbol}${(amount / 1000).toFixed(1)}K`;
  }
  
  const formatted = new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: currency === 'UZS' ? 0 : 2,
    maximumFractionDigits: currency === 'UZS' ? 0 : 2,
  }).format(amount);
  
  if (currency === 'UZS') {
    return `${formatted} сум`;
  }
  
  return `${symbol}${formatted}`;
}

export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: CurrencyRates
): number {
  if (fromCurrency === toCurrency) return amount;
  
  const fromRate = rates[fromCurrency] || 1;
  const toRate = rates[toCurrency] || 1;
  
  // Convert to USD first, then to target currency
  const inUSD = amount / fromRate;
  return inUSD * toRate;
}

export function calculateAssetValue(asset: Asset, rates: CurrencyRates, toCurrency: string): number {
  let value = 0;
  
  if (asset.type === 'stock') {
    const quantity = asset.quantity || 0;
    const price = asset.currentPrice || asset.buyPrice || 0;
    value = quantity * price;
  } else if (asset.type === 'deposit') {
    value = asset.amount || 0;
  }
  
  return convertCurrency(value, asset.currency, toCurrency, rates);
}

export function calculateAssetProfit(asset: Asset): { amount: number; percent: number } {
  if (asset.type !== 'stock') {
    return { amount: 0, percent: 0 };
  }
  
  const quantity = asset.quantity || 0;
  const currentPrice = asset.currentPrice || 0;
  const buyPrice = asset.buyPrice || 0;
  
  if (!quantity || !currentPrice || !buyPrice) {
    return { amount: 0, percent: 0 };
  }
  
  const currentValue = quantity * currentPrice;
  const costBasis = quantity * buyPrice;
  const profit = currentValue - costBasis;
  const percent = costBasis > 0 ? (profit / costBasis) * 100 : 0;
  
  return { amount: profit, percent };
}

export function calculateTotalPortfolioValue(
  assets: Asset[],
  rates: CurrencyRates,
  toCurrency: string
): number {
  return assets.reduce((total, asset) => {
    return total + calculateAssetValue(asset, rates, toCurrency);
  }, 0);
}

export function calculateTotalInvested(
  assets: Asset[],
  rates: CurrencyRates,
  toCurrency: string
): number {
  return assets.reduce((total, asset) => {
    if (asset.type === 'stock') {
      const quantity = asset.quantity || 0;
      const buyPrice = asset.buyPrice || 0;
      const value = quantity * buyPrice;
      return total + convertCurrency(value, asset.currency, toCurrency, rates);
    }
    return total + calculateAssetValue(asset, rates, toCurrency);
  }, 0);
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
  });
}

export function formatFullDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function daysUntil(dateString: string): number {
  const target = new Date(dateString);
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function monthsUntil(dateString: string): number {
  const target = new Date(dateString);
  const now = new Date();
  const months = (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth());
  return Math.max(1, months);
}

export function calculateMonthlyContribution(
  targetAmount: number,
  currentAmount: number,
  deadline: string
): number {
  const remaining = targetAmount - currentAmount;
  if (remaining <= 0) return 0;
  
  const months = monthsUntil(deadline);
  return remaining / months;
}
