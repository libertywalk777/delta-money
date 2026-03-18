import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Asset, Transaction, Goal, CurrencyRates, Currency } from './types';
import { isSupabaseConfigured, getSupabase } from './lib/supabase';
import * as db from './lib/db';

interface AppState {
  initialized: boolean;
  initError: string | null;
  useCloud: boolean;

  assets: Asset[];
  transactions: Transaction[];
  goals: Goal[];
  displayCurrency: Currency;
  currencyRates: CurrencyRates;

  bootstrap: () => Promise<void>;

  addAsset: (asset: Omit<Asset, 'id' | 'createdAt'>) => void | Promise<void>;
  updateAsset: (id: string, updates: Partial<Asset>) => void | Promise<void>;
  deleteAsset: (id: string) => void | Promise<void>;

  addTransaction: (transaction: Omit<Transaction, 'id'>) => void | Promise<void>;
  deleteTransaction: (id: string) => void | Promise<void>;

  addGoal: (goal: Omit<Goal, 'id' | 'createdAt'>) => void | Promise<void>;
  updateGoal: (id: string, updates: Partial<Goal>) => void | Promise<void>;
  deleteGoal: (id: string) => void | Promise<void>;
  addToGoal: (id: string, amount: number) => void | Promise<void>;

  setDisplayCurrency: (currency: Currency) => void | Promise<void>;
  setCurrencyRate: (currency: string, rate: number) => void | Promise<void>;

  clearAllData: () => void | Promise<void>;
}

const defaultRates: CurrencyRates = {
  USD: 1,
  UZS: 12500,
  EUR: 0.92,
  RUB: 90,
};

const generateId = () => Math.random().toString(36).substring(2, 15);

function createLocalStore() {
  return create<AppState>()(
    persist(
      (set, get) => ({
        initialized: true,
        initError: null,
        useCloud: false,

        assets: [],
        transactions: [],
        goals: [],
        displayCurrency: 'USD',
        currencyRates: { ...defaultRates },

        bootstrap: async () => {},

        addAsset: (asset) =>
          set((state) => ({
            assets: [
              ...state.assets,
              {
                ...asset,
                id: generateId(),
                createdAt: new Date().toISOString(),
              },
            ],
          })),

        updateAsset: (id, updates) =>
          set((state) => ({
            assets: state.assets.map((a) => (a.id === id ? { ...a, ...updates } : a)),
          })),

        deleteAsset: (id) =>
          set((state) => ({
            assets: state.assets.filter((a) => a.id !== id),
            transactions: state.transactions.filter((t) => t.assetId !== id),
          })),

        addTransaction: (transaction) =>
          set((state) => ({
            transactions: [
              ...state.transactions,
              { ...transaction, id: generateId() },
            ],
          })),

        deleteTransaction: (id) =>
          set((state) => ({
            transactions: state.transactions.filter((t) => t.id !== id),
          })),

        addGoal: (goal) =>
          set((state) => ({
            goals: [
              ...state.goals,
              {
                ...goal,
                id: generateId(),
                createdAt: new Date().toISOString(),
              },
            ],
          })),

        updateGoal: (id, updates) =>
          set((state) => ({
            goals: state.goals.map((g) => (g.id === id ? { ...g, ...updates } : g)),
          })),

        deleteGoal: (id) =>
          set((state) => ({
            goals: state.goals.filter((g) => g.id !== id),
          })),

        addToGoal: (id, amount) =>
          set((state) => ({
            goals: state.goals.map((g) =>
              g.id === id ? { ...g, currentAmount: g.currentAmount + amount } : g
            ),
          })),

        setDisplayCurrency: (currency) => set({ displayCurrency: currency }),

        setCurrencyRate: (currency, rate) =>
          set((state) => ({
            currencyRates: { ...state.currencyRates, [currency]: rate },
          })),

        clearAllData: () =>
          set({
            assets: [],
            transactions: [],
            goals: [],
          }),
      }),
      {
        name: 'investment-tracker-storage',
        partialize: (s) => ({
          assets: s.assets,
          transactions: s.transactions,
          goals: s.goals,
          displayCurrency: s.displayCurrency,
          currencyRates: s.currencyRates,
        }),
      }
    )
  );
}

