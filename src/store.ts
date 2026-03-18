import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Asset, Transaction, Goal, CurrencyRates, Currency } from './types';

interface AppState {
  // Data
  assets: Asset[];
  transactions: Transaction[];
  goals: Goal[];
  
  // Settings
  displayCurrency: Currency;
  currencyRates: CurrencyRates;
  
  // Actions - Assets
  addAsset: (asset: Omit<Asset, 'id' | 'createdAt'>) => void;
  updateAsset: (id: string, updates: Partial<Asset>) => void;
  deleteAsset: (id: string) => void;
  
  // Actions - Transactions
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
  
  // Actions - Goals
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt'>) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  addToGoal: (id: string, amount: number) => void;
  
  // Actions - Settings
  setDisplayCurrency: (currency: Currency) => void;
  setCurrencyRate: (currency: string, rate: number) => void;
  
  // Actions - Data
  clearAllData: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // Initial state
      assets: [],
      transactions: [],
      goals: [],
      displayCurrency: 'USD',
      currencyRates: {
        USD: 1,
        UZS: 12500,
        EUR: 0.92,
        RUB: 90,
      },
      
      // Asset actions
      addAsset: (asset) => set((state) => ({
        assets: [...state.assets, {
          ...asset,
          id: generateId(),
          createdAt: new Date().toISOString(),
        }],
      })),
      
      updateAsset: (id, updates) => set((state) => ({
        assets: state.assets.map((a) =>
          a.id === id ? { ...a, ...updates } : a
        ),
      })),
      
      deleteAsset: (id) => set((state) => ({
        assets: state.assets.filter((a) => a.id !== id),
        transactions: state.transactions.filter((t) => t.assetId !== id),
      })),
      
      // Transaction actions
      addTransaction: (transaction) => set((state) => ({
        transactions: [...state.transactions, {
          ...transaction,
          id: generateId(),
        }],
      })),
      
      deleteTransaction: (id) => set((state) => ({
        transactions: state.transactions.filter((t) => t.id !== id),
      })),
      
      // Goal actions
      addGoal: (goal) => set((state) => ({
        goals: [...state.goals, {
          ...goal,
          id: generateId(),
          createdAt: new Date().toISOString(),
        }],
      })),
      
      updateGoal: (id, updates) => set((state) => ({
        goals: state.goals.map((g) =>
          g.id === id ? { ...g, ...updates } : g
        ),
      })),
      
      deleteGoal: (id) => set((state) => ({
        goals: state.goals.filter((g) => g.id !== id),
      })),
      
      addToGoal: (id, amount) => set((state) => ({
        goals: state.goals.map((g) =>
          g.id === id ? { ...g, currentAmount: g.currentAmount + amount } : g
        ),
      })),
      
      // Settings actions
      setDisplayCurrency: (currency) => set({ displayCurrency: currency }),
      
      setCurrencyRate: (currency, rate) => set((state) => ({
        currencyRates: { ...state.currencyRates, [currency]: rate },
      })),
      
      // Clear all data
      clearAllData: () => set({
        assets: [],
        transactions: [],
        goals: [],
      }),
    }),
    {
      name: 'investment-tracker-storage',
    }
  )
);
