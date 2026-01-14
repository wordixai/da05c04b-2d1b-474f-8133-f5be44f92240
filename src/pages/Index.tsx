import { Heart } from 'lucide-react';
import { CheckInButton } from '../components/CheckInButton';
import { CountdownTimer } from '../components/CountdownTimer';
import { EmergencyContactForm } from '../components/EmergencyContactForm';
import { CheckInHistory } from '../components/CheckInHistory';
import { useCheckIn } from '../hooks/useCheckIn';

export default function Index() {
  const {
    records,
    emergencyContact,
    lastCheckIn,
    timeRemaining,
    isOverdue,
    hasCheckedInToday,
    checkIn,
    setEmergencyContact,
  } = useCheckIn();

  const formatLastCheckIn = () => {
    if (!lastCheckIn) return '从未签到';
    const date = new Date(lastCheckIn);
    return date.toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center gap-3">
            <Heart className="w-8 h-8 text-primary" fill="currentColor" />
            <h1 className="text-2xl font-bold text-gradient">死了么</h1>
          </div>
          <p className="text-center text-muted-foreground mt-2">
            每日签到，让关心你的人安心
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-xl mx-auto space-y-8">
          {/* Check-in Section */}
          <section className="text-center py-8">
            <CheckInButton
              onCheckIn={checkIn}
              hasCheckedInToday={hasCheckedInToday}
              isOverdue={isOverdue}
            />
            <p className="text-muted-foreground mt-4">
              上次签到: {formatLastCheckIn()}
            </p>
          </section>

          {/* Countdown Timer */}
          <section className="bg-card rounded-xl p-6 border border-border">
            <CountdownTimer timeRemaining={timeRemaining} isOverdue={isOverdue} />
          </section>

          {/* Warning Message when overdue */}
          {isOverdue && emergencyContact && (
            <section className="bg-danger/10 border border-danger/30 rounded-xl p-6">
              <div className="text-center">
                <p className="text-danger font-semibold text-lg">
                  警告：已超过48小时未签到！
                </p>
                <p className="text-danger/80 mt-2">
                  系统将通知紧急联系人 {emergencyContact.name}
                </p>
              </div>
            </section>
          )}

          {/* Emergency Contact */}
          <section>
            <EmergencyContactForm
              contact={emergencyContact}
              onSave={setEmergencyContact}
            />
          </section>

          {/* Check-in History */}
          <section>
            <CheckInHistory records={records} />
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-12">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-muted-foreground text-sm">
            记得每天签到，让爱你的人知道你安好
          </p>
        </div>
      </footer>
    </div>
  );
}
