import { contextBridge, ipcRenderer } from 'electron';

// 暴露受保护的方法给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 数据库操作
  db: {
    // Feeds
    getFeeds: () => ipcRenderer.invoke('db:getFeeds'),
    addFeed: (feed: any) => ipcRenderer.invoke('db:addFeed', feed),
    updateFeed: (id: number, feed: any) => ipcRenderer.invoke('db:updateFeed', id, feed),
    deleteFeed: (id: number) => ipcRenderer.invoke('db:deleteFeed', id),
    
    // Articles
    getArticles: (feedId?: number) => ipcRenderer.invoke('db:getArticles', feedId),
    addArticle: (article: any) => ipcRenderer.invoke('db:addArticle', article),
    
    // Crawlers
    getCrawlers: () => ipcRenderer.invoke('db:getCrawlers'),
    addCrawler: (crawler: any) => ipcRenderer.invoke('db:addCrawler', crawler),
    updateCrawler: (id: number, crawler: any) => ipcRenderer.invoke('db:updateCrawler', id, crawler),
    deleteCrawler: (id: number) => ipcRenderer.invoke('db:deleteCrawler', id),
    
    // Settings
    getSetting: (key: string) => ipcRenderer.invoke('db:getSetting', key),
    setSetting: (key: string, value: string) => ipcRenderer.invoke('db:setSetting', key, value),
    
    // Cleanup
    cleanupOldArticles: (retentionDays: number, mode: 'delete' | 'archive') => 
      ipcRenderer.invoke('db:cleanupOldArticles', retentionDays, mode),
    getDatabaseStats: () => ipcRenderer.invoke('db:getDatabaseStats'),
    
    // Notifications
    getNotifications: () => ipcRenderer.invoke('db:getNotifications'),
    addNotification: (notification: any) => ipcRenderer.invoke('db:addNotification', notification),
    updateNotification: (id: number, notification: any) => ipcRenderer.invoke('db:updateNotification', id, notification),
    deleteNotification: (id: number) => ipcRenderer.invoke('db:deleteNotification', id),
    
    // Blog Config
    getBlogConfig: () => ipcRenderer.invoke('db:getBlogConfig'),
    saveBlogConfig: (config: any) => ipcRenderer.invoke('db:saveBlogConfig', config),
  },
  
  // GitHub API
  github: {
    testConnection: (token: string, repo: string) => ipcRenderer.invoke('github:testConnection', token, repo),
    pushConfig: (config: any) => ipcRenderer.invoke('github:pushConfig', config),
    triggerWorkflow: () => ipcRenderer.invoke('github:triggerWorkflow'),
  },
});

export type ElectronAPI = typeof window.electronAPI;
