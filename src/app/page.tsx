'use client';

import { useState, useEffect, useCallback } from 'react';
import { PlusCircle, Stethoscope, Archive, Eraser } from 'lucide-react';
import type { FamilyMember, SymptomLog } from '@/lib/types';
import type { PickerPayload } from '@/components/SymptomPicker';
import {
  loadFamily,
  saveFamily,
  loadLogs,
  saveLogs,
  archiveOldLogs,
  DEFAULT_FAMILY,
  generateMemberId,
} from '@/lib/storage';
import {
  getChiefComplaintAuto,
  toSummaryLogs,
  getContextFromLogs,
  getContextLines,
  getPatientInfo,
} from '@/lib/summary';
import FamilyTabs from '@/components/FamilyTabs';
import LogTimeline from '@/components/LogTimeline';
import SymptomPicker from '@/components/SymptomPicker';
import DoctorView from '@/components/DoctorView';
import FamilyMemberForm from '@/components/FamilyMemberForm';
import FamilySettings from '@/components/FamilySettings';
import ChiefComplaintModal from '@/components/ChiefComplaintModal';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function Home() {
  const [family, setFamily] = useState<FamilyMember[]>(DEFAULT_FAMILY);
  const [activeMemberId, setActiveMemberId] = useState<string>(DEFAULT_FAMILY[0]?.id ?? 'self');
  const [logs, setLogs] = useState<SymptomLog[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [chiefModalOpen, setChiefModalOpen] = useState(false);
  const [chiefDraft, setChiefDraft] = useState<{ chief1: string; chief2: string | null } | null>(null);
  const [doctorView, setDoctorView] = useState<{
    summary: string;
    chief1: string;
    chief2: string | null;
    contextLines: string[];
  } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [archiveMessage, setArchiveMessage] = useState<string | null>(null);
  const [clearConfirm, setClearConfirm] = useState(false);

  const activeMember = family.find((m) => m.id === activeMemberId) ?? family[0];

  useEffect(() => {
    const loaded = loadFamily();
    setFamily(loaded);
    setActiveMemberId((current) => {
      const exists = loaded.some((m) => m.id === current);
      return exists ? current : loaded[0]?.id ?? 'self';
    });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setLogs(loadLogs(activeMemberId));
  }, [activeMemberId]);

  const handleAddMember = useCallback((data: Omit<FamilyMember, 'id'>) => {
    const newMember: FamilyMember = { ...data, id: generateMemberId() };
    setFamily((prev) => {
      const next = [...prev, newMember];
      saveFamily(next);
      return next;
    });
    setActiveMemberId(newMember.id);
    setToast('追加しました');
    setTimeout(() => setToast(null), 2000);
  }, []);

  const handleEditMember = useCallback((id: string, data: Partial<FamilyMember>) => {
    setFamily((prev) => {
      const next = prev.map((m) => (m.id === id ? { ...m, ...data } : m));
      saveFamily(next);
      return next;
    });
    setToast('保存しました');
    setTimeout(() => setToast(null), 2000);
  }, []);

  const handleDeleteMember = useCallback((id: string) => {
    let newFirstId: string | null = null;
    setFamily((prev) => {
      const next = prev.filter((m) => m.id !== id);
      if (next.length === 0) {
        saveFamily(DEFAULT_FAMILY);
        newFirstId = DEFAULT_FAMILY[0]?.id ?? 'self';
        return DEFAULT_FAMILY;
      }
      saveFamily(next);
      if (prev.some((m) => m.id === id)) {
        newFirstId = next[0].id;
      }
      return next;
    });
    setActiveMemberId((current) => (current === id ? (newFirstId ?? current) : current));
    setToast('削除しました');
    setTimeout(() => setToast(null), 2000);
  }, []);

  const persistLogs = useCallback(
    (next: SymptomLog[]) => {
      setLogs(next);
      saveLogs(activeMemberId, next);
    },
    [activeMemberId]
  );

  const handleAddLog = useCallback(
    (payload: PickerPayload) => {
      const log: SymptomLog = {
        id: generateId(),
        timestamp: new Date().toISOString(),
        timeRange: payload.timeRange,
        type: payload.type,
        severity: payload.severity,
        value: payload.value,
        mood: payload.mood,
        appetite: payload.appetite,
      };
      persistLogs([...logs, log]);
      setToast('保存しました');
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(20);
      }
      setTimeout(() => setToast(null), 2000);
    },
    [logs, persistLogs]
  );

  const handleArchive = useCallback(() => {
    const { archived, count } = archiveOldLogs(activeMemberId);
    if (archived && count > 0) {
      setLogs(loadLogs(activeMemberId));
      setArchiveMessage(`${count}件の古い記録をアーカイブしました`);
      setTimeout(() => setArchiveMessage(null), 3000);
    } else {
      setArchiveMessage('48時間以内の記録のみです（アーカイブ不要）');
      setTimeout(() => setArchiveMessage(null), 2500);
    }
  }, [activeMemberId]);

  const handleClearAllLogs = useCallback(() => {
    if (!clearConfirm) {
      setClearConfirm(true);
      setToast('もう一度押すと、この人の症状が全て消えます');
      setTimeout(() => setToast(null), 2500);
      setTimeout(() => setClearConfirm(false), 3000);
      return;
    }
    setClearConfirm(false);
    persistLogs([]);
    setToast('症状を全てクリアしました');
    setTimeout(() => setToast(null), 2000);
  }, [clearConfirm, persistLogs]);

  const runSummarize = useCallback(async (chief1: string, chief2: string | null) => {
    if (!activeMember) return;
    const patientInfo = getPatientInfo(activeMember);
    const summaryLogs = toSummaryLogs(logs);
    const context = getContextFromLogs(logs);

    try {
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientInfo: { ...patientInfo, allergies: activeMember.allergy },
          logs: summaryLogs,
          context,
          chiefComplaints: [chief1 || '（なし）', chief2 || ''],
        }),
      });
      const contentType = res.headers.get('content-type') ?? '';
      const text = await res.text();
      const data = contentType.includes('application/json') ? JSON.parse(text) : null;
      if (!res.ok) {
        const msg =
          (data && typeof data === 'object' && 'error' in data && typeof (data as any).error === 'string'
            ? (data as any).error
            : `要約APIが失敗しました（HTTP ${res.status}）`);
        throw new Error(msg);
      }

      setDoctorView({
        summary: (data && typeof data === 'object' && 'summary' in data ? (data as any).summary : '') ?? '',
        chief1: chief1 || '（なし）',
        chief2: chief2 || null,
        contextLines: getContextLines(logs),
      });
    } catch (e) {
      const raw = e instanceof Error ? e.message : '要約の取得に失敗しました';
      const msg =
        raw === 'Failed to fetch' || raw.includes('Failed to fetch')
          ? `要約APIに接続できません（Failed to fetch）。現在のURL: ${typeof window !== 'undefined' ? window.location.origin : ''}`
          : raw;
      setToast(msg);
      setTimeout(() => setToast(null), 3000);
    }
  }, [activeMember, logs]);

  const handleShowDoctor = useCallback(() => {
    const auto = getChiefComplaintAuto(logs);
    setChiefDraft({ chief1: auto[0] || '（なし）', chief2: auto[1] ? auto[1] : null });
    setChiefModalOpen(true);
  }, [logs]);

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto bg-slate-50">
      <FamilyTabs
        members={family}
        activeId={activeMemberId}
        onSelect={setActiveMemberId}
        onAddClick={() => setShowAddForm(true)}
        onSettingsClick={() => setShowSettings(true)}
      />

      <main className="flex-1 px-4 pt-4 pb-32">
        <h1 className="text-lg font-bold text-slate-800 mb-2">症状ログ</h1>
        <LogTimeline logs={logs} />

        {archiveMessage && (
          <p className="text-sm text-slate-600 py-2">{archiveMessage}</p>
        )}

        <div className="flex flex-wrap gap-2 mt-4">
          <button
            type="button"
            onClick={handleArchive}
            className="inline-flex items-center gap-2 py-2 px-4 rounded-xl bg-slate-200 text-slate-700 text-sm font-medium"
          >
            <Archive className="w-4 h-4" />
            48時間経過分をアーカイブ
          </button>
          <button
            type="button"
            onClick={handleClearAllLogs}
            className={`inline-flex items-center gap-2 py-2 px-4 rounded-xl text-sm font-bold ${
              clearConfirm ? 'bg-red-600 text-white' : 'bg-red-100 text-red-700'
            }`}
          >
            <Eraser className="w-4 h-4" />
            症状を全てクリア
          </button>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 flex flex-col gap-2 bg-gradient-to-t from-slate-50 to-transparent pt-8">
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="w-full py-4 rounded-2xl bg-slate-800 text-white font-bold text-lg flex items-center justify-center gap-2 shadow-lg active:scale-[0.98]"
        >
          <PlusCircle className="w-6 h-6" />
          記録する
        </button>
        <button
          type="button"
          onClick={handleShowDoctor}
          className="w-full py-4 rounded-2xl bg-blue-600 text-white font-bold text-lg flex items-center justify-center gap-2 shadow-lg active:scale-[0.98]"
        >
          <Stethoscope className="w-6 h-6" />
          先生に見せる
        </button>
      </div>

      {pickerOpen && (
        <SymptomPicker
          onAdd={handleAddLog}
          onClose={() => setPickerOpen(false)}
        />
      )}

      {showAddForm && (
        <FamilyMemberForm
          member={null}
          onSave={(data) => {
            handleAddMember(data);
            setShowAddForm(false);
          }}
          onClose={() => setShowAddForm(false)}
        />
      )}

      {showSettings && (
        <FamilySettings
          members={family}
          onClose={() => setShowSettings(false)}
          onAddMember={handleAddMember}
          onEditMember={handleEditMember}
          onDeleteMember={handleDeleteMember}
        />
      )}

      {chiefModalOpen && (
        <ChiefComplaintModal
          logs={logs}
          initialChief1={chiefDraft?.chief1 ?? '（なし）'}
          initialChief2={chiefDraft?.chief2 ?? ''}
          onClose={() => setChiefModalOpen(false)}
          onConfirm={(c1, c2) => {
            setChiefModalOpen(false);
            runSummarize(c1, c2);
          }}
        />
      )}

      {doctorView && activeMember && (
        <DoctorView
          patientName={activeMember.name}
          allergy={activeMember.allergy}
          chiefComplaint1={doctorView.chief1}
          chiefComplaint2={doctorView.chief2}
          summary={doctorView.summary}
          contextLines={doctorView.contextLines}
          onClose={() => setDoctorView(null)}
        />
      )}

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 max-w-md w-[90%] py-3 px-4 rounded-xl bg-slate-800 text-white text-center text-sm font-medium shadow-lg z-50">
          {toast}
        </div>
      )}
    </div>
  );
}
