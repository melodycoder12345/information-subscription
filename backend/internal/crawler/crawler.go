package crawler

import (
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/PuerkitoBio/goquery"
	"github.com/information-subscription/backend/internal/config"
)

type CrawledItem struct {
	Title   string
	Link    string
	Content string
	URL     string
}

func RunAll(cfg *config.Config) error {
	for _, crawler := range cfg.Crawlers {
		if !crawler.Enabled {
			continue
		}

		items, err := Crawl(crawler)
		if err != nil {
			log.Printf("爬虫执行失败 [%s]: %v", crawler.Name, err)
			continue
		}

		// 应用AI关键词过滤
		if len(crawler.FilterKeywords) > 0 {
			items = FilterByKeywords(items, crawler.FilterKeywords)
		}

		log.Printf("爬虫 [%s]: 获取到 %d 条数据", crawler.Name, len(items))

		// 这里应该将数据保存到文件或推送到GitHub
		// 暂时只打印
		for _, item := range items {
			fmt.Printf("  - %s: %s\n", item.Title, item.Link)
		}
	}

	return nil
}

func Crawl(crawler config.Crawler) ([]CrawledItem, error) {
	client := &http.Client{
		Timeout: 30 * time.Second,
	}

	resp, err := client.Get(crawler.URL)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("HTTP状态码: %d", resp.StatusCode)
	}

	doc, err := goquery.NewDocumentFromReader(resp.Body)
	if err != nil {
		return nil, err
	}

	var items []CrawledItem
	doc.Find(crawler.Selector).Each(func(i int, s *goquery.Selection) {
		title := strings.TrimSpace(s.Text())
		link, _ := s.Attr("href")
		if link == "" {
			link = crawler.URL
		}

		items = append(items, CrawledItem{
			Title:   title,
			Link:    link,
			Content: title,
			URL:     crawler.URL,
		})
	})

	return items, nil
}

func FilterByKeywords(items []CrawledItem, keywords []string) []CrawledItem {
	var filtered []CrawledItem
	for _, item := range items {
		fullText := strings.ToLower(item.Title + " " + item.Content)
		for _, keyword := range keywords {
			if strings.Contains(fullText, strings.ToLower(keyword)) {
				filtered = append(filtered, item)
				break
			}
		}
	}
	return filtered
}
