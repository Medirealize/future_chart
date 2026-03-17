'use client';

import { SYMPTOM_LABELS, MOOD_OPTIONS, APPETITE_OPTIONS, TIME_RANGE_OPTIONS, SEVERITY_OPTIONS } from '@/lib/constants';
import type { SymptomLog } from '@/lib/types';

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) {
    return d.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function timeRangeLabel(v: string): string {
  return TIME_RANGE_OPTIONS.find((o) => o.value === v)?.label ?? v;
}

function symptomDisplay(log: SymptomLog): string {
  if (log.type === 'fever' && log.value) return `発熱 ${log.value}℃`;
  if (log.type === 'mood' && log.mood) {
    const m = MOOD_OPTIONS.find((o) => o.value === log.mood);
    return m ? `機嫌 ${m.emoji}` : '機嫌';
  }
  if (log.type === 'appetite' && log.appetite) {
    const a = APPETITE_OPTIONS.find((o) => o.value === log.appetite);
    return a ? `食欲 ${a.label}` : '食欲';
  }
  return SYMPTOM_LABELS[log.type];
}

function severityLabel(severity: string): string {
  return SEVERITY_OPTIONS.find((s) => s.id === severity)?.label ?? severity;
}

interface LogTimelineProps {
  logs: SymptomLog[];
}

export default function LogTimeline({ logs }: LogTimelineProps) {
  const sorted = [...logs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  if (sorted.length === 0) {
    return (
      <div className="py-12 text-center text-slate-500">
        <p>まだ記録がありません</p>
        <p className="text-sm mt-1">下の「記録する」で症状を追加してください</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2 pb-4">
      {sorted.map((log) => (
        <li
          key={log.id}
          className={`rounded-xl p-4 border ${
            log.severity === 'high'
              ? 'bg-red-50 border-red-200'
              : log.severity === 'mid'
                ? 'bg-amber-50 border-amber-200'
                : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex justify-between items-start gap-2">
            <div>
              <p className="font-medium text-slate-900">{symptomDisplay(log)}</p>
              <p className="text-sm text-slate-500 mt-0.5">{timeRangeLabel(log.timeRange)} · {formatTime(log.timestamp)}</p>
            </div>
            <span
              className={`flex-shrink-0 text-xs font-medium px-2 py-1 rounded-full ${
                log.severity === 'high'
                  ? 'bg-red-200 text-red-800'
                  : log.severity === 'mid'
                    ? 'bg-amber-200 text-amber-800'
                    : 'bg-blue-200 text-blue-800'
              }`}
            >
              {severityLabel(log.severity)}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
