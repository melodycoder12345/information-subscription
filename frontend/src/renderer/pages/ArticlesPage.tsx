import { useState, useMemo } from 'react';
import { useArticles } from '../hooks/useArticles';
import { useFeeds } from '../hooks/useFeeds';
import { Article } from '../types';

type Filter = 'all' | 'rss' | 'crawler';

export default function ArticlesPage() {
  const { data: articles = [], isLoading } = useArticles();
  const { data: feeds = [] } = useFeeds();
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // feed_id → feed.title 映射
  const feedMap = useMemo(() => {
    const map: Record<number, string> = {};
    feeds.forEach((f) => { if (f.id) map[f.id] = f.title; });
    return map;
  }, [feeds]);

  const filtered = useMemo(() => {
    return articles
      .filter((a) => {
        if (filter === 'rss') return !!a.feed_id;
        if (filter === 'crawler') return !a.feed_id;
        return true;
      })
      .filter((a) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          a.title?.toLowerCase().includes(q) ||
          a.content?.toLowerCase().includes(q)
        );
      });
  }, [articles, filter, search]);

  const formatDate = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    const diff = (now.getTime() - d.getTime()) / 1000;
    if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`;
    if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} 天前`;
    return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  const stripHtml = (html: string) =>
    html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* 页头 */}
      <div className="flex items-center justify-between px-8 py-5 bg-white border-b border-gray-100">
        <div>
          <h1 className="text-xl font-bold text-gray-900">文章阅读</h1>
          <p className="text-gray-400 text-xs mt-0.5">共 {articles.length} 篇本地文章</p>
        </div>
        {/* 搜索框 */}
        <div className="relative w-64">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="搜索文章…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="flex items-center gap-1 px-8 py-3 bg-white border-b border-gray-100">
        {([
          { key: 'all', label: '全部', count: articles.length },
          { key: 'rss', label: 'RSS 订阅', count: articles.filter((a) => !!a.feed_id).length },
          { key: 'crawler', label: '爬虫抓取', count: articles.filter((a) => !a.feed_id).length },
        ] as { key: Filter; label: string; count: number }[]).map((item) => (
          <button
            key={item.key}
            onClick={() => setFilter(item.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filter === item.key
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            {item.label}
            <span className={`px-1.5 py-0.5 rounded-full text-xs ${filter === item.key ? 'bg-indigo-200 text-indigo-700' : 'bg-gray-100 text-gray-400'}`}>
              {item.count}
            </span>
          </button>
        ))}
        {search && (
          <span className="ml-2 text-xs text-gray-400">
            搜索到 {filtered.length} 篇
          </span>
        )}
      </div>

      {/* 文章列表 */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <svg className="w-12 h-12 mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            <p className="text-sm font-medium">
              {articles.length === 0 ? '暂无文章' : '没有符合条件的文章'}
            </p>
            {articles.length === 0 && (
              <p className="text-xs mt-1 text-gray-300">先到「数据同步」页面拉取 GitHub Actions 的抓取结果</p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((article) => {
              const isExpanded = expandedId === article.id;
              const sourceName = article.feed_id ? (feedMap[article.feed_id] || 'RSS 订阅') : '爬虫抓取';
              const isRss = !!article.feed_id;
              const plainContent = article.content ? stripHtml(article.content) : '';

              return (
                <div
                  key={article.id}
                  className={`bg-white rounded-xl border transition-all ${
                    isExpanded ? 'border-indigo-200 shadow-md' : 'border-gray-100 shadow-sm hover:border-gray-200 hover:shadow'
                  }`}
                >
                  {/* 卡片头 */}
                  <div
                    className="flex items-start gap-4 p-5 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : article.id!)}
                  >
                    {/* 来源图标 */}
                    <div className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center mt-0.5 ${
                      isRss ? 'bg-orange-50 text-orange-500' : 'bg-violet-50 text-violet-500'
                    }`}>
                      {isRss ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 5c7.18 0 13 5.82 13 13M6 11a7 7 0 017 7M6 17a1 1 0 110 2 1 1 0 010-2z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          isRss ? 'bg-orange-50 text-orange-600' : 'bg-violet-50 text-violet-600'
                        }`}>
                          {sourceName}
                        </span>
                        <span className="text-xs text-gray-400">{formatDate(article.published_at || article.created_at)}</span>
                      </div>
                      <h3 className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">
                        {article.title}
                      </h3>
                      {!isExpanded && plainContent && (
                        <p className="text-xs text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">
                          {plainContent.substring(0, 160)}…
                        </p>
                      )}
                    </div>

                    {/* 展开图标 */}
                    <svg
                      className={`w-4 h-4 text-gray-400 flex-shrink-0 mt-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>

                  {/* 展开内容 */}
                  {isExpanded && (
                    <div className="px-5 pb-5 border-t border-gray-50 pt-4">
                      {plainContent ? (
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                          {plainContent.substring(0, 1200)}
                          {plainContent.length > 1200 && '…'}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-400 italic">暂无内容</p>
                      )}
                      {article.link && (
                        <a
                          href={article.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 mt-4 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          查看原文
                        </a>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
