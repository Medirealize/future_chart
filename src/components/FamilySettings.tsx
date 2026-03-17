'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import type { FamilyMember } from '@/lib/types';
import FamilyMemberForm from './FamilyMemberForm';

interface FamilySettingsProps {
  members: FamilyMember[];
  onClose: () => void;
  onAddMember: (data: Omit<FamilyMember, 'id'>) => void;
  onEditMember: (id: string, data: Partial<FamilyMember>) => void;
  onDeleteMember: (id: string) => void;
}

export default function FamilySettings({
  members,
  onClose,
  onAddMember,
  onEditMember,
  onDeleteMember,
}: FamilySettingsProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [formMember, setFormMember] = useState<FamilyMember | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleSaveForm = (data: { name: string; birthYear?: number; gender?: 'male' | 'female' | 'other'; allergy: string }) => {
    if (formMember) {
      onEditMember(formMember.id, data);
    } else {
      onAddMember(data);
    }
    setFormOpen(false);
    setFormMember(null);
  };

  const openAddForm = () => {
    setFormMember(null);
    setFormOpen(true);
  };

  const openEditForm = (m: FamilyMember) => {
    setFormMember(m);
    setFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (deleteConfirmId === id) {
      onDeleteMember(id);
      setDeleteConfirmId(null);
    } else {
      setDeleteConfirmId(id);
      setTimeout(() => setDeleteConfirmId(null), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-white max-w-md mx-auto overflow-y-auto">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
        <h1 className="text-xl font-bold text-slate-800">家族設定</h1>
        <button type="button" onClick={onClose} className="p-2 text-slate-600" aria-label="閉じる">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="p-4 space-y-2">
        {members.map((m) => (
          <div
            key={m.id}
            className="flex items-center justify-between gap-2 p-4 rounded-xl bg-slate-50 border border-slate-200"
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium text-slate-900 truncate">{m.name}</p>
              <p className="text-sm text-slate-500">
                {m.birthYear && `${m.birthYear}年`}
                {m.gender === 'male' && '・男'}
                {m.gender === 'female' && '・女'}
                {m.gender === 'other' && '・その他'}
                {m.allergy && m.allergy !== 'なし' && ` ／ アレルギー: ${m.allergy}`}
              </p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                type="button"
                onClick={() => openEditForm(m)}
                className="p-2 text-slate-600 rounded-lg hover:bg-slate-200"
                aria-label="編集"
              >
                <Pencil className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(m.id)}
                className={`p-2 rounded-lg ${
                  deleteConfirmId === m.id ? 'bg-red-500 text-white' : 'text-red-600 hover:bg-red-50'
                }`}
                aria-label={deleteConfirmId === m.id ? '削除を確定' : '削除'}
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
        {deleteConfirmId && (
          <p className="text-sm text-red-600 px-2">もう一度削除ボタンを押すと削除されます</p>
        )}
      </div>

      <div className="p-4 pt-0">
        <button
          type="button"
          onClick={openAddForm}
          className="w-full py-4 rounded-2xl border-2 border-dashed border-slate-300 text-slate-600 font-medium flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          家族を追加
        </button>
      </div>

      {formOpen && (
        <FamilyMemberForm
          member={formMember}
          onSave={handleSaveForm}
          onClose={() => { setFormOpen(false); setFormMember(null); }}
        />
      )}
    </div>
  );
}
