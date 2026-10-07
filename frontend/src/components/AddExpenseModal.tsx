import React, { useState } from 'react';
import { X, Plus, Sparkles, Check, AlertCircle } from 'lucide-react';
import { api } from '../lib/api';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdded: () => void;
  onTriggerImpulseGuard: (data: { merchant: string; amount: number; category: string; reasons: string[] }, executeSave: () => Promise<void>) => void;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  onAdded,
  onTriggerImpulseGuard,
}) => {
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState(() => {
    const d = new Date();
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  });
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [location, setLocation] = useState('Bengaluru');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmt = parseFloat(amount);
    if (!merchant.trim() || isNaN(numAmt) || numAmt <= 0) return;

    setLoading(true);
    try {
      // 1. Check Emotional Spending Guard before saving
      const guardCheck = await api.checkGuard({
        merchant,
        amount: numAmt,
        category,
        time,
      });

      const executeSave = async () => {
        await api.createExpense({
          merchant,
          amount: numAmt,
          category,
          date,
          time,
          payment_method: paymentMethod,
          location,
          notes,
        });
        onAdded();
        onClose();
      };

      if (guardCheck.triggered) {
        setLoading(false);
        onTriggerImpulseGuard(
          {
            merchant,
            amount: numAmt,
            category,
            reasons: guardCheck.reasons,
          },
          executeSave
        );
        return;
      }

      await executeSave();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['Food', 'Travel', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Education', 'Other'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-[#121620] w-full max-w-lg rounded-[28px] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/60 dark:bg-slate-900/40">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Record Transaction</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Merchant Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Swiggy, Amazon, Third Wave Coffee"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              className="w-full text-xs p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Amount (INR ₹)
              </label>
              <input
                type="number"
                step="any"
                required
                placeholder="₹ Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full text-xs p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Time (HH:MM)
              </label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full text-xs p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full text-xs p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="UPI">UPI (Google Pay / PhonePe)</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Net Banking">Net Banking</option>
                <option value="Cash">Cash</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                City / Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full text-xs p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Dinner with team"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-md flex items-center justify-center gap-1.5 mt-2"
          >
            <Plus className="w-4 h-4" />
            <span>{loading ? 'Evaluating Risk Pipeline...' : 'Add Expense & Scan Immunity'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
