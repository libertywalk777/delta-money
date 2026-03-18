import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  ArrowUpRight, 
  ArrowDownRight,
  Wallet,
  ChevronRight
} from 'lucide-react';
import { useStore } from '../store';
import { 
  formatCurrency, 
  calculateTotalPortfolioValue, 
  calculateTotalInvested,
  calculateMonthlyContribution,
  formatDate 
} from '../utils';

export function Dashboard() {
  const { assets, transactions, goals, displayCurrency, currencyRates } = useStore();
  
  const totalValue = calculateTotalPortfolioValue(assets, currencyRates, displayCurrency);
  const totalInvested = calculateTotalInvested(assets, currencyRates, displayCurrency);
  const totalProfit = totalValue - totalInvested;
  const profitPercent = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;
  
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);
  
  const activeGoals = goals
    .filter(g => g.currentAmount < g.targetAmount)
    .slice(0, 3);

  const isEmpty = assets.length === 0 && goals.length === 0;

  return (
    <div className="pb-24 px-4 pt-4">
      {/* Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card mb-4"
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-gray-500">Общий баланс</span>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Wallet size={12} />
            <span>{assets.length} активов</span>
          </div>
        </div>
        
        <div className="text-3xl font-bold text-gray-900 mb-3">
          {formatCurrency(totalValue, displayCurrency)}
        </div>
        
        {totalInvested > 0 && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              {totalProfit >= 0 ? (
                <div className="flex items-center text-success text-sm font-medium">
                  <TrendingUp size={14} />
                  <span>+{formatCurrency(totalProfit, displayCurrency)}</span>
                </div>
              ) : (
                <div className="flex items-center text-danger text-sm font-medium">
                  <TrendingDown size={14} />
                  <span>{formatCurrency(totalProfit, displayCurrency)}</span>
                </div>
              )}
            </div>
            <span className={`text-sm font-medium ${totalProfit >= 0 ? 'text-success' : 'text-danger'}`}>
              {totalProfit >= 0 ? '+' : ''}{profitPercent.toFixed(2)}%
            </span>
          </div>
        )}
      </motion.div>

      {/* Stats Row */}
      {assets.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-3 mb-4"
        >
          <div className="card">
            <div className="text-xs text-gray-500 mb-1">Инвестировано</div>
            <div className="text-lg font-semibold text-gray-900">
              {formatCurrency(totalInvested, displayCurrency, true)}
            </div>
          </div>
          <div className="card">
            <div className="text-xs text-gray-500 mb-1">Доходность</div>
            <div className={`text-lg font-semibold ${profitPercent >= 0 ? 'text-success' : 'text-danger'}`}>
              {profitPercent >= 0 ? '+' : ''}{profitPercent.toFixed(1)}%
            </div>
          </div>
        </motion.div>
      )}

      {/* Empty State */}
      {isEmpty && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="empty-state"
        >
          <div className="empty-icon">
            <Wallet size={28} />
          </div>
          <div className="empty-title">Начните отслеживать</div>
          <div className="empty-text">
            Добавьте первый актив или цель, чтобы начать управлять своими инвестициями
          </div>
        </motion.div>
      )}

      {/* Goals */}
      {activeGoals.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-4"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">Цели</h3>
            <span className="text-xs text-gray-400">{goals.length} всего</span>
          </div>
          
          <div className="space-y-2">
            {activeGoals.map((goal) => {
              const progress = (goal.currentAmount / goal.targetAmount) * 100;
              const monthly = calculateMonthlyContribution(
                goal.targetAmount,
                goal.currentAmount,
                goal.deadline
              );
              
              return (
                <div key={goal.id} className="card">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: goal.color + '20' }}
                      >
                        <Target size={16} style={{ color: goal.color }} />
                      </div>
                      <span className="font-medium text-gray-900">{goal.name}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {progress.toFixed(0)}%
                    </span>
                  </div>
                  
                  <div className="progress-track mb-2">
                    <motion.div
                      className="progress-fill"
                      style={{ backgroundColor: goal.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(progress, 100)}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>
                      {formatCurrency(goal.currentAmount, goal.currency)} из {formatCurrency(goal.targetAmount, goal.currency)}
                    </span>
                    <span>{formatCurrency(monthly, goal.currency)}/мес</span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Recent Transactions */}
      {recentTransactions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">Последние операции</h3>
            <ChevronRight size={16} className="text-gray-400" />
          </div>
          
          <div className="list-group">
            {recentTransactions.map((tx) => (
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
                
                <div className={`text-sm font-medium ${
                  tx.type === 'sell' ? 'text-success' : 'text-gray-900'
                }`}>
                  {tx.type === 'sell' ? '+' : '-'}
                  {formatCurrency(tx.amount * (tx.price || 1), tx.currency)}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
