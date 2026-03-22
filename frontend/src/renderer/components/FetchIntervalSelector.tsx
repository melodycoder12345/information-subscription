interface FetchIntervalSelectorProps {
  value: number; // 秒数
  onChange: (seconds: number) => void;
  disabled?: boolean;
}

const INTERVAL_OPTIONS = [
  { label: '15分钟', value: 900 },
  { label: '30分钟', value: 1800 },
  { label: '1小时', value: 3600 },
  { label: '2小时', value: 7200 },
  { label: '6小时', value: 21600 },
  { label: '12小时', value: 43200 },
  { label: '1天', value: 86400 },
  { label: '2天', value: 172800 },
  { label: '1周', value: 604800 },
];

export default function FetchIntervalSelector({
  value,
  onChange,
  disabled = false,
}: FetchIntervalSelectorProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      disabled={disabled}
      className="px-3 py-2 border border-slate-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-400/80 focus:border-primary-300 disabled:opacity-50"
    >
      {INTERVAL_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
