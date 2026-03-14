import { Feed, Article } from '../types';

export async function fetchRSSFeed(feed: Feed): Promise<Article[]> {
  try {
    const response = await fetch(feed.url);
    const text = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, 'text/xml');

    const items = xmlDoc.querySelectorAll('item');
    const articles: Article[] = [];

    items.forEach((item) => {
      const title = item.querySelector('title')?.textContent || '';
      const link = item.querySelector('link')?.textContent || '';
      const description = item.querySelector('description')?.textContent || '';
      const content = item.querySelector('content\\:encoded')?.textContent || description;
      const pubDate = item.querySelector('pubDate')?.textContent || '';

      // 应用关键词过滤
      if (feed.filter_keywords && feed.filter_keywords.length > 0) {
        const keywords = typeof feed.filter_keywords === 'string' 
          ? JSON.parse(feed.filter_keywords) 
          : feed.filter_keywords;
        
        const fullText = `${title} ${description} ${content}`.toLowerCase();
        const hasKeyword = keywords.some((keyword: string) =>
          fullText.includes(keyword.toLowerCase())
        );

        if (!hasKeyword) {
          return; // 跳过不包含关键词的文章
        }
      }

      articles.push({
        feed_id: feed.id,
        title,
        link,
        content,
        published_at: pubDate,
      });
    });

    return articles;
  } catch (error) {
    console.error('RSS拉取失败:', error);
    throw error;
  }
}

export function filterByAIKeywords(
  content: string,
  keywords: string[]
): boolean {
  const lowerContent = content.toLowerCase();
  return keywords.some((keyword) =>
    lowerContent.includes(keyword.toLowerCase())
  );
}

export async function deduplicateArticles(
  articles: Article[],
  existingLinks: Set<string>
): Promise<Article[]> {
  return articles.filter((article) => {
    if (existingLinks.has(article.link)) {
      return false;
    }
    existingLinks.add(article.link);
    return true;
  });
}
