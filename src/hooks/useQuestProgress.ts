
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
  }, []);

  const fetchQuestProgress = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('quest_progress')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      toast.error("Failed to fetch quest progress");
      return;
    }

    const progressMap: QuestProgressMap = {};
    data.forEach(progress => {
      progressMap[progress.quest_id] = {
        quest_id: progress.quest_id,
        current_streak: progress.current_streak,
        total_activities: progress.total_activities,
        last_activity_date: progress.last_activity_date,
        first_activity_date: progress.first_activity_date
      };
    });

    setQuestProgress(progressMap);
  };

  return {
    questProgress,
    refreshProgress: fetchQuestProgress
  };
}
