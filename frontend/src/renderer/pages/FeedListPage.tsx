import { useState, useEffect } from 'react';
import { useFeeds, useAddFeed, useUpdateFeed, useDeleteFeed } from '../hooks/useFeeds';
import { Feed } from '../types';

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

export default function FeedListPage() {
  const { data: feeds = [], isLoading } = useFeeds();
  const addFeed = useAddFeed();
  const updateFeed = useUpdateFeed();
  const deleteFeed = useDeleteFeed();

  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [globalInterval, setGlobalInterval] = useState(3600);
  const [newFeed, setNewFeed] = useState<Partial<Feed>>({
    title: '', url: '', description: '',
    fetch_interval: 3600, enabled: true, is_default: false, filter_keywords: [],
  });

  useEffect(() => {
    window.electronAPI.db.getSetting('feedFetchInterval').then((v) => {
      if (v) setGlobalInterval(Number(v));
    });
  }, []);

  const handleIntervalChange = async (value: number) => {
    setGlobalInterval(value);
    await window.electronAPI.db.setSetting('feedFetchInterval', String(value));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = await window.electronAPI.db.getSetting('githubToken');
      const repo = await window.electronAPI.db.getSetting('githubRepo');
      if (token && repo) {
        const all = await window.electronAPI.db.getFeeds();
        await window.electronAPI.github.pushConfig({
          feeds: all.map((f: any) => ({
            id: f.id, title: f.title, url: f.url, description: f.description,
            fetchInterval: globalInterval, enabled: f.enabled,
            isDefault: f.is_default === 1,
            filterKeywords: f.filter_keywords ? JSON.parse(f.filter_keywords) : [],
          })),
        });
      }
      setHasChanges(false);
    } catch (e) { console.error(e); }
    finally { setIsSaving(false); }
  };

  const handleAddFeed = async () => {
    if (!newFeed.title || !newFeed.url) return;
    await addFeed.mutateAsync({ ...newFeed, fetch_interval: globalInterval } as Omit<Feed, 'id'>);
    setIsAdding(false);
    setNewFeed({ title: '', url: '', description: '', fetch_interval: globalInterval, enabled: true, is_default: false, filter_keywords: [] });
    setHasChanges(true);
  };

  const handleToggle = async (id: number, enabled: boolean) => {
    await updateFeed.mutateAsync({ id, feed: { enabled } });
    setHasChanges(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除这个订阅源吗？')) return;
    await deleteFeed.mutateAsync(id);
    setHasChanges(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const intervalLabel = INTERVAL_OPTIONS.find((o) => o.value === globalInterval)?.label ?? '1 小时';

  return (
    <div className="flex flex-col h-full">
      {/* 页头 */}
      <div className="flex items-center justify-between px-8 py-5 bg-white border-b border-gray-100">
        <div>
          <h1 className="text-xl font-bold text-gray-900">RSS 订阅</h1>
          <p className="text-gray-400 text-xs mt-0.5">共 {feeds.length} 个订阅源</p>
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
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            添加订阅
          </button>
        </div>
      </div>

      {/* 频率说明条 */}
      <div className="px-8 py-2 bg-indigo-50 border-b border-indigo-100 flex items-center gap-2">
        <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-xs text-indigo-600">
          所有订阅源统一使用 <strong>{intervalLabel}</strong> 频率抓取
        </p>
      </div>

      {/* 添加表单 */}
      {isAdding && (
        <div className="px-8 py-4 bg-indigo-50 border-b border-indigo-100">
          <div className="grid grid-cols-3 gap-3 items-end">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">名称 *</label>
              <input
                type="text"
                placeholder="OpenAI Blog"
                value={newFeed.title}
                onChange={(e) => setNewFeed({ ...newFeed, title: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">RSS 地址 *</label>
              <input
                type="text"
                placeholder="https://..."
                value={newFeed.url}
                onChange={(e) => setNewFeed({ ...newFeed, url: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">描述（可选）</label>
              <input
                type="text"
                placeholder="简短说明"
                value={newFeed.description}
                onChange={(e) => setNewFeed({ ...newFeed, description: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <button onClick={() => setIsAdding(false)} className="px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">取消</button>
            <button
              onClick={handleAddFeed}
              disabled={!newFeed.title || !newFeed.url}
              className="px-4 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 font-medium"
            >
              确认添加
            </button>
          </div>
        </div>
      )}

      {/* 表头 */}
      <div className="grid grid-cols-[1fr_2fr_1fr_80px_80px] gap-4 px-8 py-3 bg-gray-50 border-b border-gray-100 text-xs font-medium text-gray-500 uppercase tracking-wide">
        <div>名称</div>
        <div>RSS 地址</div>
        <div>描述</div>
        <div className="text-center">状态</div>
        <div className="text-center">操作</div>
      </div>

      {/* 列表 */}
      <div className="flex-1 overflow-y-auto">
        {feeds.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <svg className="w-12 h-12 mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 5c7.18 0 13 5.82 13 13M6 11a7 7 0 017 7M6 17a1 1 0 110 2 1 1 0 010-2z" />
            </svg>
            <p className="text-sm font-medium">暂无订阅源</p>
            <p className="text-xs mt-1 text-gray-300">点击右上角「添加订阅」</p>
          </div>
        ) : (
          feeds.map((feed, idx) => {
            const keywords = Array.isArray(feed.filter_keywords)
              ? feed.filter_keywords
              : (feed.filter_keywords ? (() => { try { return JSON.parse(feed.filter_keywords as any); } catch { return []; } })() : []);

            return (
              <div
                key={feed.id}
                className={`grid grid-cols-[1fr_2fr_1fr_80px_80px] gap-4 px-8 py-4 items-center border-b border-gray-50 hover:bg-gray-50/60 transition-colors ${
                  !feed.enabled ? 'opacity-50' : ''
                } ${idx % 2 === 0 ? '' : 'bg-gray-50/30'}`}
              >
                {/* 名称 */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${feed.enabled ? 'bg-emerald-400' : 'bg-gray-300'}`} />
                    <span className="text-sm font-medium text-gray-800 truncate">{feed.title}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 ml-3.5">
                    {feed.is_default && (
                      <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-500 text-xs rounded">内置</span>
                    )}
                    {keywords.length > 0 && (
                      <span className="px-1.5 py-0.5 bg-amber-50 text-amber-500 text-xs rounded">AI 过滤</span>
                    )}
                  </div>
                </div>

                {/* URL */}
                <div className="min-w-0">
                  <p className="text-xs text-gray-400 truncate font-mono">{feed.url}</p>
                </div>

                {/* 描述 */}
                <div className="min-w-0">
                  <p className="text-xs text-gray-400 truncate">{feed.description || '—'}</p>
                </div>

                {/* 开关 */}
                <div className="flex justify-center">
                  <button
                    onClick={() => handleToggle(feed.id!, !feed.enabled)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      feed.enabled ? 'bg-indigo-500' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      style={{ transform: feed.enabled ? 'translateX(18px)' : 'translateX(2px)' }}
                      className="inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform"
                    />
                  </button>
                </div>

                {/* 删除 */}
                <div className="flex justify-center">
                  {!feed.is_default ? (
                    <button
                      onClick={() => handleDelete(feed.id!)}
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
