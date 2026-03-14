import { useState, useEffect } from 'react';

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

  const inputCls = "w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sky-400";

  const Toggle = () => (
    <button onClick={() => { setEnabled(!enabled); setHasChanges(true); }}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? 'bg-sky-500' : 'bg-gray-200'}`}
    >
      <span style={{ transform: enabled ? 'translateX(22px)' : 'translateX(2px)' }}
        className="inline-block h-5 w-5 rounded-full bg-white shadow transition-transform" />
    </button>
  );

  return (
    <div className="flex flex-col h-full">
      {/* 页头 */}
      <div className="flex items-center justify-between px-8 py-5 bg-white border-b border-gray-100">
        <div>
          <h1 className="text-xl font-bold text-gray-900">博客发布</h1>
          <p className="text-gray-400 text-xs mt-0.5">自动生成 Jekyll 博客并发布到 GitHub Pages</p>
        </div>
        <button onClick={handleSave} disabled={isSaving || !hasChanges}
          className={`flex items-center gap-2 px-5 py-2.5 text-white text-sm font-medium rounded-lg transition-all disabled:opacity-60 ${
            saveOk ? 'bg-emerald-500' : 'bg-sky-600 hover:bg-sky-700'
          }`}
        >
          {isSaving
            ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            : saveOk
              ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
          }
          {isSaving ? '保存中…' : saveOk ? '已保存' : '保存配置'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="grid grid-cols-2 gap-6">
          {/* 左栏：开关 + 主题 */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <svg className="w-4 h-4 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
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
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
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
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
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
