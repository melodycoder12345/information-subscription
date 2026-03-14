import { Article } from '../types';

export interface SyncStatus {
  lastSyncAt: string | null;
  lastRemoteTimestamp: string | null;
  syncCount: number;
}

export interface LatestData {
  last_update: string;
  files: string[];
}

export async function fetchLatestData(githubToken: string, repo: string): Promise<LatestData> {
  const [owner, repoName] = repo.split('/');
  const url = `https://api.github.com/repos/${owner}/${repoName}/contents/data/latest.json`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${githubToken}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!response.ok) {
    throw new Error(`获取最新数据失败: ${response.statusText}`);
  }

  const data = await response.json();
  // 在浏览器环境中使用 atob 解码 base64
  const content = atob(data.content);
  return JSON.parse(content);
}

export async function fetchArticleData(
  githubToken: string,
  repo: string,
  filePath: string
): Promise<Article[]> {
  const [owner, repoName] = repo.split('/');
  const url = `https://api.github.com/repos/${owner}/${repoName}/contents/${filePath}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${githubToken}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!response.ok) {
    throw new Error(`获取文章数据失败: ${response.statusText}`);
  }

  const data = await response.json();
  // 在浏览器环境中使用 atob 解码 base64
  const content = atob(data.content);
  const parsed = JSON.parse(content);
  return parsed.articles || [];
}

export async function syncData(
  githubToken: string,
  repo: string,
  lastSyncTimestamp: string | null
): Promise<{ synced: number; articles: Article[] }> {
  const latestData = await fetchLatestData(githubToken, repo);

  // 检查是否有新数据
  if (lastSyncTimestamp && latestData.last_update <= lastSyncTimestamp) {
    return { synced: 0, articles: [] };
  }

  const allArticles: Article[] = [];

  // 下载所有新文件
  for (const file of latestData.files) {
    if (file.includes('articles')) {
      const articles = await fetchArticleData(githubToken, repo, file);
      allArticles.push(...articles);
    }
  }

  return {
    synced: allArticles.length,
    articles: allArticles,
  };
}
