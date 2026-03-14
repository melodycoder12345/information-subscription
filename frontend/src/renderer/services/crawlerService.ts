import { Crawler } from '../types';

export interface CrawledItem {
  title: string;
  link: string;
  content: string;
  url: string;
}

export async function crawlWebsite(crawler: Crawler): Promise<CrawledItem[]> {
  try {
    const response = await fetch(crawler.url);
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const items: CrawledItem[] = [];
    const elements = doc.querySelectorAll(crawler.selector || 'body');

    elements.forEach((element) => {
      const title = element.textContent?.trim() || '';
      const linkElement = element.querySelector('a');
      const link = linkElement?.href || crawler.url;
      const content = element.textContent?.trim() || title;

      // 应用关键词过滤
      if (crawler.filter_keywords && crawler.filter_keywords.length > 0) {
        const keywords = typeof crawler.filter_keywords === 'string'
          ? JSON.parse(crawler.filter_keywords)
          : crawler.filter_keywords;

        const fullText = `${title} ${content}`.toLowerCase();
        const hasKeyword = keywords.some((keyword: string) =>
          fullText.includes(keyword.toLowerCase())
        );

        if (!hasKeyword) {
          return; // 跳过不包含关键词的项
        }
      }

      items.push({
        title,
        link: new URL(link, crawler.url).href,
        content,
        url: crawler.url,
      });
    });

    return items;
  } catch (error) {
    console.error('爬虫执行失败:', error);
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
