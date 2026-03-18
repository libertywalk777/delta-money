import type { SupabaseClient } from '@supabase/supabase-js';
import type { Asset, Transaction, Goal, CurrencyRates, Currency } from '../types';
import { signInWithTelegram } from './telegramAuth';

const ZERO_UUID = '00000000-0000-0000-0000-000000000000';

async function getUserId(supabase: SupabaseClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) throw new Error('Нет сессии');
  return user.id;
}

function num(v: unknown): number | undefined {
  if (v === null || v === undefined) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export function rowToAsset(r: Record<string, unknown>): Asset {
  return {
    id: String(r.id),
    type: r.type as Asset['type'],
    name: String(r.name),
    ticker: r.ticker != null ? String(r.ticker) : undefined,
    quantity: num(r.quantity),
    buyPrice: num(r.buy_price),
    currentPrice: num(r.current_price),
    amount: num(r.amount),
    rate: num(r.rate),
    startDate: r.start_date != null ? String(r.start_date) : undefined,
    endDate: r.end_date != null ? String(r.end_date) : undefined,
    currency: String(r.currency),
    createdAt: String(r.created_at),
  };
}

export function rowToTransaction(r: Record<string, unknown>): Transaction {
  return {
    id: String(r.id),
    assetId: r.asset_id != null ? String(r.asset_id) : undefined,
    assetName: String(r.asset_name),
    type: r.type as Transaction['type'],
    amount: num(r.amount) ?? 0,
    price: num(r.price),
    currency: String(r.currency),
    date: String(r.date),
    comment: r.comment != null ? String(r.comment) : undefined,
  };
}

export function rowToGoal(r: Record<string, unknown>): Goal {
  return {
    id: String(r.id),
    name: String(r.name),
    targetAmount: num(r.target_amount) ?? 0,
    currentAmount: num(r.current_amount) ?? 0,
    currency: String(r.currency),
    deadline: String(r.deadline),
    color: String(r.color),
    createdAt: String(r.created_at),
  };
}

export async function loadAll(supabase: SupabaseClient) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    await signInWithTelegram(supabase);
  }

  const [a, t, g, s] = await Promise.all([
    supabase.from('assets').select('*').order('created_at', { ascending: false }),
    supabase.from('transactions').select('*').order('date', { ascending: false }),
    supabase.from('goals').select('*').order('created_at', { ascending: false }),
    supabase.from('user_settings').select('*').maybeSingle(),
  ]);

  if (a.error) throw a.error;
  if (t.error) throw t.error;
  if (g.error) throw g.error;
  if (s.error) throw s.error;

  let settingsRow = s.data;
  if (!settingsRow) {
    const ins = await supabase.from('user_settings').insert({
      display_currency: 'USD',
      currency_rates: { USD: 1, UZS: 12500, EUR: 0.92, RUB: 90 },
    });
    if (ins.error) throw ins.error;
    const again = await supabase.from('user_settings').select('*').maybeSingle();
    if (again.error) throw again.error;
    settingsRow = again.data;
  }

  const currencyRates = (settingsRow?.currency_rates as CurrencyRates) || {
    USD: 1,
    UZS: 12500,
    EUR: 0.92,
    RUB: 90,
  };
  const displayCurrency = (settingsRow?.display_currency as Currency) || 'USD';

  return {
    assets: (a.data ?? []).map((r) => rowToAsset(r as Record<string, unknown>)),
    transactions: (t.data ?? []).map((r) => rowToTransaction(r as Record<string, unknown>)),
    goals: (g.data ?? []).map((r) => rowToGoal(r as Record<string, unknown>)),
    displayCurrency,
    currencyRates,
  };
}

export async function insertAsset(supabase: SupabaseClient, asset: Omit<Asset, 'id' | 'createdAt'>) {
  const { data, error } = await supabase
    .from('assets')
    .insert({
      type: asset.type,
      name: asset.name,
      ticker: asset.ticker ?? null,
      quantity: asset.quantity ?? null,
      buy_price: asset.buyPrice ?? null,
      current_price: asset.currentPrice ?? null,
      amount: asset.amount ?? null,
      rate: asset.rate ?? null,
      start_date: asset.startDate ?? null,
      end_date: asset.endDate ?? null,
      currency: asset.currency,
    })
    .select()
    .single();
  if (error) throw error;
  return rowToAsset(data as Record<string, unknown>);
}

