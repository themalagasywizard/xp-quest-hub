
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useDailyXP() {
  const [todayXP, setTodayXP] = useState(0);

  const getTodayXP = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get today's XP from activities
      const { data: activityData, error: activityError } = await supabase
        .from('activity_log')
        .select('xp_awarded')
        .eq('user_id', user.id)
        .gte('created_at', today.toISOString());

      if (activityError) throw activityError;

      // Get today's XP from completed quests
      const { data: questData, error: questError } = await supabase
        .from('user_quests')
        .select(`
          quest:quests (
            xp_reward
          )
        `)
        .eq('user_id', user.id)
        .eq('completed_at', today.toISOString().split('T')[0]);

      if (questError) throw questError;

      const activityXP = activityData.reduce((sum, activity) => sum + activity.xp_awarded, 0);
      const questXP = questData.reduce((sum, entry) => sum + entry.quest.xp_reward, 0);
      
      setTodayXP(activityXP + questXP);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    getTodayXP();
  }, []);

  return { todayXP, refreshTodayXP: getTodayXP };
}
