package config

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
)

type Config struct {
	Subscriptions []Subscription `json:"subscriptions"`
	Crawlers      []Crawler      `json:"crawlers"`
	AIConfig      AIConfig       `json:"ai"`
	Notifications Notifications  `json:"notifications"`
	Blog          BlogConfig     `json:"blog"`
}

type Subscription struct {
	ID             int      `json:"id"`
	Title          string   `json:"title"`
	URL            string   `json:"url"`
	Description    string   `json:"description"`
	FetchInterval  int      `json:"fetchInterval"`
	Enabled        bool     `json:"enabled"`
	IsDefault      bool     `json:"isDefault"`
	FilterKeywords []string `json:"filterKeywords"`
}

type Crawler struct {
	ID             int      `json:"id"`
	Name           string   `json:"name"`
	URL            string   `json:"url"`
	Selector       string   `json:"selector"`
	FetchInterval  int      `json:"fetchInterval"`
	Enabled        bool     `json:"enabled"`
	IsDefault      bool     `json:"isDefault"`
	FilterKeywords []string `json:"filterKeywords"`
}

type AIConfig struct {
	Model        string `json:"model"`
	APIKey       string `json:"apiKey"`
	BaseURL      string `json:"baseUrl"`
	SystemPrompt string `json:"systemPrompt"`
	Enabled      bool   `json:"enabled"`
}

type Notifications struct {
	WeChatWork []WeChatWorkConfig `json:"wechatWork"`
	WxPusher   []WxPusherConfig   `json:"wxpusher"`
	Enabled    bool               `json:"enabled"`
}

type WeChatWorkConfig struct {
	ID         int    `json:"id"`
	Name       string `json:"name"`
	WebhookURL string `json:"webhookUrl"`
	Enabled    bool   `json:"enabled"`
}

type WxPusherConfig struct {
	ID       int    `json:"id"`
	Name     string `json:"name"`
	AppToken string `json:"appToken"`
	UID      string `json:"uid"`
	TopicID  string `json:"topicId"`
	Enabled  bool   `json:"enabled"`
}

type BlogConfig struct {
	Enabled     bool   `json:"enabled"`
	Generator   string `json:"generator"`
	Theme       string `json:"theme"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Author      string `json:"author"`
	BaseURL     string `json:"baseUrl"`
}

func Load(configDir string) (*Config, error) {
	cfg := &Config{}

	// 加载订阅配置
	subsFile := filepath.Join(configDir, "subscriptions.json")
	if data, err := os.ReadFile(subsFile); err == nil {
		var subs struct {
			Feeds []Subscription `json:"feeds"`
		}
		if err := json.Unmarshal(data, &subs); err == nil {
			cfg.Subscriptions = subs.Feeds
		}
	}

	// 加载爬虫配置
	crawlersFile := filepath.Join(configDir, "crawlers.json")
	if data, err := os.ReadFile(crawlersFile); err == nil {
		var crawlers struct {
			Crawlers []Crawler `json:"crawlers"`
		}
		if err := json.Unmarshal(data, &crawlers); err == nil {
			cfg.Crawlers = crawlers.Crawlers
		}
	}

	// 加载AI配置（非敏感字段来自文件）
	aiFile := filepath.Join(configDir, "ai-config.json")
	if data, err := os.ReadFile(aiFile); err == nil {
		json.Unmarshal(data, &cfg.AIConfig)
	}
	// 敏感字段从环境变量覆盖（GitHub Secrets）
	if key := os.Getenv("AI_API_KEY"); key != "" {
		cfg.AIConfig.APIKey = key
	}
	if baseURL := os.Getenv("AI_BASE_URL"); baseURL != "" {
		cfg.AIConfig.BaseURL = baseURL
	}
	if cfg.AIConfig.APIKey != "" {
		cfg.AIConfig.Enabled = true
	}

	// 加载通知配置
	notifFile := filepath.Join(configDir, "notifications.json")
	if data, err := os.ReadFile(notifFile); err == nil {
		json.Unmarshal(data, &cfg.Notifications)
	}
	// 通知敏感字段从环境变量读取（会覆盖文件中的占位符）
	if webhookURL := os.Getenv("WECHAT_WEBHOOK_URL"); webhookURL != "" {
		if len(cfg.Notifications.WeChatWork) > 0 {
			cfg.Notifications.WeChatWork[0].WebhookURL = webhookURL
		} else {
			cfg.Notifications.WeChatWork = []WeChatWorkConfig{{Name: "default", WebhookURL: webhookURL, Enabled: true}}
		}
		cfg.Notifications.Enabled = true
	}
	if appToken := os.Getenv("WXPUSHER_APP_TOKEN"); appToken != "" {
		uid := os.Getenv("WXPUSHER_UID")
		if len(cfg.Notifications.WxPusher) > 0 {
			cfg.Notifications.WxPusher[0].AppToken = appToken
		} else {
			cfg.Notifications.WxPusher = []WxPusherConfig{{Name: "default", AppToken: appToken, UID: uid, Enabled: true}}
		}
		cfg.Notifications.Enabled = true
	}

	// 加载博客配置
	blogFile := filepath.Join(configDir, "blog.json")
	if data, err := os.ReadFile(blogFile); err == nil {
		json.Unmarshal(data, &cfg.Blog)
	}

	return cfg, nil
}

func (c *Config) Validate() error {
	if len(c.Subscriptions) == 0 && len(c.Crawlers) == 0 {
		return fmt.Errorf("至少需要配置一个RSS订阅源或爬虫任务")
	}
	return nil
}
