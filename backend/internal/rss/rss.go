package rss

import (
	"fmt"
	"log"
	"strings"

	"github.com/information-subscription/backend/internal/config"
	"github.com/mmcdole/gofeed"
)

type Article struct {
	Title       string
	Link        string
	Content     string
	PublishedAt string
	FeedURL     string
}

func FetchAll(cfg *config.Config) error {
	for _, sub := range cfg.Subscriptions {
		if !sub.Enabled {
			continue
		}

		articles, err := FetchFeed(sub)
		if err != nil {
			log.Printf("拉取RSS失败 [%s]: %v", sub.Title, err)
			continue
		}

		// 应用AI关键词过滤
		if len(sub.FilterKeywords) > 0 {
			articles = FilterByKeywords(articles, sub.FilterKeywords)
		}

		log.Printf("RSS源 [%s]: 获取到 %d 篇文章", sub.Title, len(articles))

		// 这里应该将文章保存到文件或推送到GitHub
		// 暂时只打印
		for _, article := range articles {
			fmt.Printf("  - %s: %s\n", article.Title, article.Link)
		}
	}

	return nil
}

func FetchFeed(sub config.Subscription) ([]Article, error) {
	fp := gofeed.NewParser()
	feed, err := fp.ParseURL(sub.URL)
	if err != nil {
		return nil, err
	}

	var articles []Article
	for _, item := range feed.Items {
		article := Article{
			Title:       item.Title,
			Link:        item.Link,
			Content:     getContent(item),
			PublishedAt: getPublishedAt(item),
			FeedURL:     sub.URL,
		}
		articles = append(articles, article)
	}

	return articles, nil
}

func getContent(item *gofeed.Item) string {
	if item.Content != "" {
		return item.Content
	}
	return item.Description
}

func getPublishedAt(item *gofeed.Item) string {
	if item.PublishedParsed != nil {
		return item.PublishedParsed.Format("2006-01-02 15:04:05")
	}
	return ""
}

func FilterByKeywords(articles []Article, keywords []string) []Article {
	var filtered []Article
	for _, article := range articles {
		fullText := strings.ToLower(article.Title + " " + article.Content)
		for _, keyword := range keywords {
			if strings.Contains(fullText, strings.ToLower(keyword)) {
				filtered = append(filtered, article)
				break
			}
		}
	}
	return filtered
}
