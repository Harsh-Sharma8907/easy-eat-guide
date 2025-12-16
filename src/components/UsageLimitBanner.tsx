import { Crown, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface UsageLimitBannerProps {
  usageCount: number;
  dailyLimit: number;
  isPremium: boolean;
  canAnalyze: boolean;
}

export function UsageLimitBanner({ usageCount, dailyLimit, isPremium, canAnalyze }: UsageLimitBannerProps) {
  if (isPremium) {
    return (
      <div className="flex items-center gap-2 text-sm text-primary">
        <Crown className="h-4 w-4" />
        <span className="font-medium">Premium Member</span>
        <span className="text-muted-foreground">• Unlimited analyses</span>
      </div>
    );
  }

  const remaining = Math.max(0, dailyLimit - usageCount);

  if (!canAnalyze) {
    return (
      <Card className="p-4 bg-warning-light border-warning/30 animate-fade-in">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1 text-center sm:text-left">
            <h3 className="font-semibold text-foreground">Daily Limit Reached</h3>
            <p className="text-sm text-muted-foreground mt-1">
              You've used all {dailyLimit} free analyses today. Upgrade to premium for unlimited access.
            </p>
          </div>
          <Button variant="hero" size="sm" className="gap-2 whitespace-nowrap">
            <Zap className="h-4 w-4" />
            Upgrade to Premium
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="flex items-center justify-center gap-2 text-sm">
      <div className="flex gap-1">
        {[...Array(dailyLimit)].map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-colors ${
              i < usageCount ? 'bg-primary' : 'bg-muted-foreground/30'
            }`}
          />
        ))}
      </div>
      <span className="text-muted-foreground">
        {remaining} of {dailyLimit} free analyses remaining today
      </span>
    </div>
  );
}
