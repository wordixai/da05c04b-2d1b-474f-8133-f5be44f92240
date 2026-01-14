import { useState, useEffect, useCallback } from 'react';

export interface CheckInRecord {
  id: string;
  timestamp: number;
}

export interface EmergencyContact {
  name: string;
  email: string;
}

interface CheckInData {
  records: CheckInRecord[];
  emergencyContact: EmergencyContact | null;
  lastCheckIn: number | null;
}

const STORAGE_KEY = 'dead-yet-data';
const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;

export function useCheckIn() {
  const [data, setData] = useState<CheckInData>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return {
      records: [],
      emergencyContact: null,
      lastCheckIn: null,
    };
  });

  const [timeRemaining, setTimeRemaining] = useState<number>(TWO_DAYS_MS);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    const updateTimeRemaining = () => {
      if (data.lastCheckIn) {
        const elapsed = Date.now() - data.lastCheckIn;
        const remaining = Math.max(0, TWO_DAYS_MS - elapsed);
        setTimeRemaining(remaining);
      } else {
        setTimeRemaining(TWO_DAYS_MS);
      }
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);
    return () => clearInterval(interval);
  }, [data.lastCheckIn]);

  const checkIn = useCallback(() => {
    const now = Date.now();
    const newRecord: CheckInRecord = {
      id: crypto.randomUUID(),
      timestamp: now,
    };

    setData((prev) => ({
      ...prev,
      records: [newRecord, ...prev.records].slice(0, 30),
      lastCheckIn: now,
    }));
  }, []);

  const setEmergencyContact = useCallback((contact: EmergencyContact | null) => {
    setData((prev) => ({
      ...prev,
      emergencyContact: contact,
    }));
  }, []);

  const isOverdue = timeRemaining === 0 && data.lastCheckIn !== null;
  const hasCheckedInToday = data.lastCheckIn
    ? Date.now() - data.lastCheckIn < 24 * 60 * 60 * 1000
    : false;

  return {
    records: data.records,
    emergencyContact: data.emergencyContact,
    lastCheckIn: data.lastCheckIn,
    timeRemaining,
    isOverdue,
    hasCheckedInToday,
    checkIn,
    setEmergencyContact,
  };
}
