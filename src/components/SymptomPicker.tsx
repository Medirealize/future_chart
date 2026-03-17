'use client';

import { useState } from 'react';
import { Thermometer, Smile, Wind, Utensils } from 'lucide-react';
import type { SymptomType, Severity, TimeRange, MoodValue, AppetiteValue } from '@/lib/types';
import {
  SYMPTOM_LABELS,
  MOOD_OPTIONS,
  APPETITE_OPTIONS,
  TIME_RANGE_OPTIONS,
  SEVERITY_OPTIONS,
  TEMPERATURES,
} from '@/lib/constants';
import TemperatureDrumRoll from './TemperatureDrumRoll';

export type PickerPayload = {
  timeRange: TimeRange;
  type: SymptomType;
  severity: Severity;
  value?: string;
  mood?: MoodValue;
  appetite?: AppetiteValue;
};

interface SymptomPickerProps {
  onAdd: (payload: PickerPayload) => void;
  onClose: () => void;
}

const SYMPTOM_GROUPS: { label: string; icon: React.ReactNode; types: SymptomType[] }[] = [
  { label: '全身', icon: <Thermometer className="w-4 h-4" />, types: ['fever', 'mood'] },
  { label: '呼吸', icon: <Wind className="w-4 h-4" />, types: ['cough', 'runny_nose'] },
  { label: '消化', icon: <Utensils className="w-4 h-4" />, types: ['soft_stool', 'watery_stool', 'vomit', 'nausea', 'appetite'] },
  { label: 'その他', icon: <Smile className="w-4 h-4" />, types: ['rash', 'pain', 'itch'] },
];

