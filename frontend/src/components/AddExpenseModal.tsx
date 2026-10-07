import React, { useState } from 'react';
import { X, Plus, Sparkles, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../lib/api';
import { BorderBeam } from './ui/BorderBeam';
import { ShimmerButton } from './ui/ShimmerButton';

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
          merchant: merchant.trim(),
          amount: numAmt,
          category,
          date,
          time,
          payment_method: paymentMethod,
          location,
          notes,
        });
        setMerchant('');
        setAmount('');
        setNotes('');
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
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative z-10 bg-white dark:bg-navy-800 w-full max-w-lg rounded-[28px] border border-slate-200/80 dark:border-white/10 shadow-3xl overflow-hidden flex flex-col"
        >
          <BorderBeam colorFrom="#4318FF" colorTo="#00F0FF" size={240} duration={6} />

          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-gray-50/50 dark:bg-navy-900/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center shadow-md">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-navy-700 dark:text-white font-poppins">Record Transaction</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Instant telemetry logging & 7-vector immune pre-screening.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-navy-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-navy-700 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="text-xs font-bold text-navy-700 dark:text-gray-200 block mb-1">
                Merchant Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Swiggy, Amazon, Third Wave Coffee"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                className="w-full text-xs p-3.5 rounded-xl bg-lightPrimary dark:bg-navy-900 border border-gray-200 dark:border-white/10 text-navy-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/25 shadow-inner"
              />
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="text-xs font-bold text-navy-700 dark:text-gray-200 block mb-1">
                  Amount (INR ₹)
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="₹ Amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full text-xs p-3.5 rounded-xl bg-lightPrimary dark:bg-navy-900 border border-gray-200 dark:border-white/10 text-navy-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/25 shadow-inner"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-navy-700 dark:text-gray-200 block mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full text-xs p-3.5 rounded-xl bg-lightPrimary dark:bg-navy-900 border border-gray-200 dark:border-white/10 text-navy-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/25 shadow-inner font-semibold"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="text-xs font-bold text-navy-700 dark:text-gray-200 block mb-1">
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full text-xs p-3.5 rounded-xl bg-lightPrimary dark:bg-navy-900 border border-gray-200 dark:border-white/10 text-navy-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/25 shadow-inner"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-navy-700 dark:text-gray-200 block mb-1">
                  Time (HH:MM)
                </label>
                <input
                  type="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full text-xs p-3.5 rounded-xl bg-lightPrimary dark:bg-navy-900 border border-gray-200 dark:border-white/10 text-navy-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/25 shadow-inner"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="text-xs font-bold text-navy-700 dark:text-gray-200 block mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full text-xs p-3.5 rounded-xl bg-lightPrimary dark:bg-navy-900 border border-gray-200 dark:border-white/10 text-navy-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/25 shadow-inner font-semibold"
                >
                  <option value="UPI">UPI (Google Pay / PhonePe)</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Net Banking">Net Banking</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-navy-700 dark:text-gray-200 block mb-1">
                  City / Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full text-xs p-3.5 rounded-xl bg-lightPrimary dark:bg-navy-900 border border-gray-200 dark:border-white/10 text-navy-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/25 shadow-inner"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-navy-700 dark:text-gray-200 block mb-1">
                Notes (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Dinner with team"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-xs p-3.5 rounded-xl bg-lightPrimary dark:bg-navy-900 border border-gray-200 dark:border-white/10 text-navy-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/25 shadow-inner"
              />
            </div>

            <ShimmerButton
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-brand-500 hover:bg-brand-600 text-white font-black text-xs rounded-xl shadow-lg shadow-brand-500/25 mt-2 font-poppins"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Evaluating Risk Pipeline...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Add Expense & Scan Immunity</span>
                </>
              )}
            </ShimmerButton>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