function createCloudStore() {
  const supabase = getSupabase();

  return create<AppState>()((set, get) => ({
    initialized: false,
    initError: null,
    useCloud: true,

    assets: [],
    transactions: [],
    goals: [],
    displayCurrency: 'USD',
    currencyRates: { ...defaultRates },

    bootstrap: async () => {
      try {
        const data = await db.loadAll(supabase);
        set({
          ...data,
          initialized: true,
          initError: null,
          useCloud: true,
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        set({
          initialized: true,
          initError: msg,
          useCloud: true,
        });
      }
    },

    addAsset: async (asset) => {
      try {
        const row = await db.insertAsset(supabase, asset);
        set((s) => ({ assets: [row, ...s.assets] }));
      } catch (e) {
        console.error(e);
      }
    },

    updateAsset: async (id, updates) => {
      try {
        await db.updateAssetDb(supabase, id, updates);
        set((s) => ({
          assets: s.assets.map((a) => (a.id === id ? { ...a, ...updates } : a)),
        }));
      } catch (e) {
        console.error(e);
      }
    },

    deleteAsset: async (id) => {
      try {
        await db.deleteAssetDb(supabase, id);
        set((s) => ({
          assets: s.assets.filter((a) => a.id !== id),
          transactions: s.transactions.filter((t) => t.assetId !== id),
        }));
      } catch (e) {
        console.error(e);
      }
    },

    addTransaction: async (transaction) => {
      try {
        const row = await db.insertTransaction(supabase, transaction);
        set((s) => ({ transactions: [row, ...s.transactions] }));
      } catch (e) {
        console.error(e);
      }
    },

    deleteTransaction: async (id) => {
      try {
        await db.deleteTransactionDb(supabase, id);
        set((s) => ({
          transactions: s.transactions.filter((t) => t.id !== id),
        }));
      } catch (e) {
        console.error(e);
      }
    },

    addGoal: async (goal) => {
      try {
        const row = await db.insertGoal(supabase, goal);
        set((s) => ({ goals: [row, ...s.goals] }));
      } catch (e) {
        console.error(e);
      }
    },

    updateGoal: async (id, updates) => {
      try {
        await db.updateGoalDb(supabase, id, updates);
        set((s) => ({
          goals: s.goals.map((g) => (g.id === id ? { ...g, ...updates } : g)),
        }));
      } catch (e) {
        console.error(e);
      }
    },

    deleteGoal: async (id) => {
      try {
        await db.deleteGoalDb(supabase, id);
        set((s) => ({ goals: s.goals.filter((g) => g.id !== id) }));
      } catch (e) {
        console.error(e);
      }
    },

    addToGoal: async (id, amount) => {
      const g = get().goals.find((x) => x.id === id);
      if (!g) return;
      const next = g.currentAmount + amount;
      try {
        await db.updateGoalDb(supabase, id, { currentAmount: next });
        set((s) => ({
          goals: s.goals.map((x) =>
            x.id === id ? { ...x, currentAmount: next } : x
          ),
        }));
      } catch (e) {
        console.error(e);
      }
    },

    setDisplayCurrency: async (currency) => {
      try {
        await db.saveDisplayCurrency(supabase, currency);
        set({ displayCurrency: currency });
      } catch (e) {
        console.error(e);
      }
    },

    setCurrencyRate: async (currency, rate) => {
      const next = { ...get().currencyRates, [currency]: rate };
      try {
        await db.saveCurrencyRates(supabase, next);
        set({ currencyRates: next });
      } catch (e) {
        console.error(e);
      }
    },

    clearAllData: async () => {
      try {
        await db.clearAllUserData(supabase);
        set({
          assets: [],
          transactions: [],
          goals: [],
          displayCurrency: 'USD',
          currencyRates: { ...defaultRates },
        });
      } catch (e) {
        console.error(e);
      }
    },
  }));
}

export const useStore = isSupabaseConfigured() ? createCloudStore() : createLocalStore();
