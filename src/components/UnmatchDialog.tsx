'use client';

import { useState } from 'react';
import { Loader2, HeartOff } from 'lucide-react';
import Modal from '@/components/Modal';

interface UnmatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Name of the other party, shown in the heading (store name or student name). */
  counterpartName: string;
  reasons: readonly string[];
  /** Called with the chosen reason and optional note; resolves when the unmatch is saved. */
  onConfirm: (reason: string, note: string | null) => Promise<void>;
}

export default function UnmatchDialog({
  open,
  onOpenChange,
  counterpartName,
  reasons,
  onConfirm,
}: UnmatchDialogProps) {
  const [reason, setReason] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const close = (o: boolean) => {
    if (saving) return;
    if (!o) {
      setReason(null);
      setNote('');
    }
    onOpenChange(o);
  };

  const confirm = async () => {
    if (!reason || saving) return;
    setSaving(true);
    try {
      await onConfirm(reason, reason === 'Andet' && note.trim() ? note.trim() : null);
      setReason(null);
      setNote('');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={close}
      title={`Ophæv match med ${counterpartName}`}
      variant="center"
      overlayClassName="z-[70] bg-black/60 backdrop-blur-sm"
      contentZClassName="z-[71]"
      contentClassName="w-[calc(100%-2.5rem)] max-w-sm bg-white rounded-3xl border border-[#EAE4D8] varm-card-shadow p-6 max-h-[85dvh] overflow-y-auto"
    >
      <div className="flex items-center gap-3 mb-1">
        <div className="w-10 h-10 rounded-full bg-[#FCEAE3] flex items-center justify-center shrink-0">
          <HeartOff size={18} className="text-[#B3412A]" />
        </div>
        <h2 className="text-lg font-bold text-[#211F1A] min-w-0">
          Ophæv match med <span className="break-words">{counterpartName}</span>
        </h2>
      </div>
      <p className="text-sm text-[#6E6759] mb-4">
        Chatten lukkes for jer begge, og {counterpartName} får besked med din
        begrundelse.
      </p>

      <fieldset className="space-y-2 mb-4">
        <legend className="text-sm font-semibold text-[#211F1A] mb-2">
          Hvorfor ophæver du matchet?
        </legend>
        {reasons.map((r) => (
          <label
            key={r}
            className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-colors ${
              reason === r
                ? 'bg-[#E1F2EF] border-[#C4E4DE]'
                : 'bg-[#FAF7F1] border-[#EAE4D8] hover:border-[#C4E4DE]'
            }`}
          >
            <input
              type="radio"
              name="unmatch-reason"
              value={r}
              checked={reason === r}
              onChange={() => setReason(r)}
              className="mt-0.5 accent-[#0E8578]"
            />
            <span className="text-sm text-[#211F1A]">{r}</span>
          </label>
        ))}
      </fieldset>

      {reason === 'Andet' && (
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Skriv kort hvorfor (valgfrit)"
          rows={3}
          maxLength={300}
          className="w-full rounded-2xl bg-[#FAF7F1] border border-[#EAE4D8] p-3 text-sm text-[#211F1A] placeholder:text-[#8B8471] focus:outline-none focus:ring-2 focus:ring-[#0E8578] mb-4"
        />
      )}

      <div className="space-y-2">
        <button
          onClick={confirm}
          disabled={!reason || saving}
          className="w-full py-4 rounded-2xl bg-[#B3412A] hover:bg-[#9A3722] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-40"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <HeartOff size={16} />}
          Ophæv match
        </button>
        <button
          onClick={() => close(false)}
          disabled={saving}
          className="w-full py-4 rounded-2xl bg-white border border-[#EAE4D8] text-[#211F1A] font-medium text-sm hover:bg-[#FAF7F1] transition-colors disabled:opacity-40"
        >
          Fortryd
        </button>
      </div>
    </Modal>
  );
}
