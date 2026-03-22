import { useState, useEffect } from 'react';
import {
  Bot,
  Clock,
  CloudUpload,
  Loader2,
  Pencil,
  Plus,
  Rss,
  Trash2,
} from 'lucide-react';
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

  const Toggle = ({ checked, onChange, color = 'primary' }: { checked: boolean; onChange: () => void; color?: string }) => (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
        checked ? (color === 'violet' ? 'bg-violet-500 shadow-inner' : 'bg-primary-500 shadow-inner') : 'bg-slate-200'
      }`}
    >
      <span
        style={{ transform: checked ? 'translateX(18px)' : 'translateX(2px)' }}
        className="inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm ring-1 ring-black/5 transition-transform"
      />
    </button>
  );

  const inputCls = 'w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-400/80 focus:border-primary-300';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin shrink-0" strokeWidth={2} aria-hidden />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* ── 页头 ── */}
      <div className="flex items-center justify-between px-8 py-5 bg-white/90 border-b border-slate-200/80 shadow-sm backdrop-blur-sm">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">订阅管理</h1>
          <p className="text-slate-500 text-xs mt-0.5">
            {feeds.length} 个 RSS 订阅 · {crawlers.length} 个爬虫
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* 全局抓取频率 */}
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50/90 border border-slate-200/80 rounded-xl shadow-sm">
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" strokeWidth={2} aria-hidden />
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
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60"
            >
              {isSaving
                ? <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" strokeWidth={2} aria-hidden />
                : <CloudUpload className="w-3.5 h-3.5 shrink-0" strokeWidth={2} aria-hidden />
              }
              {isSaving ? '推送中…' : '推送到 GitHub'}
            </button>
          )}
        </div>
      </div>

      {/* ── Tab 栏 ── */}
      <div className="flex items-center px-8 bg-white/70 border-b border-slate-200/60">
        <button
          type="button"
          onClick={() => { setTab('feeds'); setIsAddingFeed(false); setIsAddingCrawler(false); setEditingFeedId(null); setEditingCrawlerId(null); }}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            tab === 'feeds' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-400 hover:text-gray-700'
          }`}
        >
          <Rss className="w-4 h-4 shrink-0" strokeWidth={2} aria-hidden />
          RSS 订阅
          <span className={`px-1.5 py-0.5 text-xs rounded-full ${tab === 'feeds' ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-500'}`}>
            {feeds.length}
          </span>
        </button>
        <button
          type="button"
          onClick={() => { setTab('crawlers'); setIsAddingFeed(false); setIsAddingCrawler(false); setEditingFeedId(null); setEditingCrawlerId(null); }}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            tab === 'crawlers' ? 'border-violet-500 text-violet-600' : 'border-transparent text-gray-400 hover:text-gray-700'
          }`}
        >
          <Bot className="w-4 h-4 shrink-0" strokeWidth={2} aria-hidden />
          网页爬虫
          <span className={`px-1.5 py-0.5 text-xs rounded-full ${tab === 'crawlers' ? 'bg-violet-100 text-violet-600' : 'bg-gray-100 text-gray-500'}`}>
            {crawlers.length}
          </span>
        </button>

        {/* 添加按钮 — 右对齐 */}
        <div className="ml-auto py-2">
          {tab === 'feeds' ? (
            <button
              type="button"
              onClick={() => { setIsAddingFeed((v) => !v); setEditingFeedId(null); }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-medium rounded-xl shadow-sm shadow-primary-900/20 transition-all hover:shadow-md"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" strokeWidth={2} aria-hidden />
              添加订阅
            </button>
          ) : (
            <button
              type="button"
              onClick={() => { setIsAddingCrawler((v) => !v); setEditingCrawlerId(null); }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium rounded-xl shadow-sm shadow-violet-900/20 transition-all hover:shadow-md"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" strokeWidth={2} aria-hidden />
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
            <div className="px-8 py-4 bg-gradient-to-r from-primary-50/90 to-slate-50/50 border-b border-primary-100/80">
              <p className="text-xs font-semibold text-primary-700 mb-3">新增订阅源</p>
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
                  className="px-4 py-1.5 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded-lg disabled:opacity-50 font-medium">
                  确认添加
                </button>
              </div>
            </div>
          )}

          {/* 表头 */}
          <div className="grid grid-cols-[1fr_2fr_1fr_72px_96px] gap-4 px-8 py-3 bg-slate-100/80 border-b border-slate-200/70 text-xs font-semibold text-slate-500 uppercase tracking-wide flex-shrink-0">
            <div>名称</div>
            <div>RSS 地址</div>
            <div>描述</div>
            <div className="text-center">状态</div>
            <div className="text-center">操作</div>
          </div>

          {/* 列表 */}
          <div className="flex-1 overflow-y-auto">
            {feeds.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                <Rss className="w-10 h-10 mb-2 opacity-40 shrink-0" strokeWidth={1.5} aria-hidden />
                <p className="text-sm">暂无订阅源，点击右上角「添加订阅」</p>
              </div>
            ) : feeds.map((feed, idx) => {
              const isEditing = editingFeedId === feed.id;
              const keywords = Array.isArray(feed.filter_keywords) ? feed.filter_keywords
                : (feed.filter_keywords ? (() => { try { return JSON.parse(feed.filter_keywords as any); } catch { return []; } })() : []);

              return (
                <div key={feed.id}>
                  {/* 普通行 */}
                  <div className={`grid grid-cols-[1fr_2fr_1fr_72px_96px] gap-4 px-8 py-3.5 items-center border-b border-slate-100/90 hover:bg-slate-50/80 transition-colors ${!feed.enabled ? 'opacity-50' : ''} ${idx % 2 !== 0 ? 'bg-slate-50/40' : ''} ${isEditing ? 'bg-primary-50/50' : ''}`}>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${feed.enabled ? 'bg-emerald-400' : 'bg-gray-300'}`} />
                        <span className="text-sm font-medium text-gray-800 truncate">{feed.title}</span>
                      </div>
                      <div className="flex gap-1.5 mt-1 ml-3.5">
                        {feed.is_default && <span className="px-1.5 py-0.5 bg-primary-50 text-primary-500 text-xs rounded">内置</span>}
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
                        type="button"
                        onClick={() => isEditing ? setEditingFeedId(null) : handleStartEditFeed(feed)}
                        className={`p-1.5 rounded-md transition-colors ${isEditing ? 'text-primary-500 bg-primary-50' : 'text-gray-300 hover:text-primary-500 hover:bg-primary-50'}`}
                        title="编辑"
                      >
                        <Pencil className="w-4 h-4 shrink-0" strokeWidth={2} aria-hidden />
                      </button>
                      {!feed.is_default ? (
                        <button
                          type="button"
                          onClick={() => handleDeleteFeed(feed.id!)}
                          className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4 shrink-0" strokeWidth={2} aria-hidden />
                        </button>
                      ) : (
                        <span className="w-7" />
                      )}
                    </div>
                  </div>

                  {/* 编辑展开区 */}
                  {isEditing && (
                    <div className="px-8 py-4 bg-gradient-to-r from-primary-50/80 to-slate-50/40 border-b border-primary-100/80">
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
                          className="px-4 py-1.5 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded-lg disabled:opacity-50 font-medium">
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
            <div className="px-8 py-4 bg-gradient-to-r from-violet-50/90 to-slate-50/50 border-b border-violet-100/80">
              <p className="text-xs font-semibold text-violet-700 mb-3">新增爬虫任务</p>
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
          <div className="grid grid-cols-[1fr_1.5fr_1.5fr_72px_96px] gap-4 px-8 py-3 bg-slate-100/80 border-b border-slate-200/70 text-xs font-semibold text-slate-500 uppercase tracking-wide flex-shrink-0">
            <div>名称</div>
            <div>目标地址</div>
            <div>CSS 选择器</div>
            <div className="text-center">状态</div>
            <div className="text-center">操作</div>
          </div>

          {/* 列表 */}
          <div className="flex-1 overflow-y-auto">
            {crawlers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                <Bot className="w-10 h-10 mb-2 opacity-40 shrink-0" strokeWidth={1.5} aria-hidden />
                <p className="text-sm">暂无爬虫任务，点击右上角「添加爬虫」</p>
              </div>
            ) : crawlers.map((crawler, idx) => {
              const isEditing = editingCrawlerId === crawler.id;
              const keywords = crawler.filter_keywords
                ? (() => { try { return JSON.parse(crawler.filter_keywords as any); } catch { return []; } })() : [];

              return (
                <div key={crawler.id}>
                  {/* 普通行 */}
                  <div className={`grid grid-cols-[1fr_1.5fr_1.5fr_72px_96px] gap-4 px-8 py-3.5 items-center border-b border-slate-100/90 hover:bg-slate-50/80 transition-colors ${!crawler.enabled ? 'opacity-50' : ''} ${idx % 2 !== 0 ? 'bg-slate-50/40' : ''} ${isEditing ? 'bg-violet-50/50' : ''}`}>
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
                        type="button"
                        onClick={() => isEditing ? setEditingCrawlerId(null) : handleStartEditCrawler(crawler)}
                        className={`p-1.5 rounded-md transition-colors ${isEditing ? 'text-violet-500 bg-violet-50' : 'text-gray-300 hover:text-violet-500 hover:bg-violet-50'}`}
                        title="编辑"
                      >
                        <Pencil className="w-4 h-4 shrink-0" strokeWidth={2} aria-hidden />
                      </button>
                      {!crawler.is_default ? (
                        <button
                          type="button"
                          onClick={() => handleDeleteCrawler(crawler.id!)}
                          className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4 shrink-0" strokeWidth={2} aria-hidden />
                        </button>
                      ) : (
                        <span className="w-7" />
                      )}
                    </div>
                  </div>

                  {/* 编辑展开区 */}
                  {isEditing && (
                    <div className="px-8 py-4 bg-gradient-to-r from-violet-50/80 to-slate-50/40 border-b border-violet-100/80">
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
