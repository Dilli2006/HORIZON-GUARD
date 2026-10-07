import React, { useState } from 'react';
import { Sparkles, Send, Bot, User, ArrowRight, BarChart2, CheckCircle2 } from 'lucide-react';
import { api, formatINR } from '../lib/api';

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
      text: "Hello Aarav! I am your ExpenseGuard Intelligence Assistant. Ask me anything about your spending history, anomalies, or budget forecasts. (e.g. 'How much did I spend on Food last week?' or 'What are my top merchants this month?')",
    },
  ]);
  const [input, setInput] = useState(initialPrompt || '');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
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
    <div className="space-y-6 animate-fadeIn pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          AI Expense Assistant
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Natural Language Query Engine with Structured Intent Sanitization (No Raw SQL).
        </p>
      </div>

      {/* Chat Window */}
      <div className="fintech-card bg-white dark:bg-[#121620] border border-slate-200/70 dark:border-white/5 shadow-sm overflow-hidden flex flex-col h-[650px]">
        {/* Messages list */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.map((m) => {
            const isUser = m.sender === 'user';
            return (
              <div
                key={m.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}

                <div className={`max-w-[80%] rounded-2xl p-4 text-xs leading-relaxed ${
                  isUser
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-medium'
                    : 'bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 border border-slate-200/50 dark:border-white/5'
                }`}>
                  <p className="whitespace-pre-wrap">{m.text}</p>

                  {/* Intent telemetry pill */}
                  {m.intent && (
                    <div className="mt-3 pt-3 border-t border-slate-200/50 dark:border-white/10 flex items-center gap-2 text-[10px] font-mono text-slate-400">
                      <span className="font-bold text-blue-500">Structured Intent ({m.source}):</span>
                      <span>{JSON.stringify(m.intent)}</span>
                    </div>
                  )}

                  {/* Inline Mini Chart */}
                  {m.chart && m.chart.data && m.chart.data.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-200/50 dark:border-white/10 space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Query Visualization:
                      </span>
                      <div className="space-y-1.5">
                        {m.chart.data.slice(0, 5).map((cd, i) => {
                          const maxVal = Math.max(...m.chart!.data.map((d) => d.value), 1);
                          const pct = Math.round((cd.value / maxVal) * 100);
                          return (
                            <div key={i} className="space-y-0.5">
                              <div className="flex justify-between text-[11px] font-medium">
                                <span>{cd.label}</span>
                                <span className="font-bold">{formatINR(cd.value)}</span>
                              </div>
                              <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-600 rounded-full"
                                  style={{ width: `${pct}%` }}
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
                  <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                  </div>
                )}
              </div>
            );
          })}
          {loading && (
            <div className="flex items-center gap-2 text-xs text-slate-400 animate-pulse">
              <Sparkles className="w-4 h-4 text-blue-500" />
              <span>Analyzing parameter query...</span>
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="p-4 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/30 space-y-3">
          {/* Quick chips */}
          <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1">
            {chips.map((c) => (
              <button
                key={c}
                onClick={() => handleSend(c)}
                className="text-[11px] px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-300 border border-slate-200/50 dark:border-white/5 whitespace-nowrap transition"
              >
                {c}
              </button>
            ))}
          </div>

          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="Ask anything about your expenses or anomalies..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="w-full text-xs py-3 pl-4 pr-12 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className="absolute right-2 p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 transition"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
