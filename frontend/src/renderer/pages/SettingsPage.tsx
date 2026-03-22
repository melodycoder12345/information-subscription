import { useState, useEffect } from 'react';
import {
  Check,
  Github,
  Loader2,
  Save,
  Settings2,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';

// ── 服务商 → 模型 配置表 ──────────────────────────────────
const PROVIDERS = [
  {
    id: 'openai', name: 'OpenAI', flag: '🌐',
    baseUrl: 'https://api.openai.com/v1',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o' },
      { id: 'gpt-4o-mini', name: 'GPT-4o mini' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
    ],
  },
  {
    id: 'deepseek', name: 'DeepSeek', flag: '🇨🇳',
    baseUrl: 'https://api.deepseek.com/v1',
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek Chat (V3)' },
      { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner (R1)' },
    ],
  },
  {
    id: 'qwen', name: '通义千问', flag: '🇨🇳',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    models: [
      { id: 'qwen-max', name: 'Qwen Max' },
      { id: 'qwen-plus', name: 'Qwen Plus' },
      { id: 'qwen-turbo', name: 'Qwen Turbo' },
      { id: 'qwen-long', name: 'Qwen Long' },
    ],
  },
  {
    id: 'zhipu', name: '智谱 GLM', flag: '🇨🇳',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    models: [
      { id: 'glm-4-plus', name: 'GLM-4 Plus' },
      { id: 'glm-4', name: 'GLM-4' },
      { id: 'glm-4-flash', name: 'GLM-4 Flash（免费）' },
    ],
  },
  {
    id: 'moonshot', name: '月之暗面 Kimi', flag: '🇨🇳',
    baseUrl: 'https://api.moonshot.cn/v1',
    models: [
      { id: 'moonshot-v1-128k', name: 'Moonshot 128k' },
      { id: 'moonshot-v1-32k', name: 'Moonshot 32k' },
      { id: 'moonshot-v1-8k', name: 'Moonshot 8k' },
    ],
  },
  {
    id: 'yi', name: '零一万物 Yi', flag: '🇨🇳',
    baseUrl: 'https://api.lingyiwanwu.com/v1',
    models: [
      { id: 'yi-lightning', name: 'Yi Lightning' },
      { id: 'yi-large', name: 'Yi Large' },
      { id: 'yi-medium', name: 'Yi Medium' },
    ],
  },
  {
    id: 'minimax', name: 'MiniMax', flag: '🇨🇳',
    baseUrl: 'https://api.minimax.chat/v1',
    models: [
      { id: 'abab6.5s-chat', name: 'ABAB 6.5s' },
      { id: 'abab5.5-chat', name: 'ABAB 5.5' },
    ],
  },
  {
    id: 'hunyuan', name: '腾讯混元', flag: '🇨🇳',
    baseUrl: 'https://api.hunyuan.cloud.tencent.com/v1',
    models: [
      { id: 'hunyuan-pro', name: '混元 Pro' },
      { id: 'hunyuan-standard', name: '混元 Standard' },
      { id: 'hunyuan-lite', name: '混元 Lite' },
    ],
  },
  {
    id: 'ernie', name: '文心一言', flag: '🇨🇳',
    baseUrl: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop',
    models: [
      { id: 'ernie-4.0-8k', name: 'ERNIE 4.0' },
      { id: 'ernie-3.5-8k', name: 'ERNIE 3.5' },
      { id: 'ernie-lite-8k', name: 'ERNIE Lite' },
    ],
  },
  {
    id: 'spark', name: '讯飞星火', flag: '🇨🇳',
    baseUrl: 'https://spark-api-open.xf-yun.com/v1',
    models: [
      { id: 'spark-max', name: 'Spark Max' },
      { id: 'spark-pro', name: 'Spark Pro' },
      { id: 'spark-lite', name: 'Spark Lite' },
    ],
  },
  {
    id: 'anthropic', name: 'Anthropic', flag: '🌐',
    baseUrl: 'https://api.anthropic.com',
    models: [
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet' },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku' },
      { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku' },
    ],
  },
  {
    id: 'google', name: 'Google Gemini', flag: '🌐',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    models: [
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
    ],
  },
];

export default function SettingsPage() {
  const [githubToken, setGithubToken] = useState('');
  const [githubRepo, setGithubRepo] = useState('');

  // AI
  const [aiProvider, setAiProvider] = useState('openai');
  const [aiModel, setAiModel] = useState('gpt-4o');
  const [aiApiKey, setAiApiKey] = useState('');
  const [aiBaseUrl, setAiBaseUrl] = useState('https://api.openai.com/v1');
  const [aiSystemPrompt, setAiSystemPrompt] = useState('');

  // 功能开关
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [blogEnabled, setBlogEnabled] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [saveOk, setSaveOk] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'ok' | 'fail'>('idle');
  const [testMsg, setTestMsg] = useState('');

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    const token = await window.electronAPI.db.getSetting('githubToken');
    const repo = await window.electronAPI.db.getSetting('githubRepo');
    const provider = await window.electronAPI.db.getSetting('aiProvider');
    const apiKey = await window.electronAPI.db.getSetting('aiApiKey');
    const model = await window.electronAPI.db.getSetting('aiModel');
    const baseUrl = await window.electronAPI.db.getSetting('aiBaseUrl');
    const prompt = await window.electronAPI.db.getSetting('aiSystemPrompt');
    const notif = await window.electronAPI.db.getSetting('notificationsEnabled');
    const blog = await window.electronAPI.db.getSetting('blogEnabled');
    if (token) setGithubToken(token);
    if (repo) setGithubRepo(repo);
    if (provider) setAiProvider(provider);
    if (apiKey) setAiApiKey(apiKey);
    if (model) setAiModel(model);
    if (baseUrl) setAiBaseUrl(baseUrl);
    if (prompt) setAiSystemPrompt(prompt);
    if (notif) setNotificationsEnabled(notif === 'true');
    if (blog) setBlogEnabled(blog === 'true');
  };

  // 切换服务商时自动填充 baseUrl 和第一个模型
  const handleProviderChange = (providerId: string) => {
    const p = PROVIDERS.find((x) => x.id === providerId);
    if (!p) return;
    setAiProvider(providerId);
    setAiBaseUrl(p.baseUrl);
    setAiModel(p.models[0].id);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveOk(false);
    try {
      await window.electronAPI.db.setSetting('githubToken', githubToken);
      await window.electronAPI.db.setSetting('githubRepo', githubRepo);
      await window.electronAPI.db.setSetting('aiProvider', aiProvider);
      await window.electronAPI.db.setSetting('aiApiKey', aiApiKey);
      await window.electronAPI.db.setSetting('aiModel', aiModel);
      await window.electronAPI.db.setSetting('aiBaseUrl', aiBaseUrl);
      await window.electronAPI.db.setSetting('aiSystemPrompt', aiSystemPrompt);
      await window.electronAPI.db.setSetting('notificationsEnabled', notificationsEnabled.toString());
      await window.electronAPI.db.setSetting('blogEnabled', blogEnabled.toString());
      if (githubToken && githubRepo) {
        try {
          await window.electronAPI.github.pushConfig({
            ai: { model: aiModel, baseUrl: aiBaseUrl, systemPrompt: aiSystemPrompt, enabled: true },
          });
        } catch (_) {}
      }
      setSaveOk(true);
      setTimeout(() => setSaveOk(false), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!githubToken || !githubRepo) return;
    setTestStatus('testing');
    setTestMsg('');
    try {
      const result = await window.electronAPI.github.testConnection(githubToken, githubRepo);
      if ((result as any)?.success ?? result) { setTestStatus('ok'); setTestMsg('连接成功'); }
      else { setTestStatus('fail'); setTestMsg((result as any)?.message || '连接失败'); }
    } catch (e: any) { setTestStatus('fail'); setTestMsg(e.message || '连接失败'); }
  };

  const currentProvider = PROVIDERS.find((p) => p.id === aiProvider) ?? PROVIDERS[0];
  const currentModels = currentProvider.models;

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
    <button type="button" onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 shadow-inner ${checked ? 'bg-primary-500' : 'bg-slate-200'}`}
    >
      <span style={{ transform: checked ? 'translateX(22px)' : 'translateX(2px)' }}
        className="inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-1 ring-black/5 transition-transform" />
    </button>
  );

  const inputCls = 'w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400/80 focus:border-primary-300 bg-slate-50/80';

  return (
    <div className="flex flex-col h-full">
      {/* 页头 */}
      <div className="flex items-center justify-between px-8 py-5 bg-white/90 border-b border-slate-200/80 shadow-sm backdrop-blur-sm">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">系统设置</h1>
          <p className="text-slate-500 text-xs mt-0.5">配置 GitHub 仓库、AI 服务及功能开关</p>
        </div>
        <button type="button" onClick={handleSave} disabled={isSaving}
          className={`flex items-center gap-2 px-5 py-2.5 text-white text-sm font-medium rounded-xl shadow-sm transition-all disabled:opacity-60 ${saveOk ? 'bg-emerald-500 shadow-emerald-900/20' : 'bg-primary-600 hover:bg-primary-700 shadow-primary-900/25'}`}
        >
          {isSaving
            ? <Loader2 className="w-4 h-4 animate-spin shrink-0" strokeWidth={2} aria-hidden />
            : saveOk
              ? <Check className="w-4 h-4 shrink-0" strokeWidth={2} aria-hidden />
              : <Save className="w-4 h-4 shrink-0" strokeWidth={2} aria-hidden />
          }
          {isSaving ? '保存中…' : saveOk ? '已保存' : '保存设置'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-8 min-h-0">
        <div className="grid grid-cols-2 gap-6 max-w-[1600px]">
          {/* ── 左栏：GitHub + 功能开关 ── */}
          <div className="space-y-6">
            {/* GitHub 配置 */}
            <div className="bg-white rounded-2xl border border-slate-200/70 shadow-card overflow-hidden">
              <div className="flex items-center gap-2.5 px-6 py-4 border-b border-slate-200/60 bg-slate-50/90">
                <Github className="w-4 h-4 text-slate-800 shrink-0" strokeWidth={2} aria-hidden />
                <h2 className="text-sm font-semibold text-gray-800">GitHub 配置</h2>
              </div>
              <div className="px-6 py-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">仓库地址</label>
                  <input type="text" placeholder="username/repository-name" value={githubRepo}
                    onChange={(e) => setGithubRepo(e.target.value)} className={`${inputCls} font-mono`} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Personal Access Token</label>
                  <input type="password" placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" value={githubToken}
                    onChange={(e) => setGithubToken(e.target.value)} className={`${inputCls} font-mono`} />
                  <p className="text-xs text-gray-400 mt-1">需要 repo 和 workflow 权限</p>
                </div>
                <div className="flex items-center gap-3 pt-1">
                  <button type="button" onClick={handleTestConnection} disabled={!githubToken || !githubRepo || testStatus === 'testing'}
                    className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50 font-medium"
                  >
                    {testStatus === 'testing'
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0 text-slate-500" strokeWidth={2} aria-hidden />
                      : <Zap className="w-3.5 h-3.5 shrink-0" strokeWidth={2} aria-hidden />
                    }
                    {testStatus === 'testing' ? '测试中…' : '测试连接'}
                  </button>
                  {testStatus === 'ok' && <span className="text-sm text-emerald-600 font-medium flex items-center gap-1"><Check className="w-4 h-4 shrink-0" strokeWidth={2} aria-hidden />{testMsg}</span>}
                  {testStatus === 'fail' && <span className="text-sm text-red-500 flex items-center gap-1"><X className="w-4 h-4 shrink-0" strokeWidth={2} aria-hidden />{testMsg}</span>}
                </div>
              </div>
            </div>

            {/* 功能开关 */}
            <div className="bg-white rounded-2xl border border-slate-200/70 shadow-card overflow-hidden">
              <div className="flex items-center gap-2.5 px-6 py-4 border-b border-slate-200/60 bg-slate-50/90">
                <Settings2 className="w-4 h-4 text-slate-500 shrink-0" strokeWidth={2} aria-hidden />
                <h2 className="text-sm font-semibold text-gray-800">功能开关</h2>
              </div>
              <div className="px-6 divide-y divide-gray-50">
                <div className="flex items-center justify-between py-4">
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="text-sm font-medium text-gray-800">消息推送</p>
                    <p className="text-xs text-gray-400 mt-0.5">将摘要推送到企业微信 / 个人微信</p>
                  </div>
                  <Toggle checked={notificationsEnabled} onChange={setNotificationsEnabled} />
                </div>
                <div className="flex items-center justify-between py-4">
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="text-sm font-medium text-gray-800">博客发布</p>
                    <p className="text-xs text-gray-400 mt-0.5">自动生成 Jekyll 博客并发布到 GitHub Pages</p>
                  </div>
                  <Toggle checked={blogEnabled} onChange={setBlogEnabled} />
                </div>
              </div>
            </div>
          </div>

          {/* ── 右栏：AI 配置 ── */}
          <div className="bg-white rounded-2xl border border-slate-200/70 shadow-card overflow-hidden">
            <div className="flex items-center gap-2.5 px-6 py-4 border-b border-slate-200/60 bg-slate-50/90">
              <Sparkles className="w-4 h-4 text-purple-500 shrink-0" strokeWidth={2} aria-hidden />
              <h2 className="text-sm font-semibold text-gray-800">AI 配置</h2>
            </div>

            <div className="flex h-[calc(100%-57px)]">
              {/* 服务商列表 */}
              <div className="w-40 flex-shrink-0 border-r border-gray-100 overflow-y-auto py-2">
                {PROVIDERS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleProviderChange(p.id)}
                    className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-left transition-colors ${
                      aiProvider === p.id
                        ? 'bg-primary-50 text-primary-700 font-semibold'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-base leading-none">{p.flag}</span>
                    <span className="text-xs truncate">{p.name}</span>
                  </button>
                ))}
              </div>

              {/* 服务商配置区 */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                {/* 当前服务商名 */}
                <div className="flex items-center gap-2 pb-1 border-b border-gray-50">
                  <span className="text-lg">{currentProvider.flag}</span>
                  <span className="text-sm font-semibold text-gray-800">{currentProvider.name}</span>
                </div>

                {/* 模型选择 */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">模型</label>
                  <select value={aiModel} onChange={(e) => setAiModel(e.target.value)}
                    className={inputCls}
                  >
                    {currentModels.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>

                {/* API Key */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">API Key</label>
                  <input type="password" placeholder="sk-..." value={aiApiKey}
                    onChange={(e) => setAiApiKey(e.target.value)}
                    className={`${inputCls} font-mono`} />
                </div>

                {/* Base URL */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">API Base URL</label>
                  <input type="text" value={aiBaseUrl}
                    onChange={(e) => setAiBaseUrl(e.target.value)}
                    className={`${inputCls} font-mono text-xs`} />
                  <p className="text-xs text-gray-400 mt-1">切换服务商时自动填充，也可手动修改</p>
                </div>

                {/* 总结提示词 */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">总结提示词</label>
                  <textarea rows={6} value={aiSystemPrompt}
                    onChange={(e) => setAiSystemPrompt(e.target.value)}
                    placeholder="请用中文简洁地总结以下文章的核心内容，不超过 200 字…"
                    className={`${inputCls} resize-none leading-relaxed`} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
