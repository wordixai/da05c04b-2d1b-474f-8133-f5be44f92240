interface CountdownTimerProps {
  timeRemaining: number;
  isOverdue: boolean;
}

export function CountdownTimer({ timeRemaining, isOverdue }: CountdownTimerProps) {
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return {
      hours: hours.toString().padStart(2, '0'),
      minutes: minutes.toString().padStart(2, '0'),
      seconds: seconds.toString().padStart(2, '0'),
    };
  };

  const { hours, minutes, seconds } = formatTime(timeRemaining);

  const getTimerColor = () => {
    if (isOverdue) return 'text-danger';
    const hoursLeft = timeRemaining / (1000 * 60 * 60);
    if (hoursLeft < 12) return 'text-danger';
    if (hoursLeft < 24) return 'text-warning';
    return 'text-success';
  };

  return (
    <div className="text-center">
      <p className="text-muted-foreground mb-2">距离触发通知</p>
      <div className={`font-mono text-5xl font-bold ${getTimerColor()}`}>
        {isOverdue ? (
          <span className="animate-pulse">已超时</span>
        ) : (
          <>
            <span>{hours}</span>
            <span className="mx-1 animate-pulse">:</span>
            <span>{minutes}</span>
            <span className="mx-1 animate-pulse">:</span>
            <span>{seconds}</span>
          </>
        )}
      </div>
      {!isOverdue && (
        <p className="text-muted-foreground mt-2 text-sm">
          {parseInt(hours)}小时 {parseInt(minutes)}分钟 {parseInt(seconds)}秒
        </p>
      )}
    </div>
  );
}
