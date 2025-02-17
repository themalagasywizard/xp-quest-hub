import { useState } from "react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Sidebar } from "@/components/Sidebar";
import { Brain, Dumbbell, Palette } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useIsMobile } from "@/hooks/use-mobile";

interface ActivityLog {
  activity_name: string;
  xp_awarded: number;
  created_at: string;
  skill: {
    name: string;
    icon: string;
    color: string;
  } | null;
}

interface CompletedQuest {
  quest: {
    title: string;
    xp_reward: number;
    skills: {
      skill: {
        name: string;
        icon: string;
        color: string;
      }
      xp_share: number;
    }[]
  };
  completed_at: string;
}

interface DayActivities {
  totalXP: number;
  activities: ActivityLog[];
  completedQuests: CompletedQuest[];
}

const icons = {
  brain: Brain,
  dumbbell: Dumbbell,
  palette: Palette,
} as const;

export default function Activity() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [dayActivities, setDayActivities] = useState<DayActivities | null>(null);
  const isMobile = useIsMobile();

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

  const getActivityIcon = (skillInfo: { icon: string; color: string }) => {
    const IconComponent = icons[skillInfo.icon as keyof typeof icons] || Brain;
    return <IconComponent className="h-4 w-4" style={{ color: skillInfo.color }} />;
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
          <div className="rounded-lg border bg-card p-2 md:p-6">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDayClick}
              className="w-full"
              disabled={{ after: new Date() }}
              modifiers={{
                hasActivity: (date) => {
                  const dayData = getDayActivities(date);
                  return dayData !== null && (
                    dayData.activities.length > 0 || dayData.completedQuests.length > 0
                  );
                },
              }}
              modifiersStyles={{
                hasActivity: {
                  backgroundColor: "rgb(var(--primary) / 0.1)",
                  color: "rgb(var(--primary))",
                },
              }}
              styles={{
                month: { width: '100%' },
                table: { width: '100%' },
                head_cell: { width: isMobile ? '2.5rem' : '4rem', fontSize: isMobile ? '0.75rem' : '0.875rem' },
                cell: { width: isMobile ? '2.5rem' : '4rem', height: isMobile ? '2.5rem' : '4rem' },
                day: { width: isMobile ? '2.5rem' : '4rem', height: isMobile ? '2.5rem' : '4rem' },
              }}
            />
          </div>
        </div>
      </main>

      <Dialog open={!!selectedDate} onOpenChange={() => setSelectedDate(undefined)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : ''}
            </DialogTitle>
          </DialogHeader>

          {dayActivities && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold">Total XP Earned</h3>
                <p className="text-2xl font-bold text-primary">
                  +{dayActivities.totalXP} XP
                </p>
              </div>

              {dayActivities.completedQuests.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Completed Quests</h3>
                  <div className="space-y-2">
                    {dayActivities.completedQuests.map((quest, idx) => (
                      <div
                        key={`quest-${idx}`}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          {quest.quest.skills?.[0]?.skill && getActivityIcon(quest.quest.skills[0].skill)}
                          <span>{quest.quest.title}</span>
                        </div>
                        <span className="font-medium">+{quest.quest.xp_reward} XP</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {dayActivities.activities.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Activities</h3>
                  <div className="space-y-2">
                    {dayActivities.activities.map((activity, idx) => (
                      <div
                        key={`activity-${idx}`}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          {activity.skill && getActivityIcon(activity.skill)}
                          <span>{activity.activity_name}</span>
                        </div>
                        <span className="font-medium">+{activity.xp_awarded} XP</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
