import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { DatabaseManager } from './database';
import { GitHubService } from './services/githubServiceSimple';

let mainWindow: BrowserWindow | null = null;
let db: DatabaseManager | null = null;
let githubService: GitHubService | null = null;

const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
  // __dirname 在编译后是 dist-electron/，preload 也输出到 dist-electron/
  const preloadPath = path.join(__dirname, 'preload.js');

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // Vite renderer 输出到 dist/，main.js 在 dist-electron/，所以向上一级再进 dist/
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function initDatabase() {
  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'app.db');
  db = new DatabaseManager(dbPath);
}

function setupIPC() {
  if (!db) return;

  // Feeds
  ipcMain.handle('db:getFeeds', () => db!.getFeeds());
  ipcMain.handle('db:addFeed', (_, feed) => db!.addFeed(feed));
  ipcMain.handle('db:updateFeed', (_, id, feed) => db!.updateFeed(id, feed));
  ipcMain.handle('db:deleteFeed', (_, id) => db!.deleteFeed(id));

  // Articles
  ipcMain.handle('db:getArticles', (_, feedId) => db!.getArticles(feedId));
  ipcMain.handle('db:addArticle', (_, article) => db!.addArticle(article));

  // Crawlers
  ipcMain.handle('db:getCrawlers', () => db!.getCrawlers());
  ipcMain.handle('db:addCrawler', (_, crawler) => db!.addCrawler(crawler));
  ipcMain.handle('db:updateCrawler', (_, id, crawler) => db!.updateCrawler(id, crawler));
  ipcMain.handle('db:deleteCrawler', (_, id) => db!.deleteCrawler(id));

  // Settings
  ipcMain.handle('db:getSetting', (_, key) => db!.getSetting(key));
  ipcMain.handle('db:setSetting', (_, key, value) => db!.setSetting(key, value));

  // Cleanup
  ipcMain.handle('db:cleanupOldArticles', (_, retentionDays: number, mode: 'delete' | 'archive') => {
    return db!.cleanupOldArticles(retentionDays, mode);
  });

  ipcMain.handle('db:getDatabaseStats', () => {
    return db!.getDatabaseStats();
  });

  // Notifications
  ipcMain.handle('db:getNotifications', () => db!.getNotifications());
  ipcMain.handle('db:addNotification', (_, notification) => db!.addNotification(notification));
  ipcMain.handle('db:updateNotification', (_, id, notification) => db!.updateNotification(id, notification));
  ipcMain.handle('db:deleteNotification', (_, id) => db!.deleteNotification(id));

  // Blog Config
  ipcMain.handle('db:getBlogConfig', () => db!.getBlogConfig());
  ipcMain.handle('db:saveBlogConfig', (_, config) => db!.saveBlogConfig(config));

  // GitHub
  ipcMain.handle('github:testConnection', async (_, token: string, repo: string) => {
    if (!githubService) {
      githubService = new GitHubService();
    }
    githubService.initialize(token, repo);
    return githubService.testConnection();
  });

  ipcMain.handle('github:pushConfig', async (_, config: any) => {
    if (!githubService) {
      const token = db!.getSetting('githubToken');
      const repo = db!.getSetting('githubRepo');
      if (!token || !repo) {
        throw new Error('GitHub服务未初始化，请先配置GitHub Token和仓库');
      }
      githubService = new GitHubService();
      githubService.initialize(token, repo);
    }

    // 推送订阅配置（如果config中有feeds）
    if (config.feeds !== undefined) {
      const feeds = config.feeds.length > 0 ? config.feeds : db!.getFeeds();
      await githubService.pushFile(
        'config/subscriptions.json',
        JSON.stringify({ feeds }, null, 2),
        'Update RSS subscriptions'
      );
    }
    
    // 推送爬虫配置（如果config中有crawlers）
    if (config.crawlers !== undefined) {
      const crawlers = config.crawlers.length > 0 ? config.crawlers : db!.getCrawlers();
      await githubService.pushFile(
        'config/crawlers.json',
        JSON.stringify({ crawlers }, null, 2),
        'Update crawlers'
      );
    }

    // 推送AI配置（如果config中有ai）
    if (config.ai) {
      await githubService.pushFile(
        'config/ai-config.json',
        JSON.stringify(config.ai, null, 2),
        'Update AI config'
      );
    }

    // 推送通知配置（如果config中有notifications）
    if (config.notifications) {
      await githubService.pushFile(
        'config/notifications.json',
        JSON.stringify(config.notifications, null, 2),
        'Update notifications config'
      );
    }

    // 推送博客配置（如果config中有blog）
    if (config.blog) {
      await githubService.pushFile(
        'config/blog.json',
        JSON.stringify(config.blog, null, 2),
        'Update blog config'
      );
    }
    
    return { success: true };
  });

  ipcMain.handle('github:triggerWorkflow', async () => {
    if (!githubService) {
      throw new Error('GitHub服务未初始化');
    }
    await githubService.triggerWorkflow();
    return { success: true };
  });
}

app.whenReady().then(() => {
  initDatabase();
  setupIPC();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (db) {
      db.close();
    }
    app.quit();
  }
});