export default function SymptomPicker({ onAdd, onClose }: SymptomPickerProps) {
  const [step, setStep] = useState<'time' | 'time_weeks' | 'symptom' | 'option' | 'severity'>('time');
  const [timeRange, setTimeRange] = useState<TimeRange>('just_now');
  const [selectedType, setSelectedType] = useState<SymptomType | null>(null);
  const [severity, setSeverity] = useState<Severity>('mid');
  const [temp, setTemp] = useState('36.5');
  const [mood, setMood] = useState<MoodValue>('normal');
  const [appetite, setAppetite] = useState<AppetiteValue>('half');

  const triggerHaptic = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10);
    }
  };

  const handleSelectSymptom = (type: SymptomType) => {
    triggerHaptic();
    setSelectedType(type);
    if (type === 'mood' || type === 'appetite') {
      setStep('option');
    } else {
      setStep('severity');
    }
  };

  const handleConfirmOption = () => {
    triggerHaptic();
    setStep('severity');
  };

  const handleRecord = () => {
    triggerHaptic();
    if (!selectedType) return;
    const payload: PickerPayload = {
      timeRange,
      type: selectedType,
      severity,
      value: selectedType === 'fever' ? temp : undefined,
      mood: selectedType === 'mood' ? mood : undefined,
      appetite: selectedType === 'appetite' ? appetite : undefined,
    };
    onAdd(payload);
    onClose();
  };

  const back = () => {
    triggerHaptic();
    if (step === 'severity') {
      setStep(selectedType === 'mood' || selectedType === 'appetite' ? 'option' : 'symptom');
    } else if (step === 'option') {
      setStep('symptom');
    } else if (step === 'symptom') {
      setStep('time');
    } else if (step === 'time_weeks') {
      setStep('time');
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-40 bg-slate-900/40 flex items-end justify-center" onClick={onClose}>
      <div
        className="bg-white rounded-t-3xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <button type="button" onClick={back} className="text-slate-600 font-medium">
            ← 戻る
          </button>
          <span className="text-sm text-slate-500">
            {step === 'time' && 'いつから'}
            {step === 'time_weeks' && 'いつから（週）'}
            {step === 'symptom' && '症状を選ぶ'}
            {step === 'option' && (selectedType === 'mood' ? '機嫌' : '食欲')}
            {step === 'severity' && '程度'}
          </span>
        </div>

        <div className="p-4 pb-8 max-h-[70vh] overflow-y-auto">
          {step === 'time' && (
            <div className="space-y-2">
              {[
                { value: 'just_now' as const, label: 'さっきから' },
                { value: 'today' as const, label: '今日から' },
                { value: 'yesterday' as const, label: '昨日から' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    triggerHaptic();
                    setTimeRange(opt.value);
                    setStep('symptom');
                  }}
                  className="w-full py-4 rounded-2xl bg-slate-100 text-slate-800 font-medium active:bg-slate-200"
                >
                  {opt.label}
                </button>
              ))}

              {/* 週のサブ選択へ */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic();
                  setStep('time_weeks');
                }}
                className="w-full py-4 rounded-2xl bg-slate-100 text-slate-800 font-medium active:bg-slate-200 flex items-center justify-between px-5"
              >
                <span>1週間前から</span>
                <span className="text-slate-400">→</span>
              </button>

              {/* 既存のざっくり選択 */}
              {[
                { value: 'weeks_ago' as const, label: '数週間前から' },
                { value: 'months_ago' as const, label: '何ヶ月か前から' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    triggerHaptic();
                    setTimeRange(opt.value);
                    setStep('symptom');
                  }}
                  className="w-full py-4 rounded-2xl bg-slate-100 text-slate-800 font-medium active:bg-slate-200"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {step === 'time_weeks' && (
            <div className="space-y-2">
              {[
                { value: 'week_1' as const, label: '1週間前から' },
                { value: 'week_2' as const, label: '2週間前から' },
                { value: 'week_3' as const, label: '3週間前から' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    triggerHaptic();
                    setTimeRange(opt.value);
                    setStep('symptom');
                  }}
                  className="w-full py-4 rounded-2xl bg-slate-100 text-slate-800 font-medium active:bg-slate-200"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {step === 'symptom' && (
            <div className="space-y-4">
              {SYMPTOM_GROUPS.map((group) => (
                <div key={group.label}>
                  <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                    {group.icon}
                    {group.label}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {group.types.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => handleSelectSymptom(type)}
                        className="py-3 px-4 rounded-xl bg-slate-100 text-slate-800 font-medium active:bg-slate-200"
                      >
                        {type === 'mood' && '😊😐😫'}
                        {type === 'appetite' && '食欲'}
                        {type !== 'mood' && type !== 'appetite' && SYMPTOM_LABELS[type]}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {step === 'option' && selectedType === 'mood' && (
            <div className="flex flex-col gap-2">
              {MOOD_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setMood(opt.value);
                    handleConfirmOption();
                  }}
                  className="w-full py-4 rounded-2xl bg-slate-100 text-xl active:bg-slate-200"
                >
                  {opt.emoji} {opt.label}
                </button>
              ))}
            </div>
          )}

          {step === 'option' && selectedType === 'appetite' && (
            <div className="flex flex-col gap-2">
              {APPETITE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setAppetite(opt.value);
                    handleConfirmOption();
                  }}
                  className="w-full py-4 rounded-2xl bg-slate-100 text-slate-800 font-medium active:bg-slate-200"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {step === 'severity' && (
            <>
              {selectedType === 'fever' && (
                <div className="mb-6">
                  <TemperatureDrumRoll value={temp} onChange={setTemp} />
                </div>
              )}
              <p className="text-sm text-slate-500 mb-3">程度を選んでください</p>
              <div className="grid grid-cols-3 gap-3 mb-6">
                {SEVERITY_OPTIONS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      triggerHaptic();
                      setSeverity(s.id);
                    }}
                    className={`py-4 rounded-2xl font-bold transition-all ${
                      severity === s.id ? s.activeClass : s.color
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={handleRecord}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-lg active:scale-[0.98]"
              >
                この内容で記録する
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
