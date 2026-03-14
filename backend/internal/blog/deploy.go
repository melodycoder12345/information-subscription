package blog

import (
	"fmt"
	"os"
	"os/exec"
)

func DeployToGitHubPages(outputDir string, repoOwner string, repoName string, token string) error {
	// 初始化git仓库
	if err := initGitRepo(outputDir); err != nil {
		return fmt.Errorf("初始化git仓库失败: %v", err)
	}

	// 添加文件
	if err := gitAdd(outputDir); err != nil {
		return fmt.Errorf("添加文件失败: %v", err)
	}

	// 提交
	if err := gitCommit(outputDir, "Update blog"); err != nil {
		return fmt.Errorf("提交失败: %v", err)
	}

	// 推送到gh-pages分支
	if err := gitPush(outputDir, repoOwner, repoName, token, "gh-pages"); err != nil {
		return fmt.Errorf("推送失败: %v", err)
	}

	return nil
}

func initGitRepo(dir string) error {
	cmd := exec.Command("git", "init")
	cmd.Dir = dir
	return cmd.Run()
}

func gitAdd(dir string) error {
	cmd := exec.Command("git", "add", ".")
	cmd.Dir = dir
	return cmd.Run()
}

func gitCommit(dir string, message string) error {
	cmd := exec.Command("git", "commit", "-m", message)
	cmd.Dir = dir
	cmd.Env = append(os.Environ(), "GIT_AUTHOR_NAME=GitHub Actions", "GIT_AUTHOR_EMAIL=actions@github.com")
	return cmd.Run()
}

func gitPush(dir string, owner string, repo string, token string, branch string) error {
	remoteURL := fmt.Sprintf("https://%s@github.com/%s/%s.git", token, owner, repo)

	// 设置remote
	cmd := exec.Command("git", "remote", "add", "origin", remoteURL)
	cmd.Dir = dir
	if err := cmd.Run(); err != nil {
		// 如果remote已存在，更新它
		cmd = exec.Command("git", "remote", "set-url", "origin", remoteURL)
		cmd.Dir = dir
		if err := cmd.Run(); err != nil {
			return err
		}
	}

	// 推送
	cmd = exec.Command("git", "push", "-f", "origin", fmt.Sprintf("HEAD:%s", branch))
	cmd.Dir = dir
	return cmd.Run()
}
