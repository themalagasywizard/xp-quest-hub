
import { useState } from "react";
import { format } from "date-fns";
import { Sidebar } from "@/components/Sidebar";
import { Dialog } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { ActivityCalendar } from "@/components/activity/ActivityCalendar";
import { ActivityDialogContent } from "@/components/activity/ActivityDialogContent";
import type { DayActivities } from "@/components/activity/types";

export default function Activity() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [dayActivities, setDayActivities] = useState<DayActivities | null>(null);

  // Fetch regular activities
  const { data: activities } = useQuery({
    queryKey: ['activities'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: logs, error: logsError } = await supabase
        .from('activity_log')
        .select(`
          activity_name,
          xp_awarded,
          created_at,
          skill:skill_trees(
            name,
            icon,
            color
          )
        `)
        .eq('user_id', user.id)
        // Exclude activities that start with "Completed Quest:" since they're internal
        .not('activity_name', 'ilike', 'Completed Quest:%');

      if (logsError) throw new Error("Failed to fetch data");
      return logs || [];
    },
  });

  // Fetch completed quests
  const { data: completedQuests } = useQuery({
    queryKey: ['completed_quests'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: quests, error: questsError } = await supabase
        .from('user_quests')
        .select(`
          completed_at,
          quest:quests(
            title,
            xp_reward,
            skills:quest_skills(
              xp_share,
              skill:skill_trees(
                name,
                icon,
                color
              )
            )
          )
        `)
        .eq('user_id', user.id);

      if (questsError) throw new Error("Failed to fetch data");
      return quests || [];
    },
  });

  const getDayActivities = (date: Date) => {
    if (!activities && !completedQuests) return null;

    const dateStr = format(date, 'yyyy-MM-dd');
    
    const dayLogs = activities?.filter(
      (log) => format(new Date(log.created_at), 'yyyy-MM-dd') === dateStr
    ) || [];

    const dayQuests = completedQuests?.filter(
      (quest) => format(new Date(quest.completed_at), 'yyyy-MM-dd') === dateStr
    ) || [];

    const activitiesXP = dayLogs.reduce((sum, log) => sum + log.xp_awarded, 0);
    const questsXP = dayQuests.reduce((sum, quest) => sum + quest.quest.xp_reward, 0);

    return {
      totalXP: activitiesXP + questsXP,
      activities: dayLogs,
      completedQuests: dayQuests,
    };
  };

  const handleDayClick = (date: Date | undefined) => {
    if (!date) return;
    const dayData = getDayActivities(date);
    if (dayData) {
      setSelectedDate(date);
      setDayActivities(dayData);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50/50 dark:bg-gray-900/50">
      <Sidebar />
      <main className="flex-1 ml-16 md:ml-64">
        <div className="container py-4 md:py-8 px-2 md:px-8 max-w-6xl mx-auto">
          <ActivityCalendar
            selectedDate={selectedDate}
            onDateSelect={handleDayClick}
            getDayActivities={getDayActivities}
          />
        </div>
      </main>

      <Dialog open={!!selectedDate} onOpenChange={() => setSelectedDate(undefined)}>
        <ActivityDialogContent
          selectedDate={selectedDate || null}
          dayActivities={dayActivities}
        />
      </Dialog>
    </div>
  );
}
