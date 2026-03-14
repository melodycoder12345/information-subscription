// GitHub Service implementation
// Note: @octokit/rest needs to be installed: npm install @octokit/rest

// For now, using a simplified implementation
interface Octokit {
  repos: {
    get: (params: any) => Promise<any>;
    getContent: (params: any) => Promise<any>;
    createOrUpdateFileContents: (params: any) => Promise<any>;
  };
  actions: {
    createWorkflowDispatch: (params: any) => Promise<any>;
    createOrUpdateRepoSecret: (params: any) => Promise<any>;
  };
}

export interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
}

export class GitHubService {
  private octokit: Octokit | null = null;
  private config: GitHubConfig | null = null;

  initialize(token: string, repo: string) {
    const [owner, repoName] = repo.split('/');
    this.config = { token, owner, repo: repoName };
    this.octokit = new Octokit({ auth: token });
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.octokit || !this.config) {
      return { success: false, message: '未初始化' };
    }

    try {
      await this.octokit.repos.get({
        owner: this.config.owner,
        repo: this.config.repo,
      });
      return { success: true, message: '连接成功' };
    } catch (error: any) {
      return { success: false, message: error.message || '连接失败' };
    }
  }

  async createOrUpdateSecret(secretName: string, secretValue: string): Promise<void> {
    if (!this.octokit || !this.config) {
      throw new Error('GitHub服务未初始化');
    }

    // GitHub Secrets需要通过API创建，这里需要实现加密逻辑
    // 简化版本：直接调用API
    try {
      // 注意：GitHub Secrets API需要特殊的加密处理
      // 这里只是示例，实际需要使用GitHub的公共密钥加密
      await this.octokit.rest.actions.createOrUpdateRepoSecret({
        owner: this.config.owner,
        repo: this.config.repo,
        secret_name: secretName,
        encrypted_value: secretValue, // 实际需要先加密
      });
    } catch (error: any) {
      throw new Error(`创建Secret失败: ${error.message}`);
    }
  }

  async pushFile(path: string, content: string, message: string): Promise<void> {
    if (!this.octokit || !this.config) {
      throw new Error('GitHub服务未初始化');
    }

    try {
      // 检查文件是否存在
      let sha: string | undefined;
      try {
        const { data } = await this.octokit.repos.getContent({
          owner: this.config.owner,
          repo: this.config.repo,
          path,
        });
        if ('sha' in data) {
          sha = data.sha;
        }
      } catch (error: any) {
        // 文件不存在，将创建新文件
      }

      await this.octokit.repos.createOrUpdateFileContents({
        owner: this.config.owner,
        repo: this.config.repo,
        path,
        message,
        content: Buffer.from(content).toString('base64'),
        sha,
      });
    } catch (error: any) {
      throw new Error(`推送文件失败: ${error.message}`);
    }
  }

  async triggerWorkflow(): Promise<void> {
    if (!this.octokit || !this.config) {
      throw new Error('GitHub服务未初始化');
    }

    try {
      await this.octokit.actions.createWorkflowDispatch({
        owner: this.config.owner,
        repo: this.config.repo,
        workflow_id: 'main.yml',
        ref: 'main',
      });
    } catch (error: any) {
      throw new Error(`触发工作流失败: ${error.message}`);
    }
  }

  async getFileContent(path: string): Promise<string> {
    if (!this.octokit || !this.config) {
      throw new Error('GitHub服务未初始化');
    }

    try {
      const { data } = await this.octokit.repos.getContent({
        owner: this.config.owner,
        repo: this.config.repo,
        path,
      });

      if ('content' in data && 'encoding' in data) {
        return Buffer.from(data.content, 'base64').toString('utf-8');
      }
      throw new Error('无法获取文件内容');
    } catch (error: any) {
      throw new Error(`获取文件失败: ${error.message}`);
    }
  }
}
