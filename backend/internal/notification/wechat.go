package notification

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

type WeChatWorkMessage struct {
	MsgType  string                `json:"msgtype"`
	Markdown WeChatMarkdownContent `json:"markdown"`
}

type WeChatMarkdownContent struct {
	Content string `json:"content"`
}

func SendWeChatWorkWebhook(webhookURL string, title string, content string, link string) error {
	message := WeChatWorkMessage{
		MsgType: "markdown",
		Markdown: WeChatMarkdownContent{
			Content: fmt.Sprintf("# %s\n\n%s\n\n[查看原文](%s)", title, content, link),
		},
	}

	jsonData, err := json.Marshal(message)
	if err != nil {
		return fmt.Errorf("序列化消息失败: %v", err)
	}

	client := &http.Client{
		Timeout: 10 * time.Second,
	}

	resp, err := client.Post(webhookURL, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("发送请求失败: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("HTTP状态码: %d", resp.StatusCode)
	}

	return nil
}
