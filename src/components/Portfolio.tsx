import { useState, useRef, useLayoutEffect, useEffect } from 'react';
import {
  motion,
  AnimatePresence,
  useMotionValue,
  animate,
  type PanInfo,
} from 'framer-motion';
import { 
  Plus, 
  Landmark, 
  BarChart3,
  Clock,
  Trash2,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { useStore } from '../store';
import { Asset, Transaction, CURRENCIES } from '../types';
import { 
  formatCurrency, 
  formatDate, 
  calculateAssetProfit,
  convertCurrency,
  daysUntil
} from '../utils';

type Tab = 'stocks' | 'deposits' | 'history';

type TxPrefill = { asset: Asset; operation: 'buy' | 'sell' };

function SwipeStockRow({
  asset,
  displayCurrency,
  currencyRates,
  swipeOpen,
  onSwipeOpen,
  onSwipeClose,
  onEdit,
  onBuy,
  onSell,
}: {
  asset: Asset;
  displayCurrency: string;
  currencyRates: Record<string, number>;
  swipeOpen: boolean;
  onSwipeOpen: () => void;
  onSwipeClose: () => void;
  onEdit: () => void;
  onBuy: () => void;
  onSell: () => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [maxDrag, setMaxDrag] = useState(0);
  const x = useMotionValue(0);
  const dragMoved = useRef(false);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => {
      const w = el.offsetWidth;
      setMaxDrag(Math.max(w * 0.3, 88));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!swipeOpen && x.get() < -4) {
      animate(x, 0, { type: 'spring', stiffness: 420, damping: 38 });
    }
  }, [swipeOpen, x]);

  const profit = calculateAssetProfit(asset);
  const value =
    (asset.quantity || 0) * (asset.currentPrice || asset.buyPrice || 0);
  const valueConverted = convertCurrency(
    value,
    asset.currency,
    displayCurrency,
    currencyRates
  );

  const closeSwipe = () => {
    animate(x, 0, { type: 'spring', stiffness: 420, damping: 38 });
    onSwipeClose();
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const openX = -maxDrag;
    if (maxDrag <= 0) return;
    const threshold = openX * 0.38;
    if (info.offset.x < threshold || info.velocity.x < -160) {
      animate(x, openX, { type: 'spring', stiffness: 380, damping: 34 });
      onSwipeOpen();
    } else {
      animate(x, 0, { type: 'spring', stiffness: 380, damping: 34 });
      onSwipeClose();
    }
  };

  return (
    <div
      ref={wrapRef}
      className="relative overflow-hidden rounded-xl bg-[#E8E8ED]"
    >
      <div
        className="absolute inset-y-0 right-0 z-0 flex w-[31%] min-w-[5.75rem] flex-col justify-center gap-2 pr-1.5"
        aria-hidden
      >
        <button
          type="button"
          className="swipe-action-btn swipe-action-btn--buy"
          onClick={(e) => {
            e.stopPropagation();
            closeSwipe();
            onBuy();
          }}
        >
          <span className="swipe-action-btn__icon">
            <ArrowDownRight size={17} strokeWidth={2.25} />
          </span>
          <span className="swipe-action-btn__label">Купить</span>
        </button>
        <button
          type="button"
          className="swipe-action-btn swipe-action-btn--sell"
          onClick={(e) => {
            e.stopPropagation();
            closeSwipe();
            onSell();
          }}
        >
          <span className="swipe-action-btn__icon">
            <ArrowUpRight size={17} strokeWidth={2.25} />
          </span>
          <span className="swipe-action-btn__label">Продать</span>
        </button>
      </div>
      <motion.div
        style={{ x, touchAction: 'pan-y' }}
        drag="x"
        dragConstraints={
          maxDrag > 0 ? { left: -maxDrag, right: 0 } : { left: 0, right: 0 }
        }
        dragElastic={{ left: 0.06, right: 0.18 }}
        onDragStart={() => {
          dragMoved.current = false;
        }}
        onDrag={(_, info) => {
          if (Math.abs(info.delta.x) > 2) dragMoved.current = true;
        }}
        onDragEnd={handleDragEnd}
        onClick={() => {
          if (dragMoved.current) {
            dragMoved.current = false;
            return;
          }
          if (x.get() < -maxDrag * 0.35) {
            closeSwipe();
            return;
          }
          onEdit();
        }}
        className="card relative z-10 cursor-grab shadow-[0_1px_4px_rgba(0,0,0,0.06)] active:cursor-grabbing"
      >
        <div className="mb-2 flex items-center justify-between">
          <div>
            <div className="font-semibold text-gray-900">
              {asset.ticker || asset.name}
            </div>
            {asset.ticker && (
              <div className="text-xs text-gray-500">{asset.name}</div>
            )}
          </div>
          <div className="text-right">
            <div className="font-semibold text-gray-900">
              {formatCurrency(valueConverted, displayCurrency)}
            </div>
            <div
              className={`text-xs font-medium ${profit.percent >= 0 ? 'text-success' : 'text-danger'}`}
            >
              {profit.percent >= 0 ? '+' : ''}
              {profit.percent.toFixed(2)}%
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            {asset.quantity} шт ×{' '}
            {formatCurrency(
              asset.currentPrice || asset.buyPrice || 0,
              asset.currency
            )}
          </span>
          <span
            className={
              profit.amount >= 0 ? 'text-success' : 'text-danger'
            }
          >
            {profit.amount >= 0 ? '+' : ''}
            {formatCurrency(profit.amount, asset.currency)}
          </span>
        </div>
      </motion.div>
    </div>
  );
}

