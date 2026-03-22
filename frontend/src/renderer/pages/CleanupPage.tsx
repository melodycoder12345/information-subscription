import { useState, useEffect } from 'react';
import { Archive, Clock, Loader2, Trash2, TriangleAlert } from 'lucide-react';

export default function CleanupPage() {
  const [enabled, setEnabled] = useState(true);
  const [retentionDays, setRetentionDays] = useState(90);
  const [cleanupMode, setCleanupMode] = useState<'delete' | 'archive'>('delete');
  const [stats, setStats] = useState({ articleCount: 0, feedCount: 0, crawlerCount: 0, dbSize: 0 });
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleanResult, setCleanResult] = useState<string | null>(null);

  useEffect(() => { loadConfig(); loadStats(); }, []);

  const loadConfig = async () => {
    const enabledStr = await window.electronAPI.db.getSetting('cleanupEnabled');
    const retentionStr = await window.electronAPI.db.getSetting('retentionDays');
    const modeStr = await window.electronAPI.db.getSetting('cleanupMode');
    if (enabledStr) setEnabled(enabledStr === 'true');
    if (retentionStr) setRetentionDays(Number(retentionStr));
    if (modeStr) setCleanupMode(modeStr as 'delete' | 'archive');
  };

  const loadStats = async () => {
    const statsData = await window.electronAPI.db.getDatabaseStats();
    setStats(statsData);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await window.electronAPI.db.setSetting('cleanupEnabled', enabled.toString());
      await window.electronAPI.db.setSetting('retentionDays', retentionDays.toString());
      await window.electronAPI.db.setSetting('cleanupMode', cleanupMode);
      setHasChanges(false);
    } finally { setIsSaving(false); }
  };

  const handleManualCleanup = async () => {
    if (!confirm(`确定清理 ${retentionDays} 天前的数据吗？`)) return;
    setIsCleaning(true);
    setCleanResult(null);
    try {
      const result = await window.electronAPI.db.cleanupOldArticles(retentionDays, cleanupMode);
      setCleanResult(cleanupMode === 'delete' ? `删除了 ${result.deleted} 条记录` : `归档了 ${result.archived} 条记录`);
      loadStats();
    } catch (e: any) { setCleanResult(`清理失败: ${e.message}`); }
    finally { setIsCleaning(false); }
  };

  const Toggle = () => (
    <button type="button" onClick={() => { setEnabled(!enabled); setHasChanges(true); }}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? 'bg-rose-500' : 'bg-gray-200'}`}
    >
      <span style={{ transform: enabled ? 'translateX(22px)' : 'translateX(2px)' }}
        className="inline-block h-5 w-5 rounded-full bg-white shadow transition-transform" />
    </button>
  );

  const StatCard = ({ label, value, sub }: { label: string; value: string | number; sub?: string }) => (
    <div className="bg-white rounded-2xl border border-slate-200/70 shadow-card p-6">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{label}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* 页头 */}
      <div className="flex items-center justify-between px-8 py-5 bg-white/90 border-b border-slate-200/80 shadow-sm backdrop-blur-sm">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">数据管理</h1>
          <p className="text-slate-500 text-xs mt-0.5">控制本地 SQLite 数据库的增长</p>
        </div>
        {hasChanges && (
          <button type="button" onClick={handleSave} disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium rounded-xl shadow-md shadow-rose-900/20 transition-all disabled:opacity-60"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" strokeWidth={2} aria-hidden /> : null}
            {isSaving ? '保存中…' : '保存配置'}
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-8 min-h-0">
        {/* 统计卡片 */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <StatCard label="文章总数" value={stats.articleCount} sub="条记录" />
          <StatCard label="RSS 订阅源" value={stats.feedCount} sub="个" />
          <StatCard label="爬虫任务" value={stats.crawlerCount} sub="个" />
          <StatCard
            label="数据库大小"
            value={stats.dbSize < 1024 * 1024
              ? `${(stats.dbSize / 1024).toFixed(1)} KB`
              : `${(stats.dbSize / 1024 / 1024).toFixed(2)} MB`
            }
            sub="本地 SQLite"
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* 自动清理配置 */}
          <div className="bg-white rounded-2xl border border-slate-200/70 shadow-card overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/60 bg-slate-50/90">
              <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <Clock className="w-4 h-4 text-rose-500 shrink-0" strokeWidth={2} aria-hidden />
                自动清理
              </h2>
              <Toggle />
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">保留天数</label>
                <div className="grid grid-cols-5 gap-2">
                  {[7, 30, 90, 180, 365].map(d => (
                    <button key={d} onClick={() => { setRetentionDays(d); setHasChanges(true); }}
                      className={`py-2 text-sm rounded-lg border-2 font-medium transition-all ${
                        retentionDays === d ? 'border-rose-400 bg-rose-50 text-rose-700' : 'border-gray-100 text-gray-600 hover:border-gray-200'
                      }`}
                    >
                      {d < 365 ? `${d}天` : '1年'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">清理方式</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'delete' as const, label: '直接删除', desc: '节省磁盘空间', Icon: Trash2 },
                    { value: 'archive' as const, label: '归档', desc: '保留但标记为旧', Icon: Archive },
                  ].map((opt) => {
                    const ModeIcon = opt.Icon;
                    return (
                    <button key={opt.value} type="button" onClick={() => { setCleanupMode(opt.value); setHasChanges(true); }}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        cleanupMode === opt.value ? 'border-rose-400 bg-rose-50' : 'border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <div className="mb-1 text-rose-600">
                        <ModeIcon className="w-5 h-5" strokeWidth={2} aria-hidden />
                      </div>
                      <p className="text-sm font-semibold text-gray-800">{opt.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{opt.desc}</p>
                    </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* 手动清理 */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200/70 shadow-card overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200/60 bg-slate-50/90">
                <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-gray-500 shrink-0" strokeWidth={2} aria-hidden />
                  手动清理
                </h2>
              </div>
              <div className="px-6 py-5">
                <p className="text-sm text-gray-600 mb-4">
                  将立即清理 <strong>{retentionDays}</strong> 天之前的文章数据，使用
                  <strong>「{cleanupMode === 'delete' ? '直接删除' : '归档'}」</strong>模式。
                </p>
                <button type="button" onClick={handleManualCleanup} disabled={isCleaning}
                  className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium rounded-xl shadow-md shadow-rose-900/20 transition-all disabled:opacity-60"
                >
                  {isCleaning
                    ? <Loader2 className="w-4 h-4 animate-spin shrink-0" strokeWidth={2} aria-hidden />
                    : <Trash2 className="w-4 h-4 shrink-0" strokeWidth={2} aria-hidden />
                  }
                  {isCleaning ? '清理中…' : '立即清理'}
                </button>
                {cleanResult && (
                  <p className={`mt-3 text-sm ${cleanResult.includes('失败') ? 'text-red-500' : 'text-emerald-600'}`}>
                    {cleanResult.includes('失败') ? '✗' : '✓'} {cleanResult}
                  </p>
                )}
              </div>
            </div>

            <div className="bg-amber-50 rounded-xl border border-amber-100 px-6 py-4">
              <p className="text-xs font-semibold text-amber-700 mb-1.5 flex items-center gap-1.5">
                <TriangleAlert className="w-3.5 h-3.5 shrink-0 text-amber-600" strokeWidth={2} aria-hidden />
                注意
              </p>
              <p className="text-xs text-amber-600 leading-relaxed">
                删除模式会永久移除旧文章，无法恢复。建议先使用归档模式测试，确认无误后再切换到删除模式。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
