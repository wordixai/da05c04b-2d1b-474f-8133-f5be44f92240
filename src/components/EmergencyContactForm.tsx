import { useState } from 'react';
import { UserCircle, Mail, Save, X, Edit2, Send, Loader2 } from 'lucide-react';
import type { EmergencyContact } from '../hooks/useCheckIn';
import { supabase } from '../lib/supabase';

interface EmergencyContactFormProps {
  contact: EmergencyContact | null;
  onSave: (contact: EmergencyContact | null) => void;
  userId: string | null;
}

export function EmergencyContactForm({ contact, onSave, userId }: EmergencyContactFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(contact?.name || '');
  const [email, setEmail] = useState(contact?.email || '');
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSave = () => {
    if (name.trim() && email.trim()) {
      onSave({ name: name.trim(), email: email.trim() });
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setName(contact?.name || '');
    setEmail(contact?.email || '');
    setIsEditing(false);
  };

  const handleDelete = () => {
    onSave(null);
    setName('');
    setEmail('');
    setIsEditing(false);
  };

  const handleSendTest = async () => {
    if (!userId) return;

    setIsSending(true);
    setSendResult(null);

    try {
      const { data, error } = await supabase.rpc('send_test_notification', {
        p_user_id: userId
      });

      if (error) {
        setSendResult({ success: false, message: error.message });
      } else if (data) {
        setSendResult({
          success: data.success,
          message: data.message || data.error || '发送完成'
        });
      }
    } catch (err) {
      setSendResult({ success: false, message: '发送失败，请稍后重试' });
    } finally {
      setIsSending(false);
      // 3秒后清除结果提示
      setTimeout(() => setSendResult(null), 5000);
    }
  };

  if (!isEditing && contact) {
    return (
      <div className="bg-card rounded-xl p-6 border border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">紧急联系人</h3>
          <button
            onClick={() => setIsEditing(true)}
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            <Edit2 className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <UserCircle className="w-5 h-5 text-primary" />
            <span className="text-foreground">{contact.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-primary" />
            <span className="text-foreground">{contact.email}</span>
          </div>
        </div>

        {/* 发送测试邮件按钮 */}
        <div className="mt-4 pt-4 border-t border-border">
          <button
            onClick={handleSendTest}
            disabled={isSending || !userId}
            className="w-full bg-secondary text-secondary-foreground py-3 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                发送中...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                发送测试邮件
              </>
            )}
          </button>

          {sendResult && (
            <p className={`mt-3 text-sm text-center ${sendResult.success ? 'text-success' : 'text-danger'}`}>
              {sendResult.message}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl p-6 border border-border">
      <h3 className="text-lg font-semibold text-foreground mb-4">
        {contact ? '编辑紧急联系人' : '设置紧急联系人'}
      </h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-muted-foreground mb-2">姓名</label>
          <div className="relative">
            <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="输入联系人姓名"
              className="w-full bg-input border border-border rounded-lg py-3 pl-11 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm text-muted-foreground mb-2">邮箱</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="输入联系人邮箱"
              className="w-full bg-input border border-border rounded-lg py-3 pl-11 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleSave}
            disabled={!name.trim() || !email.trim()}
            className="flex-1 bg-primary text-primary-foreground py-3 rounded-lg font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            保存
          </button>
          {contact && (
            <>
              <button
                onClick={handleCancel}
                className="flex-1 bg-secondary text-secondary-foreground py-3 rounded-lg font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              >
                <X className="w-5 h-5" />
                取消
              </button>
              <button
                onClick={handleDelete}
                className="bg-danger text-danger-foreground py-3 px-4 rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                删除
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
