import { Article, Summary } from '../types';

export interface AIConfig {
  apiKey: string;
  model: string;
  systemPrompt?: string;
}

export async function summarizeArticle(
  article: Article,
  config: AIConfig
): Promise<Summary> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model || 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: config.systemPrompt || '请总结以下文章的主要内容，用简洁的中文表述。',
          },
          {
            role: 'user',
            content: `标题: ${article.title}\n\n内容: ${article.content || ''}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'AI总结失败');
    }

    const data = await response.json();
    const summaryContent = data.choices[0]?.message?.content || '';

    return {
      article_id: article.id!,
      content: summaryContent,
      model: config.model,
    };
  } catch (error) {
    console.error('AI总结失败:', error);
    throw error;
  }
}

export async function batchSummarize(
  articles: Article[],
  config: AIConfig
): Promise<Summary[]> {
  const summaries: Summary[] = [];
  
  for (const article of articles) {
    try {
      const summary = await summarizeArticle(article, config);
      summaries.push(summary);
      
      // 添加延迟以避免API限流
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`文章 ${article.id} 总结失败:`, error);
    }
  }
  
  return summaries;
}
