import { Link, useLocation } from 'react-router-dom';

export default function Navigation() {
  const location = useLocation();

  const navItems = [
    { path: '/feeds', label: 'RSS订阅' },
    { path: '/crawlers', label: '爬虫管理' },
    { path: '/notifications', label: '通知配置' },
    { path: '/blog', label: '博客配置' },
    { path: '/sync', label: '数据同步' },
    { path: '/cleanup', label: '数据清理' },
    { path: '/settings', label: '设置' },
  ];

  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Information Subscription</h1>
        <div className="flex gap-4">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-3 py-2 rounded ${
                location.pathname === item.path
                  ? 'bg-blue-600'
                  : 'hover:bg-gray-700'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
