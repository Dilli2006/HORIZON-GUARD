import React, { useState } from 'react';
import { X, Shield, Download, Upload, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';
import { api } from '../lib/api';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-[#121620] w-full max-w-2xl rounded-[28px] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/60 dark:bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Herd Immunity Vaccine Packs</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Share fraud immunity signatures across family, teams, or community networks.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {statusMsg && (
            <div className={`p-3.5 rounded-2xl text-xs flex items-center gap-2 ${
              statusMsg.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
            }`}>
              {statusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* Section 1: Export */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-white/5">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-2">
              <Download className="w-4 h-4 text-blue-500" />
              <span>Export Inoculation Signature</span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Generates a tamper-proof signed JSON antibody package representing fraud patterns you've defeated.
            </p>
            <button
              onClick={handleExport}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-sm"
            >
              Generate Vaccine Pack (.json)
            </button>

            {exportJson && (
              <div className="mt-3">
                <textarea
                  readOnly
                  rows={4}
                  value={exportJson}
                  className="w-full text-[11px] font-mono p-3 rounded-xl bg-slate-900 text-slate-200 focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Section 2: Import */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-white/5">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-2">
              <Upload className="w-4 h-4 text-emerald-500" />
              <span>Import Community Vaccine</span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Paste a trusted antibody pack JSON. Verified with SHA-256 checksum to prevent tampering.
            </p>
            <textarea
              rows={3}
              value={importInput}
              onChange={(e) => setImportInput(e.target.value)}
              placeholder='Paste vaccine pack JSON here: {"format": "expenseguard-vaccine/v1", ...}'
              className="w-full text-xs font-mono p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 mb-3"
            />
            <button
              onClick={handleImport}
              disabled={loading || !importInput.trim()}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-sm"
            >
              Inoculate System (Import)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
