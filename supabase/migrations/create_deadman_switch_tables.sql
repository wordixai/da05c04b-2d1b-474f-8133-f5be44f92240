/*
  # 死了么应用数据库架构

  1. 新表:
    - `users` - 用户表（使用设备ID标识匿名用户）
    - `checkins` - 签到记录表
    - `emergency_contacts` - 紧急联系人表
    - `notifications_sent` - 已发送通知记录（防止重复发送）

  2. 安全:
    - 启用 RLS
    - 添加公开访问策略（简化版，无需登录）
*/

-- 用户表（匿名用户，使用设备ID标识）
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 签到记录表
CREATE TABLE IF NOT EXISTS checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  checked_in_at timestamptz DEFAULT now()
);

-- 紧急联系人表
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id) -- 每个用户只能有一个紧急联系人
);

-- 通知发送记录（防止重复发送）
CREATE TABLE IF NOT EXISTS notifications_sent (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  contact_id uuid REFERENCES emergency_contacts(id) ON DELETE CASCADE NOT NULL,
  sent_at timestamptz DEFAULT now(),
  checkin_deadline timestamptz NOT NULL -- 记录是哪个时间点的超时触发的
);

-- 启用 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications_sent ENABLE ROW LEVEL SECURITY;

-- 公开访问策略（简化版应用，无需登录）
CREATE POLICY "允许公开读取用户" ON users FOR SELECT USING (true);
CREATE POLICY "允许公开创建用户" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "允许公开更新用户" ON users FOR UPDATE USING (true);

CREATE POLICY "允许公开读取签到" ON checkins FOR SELECT USING (true);
CREATE POLICY "允许公开创建签到" ON checkins FOR INSERT WITH CHECK (true);

CREATE POLICY "允许公开读取紧急联系人" ON emergency_contacts FOR SELECT USING (true);
CREATE POLICY "允许公开创建紧急联系人" ON emergency_contacts FOR INSERT WITH CHECK (true);
CREATE POLICY "允许公开更新紧急联系人" ON emergency_contacts FOR UPDATE USING (true);
CREATE POLICY "允许公开删除紧急联系人" ON emergency_contacts FOR DELETE USING (true);

CREATE POLICY "允许公开读取通知记录" ON notifications_sent FOR SELECT USING (true);
CREATE POLICY "允许公开创建通知记录" ON notifications_sent FOR INSERT WITH CHECK (true);

-- 创建索引以优化查询
CREATE INDEX IF NOT EXISTS idx_checkins_user_id ON checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_checkins_checked_in_at ON checkins(checked_in_at DESC);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_user_id ON emergency_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_deadline ON notifications_sent(user_id, checkin_deadline);
