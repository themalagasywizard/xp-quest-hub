
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useDailyXP() {
  const [todayXP, setTodayXP] = useState(0);

  const getTodayXP = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get today's date as YYYY-MM-DD for consistent date comparison
      const today = new Date().toISOString().split('T')[0];

      // First, get quest completions for today
      const { data: questData, error: questError } = await supabase
        .from('user_quests')
        .select(`
          quest:quests (
            xp_reward
          )
        `)
        .eq('user_id', user.id)
        .eq('completed_at', today);

      if (questError) throw questError;
      console.log('Quest data for today:', questData);

      // Calculate total XP from quests
      const questXP = questData?.reduce((sum, entry) => {
        // Make sure we have valid quest data before adding XP
        return sum + (entry.quest?.xp_reward || 0);
      }, 0) || 0;

      // Set the total XP (for now, just from quests)
      setTodayXP(questXP);
    } catch (error: any) {
      console.error('Error fetching daily XP:', error);
      toast.error(error.message);
    }
  };

  useEffect(() => {
    getTodayXP();
    
    // Listen for updates to refresh the XP
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_quests'
        },
        () => {
          getTodayXP();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { todayXP, refreshTodayXP: getTodayXP };
}
