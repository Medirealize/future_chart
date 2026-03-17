'use client';

import { useState, useEffect } from 'react';
import type { FamilyMember } from '@/lib/types';

type GenderOption = 'male' | 'female' | 'other' | '';

interface FamilyMemberFormProps {
  /** 編集時はメンバーを渡す。追加時は null */
  member: FamilyMember | null;
  onSave: (data: { name: string; birthYear?: number; gender?: 'male' | 'female' | 'other'; allergy: string }) => void;
  onClose: () => void;
}

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: CURRENT_YEAR - 1939 }, (_, i) => CURRENT_YEAR - i);

export default function FamilyMemberForm({ member, onSave, onClose }: FamilyMemberFormProps) {
  const isEdit = member != null;
  const [name, setName] = useState(member?.name ?? '');
  const [birthYear, setBirthYear] = useState<string>(member?.birthYear?.toString() ?? '');
  const [gender, setGender] = useState<GenderOption>(member?.gender ?? '');
  const [allergy, setAllergy] = useState(member?.allergy ?? 'なし');

  useEffect(() => {
    if (member) {
      setName(member.name);
      setBirthYear(member.birthYear?.toString() ?? '');
      setGender(member.gender ?? '');
      setAllergy(member.allergy ?? 'なし');
    } else {
      setName('');
      setBirthYear('');
      setGender('');
      setAllergy('なし');
    }
  }, [member]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;
    onSave({
      name: trimmedName,
      birthYear: birthYear ? parseInt(birthYear, 10) : undefined,
      gender: gender === '' ? undefined : (gender as 'male' | 'female' | 'other'),
      allergy: allergy.trim() || 'なし',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-end justify-center" onClick={onClose}>
      <div
        className="bg-white rounded-t-3xl w-full max-w-md shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">
            {isEdit ? '家族を編集' : '家族を追加'}
          </h2>
          <button type="button" onClick={onClose} className="text-slate-500 font-medium">
            キャンセル
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 pb-8 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">呼称（名前） *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例：自分、長男"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-900"
              required
              autoComplete="off"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">生年（任意）</label>
            <select
              value={birthYear}
              onChange={(e) => setBirthYear(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-900 bg-white"
            >
              <option value="">選択しない</option>
              {YEAR_OPTIONS.map((y) => (
                <option key={y} value={y}>{y}年</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">性別（任意）</label>
            <div className="flex gap-2">
              {[
                { value: '' as const, label: '未選択' },
                { value: 'male' as const, label: '男' },
                { value: 'female' as const, label: '女' },
                { value: 'other' as const, label: 'その他' },
              ].map((opt) => (
                <button
                  key={opt.value || 'none'}
                  type="button"
                  onClick={() => setGender(opt.value)}
                  className={`flex-1 py-3 rounded-xl text-sm font-medium ${
                    gender === opt.value
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">アレルギー</label>
            <input
              type="text"
              value={allergy}
              onChange={(e) => setAllergy(e.target.value)}
              placeholder="なし、または 卵・ペニシリン など"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-900"
              autoComplete="off"
            />
          </div>

          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full py-4 bg-slate-800 text-white rounded-2xl font-bold disabled:opacity-50"
          >
            {isEdit ? '保存する' : '追加する'}
          </button>
        </form>
      </div>
    </div>
  );
}
