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
        onClick={handleSave}
        disabled={disabled || isSaving}
        className={`px-4 py-2 rounded-md font-medium transition-colors ${
          isSaving
            ? 'bg-gray-400 cursor-not-allowed'
            : saveStatus === 'success'
            ? 'bg-green-500 hover:bg-green-600'
            : saveStatus === 'error'
            ? 'bg-red-500 hover:bg-red-600'
            : 'bg-blue-500 hover:bg-blue-600'
        } text-white`}
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
          onClick={onCancel}
          disabled={isSaving}
          className="px-4 py-2 rounded-md font-medium bg-gray-200 hover:bg-gray-300 text-gray-700 disabled:opacity-50"
        >
          取消
        </button>
      )}
    </div>
  );
}
