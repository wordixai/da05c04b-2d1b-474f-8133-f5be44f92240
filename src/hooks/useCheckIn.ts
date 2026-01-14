import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface CheckInRecord {
  id: string;
  timestamp: number;
}

export interface EmergencyContact {
  name: string;
  email: string;
}

const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;
const DEVICE_ID_KEY = 'dead-yet-device-id';

// 获取或创建设备ID
function getDeviceId(): string {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

export function useCheckIn() {
  const [userId, setUserId] = useState<string | null>(null);
  const [records, setRecords] = useState<CheckInRecord[]>([]);
  const [emergencyContact, setEmergencyContactState] = useState<EmergencyContact | null>(null);
  const [lastCheckIn, setLastCheckIn] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(TWO_DAYS_MS);
  const [isLoading, setIsLoading] = useState(true);

  // 初始化用户
  useEffect(() => {
    async function initUser() {
      const deviceId = getDeviceId();

      // 尝试获取现有用户
      let { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('device_id', deviceId)
        .single();

      if (!existingUser) {
        // 创建新用户
        const { data: newUser, error } = await supabase
          .from('users')
          .insert({ device_id: deviceId })
          .select('id')
          .single();

        if (error) {
          console.error('创建用户失败:', error);
          return;
        }
        existingUser = newUser;
      }

      setUserId(existingUser.id);
    }

    initUser();
  }, []);

  // 加载数据
  useEffect(() => {
    if (!userId) return;

    async function loadData() {
      setIsLoading(true);

      // 获取签到记录
      const { data: checkins } = await supabase
        .from('checkins')
        .select('id, checked_in_at')
        .eq('user_id', userId)
        .order('checked_in_at', { ascending: false })
        .limit(30);

      if (checkins && checkins.length > 0) {
        setRecords(
          checkins.map((c) => ({
            id: c.id,
            timestamp: new Date(c.checked_in_at).getTime(),
          }))
        );
        setLastCheckIn(new Date(checkins[0].checked_in_at).getTime());
      }

      // 获取紧急联系人
      const { data: contact } = await supabase
        .from('emergency_contacts')
        .select('name, email')
        .eq('user_id', userId)
        .single();

      if (contact) {
        setEmergencyContactState(contact);
      }

      setIsLoading(false);
    }

    loadData();
  }, [userId]);

  // 更新倒计时
  useEffect(() => {
    const updateTimeRemaining = () => {
      if (lastCheckIn) {
        const elapsed = Date.now() - lastCheckIn;
        const remaining = Math.max(0, TWO_DAYS_MS - elapsed);
        setTimeRemaining(remaining);
      } else {
        setTimeRemaining(TWO_DAYS_MS);
      }
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);
    return () => clearInterval(interval);
  }, [lastCheckIn]);

  // 签到
  const checkIn = useCallback(async () => {
    if (!userId) return;

    const now = new Date();
    const { data, error } = await supabase
      .from('checkins')
      .insert({ user_id: userId, checked_in_at: now.toISOString() })
      .select('id, checked_in_at')
      .single();

    if (error) {
      console.error('签到失败:', error);
      return;
    }

    if (data) {
      const newRecord: CheckInRecord = {
        id: data.id,
        timestamp: new Date(data.checked_in_at).getTime(),
      };
      setRecords((prev) => [newRecord, ...prev].slice(0, 30));
      setLastCheckIn(newRecord.timestamp);
    }
  }, [userId]);

  // 设置紧急联系人
  const setEmergencyContact = useCallback(
    async (contact: EmergencyContact | null) => {
      if (!userId) return;

      if (contact) {
        // Upsert 紧急联系人
        const { error } = await supabase
          .from('emergency_contacts')
          .upsert(
            {
              user_id: userId,
              name: contact.name,
              email: contact.email,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
          );

        if (error) {
          console.error('保存紧急联系人失败:', error);
          return;
        }

        setEmergencyContactState(contact);
      } else {
        // 删除紧急联系人
        const { error } = await supabase
          .from('emergency_contacts')
          .delete()
          .eq('user_id', userId);

        if (error) {
          console.error('删除紧急联系人失败:', error);
          return;
        }

        setEmergencyContactState(null);
      }
    },
    [userId]
  );

  const isOverdue = timeRemaining === 0 && lastCheckIn !== null;
  const hasCheckedInToday = lastCheckIn
    ? Date.now() - lastCheckIn < 24 * 60 * 60 * 1000
    : false;

  return {
    records,
    emergencyContact,
    lastCheckIn,
    timeRemaining,
    isOverdue,
    hasCheckedInToday,
    isLoading,
    userId,
    checkIn,
    setEmergencyContact,
  };
}
