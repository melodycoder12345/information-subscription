import { useState, useEffect } from 'react';

export default function NotificationConfigPage() {
  const [wechatWebhooks, setWechatWebhooks] = useState<any[]>([]);
  const [wxpusherConfigs, setWxpusherConfigs] = useState<any[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAddingWebhook, setIsAddingWebhook] = useState(false);
  const [isAddingWxPusher, setIsAddingWxPusher] = useState(false);
  const [newWebhook, setNewWebhook] = useState({ name: '', url: '' });
  const [newWxPusher, setNewWxPusher] = useState({ name: '', appToken: '', uid: '', topicId: '' });

  useEffect(() => { loadNotifications(); }, []);

  const loadNotifications = async () => {
    try {
      const notifications = await window.electronAPI.db.getNotifications();
      setWechatWebhooks(notifications.filter((n: any) => n.type === 'wechat_work'));
      setWxpusherConfigs(notifications.filter((n: any) => n.type === 'wxpusher'));
    } catch (e) { console.error(e); }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = await window.electronAPI.db.getSetting('githubToken');
      const repo = await window.electronAPI.db.getSetting('githubRepo');
      if (token && repo) {
        const notifications = await window.electronAPI.db.getNotifications();
        await window.electronAPI.github.pushConfig({
          notifications: {
            enabled: true,
            wechatWork: notifications.filter((n: any) => n.type === 'wechat_work').map((n: any) => ({
              id: n.id, name: n.name, webhookUrl: n.webhook_url, enabled: n.enabled === 1,
            })),
            wxpusher: notifications.filter((n: any) => n.type === 'wxpusher').map((n: any) => ({
              id: n.id, name: n.name, appToken: n.app_token, uid: n.uid, topicId: n.topic_id, enabled: n.enabled === 1,
            })),
          },
        });
      }
      setHasChanges(false);
    } catch (e: any) { alert(`保存失败: ${e.message || e}`); }
    finally { setIsSaving(false); }
  };

  const handleAddWebhook = async () => {
    if (!newWebhook.name || !newWebhook.url) return;
    try {
      const id = await window.electronAPI.db.addNotification({
        type: 'wechat_work', name: newWebhook.name, webhook_url: newWebhook.url, enabled: true,
      });
      setWechatWebhooks([...wechatWebhooks, { ...newWebhook, id, enabled: true }]);
      setNewWebhook({ name: '', url: '' });
      setIsAddingWebhook(false);
      setHasChanges(true);
    } catch (e: any) { alert(`添加失败: ${e.message}`); }
  };

  const handleAddWxPusher = async () => {
    if (!newWxPusher.name || !newWxPusher.appToken) return;
    try {
      const id = await window.electronAPI.db.addNotification({
        type: 'wxpusher', name: newWxPusher.name, app_token: newWxPusher.appToken,
        uid: newWxPusher.uid || null, topic_id: newWxPusher.topicId || null, enabled: true,
      });
      setWxpusherConfigs([...wxpusherConfigs, { ...newWxPusher, id, enabled: true }]);
      setNewWxPusher({ name: '', appToken: '', uid: '', topicId: '' });
      setIsAddingWxPusher(false);
      setHasChanges(true);
    } catch (e: any) { alert(`添加失败: ${e.message}`); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除这个配置吗？')) return;
    await window.electronAPI.db.deleteNotification(id);
    loadNotifications();
    setHasChanges(true);
  };

  const handleToggle = async (id: number, enabled: boolean) => {
    await window.electronAPI.db.updateNotification(id, { enabled });
    loadNotifications();
    setHasChanges(true);
  };

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <button onClick={onChange}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-orange-500' : 'bg-gray-200'}`}
    >
      <span style={{ transform: checked ? 'translateX(18px)' : 'translateX(2px)' }}
        className="inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform" />
    </button>
  );

  const inputCls = "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-400";

  return (
    <div className="flex flex-col h-full">
      {/* 页头 */}
      <div className="flex items-center justify-between px-8 py-5 bg-white border-b border-gray-100">
        <div>
          <h1 className="text-xl font-bold text-gray-900">消息推送</h1>
          <p className="text-gray-400 text-xs mt-0.5">配置企业微信 Webhook 和个人微信推送</p>
        </div>
        {hasChanges && (
          <button onClick={handleSave} disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60"
          >
            {isSaving
              ? <span className="animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
              : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
            }
            {isSaving ? '推送中…' : '推送到 GitHub'}
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="grid grid-cols-2 gap-6 h-full">
          {/* 企业微信 */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-green-500 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9.5 3A6.5 6.5 0 0 1 16 9.5c0 1.61-.59 3.09-1.56 4.23l.27.27h.79l5 5-1.5 1.5-5-5v-.79l-.27-.27A6.516 6.516 0 0 1 9.5 16 6.5 6.5 0 0 1 3 9.5 6.5 6.5 0 0 1 9.5 3m0 2C7 5 5 7 5 9.5S7 14 9.5 14 14 12 14 9.5 12 5 9.5 5z"/>
                  </svg>
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-800">企业微信 Webhook</h2>
                  <p className="text-xs text-gray-400">{wechatWebhooks.length} 个配置</p>
                </div>
              </div>
              <button onClick={() => setIsAddingWebhook(v => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                添加
              </button>
            </div>

            {isAddingWebhook && (
              <div className="px-6 py-4 bg-green-50 border-b border-green-100 space-y-3">
                <input type="text" placeholder="名称（如：研发群）" value={newWebhook.name}
                  onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
                  className={inputCls} />
                <input type="text" placeholder="Webhook URL" value={newWebhook.url}
                  onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                  className={inputCls} />
                <div className="flex gap-2">
                  <button onClick={handleAddWebhook} disabled={!newWebhook.name || !newWebhook.url}
                    className="px-4 py-1.5 text-sm font-medium bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50">
                    确认
                  </button>
                  <button onClick={() => setIsAddingWebhook(false)}
                    className="px-4 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
                    取消
                  </button>
                </div>
              </div>
            )}

            <div className="flex-1 divide-y divide-gray-50">
              {wechatWebhooks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                  <p className="text-sm">暂无 Webhook 配置</p>
                </div>
              ) : wechatWebhooks.map((w) => (
                <div key={w.id} className={`px-6 py-4 ${!w.enabled ? 'opacity-50' : ''}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-gray-800">{w.name}</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleDelete(w.id)}
                        className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                      <Toggle checked={!!w.enabled} onChange={() => handleToggle(w.id, !w.enabled)} />
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 font-mono truncate">{w.webhook_url || w.url}</p>
                </div>
              ))}
            </div>
          </div>

          {/* WxPusher */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-green-600 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                  </svg>
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-800">个人微信（WxPusher）</h2>
                  <p className="text-xs text-gray-400">{wxpusherConfigs.length} 个配置</p>
                </div>
              </div>
              <button onClick={() => setIsAddingWxPusher(v => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                添加
              </button>
            </div>

            {isAddingWxPusher && (
              <div className="px-6 py-4 bg-green-50 border-b border-green-100 space-y-3">
                <input type="text" placeholder="名称" value={newWxPusher.name}
                  onChange={(e) => setNewWxPusher({ ...newWxPusher, name: e.target.value })}
                  className={inputCls} />
                <input type="password" placeholder="AppToken" value={newWxPusher.appToken}
                  onChange={(e) => setNewWxPusher({ ...newWxPusher, appToken: e.target.value })}
                  className={inputCls} />
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" placeholder="UID（可选）" value={newWxPusher.uid}
                    onChange={(e) => setNewWxPusher({ ...newWxPusher, uid: e.target.value })}
                    className={inputCls} />
                  <input type="text" placeholder="Topic ID（可选）" value={newWxPusher.topicId}
                    onChange={(e) => setNewWxPusher({ ...newWxPusher, topicId: e.target.value })}
                    className={inputCls} />
                </div>
                <p className="text-xs text-gray-400">扫码关注 WxPusher 公众号获取 UID</p>
                <div className="flex gap-2">
                  <button onClick={handleAddWxPusher} disabled={!newWxPusher.name || !newWxPusher.appToken}
                    className="px-4 py-1.5 text-sm font-medium bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50">
                    确认
                  </button>
                  <button onClick={() => setIsAddingWxPusher(false)}
                    className="px-4 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
                    取消
                  </button>
                </div>
              </div>
            )}

            <div className="flex-1 divide-y divide-gray-50">
              {wxpusherConfigs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                  <p className="text-sm">暂无 WxPusher 配置</p>
                </div>
              ) : wxpusherConfigs.map((c) => (
                <div key={c.id} className={`px-6 py-4 ${!c.enabled ? 'opacity-50' : ''}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-gray-800">{c.name}</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleDelete(c.id)}
                        className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                      <Toggle checked={!!c.enabled} onChange={() => handleToggle(c.id, !c.enabled)} />
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 space-y-0.5">
                    <p>UID: <span className="font-mono">{c.uid || '—'}</span></p>
                    {c.topic_id && <p>Topic ID: <span className="font-mono">{c.topic_id}</span></p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
