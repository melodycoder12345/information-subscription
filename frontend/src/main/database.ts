import Database from 'better-sqlite3';

export interface Feed {
  id?: number;
  title: string;
  url: string;
  description?: string;
  fetch_interval: number;
  enabled: boolean;
  is_default: boolean;
  filter_keywords?: string;
  last_fetch_at?: string;
  created_at?: string;
}

export interface Article {
  id?: number;
  feed_id?: number;
  title: string;
  link: string;
  content?: string;
  published_at?: string;
  created_at?: string;
}

export interface Crawler {
  id?: number;
  name: string;
  url: string;
  selector?: string;
  fetch_interval: number;
  enabled: boolean;
  is_default: boolean;
  filter_keywords?: string;
  created_at?: string;
}

export interface Summary {
  id?: number;
  article_id: number;
  content: string;
  model?: string;
  created_at?: string;
}

export class DatabaseManager {
  private db: Database.Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.initSchema();
  }

  private initSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS feeds (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        url TEXT NOT NULL UNIQUE,
        description TEXT,
        fetch_interval INTEGER DEFAULT 3600,
        enabled BOOLEAN DEFAULT 1,
        is_default BOOLEAN DEFAULT 0,
        filter_keywords TEXT,
        last_fetch_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS articles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        feed_id INTEGER,
        title TEXT NOT NULL,
        link TEXT NOT NULL UNIQUE,
        content TEXT,
        published_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (feed_id) REFERENCES feeds(id)
      );

      CREATE TABLE IF NOT EXISTS crawlers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        selector TEXT,
        fetch_interval INTEGER DEFAULT 3600,
        enabled BOOLEAN DEFAULT 1,
        is_default BOOLEAN DEFAULT 0,
        filter_keywords TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS summaries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        article_id INTEGER,
        content TEXT NOT NULL,
        model TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (article_id) REFERENCES articles(id)
      );

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sync_status (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        last_sync_at DATETIME,
        last_remote_timestamp TEXT,
        sync_count INTEGER DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        name TEXT NOT NULL,
        webhook_url TEXT,
        app_token TEXT,
        uid TEXT,
        topic_id TEXT,
        enabled BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS blog_config (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        enabled BOOLEAN DEFAULT 0,
        generator TEXT DEFAULT 'jekyll',
        theme TEXT,
        title TEXT,
        description TEXT,
        author TEXT,
        base_url TEXT,
        posts_per_page INTEGER DEFAULT 10,
        show_summary BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS cleanup_config (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        enabled BOOLEAN DEFAULT 1,
        retention_days INTEGER DEFAULT 90,
        auto_cleanup_interval INTEGER DEFAULT 86400,
        last_cleanup_at DATETIME,
        cleanup_mode TEXT DEFAULT 'delete',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS articles_archive (
        id INTEGER PRIMARY KEY,
        feed_id INTEGER,
        title TEXT NOT NULL,
        link TEXT NOT NULL,
        content TEXT,
        published_at DATETIME,
        created_at DATETIME,
        archived_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at);
      CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at);
      CREATE INDEX IF NOT EXISTS idx_articles_feed_id ON articles(feed_id);
      CREATE INDEX IF NOT EXISTS idx_summaries_article_id ON summaries(article_id);
    `);
  }

  // Feeds
  getFeeds(): Feed[] {
    const stmt = this.db.prepare('SELECT * FROM feeds ORDER BY created_at DESC');
    return stmt.all() as Feed[];
  }

  addFeed(feed: Feed): number {
    const stmt = this.db.prepare(`
      INSERT INTO feeds (title, url, description, fetch_interval, enabled, is_default, filter_keywords)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      feed.title,
      feed.url,
      feed.description || null,
      feed.fetch_interval,
      feed.enabled ? 1 : 0,
      feed.is_default ? 1 : 0,
      feed.filter_keywords ? JSON.stringify(feed.filter_keywords) : null
    );
    return result.lastInsertRowid as number;
  }

  updateFeed(id: number, feed: Partial<Feed>): void {
    const updates: string[] = [];
    const values: any[] = [];

    if (feed.title !== undefined) {
      updates.push('title = ?');
      values.push(feed.title);
    }
    if (feed.url !== undefined) {
      updates.push('url = ?');
      values.push(feed.url);
    }
    if (feed.description !== undefined) {
      updates.push('description = ?');
      values.push(feed.description);
    }
    if (feed.fetch_interval !== undefined) {
      updates.push('fetch_interval = ?');
      values.push(feed.fetch_interval);
    }
    if (feed.enabled !== undefined) {
      updates.push('enabled = ?');
      values.push(feed.enabled ? 1 : 0);
    }
    if (feed.filter_keywords !== undefined) {
      updates.push('filter_keywords = ?');
      values.push(JSON.stringify(feed.filter_keywords));
    }

    if (updates.length === 0) return;

    values.push(id);
    const stmt = this.db.prepare(`UPDATE feeds SET ${updates.join(', ')} WHERE id = ?`);
    stmt.run(...values);
  }

  deleteFeed(id: number): void {
    const stmt = this.db.prepare('DELETE FROM feeds WHERE id = ? AND is_default = 0');
    stmt.run(id);
  }

  // Articles
  getArticles(feedId?: number): Article[] {
    if (feedId) {
      const stmt = this.db.prepare('SELECT * FROM articles WHERE feed_id = ? ORDER BY created_at DESC');
      return stmt.all(feedId) as Article[];
    }
    const stmt = this.db.prepare('SELECT * FROM articles ORDER BY created_at DESC');
    return stmt.all() as Article[];
  }

  addArticle(article: Article): number {
    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO articles (feed_id, title, link, content, published_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      article.feed_id || null,
      article.title,
      article.link,
      article.content || null,
      article.published_at || null
    );
    return result.lastInsertRowid as number;
  }

  // Crawlers
  getCrawlers(): Crawler[] {
    const stmt = this.db.prepare('SELECT * FROM crawlers ORDER BY created_at DESC');
    return stmt.all() as Crawler[];
  }

  addCrawler(crawler: Crawler): number {
    const stmt = this.db.prepare(`
      INSERT INTO crawlers (name, url, selector, fetch_interval, enabled, is_default, filter_keywords)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      crawler.name,
      crawler.url,
      crawler.selector || null,
      crawler.fetch_interval,
      crawler.enabled ? 1 : 0,
      crawler.is_default ? 1 : 0,
      crawler.filter_keywords ? JSON.stringify(crawler.filter_keywords) : null
    );
    return result.lastInsertRowid as number;
  }

  deleteCrawler(id: number): void {
    const stmt = this.db.prepare('DELETE FROM crawlers WHERE id = ? AND is_default = 0');
    stmt.run(id);
  }

  updateCrawler(id: number, crawler: Partial<Crawler>): void {
    const updates: string[] = [];
    const values: any[] = [];

    if (crawler.name !== undefined) {
      updates.push('name = ?');
      values.push(crawler.name);
    }
    if (crawler.url !== undefined) {
      updates.push('url = ?');
      values.push(crawler.url);
    }
    if (crawler.selector !== undefined) {
      updates.push('selector = ?');
      values.push(crawler.selector);
    }
    if (crawler.fetch_interval !== undefined) {
      updates.push('fetch_interval = ?');
      values.push(crawler.fetch_interval);
    }
    if (crawler.enabled !== undefined) {
      updates.push('enabled = ?');
      values.push(crawler.enabled ? 1 : 0);
    }
    if (crawler.filter_keywords !== undefined) {
      updates.push('filter_keywords = ?');
      values.push(JSON.stringify(crawler.filter_keywords));
    }

    if (updates.length === 0) return;

    values.push(id);
    const stmt = this.db.prepare(`UPDATE crawlers SET ${updates.join(', ')} WHERE id = ?`);
    stmt.run(...values);
  }

  // Settings
  getSetting(key: string): string | null {
    const stmt = this.db.prepare('SELECT value FROM settings WHERE key = ?');
    const row = stmt.get(key) as { value: string } | undefined;
    return row ? row.value : null;
  }

  setSetting(key: string, value: string): void {
    const stmt = this.db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    stmt.run(key, value);
  }

  // Cleanup
  cleanupOldArticles(retentionDays: number, mode: 'delete' | 'archive'): { deleted: number; archived: number } {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    const cutoffStr = cutoffDate.toISOString();

    let deleted = 0;
    let archived = 0;

    if (mode === 'archive') {
      // 归档模式：移动到归档表
      const stmt = this.db.prepare(`
        INSERT INTO articles_archive (id, feed_id, title, link, content, published_at, created_at)
        SELECT id, feed_id, title, link, content, published_at, created_at
        FROM articles
        WHERE created_at < ?
      `);
      const result = stmt.run(cutoffStr);
      archived = result.changes || 0;

      // 删除关联的summaries
      this.db.prepare(`
        DELETE FROM summaries
        WHERE article_id IN (SELECT id FROM articles WHERE created_at < ?)
      `).run(cutoffStr);

      // 删除文章
      const deleteStmt = this.db.prepare('DELETE FROM articles WHERE created_at < ?');
      deleted = deleteStmt.run(cutoffStr).changes || 0;
    } else {
      // 删除模式：直接删除
      // 先删除关联的summaries
      this.db.prepare(`
        DELETE FROM summaries
        WHERE article_id IN (SELECT id FROM articles WHERE created_at < ?)
      `).run(cutoffStr);

      // 删除文章
      const stmt = this.db.prepare('DELETE FROM articles WHERE created_at < ?');
      deleted = stmt.run(cutoffStr).changes || 0;
    }

    return { deleted, archived };
  }

  getDatabaseStats(): { articleCount: number; feedCount: number; crawlerCount: number; dbSize: number } {
    const articleCount = this.db.prepare('SELECT COUNT(*) as count FROM articles').get() as { count: number };
    const feedCount = this.db.prepare('SELECT COUNT(*) as count FROM feeds').get() as { count: number };
    const crawlerCount = this.db.prepare('SELECT COUNT(*) as count FROM crawlers').get() as { count: number };
    
    // 获取数据库文件大小
    const fs = require('fs');
    const dbPath = this.db.name;
    let dbSize = 0;
    try {
      const stats = fs.statSync(dbPath);
      dbSize = stats.size;
    } catch (error) {
      // 忽略错误，返回0
    }

    return {
      articleCount: articleCount.count,
      feedCount: feedCount.count,
      crawlerCount: crawlerCount.count,
      dbSize,
    };
  }

  // Notifications
  getNotifications(): any[] {
    const stmt = this.db.prepare('SELECT * FROM notifications ORDER BY created_at DESC');
    return stmt.all() as any[];
  }

  addNotification(notification: any): number {
    const stmt = this.db.prepare(`
      INSERT INTO notifications (type, name, webhook_url, app_token, uid, topic_id, enabled)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      notification.type,
      notification.name,
      notification.webhook_url || null,
      notification.app_token || null,
      notification.uid || null,
      notification.topic_id || null,
      notification.enabled ? 1 : 0
    );
    return result.lastInsertRowid as number;
  }

  updateNotification(id: number, notification: Partial<any>): void {
    const updates: string[] = [];
    const values: any[] = [];

    if (notification.name !== undefined) {
      updates.push('name = ?');
      values.push(notification.name);
    }
    if (notification.webhook_url !== undefined) {
      updates.push('webhook_url = ?');
      values.push(notification.webhook_url);
    }
    if (notification.app_token !== undefined) {
      updates.push('app_token = ?');
      values.push(notification.app_token);
    }
    if (notification.uid !== undefined) {
      updates.push('uid = ?');
      values.push(notification.uid);
    }
    if (notification.topic_id !== undefined) {
      updates.push('topic_id = ?');
      values.push(notification.topic_id);
    }
    if (notification.enabled !== undefined) {
      updates.push('enabled = ?');
      values.push(notification.enabled ? 1 : 0);
    }

    if (updates.length === 0) return;

    values.push(id);
    const stmt = this.db.prepare(`UPDATE notifications SET ${updates.join(', ')} WHERE id = ?`);
    stmt.run(...values);
  }

  deleteNotification(id: number): void {
    const stmt = this.db.prepare('DELETE FROM notifications WHERE id = ?');
    stmt.run(id);
  }

  // Blog Config
  getBlogConfig(): any {
    const stmt = this.db.prepare('SELECT * FROM blog_config ORDER BY id DESC LIMIT 1');
    return stmt.get() as any || null;
  }

  saveBlogConfig(config: any): void {
    const existing = this.getBlogConfig();
    if (existing) {
      const stmt = this.db.prepare(`
        UPDATE blog_config SET
          enabled = ?,
          generator = ?,
          theme = ?,
          title = ?,
          description = ?,
          author = ?,
          base_url = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      stmt.run(
        config.enabled ? 1 : 0,
        config.generator || 'jekyll',
        config.theme || null,
        config.title || null,
        config.description || null,
        config.author || null,
        config.base_url || null,
        existing.id
      );
    } else {
      const stmt = this.db.prepare(`
        INSERT INTO blog_config (enabled, generator, theme, title, description, author, base_url)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        config.enabled ? 1 : 0,
        config.generator || 'jekyll',
        config.theme || null,
        config.title || null,
        config.description || null,
        config.author || null,
        config.base_url || null
      );
    }
  }

  close(): void {
    this.db.close();
  }
}
