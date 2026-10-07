import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, User, ArrowRight, BrainCircuit, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api, formatINR } from '../lib/api';
import { SpotlightCard } from '../components/ui/SpotlightCard';
import { BorderBeam } from '../components/ui/BorderBeam';
import { NeuralWaveform } from '../components/ui/NeuralWaveform';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  intent?: any;
  chart?: { type: string; data: { label: string; value: number }[] };
  source?: string;
}

interface AssistantTabProps {
  initialPrompt?: string;
  onClearInitialPrompt?: () => void;
}

export const AssistantTab: React.FC<AssistantTabProps> = ({ initialPrompt, onClearInitialPrompt }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'assistant',
      text: "Hello Aarav! I am your Horizon Guard Intelligence Assistant. Ask me anything about your spending history, anomalies, or budget forecasts. (e.g. 'How much did I spend on Food last week?' or 'What are my top merchants this month?')",
    },
  ]);
  const [input, setInput] = useState(initialPrompt || '');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    if (initialPrompt) {
      setInput(initialPrompt);
      if (onClearInitialPrompt) onClearInitialPrompt();
    }
  }, [initialPrompt]);

  const handleSend = async (qText?: string) => {
    const q = qText || input;
    if (!q.trim() || loading) return;

    const userMsg: Message = { id: Date.now().toString(), sender: 'user', text: q };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.askAssistant(q);
      const asstMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: res.answer,
        intent: res.intent,
        chart: res.chart,
        source: res.source,
      };
      setMessages((prev) => [...prev, asstMsg]);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          text: `Error analyzing query: ${e.message || 'Please try again.'}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const chips = [
    'How much did I spend on food this month?',
    'What was my biggest expense all time?',
    'Show all flagged anomalies',
    'Which merchants are my top 5?',
    'How many transactions were made in Goa?',
  ];

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-700 dark:text-white font-poppins tracking-tight flex items-center gap-2.5">
            <span>AI Expense Assistant</span>
            <span className="p-1 rounded-lg bg-brand-50 dark:bg-navy-700 text-brand-500">
              <BrainCircuit className="w-5 h-5" />
            </span>
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Natural language query engine with structured intent sanitization and real-time ledger grounding.
          </p>
        </div>

        <NeuralWaveform active={loading} bars={12} color="from-brand-500 to-cyan-400" />
      </div>

      {/* Chat Window with Horizon Spotlight Card & BorderBeam */}
      <SpotlightCard className="!p-0 overflow-hidden flex flex-col h-[670px] shadow-2xl relative">
        <BorderBeam colorFrom="#4318FF" colorTo="#00F0FF" size={300} duration={8} />

        {/* Messages list */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((m) => {
              const isUser = m.sender === 'user';
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-500 to-brand-700 text-white flex items-center justify-center shrink-0 shadow-md shadow-brand-500/25">
                      <Sparkles className="w-4 h-4" />
                    </div>
                  )}

                  <div className={`max-w-[82%] rounded-2xl p-4 text-xs leading-relaxed shadow-sm ${
                    isUser
                      ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white font-medium shadow-md shadow-brand-500/20'
                      : 'bg-lightPrimary dark:bg-navy-900 text-navy-700 dark:text-gray-200 border border-gray-100 dark:border-white/5'
                  }`}>
                    <p className="whitespace-pre-wrap">{m.text}</p>

                    {/* Intent telemetry pill */}
                    {m.intent && (
                      <div className="mt-3 pt-3 border-t border-gray-200/50 dark:border-white/10 flex items-center gap-2 text-[10px] font-mono text-gray-400">
                        <span className="font-bold text-brand-500">Structured Intent ({m.source}):</span>
                        <span>{JSON.stringify(m.intent)}</span>
                      </div>
                    )}

                    {/* Inline Mini Chart */}
                    {m.chart && m.chart.data && m.chart.data.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-gray-200/50 dark:border-white/10 space-y-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block">
                          Visual Breakdown:
                        </span>
                        <div className="space-y-2">
                          {m.chart.data.slice(0, 5).map((cd, i) => {
                            const maxVal = Math.max(...m.chart!.data.map((d) => d.value), 1);
                            const pct = Math.round((cd.value / maxVal) * 100);
                            return (
                              <div key={i} className="space-y-1">
                                <div className="flex justify-between text-[11px] font-medium">
                                  <span>{cd.label}</span>
                                  <span className="font-bold">{formatINR(cd.value)}</span>
                                </div>
                                <div className="h-1.5 w-full bg-gray-200 dark:bg-navy-800 rounded-full overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${pct}%` }}
                                    transition={{ duration: 0.6, ease: 'easeOut' }}
                                    className="h-full bg-gradient-to-r from-brand-500 to-cyan-400 rounded-full"
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-xl bg-gray-200 dark:bg-navy-700 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-navy-700 dark:text-gray-300" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>

          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3 text-xs text-brand-500 font-semibold p-2"
            >
              <div className="w-6 h-6 rounded-lg bg-brand-50 dark:bg-navy-700 flex items-center justify-center animate-pulse">
                <Sparkles className="w-3.5 h-3.5 text-brand-500" />
              </div>
              <span>Neural semantic engine analyzing 269 transactions...</span>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="p-4 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-navy-900/60 space-y-3">
          {/* Quick chips */}
          <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1">
            {chips.map((c) => (
              <motion.button
                key={c}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => handleSend(c)}
                className="text-[11px] px-3 py-1.5 rounded-xl bg-white dark:bg-navy-800 text-gray-600 dark:text-gray-300 hover:text-brand-500 dark:hover:text-white border border-gray-200/60 dark:border-white/5 whitespace-nowrap transition shadow-sm font-semibold"
              >
                {c}
              </motion.button>
            ))}
          </div>

          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="Ask anything about your expenses, merchants, or anomalies..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="w-full text-xs py-3.5 pl-4 pr-12 rounded-xl bg-white dark:bg-navy-800 border border-slate-200 dark:border-white/10 text-navy-700 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/25 shadow-inner"
            />
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className="absolute right-2 p-2 rounded-lg bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-40 transition shadow-md shadow-brand-500/25"
            >
              <Send className="w-3.5 h-3.5" />
            </motion.button>
          </div>
        </div>
      </SpotlightCard>
    </div>
  );
};
