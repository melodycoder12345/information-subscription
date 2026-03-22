import { useState, useMemo } from 'react';
import {
  Bot,
  ChevronDown,
  ExternalLink,
  Loader2,
  Newspaper,
  Rss,
  Search,
  X,
} from 'lucide-react';
import { useArticles } from '../hooks/useArticles';
import { useFeeds } from '../hooks/useFeeds';

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
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin shrink-0" strokeWidth={2} aria-hidden />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* 页头 */}
      <div className="flex items-center justify-between px-8 py-5 bg-white/90 border-b border-slate-200/80 shadow-sm backdrop-blur-sm">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">文章阅读</h1>
          <p className="text-slate-500 text-xs mt-0.5">共 {articles.length} 篇本地文章</p>
        </div>
        {/* 搜索框 */}
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 shrink-0 pointer-events-none" strokeWidth={2} aria-hidden />
          <input
            type="text"
            placeholder="搜索文章…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50/80 focus:outline-none focus:ring-2 focus:ring-primary-400/80 focus:border-primary-300"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-md hover:bg-slate-100"
              aria-label="清除搜索"
            >
              <X className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
            </button>
          )}
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="flex items-center gap-1 px-8 py-3 bg-white/70 border-b border-slate-200/60">
        {([
          { key: 'all', label: '全部', count: articles.length },
          { key: 'rss', label: 'RSS 订阅', count: articles.filter((a) => !!a.feed_id).length },
          { key: 'crawler', label: '爬虫抓取', count: articles.filter((a) => !a.feed_id).length },
        ] as { key: Filter; label: string; count: number }[]).map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setFilter(item.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl transition-all ${
              filter === item.key
                ? 'bg-primary-100 text-primary-800 shadow-sm'
                : 'text-slate-500 hover:bg-slate-100/90'
            }`}
          >
            {item.label}
            <span className={`px-1.5 py-0.5 rounded-full text-xs ${filter === item.key ? 'bg-primary-200/90 text-primary-800' : 'bg-slate-100 text-slate-400'}`}>
              {item.count}
            </span>
          </button>
        ))}
        {search && (
          <span className="ml-2 text-xs text-slate-400">
            搜索到 {filtered.length} 篇
          </span>
        )}
      </div>

      {/* 文章列表 */}
      <div className="flex-1 overflow-y-auto px-8 py-6 min-h-0">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <Newspaper className="w-12 h-12 mb-3 opacity-40 shrink-0" strokeWidth={1.5} aria-hidden />
            <p className="text-sm font-medium">
              {articles.length === 0 ? '暂无文章' : '没有符合条件的文章'}
            </p>
            {articles.length === 0 && (
              <p className="text-xs mt-1 text-slate-300">先到「数据同步」页面拉取 GitHub Actions 的抓取结果</p>
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
                  className={`bg-white rounded-2xl border transition-all duration-200 ${
                    isExpanded
                      ? 'border-primary-200/80 shadow-card-hover ring-1 ring-primary-100/50'
                      : 'border-slate-200/70 shadow-card hover:border-slate-300/90 hover:shadow-card-hover'
                  }`}
                >
                  {/* 卡片头 */}
                  <div
                    className="flex items-start gap-4 p-5 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : article.id!)}
                  >
                    {/* 来源图标 */}
                    <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center mt-0.5 shadow-sm ${
                      isRss ? 'bg-orange-50 text-orange-500' : 'bg-violet-50 text-violet-500'
                    }`}>
                      {isRss ? (
                        <Rss className="w-5 h-5 shrink-0" strokeWidth={2} aria-hidden />
                      ) : (
                        <Bot className="w-5 h-5 shrink-0" strokeWidth={2} aria-hidden />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          isRss ? 'bg-orange-50 text-orange-600' : 'bg-violet-50 text-violet-600'
                        }`}>
                          {sourceName}
                        </span>
                        <span className="text-xs text-slate-400">{formatDate(article.published_at || article.created_at)}</span>
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900 leading-snug line-clamp-2">
                        {article.title}
                      </h3>
                      {!isExpanded && plainContent && (
                        <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                          {plainContent.substring(0, 160)}…
                        </p>
                      )}
                    </div>

                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 shrink-0 mt-1 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                      strokeWidth={2}
                      aria-hidden
                    />
                  </div>

                  {/* 展开内容 */}
                  {isExpanded && (
                    <div className="px-5 pb-5 border-t border-slate-50 pt-4">
                      {plainContent ? (
                        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                          {plainContent.substring(0, 1200)}
                          {plainContent.length > 1200 && '…'}
                        </p>
                      ) : (
                        <p className="text-sm text-slate-400 italic">暂无内容</p>
                      )}
                      {article.link && (
                        <a
                          href={article.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 mt-4 text-xs text-primary-600 hover:text-primary-700 font-medium"
                        >
                          <ExternalLink className="w-3.5 h-3.5 shrink-0" strokeWidth={2} aria-hidden />
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
