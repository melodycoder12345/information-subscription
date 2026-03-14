package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"time"

	"github.com/information-subscription/backend/internal/ai"
	"github.com/information-subscription/backend/internal/blog"
	"github.com/information-subscription/backend/internal/config"
	"github.com/information-subscription/backend/internal/crawler"
	"github.com/information-subscription/backend/internal/notification"
	"github.com/information-subscription/backend/internal/rss"
)

type Article struct {
	Title       string `json:"title"`
	Link        string `json:"link"`
	Content     string `json:"content"`
	PublishedAt string `json:"publishedAt"`
	FeedURL     string `json:"feedUrl,omitempty"`
	Summary     string `json:"summary,omitempty"`
}

func main() {
	configDir := flag.String("config-dir", "./config", "配置文件目录")
	flag.Parse()

	cfg, err := config.Load(*configDir)
	if err != nil {
		log.Fatalf("加载配置失败: %v", err)
	}

	fmt.Printf("配置加载成功，RSS源数量: %d, 爬虫数量: %d\n", len(cfg.Subscriptions), len(cfg.Crawlers))

	// 创建data目录
	dataDir := "data"
	os.MkdirAll(dataDir, 0755)
	os.MkdirAll(filepath.Join(dataDir, "articles"), 0755)

	var allArticles []Article

	// 执行RSS订阅拉取
	for _, sub := range cfg.Subscriptions {
		if !sub.Enabled {
			continue
		}

		articles, err := rss.FetchFeed(sub)
		if err != nil {
			log.Printf("RSS拉取失败 [%s]: %v", sub.Title, err)
			continue
		}

		// 应用AI关键词过滤
		if len(sub.FilterKeywords) > 0 {
			articles = rss.FilterByKeywords(articles, sub.FilterKeywords)
		}

		// 转换为统一格式
		for _, article := range articles {
			allArticles = append(allArticles, Article{
				Title:       article.Title,
				Link:        article.Link,
				Content:     article.Content,
				PublishedAt: article.PublishedAt,
				FeedURL:     article.FeedURL,
			})
		}
	}

	// 执行爬虫任务
	for _, crawlerConfig := range cfg.Crawlers {
		if !crawlerConfig.Enabled {
			continue
		}

		items, err := crawler.Crawl(crawlerConfig)
		if err != nil {
			log.Printf("爬虫执行失败 [%s]: %v", crawlerConfig.Name, err)
			continue
		}

		// 应用AI关键词过滤
		if len(crawlerConfig.FilterKeywords) > 0 {
			items = crawler.FilterByKeywords(items, crawlerConfig.FilterKeywords)
		}

		// 转换为统一格式
		for _, item := range items {
			allArticles = append(allArticles, Article{
				Title:       item.Title,
				Link:        item.Link,
				Content:     item.Content,
				PublishedAt: time.Now().Format("2006-01-02 15:04:05"),
			})
		}
	}

	// AI总结（如果启用）
	if cfg.AIConfig.Enabled && cfg.AIConfig.APIKey != "" {
		log.Printf("开始AI总结，共 %d 篇文章", len(allArticles))
		for i := range allArticles {
			summary, err := ai.SummarizeArticle(
				cfg.AIConfig.APIKey,
				cfg.AIConfig.Model,
				cfg.AIConfig.SystemPrompt,
				allArticles[i].Title,
				allArticles[i].Content,
				cfg.AIConfig.BaseURL,
			)
			if err != nil {
				log.Printf("AI总结失败 [%s]: %v", allArticles[i].Title, err)
				continue
			}
			allArticles[i].Summary = summary
		}
	}

	// 发送通知（如果启用）
	if cfg.Notifications.Enabled {
		// 企业微信通知
		for _, wechatConfig := range cfg.Notifications.WeChatWork {
			if wechatConfig.Enabled {
				for _, article := range allArticles {
					content := article.Summary
					if content == "" {
						content = article.Content
					}
					if err := notification.SendWeChatWorkWebhook(wechatConfig.WebhookURL, article.Title, content, article.Link); err != nil {
						log.Printf("企业微信推送失败: %v", err)
					}
				}
			}
		}

		// WxPusher通知
		for _, wxpusherConfig := range cfg.Notifications.WxPusher {
			if wxpusherConfig.Enabled {
				for _, article := range allArticles {
					content := article.Summary
					if content == "" {
						content = article.Content
					}
					uids := []string{}
					if wxpusherConfig.UID != "" {
						uids = []string{wxpusherConfig.UID}
					}
					if err := notification.SendWxPusherMessage(wxpusherConfig.AppToken, content, article.Title, uids, article.Link); err != nil {
						log.Printf("WxPusher推送失败: %v", err)
					}
				}
			}
		}
	}

	// 生成博客（如果启用）
	if cfg.Blog.Enabled {
		log.Printf("开始生成博客")
		blogArticles := make([]blog.Article, len(allArticles))
		for i, article := range allArticles {
			blogArticles[i] = blog.Article{
				Title:       article.Title,
				Link:        article.Link,
				Content:     article.Content,
				Summary:     article.Summary,
				PublishedAt: article.PublishedAt,
			}
		}

		blogConfig := blog.BlogConfig{
			Title:       cfg.Blog.Title,
			Description: cfg.Blog.Description,
			Author:      cfg.Blog.Author,
			BaseURL:     cfg.Blog.BaseURL,
			Theme:       cfg.Blog.Theme,
			Generator:   cfg.Blog.Generator,
		}

		blogDir := filepath.Join(dataDir, "blog")
		if err := blog.GenerateJekyllBlog(blogArticles, blogConfig, blogDir); err != nil {
			log.Printf("博客生成失败: %v", err)
		} else {
			log.Printf("博客生成成功: %s", blogDir)
		}
	}

	// 保存结果到JSON文件
	timestamp := time.Now().Format("20060102150405")
	articlesFile := filepath.Join(dataDir, "articles", fmt.Sprintf("%s.json", timestamp))

	articlesData := map[string]interface{}{
		"timestamp": time.Now().Format(time.RFC3339),
		"articles":  allArticles,
	}

	jsonData, err := json.MarshalIndent(articlesData, "", "  ")
	if err != nil {
		log.Printf("序列化数据失败: %v", err)
	} else {
		if err := os.WriteFile(articlesFile, jsonData, 0644); err != nil {
			log.Printf("写入文件失败: %v", err)
		} else {
			log.Printf("文章数据已保存: %s", articlesFile)
		}
	}

	// 更新latest.json
	latestData := map[string]interface{}{
		"last_update": time.Now().Format(time.RFC3339),
		"files": []string{
			fmt.Sprintf("data/articles/%s.json", timestamp),
		},
	}

	latestJson, err := json.MarshalIndent(latestData, "", "  ")
	if err == nil {
		os.WriteFile(filepath.Join(dataDir, "latest.json"), latestJson, 0644)
	}

	fmt.Printf("任务执行完成，共处理 %d 篇文章\n", len(allArticles))
	os.Exit(0)
}
