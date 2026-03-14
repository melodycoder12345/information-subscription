package notification

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

type WxPusherMessage struct {
	AppToken    string   `json:"appToken"`
	Content     string   `json:"content"`
	Summary     string   `json:"summary"`
	ContentType int      `json:"contentType"` // 1-文本，2-html，3-markdown
	UIDs        []string `json:"uids,omitempty"`
	TopicIDs    []int    `json:"topicIds,omitempty"`
	URL         string   `json:"url,omitempty"`
}

type WxPusherResponse struct {
	Success bool   `json:"success"`
	Msg     string `json:"msg"`
	Data    struct {
		UID string `json:"uid"`
	} `json:"data"`
}

func SendWxPusherMessage(appToken string, content string, summary string, uids []string, url string) error {
	message := WxPusherMessage{
		AppToken:    appToken,
		Content:     content,
		Summary:     summary,
		ContentType: 1, // 文本
		UIDs:        uids,
		URL:         url,
	}

	jsonData, err := json.Marshal(message)
	if err != nil {
		return fmt.Errorf("序列化消息失败: %v", err)
	}

	client := &http.Client{
		Timeout: 10 * time.Second,
	}

	resp, err := client.Post(
		"https://wxpusher.zjiecode.com/api/send/message",
		"application/json",
		bytes.NewBuffer(jsonData),
	)
	if err != nil {
		return fmt.Errorf("发送请求失败: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("HTTP状态码: %d", resp.StatusCode)
	}

	var result WxPusherResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return fmt.Errorf("解析响应失败: %v", err)
	}

	if !result.Success {
		return fmt.Errorf("推送失败: %s", result.Msg)
	}

	return nil
}
