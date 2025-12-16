import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface UsageLimitState {
  canAnalyze: boolean;
  usageCount: number;
  isPremium: boolean;
  loading: boolean;
  dailyLimit: number;
}

const FREE_DAILY_LIMIT = 2;

export function useUsageLimit() {
  const { user } = useAuth();
  const [state, setState] = useState<UsageLimitState>({
    canAnalyze: false,
    usageCount: 0,
    isPremium: false,
    loading: true,
    dailyLimit: FREE_DAILY_LIMIT,
  });

  const checkUsage = useCallback(async () => {
    if (!user) {
      setState(prev => ({ ...prev, loading: false, canAnalyze: false }));
      return;
    }

    try {
      // Check if user can perform action
      const { data: canPerform, error: canError } = await supabase
        .rpc('can_perform_action', { _user_id: user.id, _daily_limit: FREE_DAILY_LIMIT });

      if (canError) throw canError;

      // Get current usage count
      const { data: count, error: countError } = await supabase
        .rpc('get_daily_usage_count', { _user_id: user.id });

      if (countError) throw countError;

      // Get user role
      const { data: role, error: roleError } = await supabase
        .rpc('get_user_role', { _user_id: user.id });

      if (roleError) throw roleError;

      const isPremium = role === 'premium';

      setState({
        canAnalyze: canPerform ?? false,
        usageCount: count ?? 0,
        isPremium,
        loading: false,
        dailyLimit: isPremium ? Infinity : FREE_DAILY_LIMIT,
      });
    } catch (error) {
      console.error('Error checking usage:', error);
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [user]);

  const recordUsage = useCallback(async () => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .rpc('record_usage', { _user_id: user.id, _action_type: 'analyze' });

      if (error) throw error;

      // Refresh usage state
      await checkUsage();
      return true;
    } catch (error) {
      console.error('Error recording usage:', error);
      return false;
    }
  }, [user, checkUsage]);

  useEffect(() => {
    checkUsage();
  }, [checkUsage]);

  return {
    ...state,
    recordUsage,
    refreshUsage: checkUsage,
    remainingSearches: state.isPremium ? Infinity : Math.max(0, FREE_DAILY_LIMIT - state.usageCount),
  };
}
