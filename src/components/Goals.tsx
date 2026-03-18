import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Target,
  Trash2,
  Calendar
} from 'lucide-react';
import { useStore } from '../store';
import { Goal, CURRENCIES } from '../types';
import { 
  formatCurrency, 
  calculateMonthlyContribution,
  daysUntil,
  formatFullDate
} from '../utils';

const GOAL_COLORS = [
  '#007AFF',
  '#34C759', 
  '#FF9500',
  '#FF3B30',
  '#AF52DE',
  '#5856D6',
];

export function Goals() {
  const { goals, addGoal, deleteGoal, addToGoal } = useStore();
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [contributeAmount, setContributeAmount] = useState('');

  const handleContribute = (goal: Goal) => {
    const amount = parseFloat(contributeAmount);
    if (amount > 0) {
      addToGoal(goal.id, amount);
      setContributeAmount('');
      setSelectedGoal(null);
    }
  };

  return (
    <div className="pb-24 px-4 pt-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Цели</h2>
        <button
          onClick={() => setShowAddGoal(true)}
          className="flex items-center gap-1 text-primary text-sm font-medium"
        >
          <Plus size={18} />
          Добавить
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <Target size={28} />
          </div>
          <div className="empty-title">Нет целей</div>
          <div className="empty-text">
            Создайте цель накопления и отслеживайте прогресс
          </div>
          <button 
            className="btn btn-primary mt-4"
            onClick={() => setShowAddGoal(true)}
          >
            <Plus size={18} />
            Создать цель
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {goals.map((goal) => {
            const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
            const monthly = calculateMonthlyContribution(
              goal.targetAmount,
              goal.currentAmount,
              goal.deadline
            );
            const days = daysUntil(goal.deadline);
            const isCompleted = goal.currentAmount >= goal.targetAmount;

            return (
              <motion.div
                key={goal.id}
                layout
                className="card"
                onClick={() => setSelectedGoal(goal)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: goal.color + '20' }}
                    >
                      <Target size={20} style={{ color: goal.color }} />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{goal.name}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <Calendar size={10} />
                        {days > 0 ? `${days} дней осталось` : 'Срок истёк'}
                      </div>
                    </div>
                  </div>
                  <span 
                    className="text-sm font-bold"
                    style={{ color: goal.color }}
                  >
                    {progress.toFixed(0)}%
                  </span>
                </div>

                <div className="progress-track mb-3">
                  <motion.div
                    className="progress-fill"
                    style={{ backgroundColor: goal.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    {formatCurrency(goal.currentAmount, goal.currency)}
                    <span className="text-gray-400"> / </span>
                    {formatCurrency(goal.targetAmount, goal.currency)}
                  </span>
                  {!isCompleted && days > 0 && (
                    <span className="text-gray-500">
                      {formatCurrency(monthly, goal.currency)}/мес
                    </span>
                  )}
                  {isCompleted && (
                    <span className="text-success font-medium">Достигнуто!</span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add Goal Modal */}
      <AddGoalModal
        isOpen={showAddGoal}
        onClose={() => setShowAddGoal(false)}
        onAdd={addGoal}
      />

      {/* Goal Detail Modal */}
      <AnimatePresence>
        {selectedGoal && (
          <>
            <motion.div
              className="modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedGoal(null)}
            />
            <motion.div
              className="modal-sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <div className="modal-header">
                <button onClick={() => setSelectedGoal(null)} className="text-primary">
                  Закрыть
                </button>
                <span className="modal-title">{selectedGoal.name}</span>
                <div style={{ width: 60 }} />
              </div>
              
              <div className="modal-body">
                <div className="text-center mb-6">
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3"
                    style={{ backgroundColor: selectedGoal.color + '20' }}
                  >
                    <Target size={32} style={{ color: selectedGoal.color }} />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(selectedGoal.currentAmount, selectedGoal.currency)}
                  </div>
                  <div className="text-gray-500">
                    из {formatCurrency(selectedGoal.targetAmount, selectedGoal.currency)}
                  </div>
                </div>

                <div className="progress-track mb-6" style={{ height: 8 }}>
                  <div
                    className="progress-fill"
                    style={{ 
                      backgroundColor: selectedGoal.color,
                      width: `${Math.min((selectedGoal.currentAmount / selectedGoal.targetAmount) * 100, 100)}%`
                    }}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Пополнить</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      className="input flex-1"
                      placeholder="Сумма"
                      value={contributeAmount}
                      onChange={(e) => setContributeAmount(e.target.value)}
                    />
                    <button
                      className="btn btn-primary"
                      onClick={() => handleContribute(selectedGoal)}
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>

                <div className="card bg-gray-50 mb-4">
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Срок</span>
                    <span className="font-medium">{formatFullDate(selectedGoal.deadline)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Осталось дней</span>
                    <span className="font-medium">{Math.max(0, daysUntil(selectedGoal.deadline))}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Нужно в месяц</span>
                    <span className="font-medium">
                      {formatCurrency(
                        calculateMonthlyContribution(
                          selectedGoal.targetAmount,
                          selectedGoal.currentAmount,
                          selectedGoal.deadline
                        ),
                        selectedGoal.currency
                      )}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    deleteGoal(selectedGoal.id);
                    setSelectedGoal(null);
                  }}
                  className="btn w-full bg-red-50 text-danger"
                >
                  <Trash2 size={18} />
                  Удалить цель
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Add Goal Modal
function AddGoalModal({ 
  isOpen, 
  onClose, 
  onAdd 
}: { 
  isOpen: boolean; 
  onClose: () => void;
  onAdd: (goal: Omit<Goal, 'id' | 'createdAt'>) => void;
}) {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [color, setColor] = useState(GOAL_COLORS[0]);

  const handleSubmit = () => {
    if (!name || !targetAmount || !deadline) return;
    
    onAdd({
      name,
      targetAmount: parseFloat(targetAmount),
      currentAmount: currentAmount ? parseFloat(currentAmount) : 0,
      deadline,
      currency,
      color,
    });
    
    // Reset
    setName('');
    setTargetAmount('');
    setCurrentAmount('');
    setDeadline('');
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
              <span className="modal-title">Новая цель</span>
              <button onClick={handleSubmit} className="text-primary font-semibold">
                Создать
              </button>
            </div>
            
            <div className="modal-body">
              <div className="input-group">
                <label className="input-label">Название</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Например: Отпуск"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="input-group">
                  <label className="input-label">Целевая сумма</label>
                  <input
                    type="number"
                    className="input"
                    placeholder="100000"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Уже накоплено</label>
                  <input
                    type="number"
                    className="input"
                    placeholder="0"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="input-group">
                  <label className="input-label">Срок</label>
                  <input
                    type="date"
                    className="input"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
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
                <label className="input-label">Цвет</label>
                <div className="flex gap-3">
                  {GOAL_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-10 h-10 rounded-full transition-transform ${
                        color === c ? 'scale-110 ring-2 ring-offset-2 ring-gray-300' : ''
                      }`}
                      style={{ 
                        backgroundColor: c
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
