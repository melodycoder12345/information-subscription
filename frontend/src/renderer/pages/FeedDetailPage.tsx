import { useParams, Link } from 'react-router-dom';
import { useArticles } from '../hooks/useArticles';

export default function FeedDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: articles = [], isLoading } = useArticles(Number(id));

  if (isLoading) {
    return <div className="p-6">加载中...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link to="/feeds" className="text-blue-500 hover:underline mb-2 inline-block">
          ← 返回订阅列表
        </Link>
        <h1 className="text-2xl font-bold mt-2">文章列表</h1>
      </div>

      <div className="space-y-3">
        {articles.map((article) => (
          <Link
            key={article.id}
            to={`/articles/${article.id}`}
            className="block bg-white p-4 rounded-lg shadow hover:shadow-lg transition-shadow"
          >
            <h3 className="font-semibold text-lg mb-2">{article.title}</h3>
            {article.published_at && (
              <p className="text-sm text-gray-500">
                {new Date(article.published_at).toLocaleString('zh-CN')}
              </p>
            )}
            {article.content && (
              <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                {article.content.substring(0, 200)}...
              </p>
            )}
          </Link>
        ))}
        {articles.length === 0 && (
          <div className="text-center text-gray-500 py-8">暂无文章</div>
        )}
      </div>
    </div>
  );
}
