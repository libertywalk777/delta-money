import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  PieChart,
  BarChart3
} from 'lucide-react';
import { useStore } from '../store';
import { 
  formatCurrency, 
  calculateTotalPortfolioValue,
  calculateTotalInvested,
  convertCurrency
} from '../utils';

export function Analytics() {
  const { assets, displayCurrency, currencyRates } = useStore();
  
  const totalValue = calculateTotalPortfolioValue(assets, currencyRates, displayCurrency);
  const totalInvested = calculateTotalInvested(assets, currencyRates, displayCurrency);
  const totalProfit = totalValue - totalInvested;
  const profitPercent = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

  // Distribution by type
  const stocksValue = assets
    .filter(a => a.type === 'stock')
    .reduce((sum, a) => {
      const qty = a.quantity || 0;
      const price = a.currentPrice || a.buyPrice || 0;
      return sum + convertCurrency(qty * price, a.currency, displayCurrency, currencyRates);
    }, 0);
  
  const depositsValue = assets
    .filter(a => a.type === 'deposit')
    .reduce((sum, a) => {
      return sum + convertCurrency(a.amount || 0, a.currency, displayCurrency, currencyRates);
    }, 0);

  const typeDistribution = [
    { name: 'Акции', value: stocksValue, color: '#007AFF', percent: totalValue > 0 ? (stocksValue / totalValue) * 100 : 0 },
    { name: 'Депозиты', value: depositsValue, color: '#34C759', percent: totalValue > 0 ? (depositsValue / totalValue) * 100 : 0 },
  ].filter(d => d.value > 0);

  // Distribution by currency
  const currencyGroups: Record<string, number> = {};
  assets.forEach(asset => {
    let value = 0;
    if (asset.type === 'stock') {
      const qty = asset.quantity || 0;
      const price = asset.currentPrice || asset.buyPrice || 0;
      value = qty * price;
    } else {
      value = asset.amount || 0;
    }
    const inDisplay = convertCurrency(value, asset.currency, displayCurrency, currencyRates);
    currencyGroups[asset.currency] = (currencyGroups[asset.currency] || 0) + inDisplay;
  });

  const currencyColors: Record<string, string> = {
    USD: '#007AFF',
    EUR: '#5856D6',
    RUB: '#FF9500',
    UZS: '#34C759',
  };

  const currencyDistribution = Object.entries(currencyGroups).map(([currency, value]) => ({
    currency,
    value,
    color: currencyColors[currency] || '#8E8E93',
    percent: totalValue > 0 ? (value / totalValue) * 100 : 0,
  }));

  if (assets.length === 0) {
    return (
      <div className="pb-24 px-4 pt-4">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Аналитика</h2>
        <div className="empty-state">
          <div className="empty-icon">
            <BarChart3 size={28} />
          </div>
          <div className="empty-title">Нет данных</div>
          <div className="empty-text">
            Добавьте активы, чтобы увидеть аналитику
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 px-4 pt-4">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Аналитика</h2>

      {/* Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card mb-4"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            totalProfit >= 0 ? 'bg-green-50' : 'bg-red-50'
          }`}>
            <TrendingUp size={20} className={totalProfit >= 0 ? 'text-success' : 'text-danger'} />
          </div>
          <div>
            <div className="text-sm text-gray-500">Общая доходность</div>
            <div className={`text-xl font-bold ${totalProfit >= 0 ? 'text-success' : 'text-danger'}`}>
              {totalProfit >= 0 ? '+' : ''}{profitPercent.toFixed(2)}%
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-100">
          <div>
            <div className="text-xs text-gray-500 mb-1">Инвестировано</div>
            <div className="font-semibold text-gray-900">
              {formatCurrency(totalInvested, displayCurrency)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Прибыль/Убыток</div>
            <div className={`font-semibold ${totalProfit >= 0 ? 'text-success' : 'text-danger'}`}>
              {totalProfit >= 0 ? '+' : ''}{formatCurrency(totalProfit, displayCurrency)}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Type Distribution */}
      {typeDistribution.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card mb-4"
        >
          <div className="flex items-center gap-2 mb-4">
            <PieChart size={18} className="text-gray-500" />
            <span className="font-semibold text-gray-900">По типу активов</span>
          </div>
          
          <div className="space-y-3">
            {typeDistribution.map((item) => (
              <div key={item.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-700">{item.name}</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency(item.value, displayCurrency)}
                  </span>
                </div>
                <div className="progress-track">
                  <motion.div
                    className="progress-fill"
                    style={{ backgroundColor: item.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${item.percent}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1">{item.percent.toFixed(1)}%</div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Currency Distribution */}
      {currencyDistribution.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={18} className="text-gray-500" />
            <span className="font-semibold text-gray-900">По валютам</span>
          </div>
          
          <div className="space-y-3">
            {currencyDistribution.map((item) => (
              <div key={item.currency}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-700">{item.currency}</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency(item.value, displayCurrency)}
                  </span>
                </div>
                <div className="progress-track">
                  <motion.div
                    className="progress-fill"
                    style={{ backgroundColor: item.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${item.percent}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1">{item.percent.toFixed(1)}%</div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
