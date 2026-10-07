import React, { useState } from 'react';
import { X, Sparkles, CheckCircle2, FileImage, ArrowRight, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../lib/api';
import { BorderBeam } from './ui/BorderBeam';
import { ShimmerButton } from './ui/ShimmerButton';

interface ReceiptScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const ReceiptScanModal: React.FC<ReceiptScanModalProps> = ({ isOpen, onClose, onSaved }) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [extracted, setExtracted] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setLoading(true);
    setExtracted(null);

    try {
      const res = await api.scanReceipt(f);
      setExtracted(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!extracted) return;
    setSaving(true);
    try {
      await api.createExpense({
        merchant: extracted.merchant || 'Scanned Merchant',
        amount: parseFloat(extracted.amount) || 100,
        category: extracted.category || 'Other',
        date: extracted.date || new Date().toISOString().slice(0, 10),
        time: '12:00',
        payment_method: 'Credit Card',
        location: 'Bengaluru',
        notes: 'Scanned from receipt via Gemini Vision OCR',
      });
      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

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
          <BorderBeam colorFrom="#00F0FF" colorTo="#4318FF" size={240} duration={6} />

          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-gray-50/50 dark:bg-navy-900/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center shadow-md">
                <Sparkles className="w-5 h-5 text-brand-500" />
              </div>
              <div>
                <h3 className="text-lg font-black text-navy-700 dark:text-white font-poppins">Smart Receipt OCR</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Multimodal receipt parsing powered by Gemini Vision AI.
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

          {/* Body */}
          <div className="p-6 space-y-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Upload any physical bill or receipt image. Gemini Vision extracts merchant, total amount in INR, and auto-categorizes it into your telemetry stream.
            </p>

            {/* Upload Area */}
            <motion.label
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-brand-500 dark:hover:border-cyan-400 transition-colors bg-lightPrimary dark:bg-navy-900 shadow-inner"
            >
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              <FileImage className="w-9 h-9 text-brand-500" />
              <span className="text-xs font-bold text-navy-700 dark:text-white">
                {file ? file.name : 'Choose receipt image or drop here'}
              </span>
              <span className="text-[10px] text-gray-400">JPG, PNG, WEBP</span>
            </motion.label>

            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 rounded-2xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-900/40 text-center space-y-1 shadow-sm"
              >
                <div className="flex items-center justify-center gap-2 text-xs font-bold text-brand-600 dark:text-brand-300">
                  <RefreshCw className="w-4 h-4 animate-spin text-brand-500" />
                  <span>Analyzing visual tokens with Gemini Vision...</span>
                </div>
                <span className="text-[10px] text-gray-500">Parsing merchant headers, date stamps, and line totals</span>
              </motion.div>
            )}

            {extracted && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 space-y-3.5 shadow-md"
              >
                <div className="flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  <span className="flex items-center gap-1.5 font-poppins">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>OCR Extraction Complete ({extracted.source})</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-navy-900 border border-gray-100 dark:border-white/5">
                    <span className="text-[10px] text-gray-400 block font-semibold">Merchant</span>
                    <input
                      type="text"
                      value={extracted.merchant || ''}
                      onChange={(e) => setExtracted({ ...extracted, merchant: e.target.value })}
                      className="w-full font-bold text-navy-700 dark:text-white bg-transparent focus:outline-none"
                    />
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-navy-900 border border-gray-100 dark:border-white/5">
                    <span className="text-[10px] text-gray-400 block font-semibold">Total (₹)</span>
                    <input
                      type="number"
                      value={extracted.amount || ''}
                      onChange={(e) => setExtracted({ ...extracted, amount: e.target.value })}
                      className="w-full font-black text-emerald-600 bg-transparent focus:outline-none font-poppins"
                    />
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-navy-900 border border-gray-100 dark:border-white/5">
                    <span className="text-[10px] text-gray-400 block font-semibold">Category</span>
                    <input
                      type="text"
                      value={extracted.category || 'Other'}
                      onChange={(e) => setExtracted({ ...extracted, category: e.target.value })}
                      className="w-full font-bold text-navy-700 dark:text-white bg-transparent focus:outline-none"
                    />
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-navy-900 border border-gray-100 dark:border-white/5">
                    <span className="text-[10px] text-gray-400 block font-semibold">Date</span>
                    <input
                      type="date"
                      value={extracted.date || ''}
                      onChange={(e) => setExtracted({ ...extracted, date: e.target.value })}
                      className="w-full font-bold text-navy-700 dark:text-white bg-transparent focus:outline-none"
                    />
                  </div>
                </div>

                <ShimmerButton
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/25 flex items-center justify-center gap-1.5"
                >
                  <span>Save to Expenses & Scan Shield</span>
                  <ArrowRight className="w-4 h-4" />
                </ShimmerButton>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
