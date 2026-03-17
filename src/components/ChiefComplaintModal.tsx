'use client';

import { useMemo, useState } from 'react';
import { Check, X } from 'lucide-react';
import type { SymptomLog } from '@/lib/types';
import { SYMPTOM_LABELS, MOOD_OPTIONS, APPETITE_OPTIONS } from '@/lib/constants';

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

function buildCandidates(logs: SymptomLog[]): string[] {
  // 新しい順、同じ症状は重複排除
  const sorted = [...logs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const seen = new Set<string>();
  const out: string[] = [];
  for (const l of sorted) {
    const s = symptomDisplay(l);
    if (!seen.has(s)) {
      seen.add(s);
      out.push(s);
    }
  }
  // 何もなければ「（なし）」のみ
  return out.length > 0 ? out : ['（なし）'];
}

interface ChiefComplaintModalProps {
  logs: SymptomLog[];
  initialChief1: string;
  initialChief2?: string;
  onConfirm: (chief1: string, chief2: string | null) => void;
  onClose: () => void;
}

export default function ChiefComplaintModal({
  logs,
  initialChief1,
  initialChief2,
  onConfirm,
  onClose,
}: ChiefComplaintModalProps) {
  const candidates = useMemo(() => buildCandidates(logs), [logs]);
  const [chief1, setChief1] = useState<string>(initialChief1 || '（なし）');
  const [chief2, setChief2] = useState<string>(initialChief2 || '');

  const triggerHaptic = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-end justify-center" onClick={onClose}>
      <div
        className="bg-white rounded-t-3xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">主訴を確認</h2>
          <button type="button" onClick={onClose} className="p-2 text-slate-600" aria-label="閉じる">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 pb-6 space-y-5 max-h-[70vh] overflow-y-auto">
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">主訴 1（自動選定・変更可）</p>
            <div className="flex flex-wrap gap-2">
              {candidates.map((c) => (
                <button
                  key={`c1-${c}`}
                  type="button"
                  onClick={() => {
                    triggerHaptic();
                    setChief1(c);
                    // 2つ目と被ったら2つ目を空に
                    if (chief2 === c) setChief2('');
                  }}
                  className={`px-3 py-2 rounded-xl text-sm font-medium border ${
                    chief1 === c ? 'bg-slate-800 text-white border-slate-800' : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">主訴 2（任意）</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic();
                  setChief2('');
                }}
                className={`px-3 py-2 rounded-xl text-sm font-medium border ${
                  chief2 === '' ? 'bg-slate-800 text-white border-slate-800' : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                なし
              </button>
              {candidates
                .filter((c) => c !== chief1 && c !== '（なし）')
                .map((c) => (
                  <button
                    key={`c2-${c}`}
                    type="button"
                    onClick={() => {
                      triggerHaptic();
                      setChief2(c);
                    }}
                    className={`px-3 py-2 rounded-xl text-sm font-medium border ${
                      chief2 === c ? 'bg-slate-800 text-white border-slate-800' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    {c}
                  </button>
                ))}
            </div>
          </div>
        </div>

        <div className="p-4 pt-0">
          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              onConfirm(chief1 || '（なし）', chief2 || null);
            }}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <Check className="w-6 h-6" />
            この主訴で先生に見せる
          </button>
        </div>
      </div>
    </div>
  );
}

