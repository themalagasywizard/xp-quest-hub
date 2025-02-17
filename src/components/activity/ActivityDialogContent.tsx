
import { format } from "date-fns";
import { Brain, Dumbbell, Palette } from "lucide-react";
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
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
  const isMobile = useIsMobile();
  if (!selectedDate || !dayActivities) return null;

  return (
    <DialogContent className={isMobile ? "w-[calc(100%-32px)] h-[calc(100%-64px)] p-4" : ""}>
      <DialogHeader className="space-y-2">
        <DialogTitle>
          {format(selectedDate, 'MMMM d, yyyy')}
        </DialogTitle>
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground">Total XP Earned</h3>
          <p className="text-xl font-bold text-primary">
            +{dayActivities.totalXP} XP
          </p>
        </div>
      </DialogHeader>

      <ScrollArea className={`${isMobile ? "h-[calc(100%-120px)]" : "max-h-[60vh]"} pr-4`}>
        <div className="space-y-4">
          {dayActivities.completedQuests.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Completed Quests</h3>
              <div className="space-y-2">
                {dayActivities.completedQuests.map((quest, idx) => (
                  <div
                    key={`quest-${idx}`}
                    className="flex items-center justify-between p-2.5 rounded-lg border text-sm"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {quest.quest.skills?.[0]?.skill && getActivityIcon(quest.quest.skills[0].skill)}
                      <span className="truncate">{quest.quest.title}</span>
                    </div>
                    <span className="font-medium shrink-0 ml-2">+{quest.quest.xp_reward} XP</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {dayActivities.activities.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Activities</h3>
              <div className="space-y-2">
                {dayActivities.activities.map((activity, idx) => (
                  <div
                    key={`activity-${idx}`}
                    className="flex items-center justify-between p-2.5 rounded-lg border text-sm"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {activity.skill && getActivityIcon(activity.skill)}
                      <span className="truncate">{activity.activity_name}</span>
                    </div>
                    <span className="font-medium shrink-0 ml-2">+{activity.xp_awarded} XP</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </DialogContent>
  );
}
