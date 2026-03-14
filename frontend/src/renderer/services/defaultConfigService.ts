import { Feed, Crawler } from '../types';

export const DEFAULT_FEEDS: Omit<Feed, 'id'>[] = [
  {
    title: 'OpenAI Blog',
    url: 'https://openai.com/blog/rss.xml',
    description: 'OpenAI官方博客 - AI研究和产品更新',
    fetch_interval: 3600,
    enabled: true,
    is_default: true,
    filter_keywords: ['AI', 'artificial intelligence', 'GPT', 'LLM', 'ChatGPT', 'machine learning', 'deep learning'],
  },
  {
    title: 'Anthropic Blog',
    url: 'https://www.anthropic.com/index.xml',
    description: 'Anthropic官方博客 - Claude AI相关',
    fetch_interval: 3600,
    enabled: true,
    is_default: true,
    filter_keywords: ['AI', 'Claude', 'LLM', 'artificial intelligence', 'machine learning'],
  },
  {
    title: 'Google AI Blog',
    url: 'https://ai.googleblog.com/feeds/posts/default',
    description: 'Google AI研究博客',
    fetch_interval: 3600,
    enabled: true,
    is_default: true,
    filter_keywords: ['AI', 'artificial intelligence', 'machine learning', 'deep learning', 'Gemini', 'neural network'],
  },
  {
    title: 'Hacker News AI',
    url: 'https://hnrss.org/newest?q=AI',
    description: 'Hacker News AI相关话题',
    fetch_interval: 7200,
    enabled: true,
    is_default: true,
    filter_keywords: ['AI', 'artificial intelligence', 'machine learning', 'GPT', 'LLM', 'ChatGPT'],
  },
  {
    title: 'Towards Data Science',
    url: 'https://towardsdatascience.com/feed',
    description: 'Towards Data Science - AI和机器学习文章',
    fetch_interval: 3600,
    enabled: true,
    is_default: true,
    filter_keywords: ['AI', 'machine learning', 'deep learning', 'neural network', 'data science'],
  },
  {
    title: 'Machine Learning Mastery',
    url: 'https://machinelearningmastery.com/feed/',
    description: '机器学习教程和实践',
    fetch_interval: 7200,
    enabled: true,
    is_default: true,
    filter_keywords: ['machine learning', 'AI', 'deep learning', 'neural network'],
  },
  {
    title: 'Fast.ai Blog',
    url: 'https://www.fast.ai/atom.xml',
    description: 'Fast.ai - 实用深度学习',
    fetch_interval: 7200,
    enabled: true,
    is_default: true,
    filter_keywords: ['deep learning', 'AI', 'machine learning', 'neural network'],
  },
  {
    title: 'Distill.pub',
    url: 'https://distill.pub/rss.xml',
    description: 'Distill - 机器学习可视化研究',
    fetch_interval: 86400,
    enabled: true,
    is_default: true,
    filter_keywords: ['machine learning', 'AI', 'deep learning', 'neural network'],
  },
  {
    title: 'AI Research Papers (arXiv)',
    url: 'https://arxiv.org/rss/cs.AI',
    description: 'arXiv AI研究论文',
    fetch_interval: 10800,
    enabled: true,
    is_default: true,
    filter_keywords: ['AI', 'artificial intelligence', 'machine learning', 'deep learning'],
  },
  {
    title: 'TechCrunch AI',
    url: 'https://techcrunch.com/tag/artificial-intelligence/feed/',
    description: 'TechCrunch AI新闻',
    fetch_interval: 3600,
    enabled: true,
    is_default: true,
    filter_keywords: ['AI', 'artificial intelligence', 'machine learning'],
  },
];

export const DEFAULT_CRAWLERS: Omit<Crawler, 'id'>[] = [
  {
    name: 'ArXiv AI Papers',
    url: 'https://arxiv.org/list/cs.AI/recent',
    selector: 'dt',
    fetch_interval: 86400,
    enabled: true,
    is_default: true,
    filter_keywords: ['AI', 'artificial intelligence', 'machine learning', 'deep learning', 'neural network'],
  },
  {
    name: 'Papers with Code',
    url: 'https://paperswithcode.com/latest',
    selector: '.paper-card',
    fetch_interval: 86400,
    enabled: true,
    is_default: true,
    filter_keywords: ['AI', 'machine learning', 'deep learning', 'neural network'],
  },
  {
    name: 'AI News (The Verge)',
    url: 'https://www.theverge.com/ai-artificial-intelligence',
    selector: 'article',
    fetch_interval: 3600,
    enabled: true,
    is_default: true,
    filter_keywords: ['AI', 'artificial intelligence', 'GPT', 'LLM', 'ChatGPT'],
  },
];

export async function loadDefaultConfigs() {
  // 检查是否已加载过默认配置
  const hasLoaded = await window.electronAPI.db.getSetting('defaultConfigsLoaded');
  if (hasLoaded === 'true') {
    return;
  }

  // 加载默认RSS源
  for (const feed of DEFAULT_FEEDS) {
    await window.electronAPI.db.addFeed({
      ...feed,
      filter_keywords: Array.isArray(feed.filter_keywords)
        ? JSON.stringify(feed.filter_keywords)
        : feed.filter_keywords,
    });
  }

  // 加载默认爬虫
  for (const crawler of DEFAULT_CRAWLERS) {
    await window.electronAPI.db.addCrawler({
      ...crawler,
      filter_keywords: Array.isArray(crawler.filter_keywords)
        ? JSON.stringify(crawler.filter_keywords)
        : crawler.filter_keywords,
    });
  }

  // 标记已加载
  await window.electronAPI.db.setSetting('defaultConfigsLoaded', 'true');
}