export function Portfolio() {
  const { 
    assets, 
    transactions, 
    displayCurrency, 
    currencyRates,
    addAsset, 
    updateAsset, 
    deleteAsset,
    addTransaction,
    deleteTransaction
  } = useStore();
  
  const [tab, setTab] = useState<Tab>('stocks');
  const [showAddAsset, setShowAddAsset] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [txPrefill, setTxPrefill] = useState<TxPrefill | null>(null);
  const [openSwipeAssetId, setOpenSwipeAssetId] = useState<string | null>(
    null
  );
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  
  const stocks = assets.filter(a => a.type === 'stock');
  const deposits = assets.filter(a => a.type === 'deposit');
  
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const tabTransition = {
    duration: 0.42,
    ease: [0.16, 1, 0.3, 1] as const,
  };

  return (
    <div className="pb-24 px-4 pt-4">
      {/* Segment Control — скользящий pill + скругление */}
      <div className="segment-control segment-control--smooth mb-4">
        {(
          [
            { id: 'stocks' as const, label: `Акции (${stocks.length})` },
            { id: 'deposits' as const, label: `Депозиты (${deposits.length})` },
            { id: 'history' as const, label: 'История' },
          ] as const
        ).map(({ id, label }) => (
          <button
            key={id}
            type="button"
            className={`segment-btn ${tab === id ? 'segment-btn--on active' : 'segment-btn--off'}`}
            onClick={() => setTab(id)}
          >
            {tab === id && (
              <motion.div
                layoutId="portfolio-segment-pill"
                className="absolute inset-[3px] rounded-[11px] bg-white shadow-[0_2px_10px_rgba(0,0,0,0.07)]"
                transition={{
                  type: 'spring',
                  stiffness: 420,
                  damping: 34,
                  mass: 0.72,
                }}
              />
            )}
            <span className="relative z-[1]">{label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'stocks' && (
        <motion.div
          key="stocks"
          role="tabpanel"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={tabTransition}
        >
          {stocks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <BarChart3 size={28} />
              </div>
              <div className="empty-title">Нет акций</div>
              <div className="empty-text">Добавьте первую акцию или ETF</div>
              <button 
                className="btn btn-primary btn-pill mt-4"
                onClick={() => setShowAddAsset(true)}
              >
                <Plus size={18} />
                Добавить актив
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {stocks.map((asset) => (
                <SwipeStockRow
                  key={asset.id}
                  asset={asset}
                  displayCurrency={displayCurrency}
                  currencyRates={currencyRates}
                  swipeOpen={openSwipeAssetId === asset.id}
                  onSwipeOpen={() => setOpenSwipeAssetId(asset.id)}
                  onSwipeClose={() =>
                    setOpenSwipeAssetId((id) =>
                      id === asset.id ? null : id
                    )
                  }
                  onEdit={() => setEditingAsset(asset)}
                  onBuy={() => {
                    setTxPrefill({ asset, operation: 'buy' });
                    setShowAddTransaction(true);
                  }}
                  onSell={() => {
                    setTxPrefill({ asset, operation: 'sell' });
                    setShowAddTransaction(true);
                  }}
                />
              ))}
              
              <button 
                className="btn btn-secondary w-full"
                onClick={() => setShowAddAsset(true)}
              >
                <Plus size={18} />
                Добавить актив
              </button>
            </div>
          )}
        </motion.div>
        )}

      {tab === 'deposits' && (
        <motion.div
          key="deposits"
          role="tabpanel"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={tabTransition}
        >
          {deposits.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <Landmark size={28} />
              </div>
              <div className="empty-title">Нет депозитов</div>
              <div className="empty-text">Добавьте первый вклад</div>
              <button 
                className="btn btn-primary btn-pill mt-4"
                onClick={() => setShowAddAsset(true)}
              >
                <Plus size={18} />
                Добавить депозит
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {deposits.map((asset) => {
                const days = asset.endDate ? daysUntil(asset.endDate) : 0;
                const valueConverted = convertCurrency(asset.amount || 0, asset.currency, displayCurrency, currencyRates);
                
                return (
                  <motion.div
                    key={asset.id}
                    layout
                    className="card"
                    onClick={() => setEditingAsset(asset)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                          <Landmark size={20} className="text-primary" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{asset.name}</div>
                          {asset.rate && (
                            <div className="text-xs text-success">{asset.rate}% годовых</div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">
                          {formatCurrency(valueConverted, displayCurrency)}
                        </div>
                        {days > 0 && (
                          <div className="text-xs text-gray-500 flex items-center gap-1 justify-end">
                            <Clock size={10} />
                            {days} дн.
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              
              <button 
                className="btn btn-secondary w-full"
                onClick={() => setShowAddAsset(true)}
              >
                <Plus size={18} />
                Добавить депозит
              </button>
            </div>
          )}
        </motion.div>
        )}

      {tab === 'history' && (
        <motion.div
          key="history"
          role="tabpanel"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={tabTransition}
        >
          {sortedTransactions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <Clock size={28} />
              </div>
              <div className="empty-title">Нет операций</div>
              <div className="empty-text">История транзакций пуста</div>
              <button 
                className="btn btn-primary btn-pill mt-4"
                onClick={() => setShowAddTransaction(true)}
              >
                <Plus size={18} />
                Добавить операцию
              </button>
            </div>
          ) : (
            <div className="list-group">
              {sortedTransactions.map((tx) => (
                <div key={tx.id} className="list-item">
                  <div 
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      tx.type === 'buy' ? 'bg-green-50' : 
                      tx.type === 'sell' ? 'bg-red-50' : 'bg-blue-50'
                    }`}
                  >
                    {tx.type === 'buy' ? (
                      <ArrowDownRight size={16} className="text-success" />
                    ) : tx.type === 'sell' ? (
                      <ArrowUpRight size={16} className="text-danger" />
                    ) : (
                      <ArrowDownRight size={16} className="text-primary" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {tx.assetName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {tx.type === 'buy' ? 'Покупка' : tx.type === 'sell' ? 'Продажа' : 'Пополнение'}
                      {' · '}
                      {formatDate(tx.date)}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${
                      tx.type === 'sell' ? 'text-success' : 'text-gray-900'
                    }`}>
                      {tx.type === 'sell' ? '+' : '-'}
                      {formatCurrency(tx.amount * (tx.price || 1), tx.currency)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteTransaction(tx.id);
                      }}
                      className="p-1 text-gray-400 hover:text-danger"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {sortedTransactions.length > 0 && (
            <button 
              className="btn btn-secondary btn-pill w-full mt-4"
              onClick={() => setShowAddTransaction(true)}
            >
              <Plus size={18} />
              Добавить операцию
            </button>
          )}
        </motion.div>
        )}
      </AnimatePresence>

      {/* Add Asset Modal */}
      <AddAssetModal
        isOpen={showAddAsset}
        onClose={() => setShowAddAsset(false)}
        onAdd={addAsset}
        type={tab === 'deposits' ? 'deposit' : 'stock'}
      />

      {/* Edit Asset Modal */}
      <EditAssetModal
        asset={editingAsset}
        onClose={() => setEditingAsset(null)}
        onUpdate={updateAsset}
        onDelete={deleteAsset}
      />

      {/* Add Transaction Modal */}
      <AddTransactionModal
        isOpen={showAddTransaction}
        onClose={() => {
          setShowAddTransaction(false);
          setTxPrefill(null);
        }}
        onAdd={addTransaction}
        assets={assets}
        prefillStock={txPrefill}
      />
    </div>
  );
}

// Add Asset Modal
function AddAssetModal({ 
  isOpen, 
  onClose, 
  onAdd,
  type 
}: { 
  isOpen: boolean; 
  onClose: () => void;
  onAdd: (asset: Omit<Asset, 'id' | 'createdAt'>) => void;
  type: 'stock' | 'deposit';
}) {
  const [name, setName] = useState('');
  const [ticker, setTicker] = useState('');
  const [quantity, setQuantity] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');
  const [amount, setAmount] = useState('');
  const [rate, setRate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currency, setCurrency] = useState('USD');

  const handleSubmit = () => {
    if (type === 'stock') {
      if (!name || !quantity || !buyPrice) return;
      onAdd({
        type: 'stock',
        name,
        ticker: ticker || undefined,
        quantity: parseFloat(quantity),
        buyPrice: parseFloat(buyPrice),
        currentPrice: currentPrice ? parseFloat(currentPrice) : parseFloat(buyPrice),
        currency,
      });
    } else {
      if (!name || !amount) return;
      onAdd({
        type: 'deposit',
        name,
        amount: parseFloat(amount),
        rate: rate ? parseFloat(rate) : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        currency,
      });
    }
    
    // Reset form
    setName('');
    setTicker('');
    setQuantity('');
    setBuyPrice('');
    setCurrentPrice('');
    setAmount('');
    setRate('');
    setStartDate('');
    setEndDate('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="modal-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="modal-header">
              <button onClick={onClose} className="text-primary">
                Отмена
              </button>
              <span className="modal-title">
                {type === 'stock' ? 'Новый актив' : 'Новый депозит'}
              </span>
              <button onClick={handleSubmit} className="text-primary font-semibold">
                Готово
              </button>
            </div>
            
            <div className="modal-body">
              <div className="input-group">
                <label className="input-label">Название</label>
                <input
                  type="text"
                  className="input"
                  placeholder={type === 'stock' ? 'Apple Inc.' : 'Сбербанк'}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              {type === 'stock' && (
                <>
                  <div className="input-group">
                    <label className="input-label">Тикер</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="AAPL"
                      value={ticker}
                      onChange={(e) => setTicker(e.target.value.toUpperCase())}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="input-group">
                      <label className="input-label">Количество</label>
                      <input
                        type="number"
                        className="input"
                        placeholder="10"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                      />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Цена покупки</label>
                      <input
                        type="number"
                        className="input"
                        placeholder="150.00"
                        value={buyPrice}
                        onChange={(e) => setBuyPrice(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="input-group">
                    <label className="input-label">Текущая цена</label>
                    <input
                      type="number"
                      className="input"
                      placeholder="175.00"
                      value={currentPrice}
                      onChange={(e) => setCurrentPrice(e.target.value)}
                    />
                  </div>
                </>
              )}

              {type === 'deposit' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="input-group">
                      <label className="input-label">Сумма</label>
                      <input
                        type="number"
                        className="input"
                        placeholder="100000"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                      />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Ставка %</label>
                      <input
                        type="number"
                        className="input"
                        placeholder="12"
                        value={rate}
                        onChange={(e) => setRate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="input-group">
                      <label className="input-label">Дата открытия</label>
                      <input
                        type="date"
                        className="input"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Дата закрытия</label>
                      <input
                        type="date"
                        className="input"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="input-group">
                <label className="input-label">Валюта</label>
                <select
                  className="select"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.value} — {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Edit Asset Modal
function EditAssetModal({ 
  asset, 
  onClose, 
  onUpdate,
  onDelete 
}: { 
  asset: Asset | null;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Asset>) => void;
  onDelete: (id: string) => void;
}) {
  const [currentPrice, setCurrentPrice] = useState('');
  
  if (!asset) return null;
  
  const handleUpdate = () => {
    if (currentPrice) {
      onUpdate(asset.id, { currentPrice: parseFloat(currentPrice) });
    }
    onClose();
  };
  
  const handleDelete = () => {
    onDelete(asset.id);
    onClose();
  };

  return (
    <>
      <motion.div
        className="modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="modal-sheet"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        <div className="modal-header">
          <button onClick={onClose} className="text-primary">
            Закрыть
          </button>
          <span className="modal-title">{asset.name}</span>
          <button onClick={handleUpdate} className="text-primary font-semibold">
            Сохранить
          </button>
        </div>
        
        <div className="modal-body">
          {asset.type === 'stock' && (
            <div className="input-group">
              <label className="input-label">Текущая цена</label>
              <input
                type="number"
                className="input"
                placeholder={String(asset.currentPrice || asset.buyPrice || 0)}
                value={currentPrice}
                onChange={(e) => setCurrentPrice(e.target.value)}
              />
            </div>
          )}
          
          <div className="card bg-gray-50 mb-4">
            <div className="text-sm text-gray-500 mb-2">Информация</div>
            {asset.type === 'stock' && (
              <>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Количество</span>
                  <span className="font-medium">{asset.quantity} шт</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Цена покупки</span>
                  <span className="font-medium">{formatCurrency(asset.buyPrice || 0, asset.currency)}</span>
                </div>
              </>
            )}
            {asset.type === 'deposit' && (
              <>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Сумма</span>
                  <span className="font-medium">{formatCurrency(asset.amount || 0, asset.currency)}</span>
                </div>
                {asset.rate && (
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Ставка</span>
                    <span className="font-medium">{asset.rate}%</span>
                  </div>
                )}
              </>
            )}
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Валюта</span>
              <span className="font-medium">{asset.currency}</span>
            </div>
          </div>
          
          <button
            onClick={handleDelete}
            className="btn w-full bg-red-50 text-danger"
          >
            <Trash2 size={18} />
            Удалить актив
          </button>
        </div>
      </motion.div>
    </>
  );
}

// Add Transaction Modal
function AddTransactionModal({ 
  isOpen, 
  onClose, 
  onAdd,
  assets,
  prefillStock,
}: { 
  isOpen: boolean; 
  onClose: () => void;
  onAdd: (tx: Omit<Transaction, 'id'>) => void;
  assets: Asset[];
  prefillStock?: TxPrefill | null;
}) {
  const [type, setType] = useState<'buy' | 'sell' | 'deposit'>('buy');
  const [assetId, setAssetId] = useState('');
  const [assetName, setAssetName] = useState('');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [currency, setCurrency] = useState('USD');
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    if (prefillStock) {
      const a = prefillStock.asset;
      setType(prefillStock.operation);
      setAssetId(a.id);
      setAssetName(a.name);
      setCurrency(a.currency);
      const p = a.currentPrice ?? a.buyPrice;
      setPrice(p != null && p > 0 ? String(p) : '');
      setAmount('');
    } else {
      setType('buy');
      setAssetId('');
      setAssetName('');
      setAmount('');
      setPrice('');
      setDate(new Date().toISOString().split('T')[0]);
      setCurrency('USD');
      setComment('');
    }
  }, [isOpen, prefillStock]);

  const stockAssets = assets.filter((a) => a.type === 'stock');
  const depositAssets = assets.filter((a) => a.type === 'deposit');

  useEffect(() => {
    if (type === 'deposit') {
      const d = assets.find((a) => a.id === assetId);
      if (assetId && d?.type !== 'deposit') {
        setAssetId('');
        setAssetName('');
      }
    }
    if (type === 'buy' || type === 'sell') {
      const s = assets.find((a) => a.id === assetId);
      if (assetId && s?.type !== 'stock') {
        setAssetId('');
        setAssetName('');
      }
    }
  }, [type, assetId, assets]);

  const handleSubmit = () => {
    const qty = parseFloat(amount);
    if (!qty || qty <= 0) return;

    if (type === 'deposit') {
      if (!assetId) return;
      const dep = assets.find((a) => a.id === assetId && a.type === 'deposit');
      if (!dep) return;
      onAdd({
        assetId: dep.id,
        assetName: dep.name,
        type: 'deposit',
        amount: qty,
        price: 1,
        currency: dep.currency,
        date,
        comment: comment || undefined,
      });
      onClose();
      return;
    }

    if (type === 'sell') {
      if (!assetId && !assetName.trim()) return;
    }
    if (type === 'buy') {
      if (!assetId && !assetName.trim()) return;
    }

    onAdd({
      assetId: assetId || undefined,
      assetName: assetName.trim() || (assets.find((a) => a.id === assetId)?.name ?? ''),
      type,
      amount: qty,
      price: price ? parseFloat(price) : undefined,
      currency,
      date,
      comment: comment || undefined,
    });

    setType('buy');
    setAssetId('');
    setAssetName('');
    setAmount('');
    setPrice('');
    setComment('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="modal-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="modal-header">
              <button onClick={onClose} className="text-primary">
                Отмена
              </button>
              <span className="modal-title">Новая операция</span>
              <button onClick={handleSubmit} className="text-primary font-semibold">
                Готово
              </button>
            </div>
            
            <div className="modal-body">
              <p className="mb-3 rounded-xl bg-blue-50/90 px-3 py-2.5 text-xs leading-snug text-gray-700">
                Покупка и продажа <strong>меняют портфель</strong> (вкладка «Акции»), запись
                одновременно попадает в <strong>«Историю»</strong>. Пополнение увеличивает сумму
                выбранного вклада.
              </p>
              <div className="segment-control mb-4">
                <button
                  className={`segment-btn ${type === 'buy' ? 'active' : ''}`}
                  onClick={() => setType('buy')}
                >
                  Покупка
                </button>
                <button
                  className={`segment-btn ${type === 'sell' ? 'active' : ''}`}
                  onClick={() => setType('sell')}
                >
                  Продажа
                </button>
                <button
                  className={`segment-btn ${type === 'deposit' ? 'active' : ''}`}
                  onClick={() => setType('deposit')}
                >
                  Пополнение
                </button>
              </div>

              {type === 'deposit' ? (
                depositAssets.length > 0 ? (
                  <div className="input-group">
                    <label className="input-label">Вклад</label>
                    <select
                      className="select"
                      value={assetId}
                      onChange={(e) => {
                        setAssetId(e.target.value);
                        const asset = assets.find((a) => a.id === e.target.value);
                        if (asset) {
                          setAssetName(asset.name);
                          setCurrency(asset.currency);
                        }
                      }}
                    >
                      <option value="">Выберите вклад</option>
                      {depositAssets.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <p className="mb-3 text-sm text-amber-800">
                    Нет вкладов. Добавьте вклад во вкладке «Депозиты», затем пополните его здесь.
                  </p>
                )
              ) : (
                <>
                  {stockAssets.length > 0 && (
                    <div className="input-group">
                      <label className="input-label">
                        {type === 'buy'
                          ? 'Докупить к позиции'
                          : 'Позиция'}
                      </label>
                      <select
                        className="select"
                        value={assetId}
                        onChange={(e) => {
                          setAssetId(e.target.value);
                          const asset = assets.find((a) => a.id === e.target.value);
                          if (asset) {
                            setAssetName(asset.name);
                            setCurrency(asset.currency);
                          }
                        }}
                      >
                        <option value="">
                          {type === 'buy' ? 'Новый актив (другая монета)' : '— выберите —'}
                        </option>
                        {stockAssets.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.ticker || a.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {(type === 'buy' || (type === 'sell' && !assetId)) && (
                    <div className="input-group">
                      <label className="input-label">
                        {type === 'buy' ? 'Название / тикер' : 'Название актива'}
                      </label>
                      <input
                        type="text"
                        className="input"
                        placeholder="TON, AAPL, Bitcoin…"
                        value={assetName}
                        onChange={(e) => setAssetName(e.target.value)}
                      />
                    </div>
                  )}
                </>
              )}

              {type === 'deposit' ? (
                <div className="input-group">
                  <label className="input-label">Сумма пополнения</label>
                  <input
                    type="number"
                    className="input"
                    placeholder="100000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="input-group">
                    <label className="input-label">Количество, шт</label>
                    <input
                      type="number"
                      className="input"
                      placeholder="10"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Цена за единицу</label>
                    <input
                      type="number"
                      className="input"
                      placeholder="150.00"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="input-group">
                  <label className="input-label">Дата</label>
                  <input
                    type="date"
                    className="input"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Валюта</label>
                  <select
                    className="select"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.value}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Комментарий</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Опционально"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
