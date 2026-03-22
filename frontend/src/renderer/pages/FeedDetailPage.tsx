import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useArticles } from '../hooks/useArticles';

export default function FeedDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: articles = [], isLoading } = useArticles(Number(id));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[200px]">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin shrink-0" strokeWidth={2} aria-hidden />
      </div>
    );
  }

  return (
    <div className="p-8 min-h-0">
      <div className="mb-8">
        <Link to="/subscriptions" className="text-primary-600 hover:text-primary-700 font-medium text-sm inline-flex items-center gap-1.5">
          <ArrowLeft className="w-4 h-4 shrink-0" strokeWidth={2} aria-hidden />
          返回订阅管理
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-3">文章列表</h1>
      </div>

      <div className="space-y-3 max-w-4xl">
        {articles.map((article) => (
          <Link
            key={article.id}
            to={`/articles/${article.id}`}
            className="block bg-white p-5 rounded-2xl border border-slate-200/70 shadow-card hover:shadow-card-hover hover:border-slate-300/90 transition-all duration-200"
          >
            <h3 className="font-semibold text-lg text-slate-900 mb-2">{article.title}</h3>
            {article.published_at && (
              <p className="text-sm text-slate-500">
                {new Date(article.published_at).toLocaleString('zh-CN')}
              </p>
            )}
            {article.content && (
              <p className="text-sm text-slate-600 mt-2 line-clamp-2">
                {article.content.substring(0, 200)}...
              </p>
            )}
          </Link>
        ))}
        {articles.length === 0 && (
          <div className="text-center text-slate-500 py-12 rounded-2xl border border-dashed border-slate-200 bg-white/50">
            暂无文章
          </div>
        )}
      </div>
    </div>
  );
}
