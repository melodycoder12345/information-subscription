import { useParams, Link } from 'react-router-dom';
import { useArticles } from '../hooks/useArticles';

export default function ArticleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: articles = [] } = useArticles();
  const article = articles.find((a) => a.id === Number(id));

  if (!article) {
    return (
      <div className="p-6">
        <Link to="/feeds" className="text-blue-500 hover:underline">
          ← 返回
        </Link>
        <div className="mt-4">文章不存在</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Link to="/feeds" className="text-blue-500 hover:underline mb-4 inline-block">
        ← 返回
      </Link>
      
      <article className="bg-white p-6 rounded-lg shadow">
        <h1 className="text-3xl font-bold mb-4">{article.title}</h1>
        
        {article.published_at && (
          <p className="text-sm text-gray-500 mb-4">
            {new Date(article.published_at).toLocaleString('zh-CN')}
          </p>
        )}

        {article.link && (
          <a
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline mb-4 inline-block"
          >
            查看原文 →
          </a>
        )}

        <div
          className="prose max-w-none mt-6"
          dangerouslySetInnerHTML={{ __html: article.content || '' }}
        />
      </article>
    </div>
  );
}
