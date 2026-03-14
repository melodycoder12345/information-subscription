package blog

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"
)

type Article struct {
	Title       string
	Link        string
	Content     string
	PublishedAt string
	Summary     string
}

type BlogConfig struct {
	Title       string
	Description string
	Author      string
	BaseURL     string
	Theme       string
	Generator   string
}

func GenerateJekyllBlog(articles []Article, config BlogConfig, outputDir string) error {
	postsDir := filepath.Join(outputDir, "_posts")
	if err := os.MkdirAll(postsDir, 0755); err != nil {
		return fmt.Errorf("创建posts目录失败: %v", err)
	}

	// 生成_config.yml
	configContent := fmt.Sprintf(`title: %s
description: %s
author: %s
baseurl: %s
theme: %s
`, config.Title, config.Description, config.Author, config.BaseURL, config.Theme)

	if err := os.WriteFile(filepath.Join(outputDir, "_config.yml"), []byte(configContent), 0644); err != nil {
		return fmt.Errorf("写入配置文件失败: %v", err)
	}

	// 生成文章
	for _, article := range articles {
		filename := generateFilename(article.Title, article.PublishedAt)
		content := generatePostContent(article, config)
		filePath := filepath.Join(postsDir, filename)
		if err := os.WriteFile(filePath, []byte(content), 0644); err != nil {
			return fmt.Errorf("写入文章失败: %v", err)
		}
	}

	// 生成index.html
	indexContent := generateIndexHTML(articles, config)
	if err := os.WriteFile(filepath.Join(outputDir, "index.html"), []byte(indexContent), 0644); err != nil {
		return fmt.Errorf("写入首页失败: %v", err)
	}

	// 生成feed.xml
	feedContent := generateRSSFeed(articles, config)
	if err := os.WriteFile(filepath.Join(outputDir, "feed.xml"), []byte(feedContent), 0644); err != nil {
		return fmt.Errorf("写入RSS Feed失败: %v", err)
	}

	return nil
}

func generateFilename(title string, publishedAt string) string {
	date := time.Now().Format("2006-01-02")
	if publishedAt != "" {
		if t, err := time.Parse("2006-01-02 15:04:05", publishedAt); err == nil {
			date = t.Format("2006-01-02")
		}
	}

	slug := strings.ToLower(title)
	slug = strings.ReplaceAll(slug, " ", "-")
	slug = strings.ReplaceAll(slug, "/", "-")

	return fmt.Sprintf("%s-%s.md", date, slug)
}

func generatePostContent(article Article, config BlogConfig) string {
	frontMatter := fmt.Sprintf(`---
layout: post
title: "%s"
date: %s
author: %s
summary: "%s"
original_link: "%s"
---

%s
`, article.Title, article.PublishedAt, config.Author, article.Summary, article.Link, article.Content)

	return frontMatter
}

func generateIndexHTML(articles []Article, config BlogConfig) string {
	var items strings.Builder
	items.WriteString(fmt.Sprintf(`<!DOCTYPE html>
<html>
<head>
    <title>%s</title>
    <meta charset="utf-8">
</head>
<body>
    <h1>%s</h1>
    <p>%s</p>
    <ul>
`, config.Title, config.Title, config.Description))

	for _, article := range articles {
		items.WriteString(fmt.Sprintf(`        <li>
            <a href="%s">%s</a>
            <p>%s</p>
        </li>
`, article.Link, article.Title, article.Summary))
	}

	items.WriteString(`    </ul>
</body>
</html>`)

	return items.String()
}

func generateRSSFeed(articles []Article, config BlogConfig) string {
	var items strings.Builder
	items.WriteString(`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
    <title>` + config.Title + `</title>
    <description>` + config.Description + `</description>
    <link>` + config.BaseURL + `</link>
`)

	for _, article := range articles {
		items.WriteString(fmt.Sprintf(`    <item>
        <title>%s</title>
        <link>%s</link>
        <description><![CDATA[%s]]></description>
        <pubDate>%s</pubDate>
    </item>
`, article.Title, article.Link, article.Content, article.PublishedAt))
	}

	items.WriteString(`</channel>
</rss>`)

	return items.String()
}
