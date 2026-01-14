import { Heart } from 'lucide-react';

interface CheckInButtonProps {
  onCheckIn: () => void;
  hasCheckedInToday: boolean;
  isOverdue: boolean;
}

export function CheckInButton({ onCheckIn, hasCheckedInToday, isOverdue }: CheckInButtonProps) {
  const getButtonStyles = () => {
    if (isOverdue) {
      return 'bg-danger glow-danger';
    }
    if (hasCheckedInToday) {
      return 'bg-success glow-success';
    }
    return 'bg-primary animate-pulse-glow';
  };

  const getStatusText = () => {
    if (isOverdue) {
      return '已超时！';
    }
    if (hasCheckedInToday) {
      return '今日已签到';
    }
    return '点击签到';
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <button
        onClick={onCheckIn}
        className={`
          relative w-48 h-48 rounded-full
          flex items-center justify-center
          transition-all duration-300 ease-out
          hover:scale-105 active:scale-95
          ${getButtonStyles()}
        `}
      >
        <Heart
          className={`w-20 h-20 text-primary-foreground ${hasCheckedInToday ? 'animate-heartbeat' : ''}`}
          fill="currentColor"
        />
      </button>
      <p className="text-xl font-medium text-foreground">{getStatusText()}</p>
    </div>
  );
}
