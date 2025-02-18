
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

      // Get today's XP from activities
      const { data: activityData, error: activityError } = await supabase
        .from('activity_log')
        .select(`
          xp_awarded,
          created_at,
          skill:skill_trees(
            name,
            icon,
            color
          )
        `)
        .eq('user_id', user.id)
        .filter('created_at', 'gte', `${today}T00:00:00`)
        .filter('created_at', 'lt', `${today}T23:59:59.999`);

      if (activityError) throw activityError;
      console.log('Activity data for today:', activityData);

      // Get today's XP from completed quests
      const { data: questData, error: questError } = await supabase
        .from('user_quests')
        .select(`
          quest:quests (
            xp_reward,
            skills:quest_skills (
              skill:skill_trees (
                name,
                icon,
                color
              )
            )
          )
        `)
        .eq('user_id', user.id)
        .eq('completed_at', today);

      if (questError) throw questError;
      console.log('Quest data for today:', questData);

      const activityXP = activityData?.reduce((sum, activity) => sum + activity.xp_awarded, 0) || 0;
      const questXP = questData?.reduce((sum, entry) => sum + entry.quest.xp_reward, 0) || 0;
      
      setTodayXP(activityXP + questXP);
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
          table: 'activity_log'
        },
        () => {
          getTodayXP();
        }
      )
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
