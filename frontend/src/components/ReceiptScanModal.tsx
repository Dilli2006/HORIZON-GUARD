import React, { useState } from 'react';
import { X, Upload, Sparkles, CheckCircle2, FileImage, ArrowRight } from 'lucide-react';
import { api, formatINR } from '../lib/api';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-[#121620] w-full max-w-lg rounded-[28px] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/60 dark:bg-slate-900/40">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-500" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Smart Receipt Scan</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Upload any physical bill or receipt image. Gemini Vision extracts merchant, total amount in INR, and auto-categorizes it.
          </p>

          {/* Upload Area */}
          <label className="border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-blue-500 dark:hover:border-blue-500 transition-colors bg-slate-50/40 dark:bg-slate-800/20">
            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            <FileImage className="w-8 h-8 text-blue-500" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {file ? file.name : 'Choose receipt image or drop here'}
            </span>
            <span className="text-[10px] text-slate-400">JPG, PNG, WEBP</span>
          </label>

          {loading && (
            <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 text-center space-y-1">
              <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 block">
                Analyzing visual tokens with Gemini Vision...
              </span>
              <span className="text-[10px] text-blue-500">Detecting merchant line items and tax totals</span>
            </div>
          )}

          {extracted && (
            <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-300">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>OCR Extraction Complete ({extracted.source})</span>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-white/5">
                  <span className="text-[10px] text-slate-400 block font-medium">Merchant</span>
                  <input
                    type="text"
                    value={extracted.merchant || ''}
                    onChange={(e) => setExtracted({ ...extracted, merchant: e.target.value })}
                    className="w-full font-bold bg-transparent focus:outline-none"
                  />
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-white/5">
                  <span className="text-[10px] text-slate-400 block font-medium">Total (₹)</span>
                  <input
                    type="number"
                    value={extracted.amount || ''}
                    onChange={(e) => setExtracted({ ...extracted, amount: e.target.value })}
                    className="w-full font-bold text-emerald-600 bg-transparent focus:outline-none"
                  />
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-white/5">
                  <span className="text-[10px] text-slate-400 block font-medium">Category</span>
                  <input
                    type="text"
                    value={extracted.category || 'Other'}
                    onChange={(e) => setExtracted({ ...extracted, category: e.target.value })}
                    className="w-full font-bold bg-transparent focus:outline-none"
                  />
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-white/5">
                  <span className="text-[10px] text-slate-400 block font-medium">Date</span>
                  <input
                    type="date"
                    value={extracted.date || ''}
                    onChange={(e) => setExtracted({ ...extracted, date: e.target.value })}
                    className="w-full font-bold bg-transparent focus:outline-none"
                  />
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-sm flex items-center justify-center gap-1.5"
              >
                <span>Save to Expenses & Scan Shield</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
