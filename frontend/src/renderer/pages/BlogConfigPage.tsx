import { useState, useEffect } from 'react';
import { BookOpen, Check, ExternalLink, Loader2, Save } from 'lucide-react';

export default function BlogConfigPage() {
  const [enabled, setEnabled] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [author, setAuthor] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [theme, setTheme] = useState('jekyll');
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveOk, setSaveOk] = useState(false);

  useEffect(() => { loadConfig(); }, []);

  const loadConfig = async () => {
    try {
      const config = await window.electronAPI.db.getBlogConfig();
      if (config) {
        setEnabled(config.enabled === 1);
        setTitle(config.title || '');
        setDescription(config.description || '');
        setAuthor(config.author || '');
        setBaseUrl(config.base_url || '');
        setTheme(config.theme || 'jekyll');
      }
    } catch (e) { console.error(e); }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await window.electronAPI.db.saveBlogConfig({ enabled, generator: 'jekyll', theme, title, description, author, base_url: baseUrl });
      const token = await window.electronAPI.db.getSetting('githubToken');
      const repo = await window.electronAPI.db.getSetting('githubRepo');
      if (token && repo) {
        await window.electronAPI.github.pushConfig({ blog: { enabled, generator: 'jekyll', theme, title, description, author, baseUrl } });
      }
      setHasChanges(false);
      setSaveOk(true);
      setTimeout(() => setSaveOk(false), 2000);
    } catch (e: any) { alert(`保存失败: ${e.message}`); }
    finally { setIsSaving(false); }
  };

  const inputCls = "w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50/80 focus:outline-none focus:ring-2 focus:ring-sky-400/80 focus:border-sky-300";

  const Toggle = () => (
    <button type="button" onClick={() => { setEnabled(!enabled); setHasChanges(true); }}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shadow-inner ${enabled ? 'bg-sky-500' : 'bg-slate-200'}`}
    >
      <span style={{ transform: enabled ? 'translateX(22px)' : 'translateX(2px)' }}
        className="inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-1 ring-black/5 transition-transform" />
    </button>
  );

  return (
    <div className="flex flex-col h-full">
      {/* 页头 */}
      <div className="flex items-center justify-between px-8 py-5 bg-white/90 border-b border-slate-200/80 shadow-sm backdrop-blur-sm">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">博客发布</h1>
          <p className="text-slate-500 text-xs mt-0.5">自动生成 Jekyll 博客并发布到 GitHub Pages</p>
        </div>
        <button type="button" onClick={handleSave} disabled={isSaving || !hasChanges}
          className={`flex items-center gap-2 px-5 py-2.5 text-white text-sm font-medium rounded-xl shadow-sm transition-all disabled:opacity-60 ${
            saveOk ? 'bg-emerald-500 shadow-emerald-900/20' : 'bg-sky-600 hover:bg-sky-700 shadow-sky-900/25'
          }`}
        >
          {isSaving
            ? <Loader2 className="w-4 h-4 animate-spin shrink-0" strokeWidth={2} aria-hidden />
            : saveOk
              ? <Check className="w-4 h-4 shrink-0" strokeWidth={2} aria-hidden />
              : <Save className="w-4 h-4 shrink-0" strokeWidth={2} aria-hidden />
          }
          {isSaving ? '保存中…' : saveOk ? '已保存' : '保存配置'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-8 min-h-0">
        <div className="grid grid-cols-2 gap-6 max-w-[1600px]">
          {/* 左栏：开关 + 主题 */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200/70 shadow-card overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200/60 bg-slate-50/90">
                <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-sky-500 shrink-0" strokeWidth={2} aria-hidden />
                  博客发布设置
                </h2>
              </div>
              <div className="px-6 py-5 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">启用博客发布</p>
                    <p className="text-xs text-gray-400 mt-0.5">GitHub Actions 将自动生成博客文章</p>
                  </div>
                  <Toggle />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">静态博客框架</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'jekyll', label: 'Jekyll', desc: '最流行' },
                      { value: 'hugo', label: 'Hugo', desc: '速度快' },
                      { value: 'html', label: '纯 HTML', desc: '最简单' },
                    ].map(opt => (
                      <button key={opt.value} onClick={() => { setTheme(opt.value); setHasChanges(true); }}
                        className={`p-3 rounded-lg border-2 text-left transition-all ${
                          theme === opt.value
                            ? 'border-sky-400 bg-sky-50'
                            : 'border-gray-100 hover:border-gray-200'
                        }`}
                      >
                        <p className="text-sm font-semibold text-gray-800">{opt.label}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 说明卡片 */}
            <div className="bg-sky-50 rounded-xl border border-sky-100 px-6 py-5">
              <h3 className="text-sm font-semibold text-sky-800 mb-3">使用说明</h3>
              <ol className="space-y-2 text-xs text-sky-700">
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-4 h-4 bg-sky-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  在 GitHub 仓库设置中开启 GitHub Pages
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-4 h-4 bg-sky-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  将 Source 设置为 <code className="bg-sky-100 px-1 rounded">gh-pages</code> 分支
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-4 h-4 bg-sky-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                  GitHub Actions 执行后会自动生成博客
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-4 h-4 bg-sky-500 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
                  通过右侧填写的基础 URL 访问博客
                </li>
              </ol>
            </div>
          </div>

          {/* 右栏：博客信息 */}
          <div className="bg-white rounded-2xl border border-slate-200/70 shadow-card overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200/60 bg-slate-50/90">
              <h2 className="text-sm font-semibold text-gray-800">博客信息</h2>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">博客标题</label>
                <input type="text" placeholder="我的 AI 资讯博客" value={title}
                  onChange={(e) => { setTitle(e.target.value); setHasChanges(true); }}
                  className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">博客描述</label>
                <textarea rows={3} placeholder="每日自动聚合 AI 领域最新资讯..." value={description}
                  onChange={(e) => { setDescription(e.target.value); setHasChanges(true); }}
                  className={`${inputCls} resize-none`} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">作者</label>
                <input type="text" placeholder="Your Name" value={author}
                  onChange={(e) => { setAuthor(e.target.value); setHasChanges(true); }}
                  className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">基础 URL</label>
                <input type="text" placeholder="https://username.github.io/repo-name" value={baseUrl}
                  onChange={(e) => { setBaseUrl(e.target.value); setHasChanges(true); }}
                  className={`${inputCls} font-mono`} />
                <p className="text-xs text-gray-400 mt-1">GitHub Pages 的访问地址</p>
              </div>
              {baseUrl && (
                <a href={baseUrl} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-sky-600 hover:underline">
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" strokeWidth={2} aria-hidden />
                  预览博客
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
