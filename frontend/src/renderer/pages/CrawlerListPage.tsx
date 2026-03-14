import { useState, useEffect } from 'react';
import { useCrawlers, useAddCrawler, useUpdateCrawler, useDeleteCrawler } from '../hooks/useCrawlers';
import { Crawler } from '../types';

const INTERVAL_OPTIONS = [
  { label: '15 分钟', value: 900 },
  { label: '30 分钟', value: 1800 },
  { label: '1 小时', value: 3600 },
  { label: '2 小时', value: 7200 },
  { label: '6 小时', value: 21600 },
  { label: '12 小时', value: 43200 },
  { label: '每天', value: 86400 },
  { label: '每周', value: 604800 },
];

export default function CrawlerListPage() {
  const { data: crawlers = [], isLoading } = useCrawlers();
  const addCrawler = useAddCrawler();
  const updateCrawler = useUpdateCrawler();
  const deleteCrawler = useDeleteCrawler();

  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [globalInterval, setGlobalInterval] = useState(86400);
  const [newCrawler, setNewCrawler] = useState<Partial<Crawler>>({
    name: '', url: '', selector: '',
    fetch_interval: 86400, enabled: true, is_default: false,
  });

  useEffect(() => {
    window.electronAPI.db.getSetting('crawlerFetchInterval').then((v) => {
      if (v) setGlobalInterval(Number(v));
    });
  }, []);

  const handleIntervalChange = async (value: number) => {
    setGlobalInterval(value);
    await window.electronAPI.db.setSetting('crawlerFetchInterval', String(value));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = await window.electronAPI.db.getSetting('githubToken');
      const repo = await window.electronAPI.db.getSetting('githubRepo');
      if (token && repo) {
        const all = await window.electronAPI.db.getCrawlers();
        await window.electronAPI.github.pushConfig({
          crawlers: all.map((c: any) => ({
            id: c.id, name: c.name, url: c.url, selector: c.selector,
            fetchInterval: globalInterval, enabled: c.enabled,
            isDefault: c.is_default === 1,
            filterKeywords: c.filter_keywords ? JSON.parse(c.filter_keywords) : [],
          })),
        });
      }
      setHasChanges(false);
    } catch (e) { console.error(e); }
    finally { setIsSaving(false); }
  };

  const handleAdd = async () => {
    if (!newCrawler.name || !newCrawler.url || !newCrawler.selector) return;
    await addCrawler.mutateAsync({ ...newCrawler, fetch_interval: globalInterval } as Omit<Crawler, 'id'>);
    setIsAdding(false);
    setNewCrawler({ name: '', url: '', selector: '', fetch_interval: globalInterval, enabled: true, is_default: false });
    setHasChanges(true);
  };

  const handleToggle = async (id: number, enabled: boolean) => {
    await updateCrawler.mutateAsync({ id, crawler: { enabled } });
    setHasChanges(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除这个爬虫吗？')) return;
    await deleteCrawler.mutateAsync(id);
    setHasChanges(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const intervalLabel = INTERVAL_OPTIONS.find((o) => o.value === globalInterval)?.label ?? '每天';

  return (
    <div className="flex flex-col h-full">
      {/* 页头 */}
      <div className="flex items-center justify-between px-8 py-5 bg-white border-b border-gray-100">
        <div>
          <h1 className="text-xl font-bold text-gray-900">网页爬虫</h1>
          <p className="text-gray-400 text-xs mt-0.5">共 {crawlers.length} 个爬虫任务</p>
        </div>
        <div className="flex items-center gap-3">
          {/* 全局抓取频率 */}
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
            <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs text-gray-500 whitespace-nowrap">抓取频率</span>
            <select
              value={globalInterval}
              onChange={(e) => handleIntervalChange(Number(e.target.value))}
              className="text-xs font-medium text-gray-700 bg-transparent border-none outline-none cursor-pointer"
            >
              {INTERVAL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {hasChanges && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60"
            >
              {isSaving
                ? <span className="animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
                : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
              }
              {isSaving ? '推送中…' : '推送到 GitHub'}
            </button>
          )}
          <button
            onClick={() => setIsAdding((v) => !v)}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            添加爬虫
          </button>
        </div>
      </div>

      {/* 频率说明条 */}
      <div className="px-8 py-2 bg-violet-50 border-b border-violet-100 flex items-center gap-2">
        <svg className="w-3.5 h-3.5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-xs text-violet-600">
          所有爬虫任务统一使用 <strong>{intervalLabel}</strong> 频率抓取
        </p>
      </div>

      {/* 添加表单 */}
      {isAdding && (
        <div className="px-8 py-4 bg-violet-50 border-b border-violet-100">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">名称 *</label>
              <input
                type="text"
                placeholder="AI 资讯爬虫"
                value={newCrawler.name}
                onChange={(e) => setNewCrawler({ ...newCrawler, name: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-violet-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">目标地址 *</label>
              <input
                type="text"
                placeholder="https://..."
                value={newCrawler.url}
                onChange={(e) => setNewCrawler({ ...newCrawler, url: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-violet-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">CSS 选择器 *</label>
              <input
                type="text"
                placeholder=".article-title"
                value={newCrawler.selector}
                onChange={(e) => setNewCrawler({ ...newCrawler, selector: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-violet-400"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <button onClick={() => setIsAdding(false)} className="px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">取消</button>
            <button
              onClick={handleAdd}
              disabled={!newCrawler.name || !newCrawler.url || !newCrawler.selector}
              className="px-4 py-1.5 text-sm bg-violet-600 hover:bg-violet-700 text-white rounded-lg disabled:opacity-50 font-medium"
            >
              确认添加
            </button>
          </div>
        </div>
      )}

      {/* 表头 */}
      <div className="grid grid-cols-[1fr_1.5fr_1.5fr_80px_80px] gap-4 px-8 py-3 bg-gray-50 border-b border-gray-100 text-xs font-medium text-gray-500 uppercase tracking-wide">
        <div>名称</div>
        <div>目标地址</div>
        <div>CSS 选择器</div>
        <div className="text-center">状态</div>
        <div className="text-center">操作</div>
      </div>

      {/* 列表 */}
      <div className="flex-1 overflow-y-auto">
        {crawlers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <svg className="w-12 h-12 mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
            <p className="text-sm font-medium">暂无爬虫任务</p>
            <p className="text-xs mt-1 text-gray-300">点击右上角「添加爬虫」</p>
          </div>
        ) : (
          crawlers.map((crawler, idx) => {
            const keywords = crawler.filter_keywords
              ? (() => { try { return JSON.parse(crawler.filter_keywords as any); } catch { return []; } })()
              : [];

            return (
              <div
                key={crawler.id}
                className={`grid grid-cols-[1fr_1.5fr_1.5fr_80px_80px] gap-4 px-8 py-4 items-center border-b border-gray-50 hover:bg-gray-50/60 transition-colors ${
                  !crawler.enabled ? 'opacity-50' : ''
                } ${idx % 2 === 0 ? '' : 'bg-gray-50/30'}`}
              >
                {/* 名称 */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${crawler.enabled ? 'bg-emerald-400' : 'bg-gray-300'}`} />
                    <span className="text-sm font-medium text-gray-800 truncate">{crawler.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 ml-3.5">
                    {crawler.is_default === 1 && (
                      <span className="px-1.5 py-0.5 bg-violet-50 text-violet-500 text-xs rounded">内置</span>
                    )}
                    {keywords.length > 0 && (
                      <span className="px-1.5 py-0.5 bg-amber-50 text-amber-500 text-xs rounded">AI 过滤</span>
                    )}
                  </div>
                </div>

                {/* URL */}
                <div className="min-w-0">
                  <p className="text-xs text-gray-400 truncate font-mono">{crawler.url}</p>
                </div>

                {/* 选择器 */}
                <div className="min-w-0">
                  <code className="text-xs text-violet-600 bg-violet-50 px-2 py-0.5 rounded font-mono truncate block">
                    {crawler.selector}
                  </code>
                </div>

                {/* 开关 */}
                <div className="flex justify-center">
                  <button
                    onClick={() => handleToggle(crawler.id!, !crawler.enabled)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      crawler.enabled ? 'bg-violet-500' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      style={{ transform: crawler.enabled ? 'translateX(18px)' : 'translateX(2px)' }}
                      className="inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform"
                    />
                  </button>
                </div>

                {/* 删除 */}
                <div className="flex justify-center">
                  {crawler.is_default !== 1 ? (
                    <button
                      onClick={() => handleDelete(crawler.id!)}
                      className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                      title="删除"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  ) : (
                    <span className="text-xs text-gray-200">—</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
