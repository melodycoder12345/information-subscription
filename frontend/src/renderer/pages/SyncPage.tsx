import { useState, useEffect } from 'react';
import { syncData } from '../services/syncService';

export default function SyncPage() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [syncCount, setSyncCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{ synced: number } | null>(null);

  useEffect(() => { loadSyncStatus(); }, []);

  const loadSyncStatus = async () => {
    const lastSync = await window.electronAPI.db.getSetting('lastSyncAt');
    const count = await window.electronAPI.db.getSetting('syncCount');
    if (lastSync) setLastSyncAt(lastSync);
    if (count) setSyncCount(Number(count));
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setError(null);
    setLastResult(null);
    try {
      const token = await window.electronAPI.db.getSetting('githubToken');
      const repo = await window.electronAPI.db.getSetting('githubRepo');
      if (!token || !repo) throw new Error('请先在「设置」中配置 GitHub Token 和仓库');

      const lastSyncTimestamp = await window.electronAPI.db.getSetting('lastSyncTimestamp');
      const result = await syncData(token, repo, lastSyncTimestamp);

      for (const article of result.articles) {
        await window.electronAPI.db.addArticle(article);
      }

      const now = new Date().toISOString();
      await window.electronAPI.db.setSetting('lastSyncAt', now);
      await window.electronAPI.db.setSetting('lastSyncTimestamp', result.articles.length > 0 ? now : lastSyncTimestamp || '');
      await window.electronAPI.db.setSetting('syncCount', (syncCount + result.synced).toString());

      setLastSyncAt(now);
      setSyncCount(syncCount + result.synced);
      setLastResult({ synced: result.synced });
    } catch (err: any) {
      setError(err.message || '同步失败');
    } finally {
      setIsSyncing(false);
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diff < 60) return `${diff} 秒前`;
    if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`;
    return d.toLocaleString('zh-CN');
  };

  return (
    <div className="flex flex-col h-full">
      {/* 页头 */}
      <div className="flex items-center justify-between px-8 py-5 bg-white border-b border-gray-100">
        <div>
          <h1 className="text-xl font-bold text-gray-900">数据同步</h1>
          <p className="text-gray-400 text-xs mt-0.5">从 GitHub 仓库拉取最新抓取数据</p>
        </div>
        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60"
        >
          {isSyncing
            ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
          }
          {isSyncing ? '同步中…' : '立即同步'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="grid grid-cols-2 gap-6">
          {/* 状态 */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <svg className="w-4 h-4 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  同步状态
                </h2>
              </div>
              <div className="px-6 py-5 space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-50">
                  <span className="text-sm text-gray-600">最后同步时间</span>
                  <span className="text-sm font-medium text-gray-900">
                    {lastSyncAt ? formatDate(lastSyncAt) : '从未同步'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-50">
                  <span className="text-sm text-gray-600">累计同步文章</span>
                  <span className="text-sm font-bold text-teal-600">{syncCount} 篇</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-sm text-gray-600">同步来源</span>
                  <span className="text-sm text-gray-500">GitHub 仓库 data/</span>
                </div>

                {lastResult && (
                  <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-lg">
                    <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="text-sm text-emerald-700 font-medium">
                      同步完成，新增 <strong>{lastResult.synced}</strong> 篇文章
                    </p>
                  </div>
                )}

                {error && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg">
                    <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 说明 */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h2 className="text-sm font-semibold text-gray-800">数据流说明</h2>
            </div>
            <div className="px-6 py-5">
              <div className="space-y-4">
                {[
                  {
                    icon: '⚙️',
                    title: 'GitHub Actions 执行',
                    desc: '按你设定的频率，自动抓取 RSS 和爬虫数据',
                  },
                  {
                    icon: '🤖',
                    title: 'AI 处理',
                    desc: '对文章进行总结，过滤关键词',
                  },
                  {
                    icon: '📁',
                    title: '数据保存到仓库',
                    desc: '将处理后的数据以 JSON 格式推送到 data/ 目录',
                  },
                  {
                    icon: '📥',
                    title: '客户端同步',
                    desc: '点击同步后，客户端拉取 data/latest.json 写入本地 SQLite',
                  },
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center text-base">
                      {step.icon}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{step.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{step.desc}</p>
                    </div>
                    {i < 3 && (
                      <svg className="w-4 h-4 text-gray-200 flex-shrink-0 mt-2 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
