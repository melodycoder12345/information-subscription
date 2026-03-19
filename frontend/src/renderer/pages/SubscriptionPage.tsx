import { useState, useEffect } from 'react';
import { useFeeds, useAddFeed, useUpdateFeed, useDeleteFeed } from '../hooks/useFeeds';
import { useCrawlers, useAddCrawler, useUpdateCrawler, useDeleteCrawler } from '../hooks/useCrawlers';
import { Feed, Crawler } from '../types';

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

type Tab = 'feeds' | 'crawlers';

export default function SubscriptionPage() {
  const [tab, setTab] = useState<Tab>('feeds');
  const [globalInterval, setGlobalInterval] = useState(3600);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // feeds
  const { data: feeds = [], isLoading: feedsLoading } = useFeeds();
  const addFeed = useAddFeed();
  const updateFeed = useUpdateFeed();
  const deleteFeed = useDeleteFeed();
  const [isAddingFeed, setIsAddingFeed] = useState(false);
  const [editingFeedId, setEditingFeedId] = useState<number | null>(null);
  const [newFeed, setNewFeed] = useState<Partial<Feed>>({
    title: '', url: '', description: '', fetch_interval: 3600, enabled: true, is_default: false, filter_keywords: [],
  });
  const [editFeed, setEditFeed] = useState<Partial<Feed>>({});

  // crawlers
  const { data: crawlers = [], isLoading: crawlersLoading } = useCrawlers();
  const addCrawler = useAddCrawler();
  const updateCrawler = useUpdateCrawler();
  const deleteCrawler = useDeleteCrawler();
  const [isAddingCrawler, setIsAddingCrawler] = useState(false);
  const [editingCrawlerId, setEditingCrawlerId] = useState<number | null>(null);
  const [newCrawler, setNewCrawler] = useState<Partial<Crawler>>({
    name: '', url: '', selector: '', fetch_interval: 3600, enabled: true, is_default: false,
  });
  const [editCrawler, setEditCrawler] = useState<Partial<Crawler>>({});

  useEffect(() => {
    window.electronAPI.db.getSetting('fetchInterval').then((v) => {
      if (v) setGlobalInterval(Number(v));
    });
  }, []);

  const handleIntervalChange = async (value: number) => {
    setGlobalInterval(value);
    await window.electronAPI.db.setSetting('fetchInterval', String(value));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = await window.electronAPI.db.getSetting('githubToken');
      const repo = await window.electronAPI.db.getSetting('githubRepo');
      if (token && repo) {
        const allFeeds = await window.electronAPI.db.getFeeds();
        const allCrawlers = await window.electronAPI.db.getCrawlers();
        await window.electronAPI.github.pushConfig({
          feeds: allFeeds.map((f: any) => ({
            id: f.id, title: f.title, url: f.url, description: f.description,
            fetchInterval: globalInterval, enabled: f.enabled,
            isDefault: f.is_default === 1,
            filterKeywords: f.filter_keywords ? JSON.parse(f.filter_keywords) : [],
          })),
          crawlers: allCrawlers.map((c: any) => ({
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

  // ── Feed handlers ──
  const handleAddFeed = async () => {
    if (!newFeed.title || !newFeed.url) return;
    await addFeed.mutateAsync({ ...newFeed, fetch_interval: globalInterval } as Omit<Feed, 'id'>);
    setIsAddingFeed(false);
    setNewFeed({ title: '', url: '', description: '', fetch_interval: globalInterval, enabled: true, is_default: false, filter_keywords: [] });
    setHasChanges(true);
  };
  const handleStartEditFeed = (feed: Feed) => {
    setEditingFeedId(feed.id!);
    setEditFeed({ title: feed.title, url: feed.url, description: feed.description });
    setIsAddingFeed(false);
  };
  const handleSaveEditFeed = async () => {
    if (!editingFeedId || !editFeed.title || !editFeed.url) return;
    await updateFeed.mutateAsync({ id: editingFeedId, feed: editFeed });
    setEditingFeedId(null);
    setHasChanges(true);
  };
  const handleToggleFeed = async (id: number, enabled: boolean) => {
    await updateFeed.mutateAsync({ id, feed: { enabled } });
    setHasChanges(true);
  };
  const handleDeleteFeed = async (id: number) => {
    if (!confirm('确定删除这个订阅源吗？')) return;
    await deleteFeed.mutateAsync(id);
    setHasChanges(true);
  };

  // ── Crawler handlers ──
  const handleAddCrawler = async () => {
    if (!newCrawler.name || !newCrawler.url || !newCrawler.selector) return;
    await addCrawler.mutateAsync({ ...newCrawler, fetch_interval: globalInterval } as Omit<Crawler, 'id'>);
    setIsAddingCrawler(false);
    setNewCrawler({ name: '', url: '', selector: '', fetch_interval: globalInterval, enabled: true, is_default: false });
    setHasChanges(true);
  };
  const handleStartEditCrawler = (crawler: Crawler) => {
    setEditingCrawlerId(crawler.id!);
    setEditCrawler({ name: crawler.name, url: crawler.url, selector: crawler.selector });
    setIsAddingCrawler(false);
  };
  const handleSaveEditCrawler = async () => {
    if (!editingCrawlerId || !editCrawler.name || !editCrawler.url || !editCrawler.selector) return;
    await updateCrawler.mutateAsync({ id: editingCrawlerId, crawler: editCrawler });
    setEditingCrawlerId(null);
    setHasChanges(true);
  };
  const handleToggleCrawler = async (id: number, enabled: boolean) => {
    await updateCrawler.mutateAsync({ id, crawler: { enabled } });
    setHasChanges(true);
  };
  const handleDeleteCrawler = async (id: number) => {
    if (!confirm('确定删除这个爬虫吗？')) return;
    await deleteCrawler.mutateAsync(id);
    setHasChanges(true);
  };

  const isLoading = feedsLoading || crawlersLoading;

  const Toggle = ({ checked, onChange, color = 'indigo' }: { checked: boolean; onChange: () => void; color?: string }) => (
    <button
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
        checked ? (color === 'violet' ? 'bg-violet-500' : 'bg-indigo-500') : 'bg-gray-200'
      }`}
    >
      <span
        style={{ transform: checked ? 'translateX(18px)' : 'translateX(2px)' }}
        className="inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform"
      />
    </button>
  );

  const inputCls = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* ── 页头 ── */}
      <div className="flex items-center justify-between px-8 py-5 bg-white border-b border-gray-100">
        <div>
          <h1 className="text-xl font-bold text-gray-900">订阅管理</h1>
          <p className="text-gray-400 text-xs mt-0.5">
            {feeds.length} 个 RSS 订阅 · {crawlers.length} 个爬虫
          </p>
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
        </div>
      </div>

      {/* ── Tab 栏 ── */}
      <div className="flex items-center px-8 bg-white border-b border-gray-100">
        <button
          onClick={() => { setTab('feeds'); setIsAddingFeed(false); setIsAddingCrawler(false); setEditingFeedId(null); setEditingCrawlerId(null); }}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            tab === 'feeds' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-700'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 5c7.18 0 13 5.82 13 13M6 11a7 7 0 017 7M6 17a1 1 0 110 2 1 1 0 010-2z" />
          </svg>
          RSS 订阅
          <span className={`px-1.5 py-0.5 text-xs rounded-full ${tab === 'feeds' ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'}`}>
            {feeds.length}
          </span>
        </button>
        <button
          onClick={() => { setTab('crawlers'); setIsAddingFeed(false); setIsAddingCrawler(false); setEditingFeedId(null); setEditingCrawlerId(null); }}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            tab === 'crawlers' ? 'border-violet-500 text-violet-600' : 'border-transparent text-gray-400 hover:text-gray-700'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
          网页爬虫
          <span className={`px-1.5 py-0.5 text-xs rounded-full ${tab === 'crawlers' ? 'bg-violet-100 text-violet-600' : 'bg-gray-100 text-gray-500'}`}>
            {crawlers.length}
          </span>
        </button>

        {/* 添加按钮 — 右对齐 */}
        <div className="ml-auto py-2">
          {tab === 'feeds' ? (
            <button
              onClick={() => { setIsAddingFeed((v) => !v); setEditingFeedId(null); }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              添加订阅
            </button>
          ) : (
            <button
              onClick={() => { setIsAddingCrawler((v) => !v); setEditingCrawlerId(null); }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium rounded-lg transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              添加爬虫
            </button>
          )}
        </div>
      </div>

      {/* ════════════════════ RSS 订阅面板 ════════════════════ */}
      {tab === 'feeds' && (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* 添加表单 */}
          {isAddingFeed && (
            <div className="px-8 py-4 bg-indigo-50 border-b border-indigo-100">
              <p className="text-xs font-semibold text-indigo-600 mb-3">新增订阅源</p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">名称 *</label>
                  <input type="text" placeholder="OpenAI Blog" value={newFeed.title}
                    onChange={(e) => setNewFeed({ ...newFeed, title: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">RSS 地址 *</label>
                  <input type="text" placeholder="https://..." value={newFeed.url}
                    onChange={(e) => setNewFeed({ ...newFeed, url: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">描述（可选）</label>
                  <input type="text" placeholder="简短说明" value={newFeed.description}
                    onChange={(e) => setNewFeed({ ...newFeed, description: e.target.value })} className={inputCls} />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-3">
                <button onClick={() => setIsAddingFeed(false)} className="px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">取消</button>
                <button onClick={handleAddFeed} disabled={!newFeed.title || !newFeed.url}
                  className="px-4 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 font-medium">
                  确认添加
                </button>
              </div>
            </div>
          )}

          {/* 表头 */}
          <div className="grid grid-cols-[1fr_2fr_1fr_72px_96px] gap-4 px-8 py-3 bg-gray-50 border-b border-gray-100 text-xs font-medium text-gray-500 uppercase tracking-wide flex-shrink-0">
            <div>名称</div>
            <div>RSS 地址</div>
            <div>描述</div>
            <div className="text-center">状态</div>
            <div className="text-center">操作</div>
          </div>

          {/* 列表 */}
          <div className="flex-1 overflow-y-auto">
            {feeds.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                <svg className="w-10 h-10 mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 5c7.18 0 13 5.82 13 13M6 11a7 7 0 017 7M6 17a1 1 0 110 2 1 1 0 010-2z" />
                </svg>
                <p className="text-sm">暂无订阅源，点击右上角「添加订阅」</p>
              </div>
            ) : feeds.map((feed, idx) => {
              const isEditing = editingFeedId === feed.id;
              const keywords = Array.isArray(feed.filter_keywords) ? feed.filter_keywords
                : (feed.filter_keywords ? (() => { try { return JSON.parse(feed.filter_keywords as any); } catch { return []; } })() : []);

              return (
                <div key={feed.id}>
                  {/* 普通行 */}
                  <div className={`grid grid-cols-[1fr_2fr_1fr_72px_96px] gap-4 px-8 py-3.5 items-center border-b border-gray-50 hover:bg-gray-50/60 transition-colors ${!feed.enabled ? 'opacity-50' : ''} ${idx % 2 !== 0 ? 'bg-gray-50/30' : ''} ${isEditing ? 'bg-indigo-50/40' : ''}`}>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${feed.enabled ? 'bg-emerald-400' : 'bg-gray-300'}`} />
                        <span className="text-sm font-medium text-gray-800 truncate">{feed.title}</span>
                      </div>
                      <div className="flex gap-1.5 mt-1 ml-3.5">
                        {feed.is_default && <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-500 text-xs rounded">内置</span>}
                        {keywords.length > 0 && <span className="px-1.5 py-0.5 bg-amber-50 text-amber-500 text-xs rounded">AI 过滤</span>}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400 truncate font-mono">{feed.url}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400 truncate">{feed.description || '—'}</p>
                    </div>
                    <div className="flex justify-center">
                      <Toggle checked={!!feed.enabled} onChange={() => handleToggleFeed(feed.id!, !feed.enabled)} />
                    </div>
                    {/* 操作列：编辑 + 删除 */}
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => isEditing ? setEditingFeedId(null) : handleStartEditFeed(feed)}
                        className={`p-1.5 rounded-md transition-colors ${isEditing ? 'text-indigo-500 bg-indigo-50' : 'text-gray-300 hover:text-indigo-500 hover:bg-indigo-50'}`}
                        title="编辑"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      {!feed.is_default ? (
                        <button
                          onClick={() => handleDeleteFeed(feed.id!)}
                          className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                          title="删除"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      ) : (
                        <span className="w-7" />
                      )}
                    </div>
                  </div>

                  {/* 编辑展开区 */}
                  {isEditing && (
                    <div className="px-8 py-4 bg-indigo-50/60 border-b border-indigo-100">
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">名称 *</label>
                          <input type="text" value={editFeed.title ?? ''}
                            onChange={(e) => setEditFeed({ ...editFeed, title: e.target.value })}
                            className={inputCls} />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">RSS 地址 *</label>
                          <input type="text" value={editFeed.url ?? ''}
                            onChange={(e) => setEditFeed({ ...editFeed, url: e.target.value })}
                            className={inputCls} />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">描述</label>
                          <input type="text" value={editFeed.description ?? ''}
                            onChange={(e) => setEditFeed({ ...editFeed, description: e.target.value })}
                            className={inputCls} />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 mt-3">
                        <button onClick={() => setEditingFeedId(null)} className="px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">取消</button>
                        <button onClick={handleSaveEditFeed} disabled={!editFeed.title || !editFeed.url}
                          className="px-4 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 font-medium">
                          保存修改
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ════════════════════ 爬虫面板 ════════════════════ */}
      {tab === 'crawlers' && (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* 添加表单 */}
          {isAddingCrawler && (
            <div className="px-8 py-4 bg-violet-50 border-b border-violet-100">
              <p className="text-xs font-semibold text-violet-600 mb-3">新增爬虫任务</p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">名称 *</label>
                  <input type="text" placeholder="AI 资讯爬虫" value={newCrawler.name}
                    onChange={(e) => setNewCrawler({ ...newCrawler, name: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">目标地址 *</label>
                  <input type="text" placeholder="https://..." value={newCrawler.url}
                    onChange={(e) => setNewCrawler({ ...newCrawler, url: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">CSS 选择器 *</label>
                  <input type="text" placeholder=".article-title" value={newCrawler.selector}
                    onChange={(e) => setNewCrawler({ ...newCrawler, selector: e.target.value })} className={inputCls} />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-3">
                <button onClick={() => setIsAddingCrawler(false)} className="px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">取消</button>
                <button onClick={handleAddCrawler} disabled={!newCrawler.name || !newCrawler.url || !newCrawler.selector}
                  className="px-4 py-1.5 text-sm bg-violet-600 hover:bg-violet-700 text-white rounded-lg disabled:opacity-50 font-medium">
                  确认添加
                </button>
              </div>
            </div>
          )}

          {/* 表头 */}
          <div className="grid grid-cols-[1fr_1.5fr_1.5fr_72px_96px] gap-4 px-8 py-3 bg-gray-50 border-b border-gray-100 text-xs font-medium text-gray-500 uppercase tracking-wide flex-shrink-0">
            <div>名称</div>
            <div>目标地址</div>
            <div>CSS 选择器</div>
            <div className="text-center">状态</div>
            <div className="text-center">操作</div>
          </div>

          {/* 列表 */}
          <div className="flex-1 overflow-y-auto">
            {crawlers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                <svg className="w-10 h-10 mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                <p className="text-sm">暂无爬虫任务，点击右上角「添加爬虫」</p>
              </div>
            ) : crawlers.map((crawler, idx) => {
              const isEditing = editingCrawlerId === crawler.id;
              const keywords = crawler.filter_keywords
                ? (() => { try { return JSON.parse(crawler.filter_keywords as any); } catch { return []; } })() : [];

              return (
                <div key={crawler.id}>
                  {/* 普通行 */}
                  <div className={`grid grid-cols-[1fr_1.5fr_1.5fr_72px_96px] gap-4 px-8 py-3.5 items-center border-b border-gray-50 hover:bg-gray-50/60 transition-colors ${!crawler.enabled ? 'opacity-50' : ''} ${idx % 2 !== 0 ? 'bg-gray-50/30' : ''} ${isEditing ? 'bg-violet-50/40' : ''}`}>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${crawler.enabled ? 'bg-emerald-400' : 'bg-gray-300'}`} />
                        <span className="text-sm font-medium text-gray-800 truncate">{crawler.name}</span>
                      </div>
                      <div className="flex gap-1.5 mt-1 ml-3.5">
                        {crawler.is_default && <span className="px-1.5 py-0.5 bg-violet-50 text-violet-500 text-xs rounded">内置</span>}
                        {keywords.length > 0 && <span className="px-1.5 py-0.5 bg-amber-50 text-amber-500 text-xs rounded">AI 过滤</span>}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400 truncate font-mono">{crawler.url}</p>
                    </div>
                    <div className="min-w-0">
                      <code className="text-xs text-violet-600 bg-violet-50 px-2 py-0.5 rounded font-mono truncate block">{crawler.selector}</code>
                    </div>
                    <div className="flex justify-center">
                      <Toggle checked={!!crawler.enabled} onChange={() => handleToggleCrawler(crawler.id!, !crawler.enabled)} color="violet" />
                    </div>
                    {/* 操作列：编辑 + 删除 */}
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => isEditing ? setEditingCrawlerId(null) : handleStartEditCrawler(crawler)}
                        className={`p-1.5 rounded-md transition-colors ${isEditing ? 'text-violet-500 bg-violet-50' : 'text-gray-300 hover:text-violet-500 hover:bg-violet-50'}`}
                        title="编辑"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      {!crawler.is_default ? (
                        <button
                          onClick={() => handleDeleteCrawler(crawler.id!)}
                          className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                          title="删除"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      ) : (
                        <span className="w-7" />
                      )}
                    </div>
                  </div>

                  {/* 编辑展开区 */}
                  {isEditing && (
                    <div className="px-8 py-4 bg-violet-50/60 border-b border-violet-100">
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">名称 *</label>
                          <input type="text" value={editCrawler.name ?? ''}
                            onChange={(e) => setEditCrawler({ ...editCrawler, name: e.target.value })}
                            className={inputCls} />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">目标地址 *</label>
                          <input type="text" value={editCrawler.url ?? ''}
                            onChange={(e) => setEditCrawler({ ...editCrawler, url: e.target.value })}
                            className={inputCls} />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">CSS 选择器 *</label>
                          <input type="text" value={editCrawler.selector ?? ''}
                            onChange={(e) => setEditCrawler({ ...editCrawler, selector: e.target.value })}
                            className={inputCls} />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 mt-3">
                        <button onClick={() => setEditingCrawlerId(null)} className="px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">取消</button>
                        <button onClick={handleSaveEditCrawler} disabled={!editCrawler.name || !editCrawler.url || !editCrawler.selector}
                          className="px-4 py-1.5 text-sm bg-violet-600 hover:bg-violet-700 text-white rounded-lg disabled:opacity-50 font-medium">
                          保存修改
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
