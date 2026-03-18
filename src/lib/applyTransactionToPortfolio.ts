import type { Asset, Transaction } from '../types';

export type ApplyTxResult =
  | {
      ok: true;
      nextAssets: Asset[];
      transaction: Omit<Transaction, 'id'>;
    }
  | { ok: false; message: string };

const genId = () => Math.random().toString(36).substring(2, 15);

/**
 * Покупка/продажа меняют позиции в портфеле; пополнение — сумму вклада.
 * Запись в историю — отдельно тем же объектом transaction.
 */
export function applyTransactionToPortfolio(
  assets: Asset[],
  tx: Omit<Transaction, 'id'>
): ApplyTxResult {
  const t = { ...tx };

  if (t.type === 'buy') {
    if (!t.amount || t.amount <= 0) {
      return { ok: false, message: 'Укажите количество' };
    }
    const price = t.price ?? 0;

    if (t.assetId) {
      const a = assets.find((x) => x.id === t.assetId);
      if (!a || a.type !== 'stock') {
        return {
          ok: false,
          message:
            'Покупка акции: выберите позицию из списка акций или снимите выбор и введите новый актив.',
        };
      }
      const p = price > 0 ? price : (a.buyPrice ?? 0);
      if (p <= 0) {
        return { ok: false, message: 'Укажите цену за единицу' };
      }
      const oldQ = a.quantity ?? 0;
      const newQ = oldQ + t.amount;
      const newBuy =
        (oldQ * (a.buyPrice ?? p) + t.amount * p) / newQ;
      const next = assets.map((x) =>
        x.id === a.id
          ? {
              ...x,
              quantity: newQ,
              buyPrice: newBuy,
              currentPrice: p,
            }
          : x
      );
      return {
        ok: true,
        nextAssets: next,
        transaction: {
          ...t,
          assetId: a.id,
          assetName: a.name,
        },
      };
    }

    const name = (t.assetName || '').trim();
    if (!name) {
      return { ok: false, message: 'Введите название актива' };
    }
    if (price <= 0) {
      return { ok: false, message: 'Укажите цену покупки' };
    }
    const aid = genId();
    const createdAt = new Date().toISOString();
    const newA: Asset = {
      id: aid,
      type: 'stock',
      name: name,
      ticker: name.length <= 6 ? name.toUpperCase() : undefined,
      quantity: t.amount,
      buyPrice: price,
      currentPrice: price,
      currency: t.currency,
      createdAt,
    };
    return {
      ok: true,
      nextAssets: [newA, ...assets],
      transaction: {
        ...t,
        assetId: aid,
        assetName: name,
      },
    };
  }

  if (t.type === 'sell') {
    let a = t.assetId
      ? assets.find((x) => x.id === t.assetId)
      : undefined;
    if (!a) {
      const n = (t.assetName || '').toLowerCase().trim();
      a = assets.find(
        (x) => x.type === 'stock' && x.name.toLowerCase().trim() === n
      );
    }
    if (!a || a.type !== 'stock') {
      return {
        ok: false,
        message: 'Нет акции для продажи. Выберите позицию из списка.',
      };
    }
    const sellQty = t.amount;
    if (!sellQty || sellQty <= 0) {
      return { ok: false, message: 'Укажите количество к продаже' };
    }
    const q = a.quantity ?? 0;
    if (sellQty > q + 1e-9) {
      return {
        ok: false,
        message: `Недостаточно: в портфеле ${q} шт.`,
      };
    }
    const newQ = q - sellQty;
    const price = t.price ?? a.currentPrice ?? a.buyPrice ?? 0;
    let next: Asset[];
    if (newQ <= 1e-9) {
      next = assets.filter((x) => x.id !== a!.id);
    } else {
      next = assets.map((x) =>
        x.id === a!.id
          ? {
              ...x,
              quantity: newQ,
              currentPrice: price > 0 ? price : x.currentPrice,
            }
          : x
      );
    }
    return {
      ok: true,
      nextAssets: next,
      transaction: {
        ...t,
        assetId: a.id,
        assetName: a.name,
        price: price > 0 ? price : t.price,
      },
    };
  }

  if (t.type === 'deposit') {
    if (t.assetId) {
      const dep = assets.find((x) => x.id === t.assetId && x.type === 'deposit');
      if (dep) {
        const add = t.amount * (t.price || 1);
        if (!t.amount || t.amount <= 0) {
          return { ok: false, message: 'Укажите сумму пополнения' };
        }
        const next = assets.map((x) =>
          x.id === dep.id ? { ...x, amount: (x.amount || 0) + add } : x
        );
        return {
          ok: true,
          nextAssets: next,
          transaction: {
            ...t,
            assetName: dep.name,
          },
        };
      }
    }
    const name = (t.assetName || '').trim();
    if (!name) {
      return {
        ok: false,
        message: 'Выберите вклад для пополнения или укажите название',
      };
    }
    return {
      ok: true,
      nextAssets: assets,
      transaction: t,
    };
  }

  return { ok: true, nextAssets: assets, transaction: t };
}
