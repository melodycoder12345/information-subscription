import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Sidebar from './components/Sidebar';
import SettingsPage from './pages/SettingsPage';
import SubscriptionPage from './pages/SubscriptionPage';
import ArticlesPage from './pages/ArticlesPage';
import FeedDetailPage from './pages/FeedDetailPage';
import ArticleDetailPage from './pages/ArticleDetailPage';
import NotificationConfigPage from './pages/NotificationConfigPage';
import BlogConfigPage from './pages/BlogConfigPage';
import CleanupPage from './pages/CleanupPage';
import SyncPage from './pages/SyncPage';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="flex h-screen bg-gray-50 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-hidden">
            <Routes>
              <Route path="/" element={<Navigate to="/articles" replace />} />
              <Route path="/articles" element={<ArticlesPage />} />
              <Route path="/articles/:id" element={<ArticleDetailPage />} />
              <Route path="/subscriptions" element={<SubscriptionPage />} />
              <Route path="/feeds" element={<Navigate to="/subscriptions" replace />} />
              <Route path="/crawlers" element={<Navigate to="/subscriptions" replace />} />
              <Route path="/feeds/:id" element={<FeedDetailPage />} />
              <Route path="/notifications" element={<NotificationConfigPage />} />
              <Route path="/blog" element={<BlogConfigPage />} />
              <Route path="/cleanup" element={<CleanupPage />} />
              <Route path="/sync" element={<SyncPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
