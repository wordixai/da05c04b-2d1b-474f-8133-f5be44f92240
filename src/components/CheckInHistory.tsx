import { Clock, CheckCircle } from 'lucide-react';
import type { CheckInRecord } from '../hooks/useCheckIn';

interface CheckInHistoryProps {
  records: CheckInRecord[];
}

export function CheckInHistory({ records }: CheckInHistoryProps) {
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      weekday: 'short',
    });
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (records.length === 0) {
    return (
      <div className="bg-card rounded-xl p-6 border border-border">
        <h3 className="text-lg font-semibold text-foreground mb-4">签到历史</h3>
        <div className="text-center py-8">
          <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">暂无签到记录</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl p-6 border border-border">
      <h3 className="text-lg font-semibold text-foreground mb-4">签到历史</h3>
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {records.map((record, index) => (
          <div
            key={record.id}
            className={`flex items-center justify-between p-3 rounded-lg ${
              index === 0 ? 'bg-primary/10 border border-primary/30' : 'bg-secondary'
            }`}
          >
            <div className="flex items-center gap-3">
              <CheckCircle
                className={`w-5 h-5 ${index === 0 ? 'text-primary' : 'text-success'}`}
              />
              <span className="text-foreground">{formatDate(record.timestamp)}</span>
            </div>
            <span className="text-muted-foreground text-sm">
              {formatTime(record.timestamp)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
