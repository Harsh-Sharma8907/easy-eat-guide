import { LogOut, User, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { useUsageLimit } from '@/hooks/useUsageLimit';

export function UserMenu() {
  const { user, signOut } = useAuth();
  const { isPremium, usageCount, dailyLimit } = useUsageLimit();

  if (!user) return null;

  const remaining = isPremium ? '∞' : Math.max(0, dailyLimit - usageCount);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="shadow-soft">
          <User className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{user.email}</p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {isPremium ? (
                <>
                  <Crown className="h-3 w-3 text-primary" />
                  <span>Premium Member</span>
                </>
              ) : (
                <span>Free Tier • {remaining} analyses left</span>
              )}
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {!isPremium && (
          <>
            <DropdownMenuItem className="cursor-pointer text-primary">
              <Crown className="mr-2 h-4 w-4" />
              Upgrade to Premium
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
