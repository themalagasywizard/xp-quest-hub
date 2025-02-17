
import { format } from "date-fns";
import { Brain, Dumbbell, Palette } from "lucide-react";
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ActivityLog, CompletedQuest } from "./types";

interface ActivityDialogContentProps {
  selectedDate: Date | null;
  dayActivities: {
    totalXP: number;
    activities: ActivityLog[];
    completedQuests: CompletedQuest[];
  } | null;
}

const icons = {
  brain: Brain,
  dumbbell: Dumbbell,
  palette: Palette,
} as const;

const getActivityIcon = (skillInfo: { icon: string; color: string }) => {
  const IconComponent = icons[skillInfo.icon as keyof typeof icons] || Brain;
  return <IconComponent className="h-4 w-4" style={{ color: skillInfo.color }} />;
};

export function ActivityDialogContent({ selectedDate, dayActivities }: ActivityDialogContentProps) {
  if (!selectedDate || !dayActivities) return null;

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>
          {format(selectedDate, 'MMMM d, yyyy')}
        </DialogTitle>
      </DialogHeader>

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
    </DialogContent>
  );
}
