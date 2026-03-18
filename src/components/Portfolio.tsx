import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  
  const stocks = assets.filter(a => a.type === 'stock');
  const deposits = assets.filter(a => a.type === 'deposit');
  
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="pb-24 px-4 pt-4">
      {/* Segment Control */}
      <div className="segment-control mb-4">
        <button
          className={`segment-btn ${tab === 'stocks' ? 'active' : ''}`}
          onClick={() => setTab('stocks')}
        >
          Акции ({stocks.length})
        </button>
        <button
          className={`segment-btn ${tab === 'deposits' ? 'active' : ''}`}
          onClick={() => setTab('deposits')}
        >
          Депозиты ({deposits.length})
        </button>
        <button
          className={`segment-btn ${tab === 'history' ? 'active' : ''}`}
          onClick={() => setTab('history')}
        >
          История
        </button>
      </div>

      {/* Stocks Tab */}
      {tab === 'stocks' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
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
              {stocks.map((asset) => {
                const profit = calculateAssetProfit(asset);
                const value = (asset.quantity || 0) * (asset.currentPrice || asset.buyPrice || 0);
                const valueConverted = convertCurrency(value, asset.currency, displayCurrency, currencyRates);
                
                return (
                  <motion.div
                    key={asset.id}
                    layout
                    className="card"
                    onClick={() => setEditingAsset(asset)}
                  >
                    <div className="flex items-center justify-between mb-2">
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
                        <div className={`text-xs font-medium ${profit.percent >= 0 ? 'text-success' : 'text-danger'}`}>
                          {profit.percent >= 0 ? '+' : ''}{profit.percent.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{asset.quantity} шт × {formatCurrency(asset.currentPrice || asset.buyPrice || 0, asset.currency)}</span>
                      <span className={profit.amount >= 0 ? 'text-success' : 'text-danger'}>
                        {profit.amount >= 0 ? '+' : ''}{formatCurrency(profit.amount, asset.currency)}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
              
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

      {/* Deposits Tab */}
      {tab === 'deposits' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
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

      {/* History Tab */}
      {tab === 'history' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {sortedTransactions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <Clock size={28} />
              </div>
              <div className="empty-title">Нет операций</div>
              <div className="empty-text">История транзакций пуста</div>
              <button 
                className="btn btn-primary mt-4"
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
              className="btn btn-secondary w-full mt-4"
              onClick={() => setShowAddTransaction(true)}
            >
              <Plus size={18} />
              Добавить операцию
            </button>
          )}
        </motion.div>
      )}

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
        onClose={() => setShowAddTransaction(false)}
        onAdd={addTransaction}
        assets={assets}
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
  assets 
}: { 
  isOpen: boolean; 
  onClose: () => void;
  onAdd: (tx: Omit<Transaction, 'id'>) => void;
  assets: Asset[];
}) {
  const [type, setType] = useState<'buy' | 'sell' | 'deposit'>('buy');
  const [assetId, setAssetId] = useState('');
  const [assetName, setAssetName] = useState('');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [currency, setCurrency] = useState('USD');
  const [comment, setComment] = useState('');

  const handleSubmit = () => {
    if (!assetName || !amount) return;
    
    onAdd({
      assetId: assetId || undefined,
      assetName,
      type,
      amount: parseFloat(amount),
      price: price ? parseFloat(price) : undefined,
      currency,
      date,
      comment: comment || undefined,
    });
    
    // Reset
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

              {assets.length > 0 && (
                <div className="input-group">
                  <label className="input-label">Выбрать актив</label>
                  <select
                    className="select"
                    value={assetId}
                    onChange={(e) => {
                      setAssetId(e.target.value);
                      const asset = assets.find(a => a.id === e.target.value);
                      if (asset) {
                        setAssetName(asset.name);
                        setCurrency(asset.currency);
                      }
                    }}
                  >
                    <option value="">Другой актив</option>
                    {assets.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.ticker || a.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {!assetId && (
                <div className="input-group">
                  <label className="input-label">Название актива</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="AAPL, Bitcoin, и т.д."
                    value={assetName}
                    onChange={(e) => setAssetName(e.target.value)}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="input-group">
                  <label className="input-label">Количество</label>
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
