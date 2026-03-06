import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, Loader2, BarChart3, Calendar, TrendingUp, ArrowLeft, Crown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { UserMenu } from '@/components/UserMenu';
import { useAuth } from '@/hooks/useAuth';
import { useUsageLimit } from '@/hooks/useUsageLimit';
import { supabase } from '@/integrations/supabase/client';

interface UsageEntry {
  id: string;
  action_type: string;
  created_at: string;
}

const Dashboard = () => {
  const [history, setHistory] = useState<UsageEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const { user, loading: authLoading } = useAuth();
  const { usageCount, isPremium, dailyLimit } = useUsageLimit();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;

    const fetchHistory = async () => {
      const { data, error } = await supabase
        .from('usage_tracking')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data) {
        setHistory(data);
      }
      setLoadingHistory(false);
    };

    fetchHistory();
  }, [user]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Compute stats
  const totalAnalyses = history.length;
  const today = new Date().toDateString();
  const todayCount = history.filter(h => new Date(h.created_at).toDateString() === today).length;
  
  const last7Days = new Date();
  last7Days.setDate(last7Days.getDate() - 7);
  const weekCount = history.filter(h => new Date(h.created_at) >= last7Days).length;

  // Group by date for recent activity
  const groupedByDate = history.reduce<Record<string, number>>((acc, entry) => {
    const date = new Date(entry.created_at).toLocaleDateString();
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gradient-hero animate-fade-in">
      <header className="border-b bg-card/50 backdrop-blur-sm shadow-soft sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Leaf className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">EatWise</h1>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/')} className="shadow-soft">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold">Dashboard</h2>
            <p className="text-muted-foreground">Your analysis history and statistics</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Today's Analyses</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{todayCount}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {isPremium ? (
                  <span className="flex items-center gap-1"><Crown className="h-3 w-3 text-primary" /> Unlimited</span>
                ) : (
                  `${Math.max(0, dailyLimit - usageCount)} remaining today`
                )}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">This Week</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{weekCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Last 7 days</p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Analyses</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalAnalyses}</div>
              <p className="text-xs text-muted-foreground mt-1">All time</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest ingredient analyses</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingHistory ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No analyses yet. Start by uploading an ingredient photo!</p>
                <Button variant="hero" className="mt-4" onClick={() => navigate('/')}>
                  Analyze Ingredients
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(groupedByDate).slice(0, 10).map(([date, count]) => (
                  <div key={date} className="flex items-center justify-between py-2 border-b last:border-0">
                    <span className="text-sm font-medium">{date}</span>
                    <span className="text-sm text-muted-foreground">
                      {count} {count === 1 ? 'analysis' : 'analyses'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
