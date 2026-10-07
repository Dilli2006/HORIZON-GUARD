import React, { useState } from 'react';
import { X, Shield, Download, Upload, CheckCircle2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../lib/api';
import { BorderBeam } from './ui/BorderBeam';
import { ShimmerButton } from './ui/ShimmerButton';

interface VaccineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
}

export const VaccineModal: React.FC<VaccineModalProps> = ({ isOpen, onClose, onImportSuccess }) => {
  const [exportJson, setExportJson] = useState<string | null>(null);
  const [importInput, setImportInput] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    setLoading(true);
    setStatusMsg(null);
    try {
      const data = await api.exportVaccine();
      setExportJson(JSON.stringify(data, null, 2));
      setStatusMsg({ type: 'success', text: `Vaccine pack generated with ${data.count} antibodies & SHA-256 seal.` });
    } catch (e: any) {
      setStatusMsg({ type: 'error', text: e.message || 'Export failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!importInput.trim()) return;
    setLoading(true);
    setStatusMsg(null);
    try {
      const parsed = JSON.parse(importInput);
      const res = await api.importVaccine(parsed);
      setStatusMsg({ type: 'success', text: `Vaccine deployed! Inoculated ${res.added} new antibodies (Acquired Immunity).` });
      setImportInput('');
      onImportSuccess();
    } catch (e: any) {
      setStatusMsg({ type: 'error', text: e.message || 'Failed to import vaccine pack' });
    } finally {
      setLoading(false);
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
          className="relative z-10 bg-white dark:bg-navy-800 w-full max-w-2xl rounded-[28px] border border-slate-200/80 dark:border-white/10 shadow-3xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          <BorderBeam colorFrom="#00F0FF" colorTo="#4318FF" size={260} duration={6} />

          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-gray-50/50 dark:bg-navy-900/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shadow-md">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-navy-700 dark:text-white font-poppins">
                  Herd Immunity Vaccine Packs
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Share fraud immunity signatures across family, teams, or community networks.
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
          <div className="p-6 overflow-y-auto space-y-6">
            {statusMsg && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3.5 rounded-2xl text-xs flex items-center gap-2.5 shadow-sm ${
                  statusMsg.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                    : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                }`}
              >
                {statusMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                )}
                <span className="font-medium">{statusMsg.text}</span>
              </motion.div>
            )}

            {/* Section 1: Export */}
            <div className="p-4 rounded-2xl bg-lightPrimary dark:bg-navy-900 border border-gray-100 dark:border-white/5">
              <h4 className="text-xs font-black text-navy-700 dark:text-white flex items-center gap-1.5 mb-1.5 font-poppins">
                <Download className="w-4 h-4 text-brand-500" />
                <span>Export Inoculation Signature</span>
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Generates a tamper-proof signed JSON antibody package representing fraud patterns you've defeated.
              </p>
              <ShimmerButton
                onClick={handleExport}
                disabled={loading}
                className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs rounded-xl shadow-md shadow-brand-500/20"
              >
                Generate Vaccine Pack (.json)
              </ShimmerButton>

              {exportJson && (
                <div className="mt-3">
                  <textarea
                    readOnly
                    rows={4}
                    value={exportJson}
                    className="w-full text-[11px] font-mono p-3 rounded-xl bg-navy-900 text-cyan-300 border border-white/10 focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* Section 2: Import */}
            <div className="p-4 rounded-2xl bg-lightPrimary dark:bg-navy-900 border border-gray-100 dark:border-white/5">
              <h4 className="text-xs font-black text-navy-700 dark:text-white flex items-center gap-1.5 mb-1.5 font-poppins">
                <Upload className="w-4 h-4 text-emerald-500" />
                <span>Import Community Vaccine</span>
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Paste a trusted antibody pack JSON. Verified with SHA-256 checksum to prevent tampering.
              </p>
              <textarea
                rows={3}
                value={importInput}
                onChange={(e) => setImportInput(e.target.value)}
                placeholder='Paste vaccine pack JSON here: {"format": "expenseguard-vaccine/v1", ...}'
                className="w-full text-xs font-mono p-3 rounded-xl bg-white dark:bg-navy-800 border border-gray-200 dark:border-white/10 text-navy-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 mb-3 shadow-inner"
              />
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleImport}
                disabled={loading || !importInput.trim()}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold text-xs transition shadow-md shadow-emerald-600/20"
              >
                Inoculate System (Import)
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
