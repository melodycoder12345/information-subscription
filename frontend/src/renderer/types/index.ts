export interface Feed {
  id?: number;
  title: string;
  url: string;
  description?: string;
  fetch_interval: number;
  enabled: boolean;
  is_default: boolean;
  filter_keywords?: string | string[];
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
  filter_keywords?: string | string[];
  created_at?: string;
}

export interface Summary {
  id?: number;
  article_id: number;
  content: string;
  model?: string;
  created_at?: string;
}

export interface Settings {
  githubToken?: string;
  githubRepo?: string;
  aiApiKey?: string;
  aiModel?: string;
  aiSystemPrompt?: string;
}
