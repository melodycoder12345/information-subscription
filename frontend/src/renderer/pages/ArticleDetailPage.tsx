import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useArticles } from '../hooks/useArticles';

export default function ArticleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: articles = [] } = useArticles();
  const article = articles.find((a) => a.id === Number(id));

  if (!article) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <Link to="/articles" className="text-primary-600 hover:text-primary-700 font-medium text-sm inline-flex items-center gap-1.5">
          <ArrowLeft className="w-4 h-4 shrink-0" strokeWidth={2} aria-hidden />
          返回
        </Link>
        <div className="mt-6 text-slate-500">文章不存在</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto min-h-0">
      <Link to="/articles" className="text-primary-600 hover:text-primary-700 font-medium text-sm inline-flex items-center gap-1.5 mb-6">
        <ArrowLeft className="w-4 h-4 shrink-0" strokeWidth={2} aria-hidden />
        返回文章列表
      </Link>

      <article className="bg-white p-8 rounded-2xl border border-slate-200/70 shadow-card">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-4">{article.title}</h1>

        {article.published_at && (
          <p className="text-sm text-slate-500 mb-4">
            {new Date(article.published_at).toLocaleString('zh-CN')}
          </p>
        )}

        {article.link && (
          <a
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-600 hover:text-primary-700 font-medium mb-4 inline-flex items-center gap-1"
          >
            查看原文 →
          </a>
        )}

        <div
          className="max-w-none mt-6 text-slate-700 leading-relaxed [&_a]:text-primary-600 [&_img]:max-w-full [&_img]:rounded-lg"
          dangerouslySetInnerHTML={{ __html: article.content || '' }}
        />
      </article>
    </div>
  );
}
