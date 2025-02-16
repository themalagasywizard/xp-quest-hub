
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { QuestProgress } from "@/types/quest";
import { toast } from "sonner";

interface QuestProgressMap {
  [questId: string]: QuestProgress;
}

export function useQuestProgress() {
  const [questProgress, setQuestProgress] = useState<QuestProgressMap>({});

  useEffect(() => {
    fetchQuestProgress();
    // Listen for activity updates to refresh progress
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'quest_progress'
        },
        (payload) => {
          console.log('Quest progress updated:', payload);
          fetchQuestProgress();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchQuestProgress = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // First, let's log all activities for the fitness skill to debug
    const { data: activities, error: activityError } = await supabase
      .from('activity_log')
      .select('*')
      .eq('user_id', user.id)
      .eq('skill_id', 'c8066fcd-13df-456f-9c7b-4e5368377827')
      .order('created_at', { ascending: false });

    console.log('Fitness activities:', activities);

    const { data, error } = await supabase
      .from('quest_progress')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      toast.error("Failed to fetch quest progress");
      console.error("Quest progress error:", error);
      return;
    }

    console.log('Quest progress raw data:', data);

    const progressMap: QuestProgressMap = {};
    data.forEach(progress => {
      progressMap[progress.quest_id] = {
        quest_id: progress.quest_id,
        current_streak: progress.current_streak || 0,
        total_activities: progress.total_activities || 0,
        last_activity_date: progress.last_activity_date,
        first_activity_date: progress.first_activity_date
      };
      console.log('Progress for quest:', progress.quest_id, progressMap[progress.quest_id]);
    });

    setQuestProgress(progressMap);
  };

  return {
    questProgress,
    refreshProgress: fetchQuestProgress
  };
}
