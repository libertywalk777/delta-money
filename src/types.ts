export interface Asset {
  id: string;
  type: 'stock' | 'deposit';
  name: string;
  ticker?: string;
  quantity?: number;
  buyPrice?: number;
  currentPrice?: number;
  amount?: number;
  rate?: number;
  startDate?: string;
  endDate?: string;
  currency: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  assetId?: string;
  assetName: string;
  type: 'buy' | 'sell' | 'deposit';
  amount: number;
  price?: number;
  currency: string;
  date: string;
  comment?: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  deadline: string;
  color: string;
  createdAt: string;
}

export interface CurrencyRates {
  [key: string]: number;
}

export type Currency = 'USD' | 'UZS' | 'EUR' | 'RUB';

export const CURRENCIES: { value: Currency; label: string; symbol: string }[] = [
  { value: 'USD', label: 'Доллар США', symbol: '$' },
  { value: 'UZS', label: 'Узбекский сум', symbol: 'сум' },
  { value: 'EUR', label: 'Евро', symbol: '€' },
  { value: 'RUB', label: 'Российский рубль', symbol: '₽' },
];
