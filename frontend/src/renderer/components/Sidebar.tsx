import { Link, useLocation } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  Bell,
  BookOpen,
  Newspaper,
  RefreshCw,
  Rss,
  Settings,
  Trash2,
  Zap,
} from 'lucide-react';

const navItems: { path: string; label: string; Icon: LucideIcon }[] = [
  { path: '/articles', label: '文章阅读', Icon: Newspaper },
  { path: '/subscriptions', label: '订阅管理', Icon: Rss },
  { path: '/sync', label: '数据同步', Icon: RefreshCw },
  { path: '/notifications', label: '消息推送', Icon: Bell },
  { path: '/blog', label: '博客发布', Icon: BookOpen },
  { path: '/cleanup', label: '数据清理', Icon: Trash2 },
  { path: '/settings', label: '系统设置', Icon: Settings },
];

function navActive(pathname: string, itemPath: string): boolean {
  if (pathname === '/' && itemPath === '/articles') return true;
  if (itemPath === '/articles') {
    return pathname === '/articles' || pathname.startsWith('/articles/');
  }
  if (itemPath === '/subscriptions') {
    return pathname === '/subscriptions' || pathname.startsWith('/feeds/');
  }
  return pathname === itemPath;
}

export default function Sidebar() {
  const location = useLocation();

  return (
    <div className="w-56 flex flex-col h-full flex-shrink-0 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 shadow-xl shadow-slate-900/25">
      {/* Logo 区域 */}
      <div className="px-5 py-5 border-b border-white/10 shadow-sidebar">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-950/50 ring-1 ring-white/20">
            <Zap className="w-5 h-5 text-white shrink-0" strokeWidth={2} aria-hidden />
          </div>
          <div>
            <h1 className="text-white text-sm font-semibold tracking-tight leading-tight">讯流</h1>
            <p className="text-slate-500 text-[11px] mt-0.5">本地阅读与订阅</p>
          </div>
        </div>
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = navActive(location.pathname, item.path);
          const { Icon } = item;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-primary-600 text-white shadow-md shadow-primary-950/40 ring-1 ring-white/15'
                  : 'text-slate-400 hover:bg-white/[0.06] hover:text-white'
              }`}
            >
              <Icon
                className={`w-5 h-5 shrink-0 transition-colors ${
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                }`}
                strokeWidth={2}
                aria-hidden
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* 底部版本信息 */}
      <div className="px-5 py-4 border-t border-white/10">
        <p className="text-slate-500 text-xs tabular-nums">v1.0.0</p>
      </div>
    </div>
  );
}
