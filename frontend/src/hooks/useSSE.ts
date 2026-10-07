import { useEffect, useRef, useState } from 'react';
import { API_BASE } from '../lib/api';

export interface SSEToast {
  id: string;
  type: string;
  title: string;
  message: string;
  severity?: string;
  riskScore?: number;
  timestamp: Date;
}

export function useSSE(onRefresh?: () => void) {
  const [toasts, setToasts] = useState<SSEToast[]>([]);
  const evtSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const es = new EventSource(`${API_BASE}/events`);
    evtSourceRef.current = es;

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'anomaly') {
          const newToast: SSEToast = {
            id: `${Date.now()}-${Math.random()}`,
            type: 'anomaly',
            title: `🚨 Threat Detected: ${data.merchant}`,
            message: `${data.reason || 'Flagged by detector pipeline'} (${data.severity} Risk: ${data.risk_score})`,
            severity: data.severity,
            riskScore: data.risk_score,
            timestamp: new Date(),
          };
          setToasts((prev) => [newToast, ...prev.slice(0, 4)]);
          if (onRefresh) onRefresh();
        } else if (data.type === 'refresh') {
          if (onRefresh) onRefresh();
        } else if (data.type === 'verdict') {
          const report = data.report;
          const isFraud = report?.verdict === 'fraud';
          const newToast: SSEToast = {
            id: `${Date.now()}-${Math.random()}`,
            type: 'verdict',
            title: isFraud ? '🛡️ Antibody Generated' : '✅ Pattern Whitelisted',
            message: report?.note || `Verdict recorded. Immunity score updated to ${report?.immunity_after || 0}%.`,
            severity: isFraud ? 'High' : 'Low',
            timestamp: new Date(),
          };
          setToasts((prev) => [newToast, ...prev.slice(0, 4)]);
          if (onRefresh) onRefresh();
        }
      } catch (err) {
        // keep alive ping or comment
      }
    };

    es.onerror = () => {
      // Reconnect handled automatically by EventSource
    };

    return () => {
      es.close();
    };
  }, [onRefresh]);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return { toasts, dismissToast };
}
