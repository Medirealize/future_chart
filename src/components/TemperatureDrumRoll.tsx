'use client';

import { useRef, useEffect } from 'react';
import { TEMPERATURES } from '@/lib/constants';

interface TemperatureDrumRollProps {
  value: string;
  onChange: (temp: string) => void;
}

export default function TemperatureDrumRoll({ value, onChange }: TemperatureDrumRollProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const triggerHaptic = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(8);
    }
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const index = TEMPERATURES.indexOf(value);
    if (index >= 0) {
      const item = el.querySelector(`[data-temp-index="${index}"]`);
      item?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    }
  }, [value]);

  return (
    <div className="w-full">
      <p className="text-sm text-slate-500 mb-2 text-center">体温を選択（タップで選ぶ）</p>
      <div
        ref={scrollRef}
        className="flex overflow-x-auto scrollbar-hide w-full snap-x snap-mandatory py-3 border-y border-slate-100"
      >
        {TEMPERATURES.map((temp, i) => (
          <button
            key={temp}
            type="button"
            data-temp-index={i}
            onClick={() => {
              triggerHaptic();
              onChange(temp);
            }}
            className={`flex-shrink-0 w-16 h-12 flex items-center justify-center snap-center text-xl font-mono transition-all ${
              value === temp
                ? 'text-red-600 font-bold text-2xl scale-110'
                : 'text-slate-400'
            }`}
          >
            {temp}
          </button>
        ))}
      </div>
    </div>
  );
}