export async function updateAssetDb(supabase: SupabaseClient, id: string, updates: Partial<Asset>) {
  const patch: Record<string, unknown> = {};
  if (updates.type !== undefined) patch.type = updates.type;
  if (updates.name !== undefined) patch.name = updates.name;
  if (updates.ticker !== undefined) patch.ticker = updates.ticker ?? null;
  if (updates.quantity !== undefined) patch.quantity = updates.quantity ?? null;
  if (updates.buyPrice !== undefined) patch.buy_price = updates.buyPrice ?? null;
  if (updates.currentPrice !== undefined) patch.current_price = updates.currentPrice ?? null;
  if (updates.amount !== undefined) patch.amount = updates.amount ?? null;
  if (updates.rate !== undefined) patch.rate = updates.rate ?? null;
  if (updates.startDate !== undefined) patch.start_date = updates.startDate ?? null;
  if (updates.endDate !== undefined) patch.end_date = updates.endDate ?? null;
  if (updates.currency !== undefined) patch.currency = updates.currency;
  const { error } = await supabase.from('assets').update(patch).eq('id', id);
  if (error) throw error;
}

export async function deleteAssetDb(supabase: SupabaseClient, id: string) {
  const { error } = await supabase.from('assets').delete().eq('id', id);
  if (error) throw error;
}

export async function insertTransaction(
  supabase: SupabaseClient,
  tx: Omit<Transaction, 'id'>
) {
  const { data, error } = await supabase
    .from('transactions')
    .insert({
      asset_id: tx.assetId ?? null,
      asset_name: tx.assetName,
      type: tx.type,
      amount: tx.amount,
      price: tx.price ?? null,
      currency: tx.currency,
      date: tx.date,
      comment: tx.comment ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return rowToTransaction(data as Record<string, unknown>);
}

export async function deleteTransactionDb(supabase: SupabaseClient, id: string) {
  const { error } = await supabase.from('transactions').delete().eq('id', id);
  if (error) throw error;
}

export async function insertGoal(supabase: SupabaseClient, goal: Omit<Goal, 'id' | 'createdAt'>) {
  const { data, error } = await supabase
    .from('goals')
    .insert({
      name: goal.name,
      target_amount: goal.targetAmount,
      current_amount: goal.currentAmount,
      currency: goal.currency,
      deadline: goal.deadline,
      color: goal.color,
    })
    .select()
    .single();
  if (error) throw error;
  return rowToGoal(data as Record<string, unknown>);
}

export async function updateGoalDb(supabase: SupabaseClient, id: string, updates: Partial<Goal>) {
  const patch: Record<string, unknown> = {};
  if (updates.name !== undefined) patch.name = updates.name;
  if (updates.targetAmount !== undefined) patch.target_amount = updates.targetAmount;
  if (updates.currentAmount !== undefined) patch.current_amount = updates.currentAmount;
  if (updates.currency !== undefined) patch.currency = updates.currency;
  if (updates.deadline !== undefined) patch.deadline = updates.deadline;
  if (updates.color !== undefined) patch.color = updates.color;
  const { error } = await supabase.from('goals').update(patch).eq('id', id);
  if (error) throw error;
}

export async function deleteGoalDb(supabase: SupabaseClient, id: string) {
  const { error } = await supabase.from('goals').delete().eq('id', id);
  if (error) throw error;
}

export async function saveDisplayCurrency(supabase: SupabaseClient, currency: Currency) {
  const uid = await getUserId(supabase);
  const { error } = await supabase
    .from('user_settings')
    .update({ display_currency: currency })
    .eq('user_id', uid);
  if (error) throw error;
}

export async function saveCurrencyRates(supabase: SupabaseClient, rates: CurrencyRates) {
  const uid = await getUserId(supabase);
  const { error } = await supabase
    .from('user_settings')
    .update({ currency_rates: rates })
    .eq('user_id', uid);
  if (error) throw error;
}

/** Удаляет все строки текущего пользователя (RLS) */
export async function clearAllUserData(supabase: SupabaseClient) {
  const uid = await getUserId(supabase);
  await supabase.from('transactions').delete().neq('id', ZERO_UUID);
  await supabase.from('goals').delete().neq('id', ZERO_UUID);
  await supabase.from('assets').delete().neq('id', ZERO_UUID);
  const { error } = await supabase
    .from('user_settings')
    .update({
      display_currency: 'USD',
      currency_rates: { USD: 1, UZS: 12500, EUR: 0.92, RUB: 90 },
    })
    .eq('user_id', uid);
  if (error) throw error;
}
