import { useState } from 'react';

interface SaveButtonProps {
  onSave: () => Promise<void>;
  onCancel?: () => void;
  disabled?: boolean;
}

export default function SaveButton({
  onSave,
  onCancel,
  disabled = false,
}: SaveButtonProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');

    try {
      await onSave();
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('保存失败:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={handleSave}
        disabled={disabled || isSaving}
        className={`px-4 py-2 rounded-xl font-medium text-white shadow-sm transition-all ${
          isSaving
            ? 'bg-slate-400 cursor-not-allowed shadow-none'
            : saveStatus === 'success'
              ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-900/20'
              : saveStatus === 'error'
                ? 'bg-red-500 hover:bg-red-600 shadow-red-900/20'
                : 'bg-primary-600 hover:bg-primary-700 shadow-primary-900/25'
        }`}
      >
        {isSaving
          ? '保存中...'
          : saveStatus === 'success'
            ? '保存成功'
            : saveStatus === 'error'
              ? '保存失败'
              : '保存'}
      </button>
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="px-4 py-2 rounded-xl font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-50 border border-slate-200/80"
        >
          取消
        </button>
      )}
    </div>
  );
}
