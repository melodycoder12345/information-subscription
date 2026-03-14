interface Window {
  electronAPI: {
    db: {
      getFeeds: () => Promise<any[]>;
      addFeed: (feed: any) => Promise<void>;
      updateFeed: (id: number, feed: any) => Promise<void>;
      deleteFeed: (id: number) => Promise<void>;
      getArticles: (feedId?: number) => Promise<any[]>;
      addArticle: (article: any) => Promise<void>;
      getCrawlers: () => Promise<any[]>;
      addCrawler: (crawler: any) => Promise<void>;
      updateCrawler: (id: number, crawler: any) => Promise<void>;
      deleteCrawler: (id: number) => Promise<void>;
      getSetting: (key: string) => Promise<string | null>;
      setSetting: (key: string, value: string) => Promise<void>;
      cleanupOldArticles: (retentionDays: number, mode: 'delete' | 'archive') => Promise<{ deleted: number; archived: number }>;
      getDatabaseStats: () => Promise<{ articleCount: number; feedCount: number; crawlerCount: number; dbSize: number }>;
      getNotifications: () => Promise<any[]>;
      addNotification: (notification: any) => Promise<number>;
      updateNotification: (id: number, notification: any) => Promise<void>;
      deleteNotification: (id: number) => Promise<void>;
      getBlogConfig: () => Promise<any>;
      saveBlogConfig: (config: any) => Promise<void>;
    };
    github: {
      testConnection: (token: string, repo: string) => Promise<boolean>;
      pushConfig: (config: any) => Promise<void>;
      triggerWorkflow: () => Promise<void>;
    };
  };
}
