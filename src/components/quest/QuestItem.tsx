
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { Quest, QuestProgress } from "@/types/quest";
import { Progress } from "@/components/ui/progress";

interface QuestItemProps {
  quest: Quest;
  completed: boolean;
  resetTimeDisplay: string | null;
  onComplete: (quest: Quest) => void;
  progress?: QuestProgress;
}

export function QuestItem({ 
  quest, 
  completed, 
  resetTimeDisplay, 
  onComplete,
  progress 
}: QuestItemProps) {
  const getProgressDisplay = () => {
    if (!quest.completion_type || !quest.completion_requirement) return null;

    // Ensure we have progress data, if not, default to 0
    const currentProgress = progress || {
      quest_id: quest.id,
      current_streak: 0,
      total_activities: 0,
      last_activity_date: null,
      first_activity_date: null
    };

    switch (quest.completion_type) {
      case 'daily_streak':
        const requiredStreak = quest.completion_requirement.required_streak || 0;
        return {
          current: currentProgress.current_streak,
          max: requiredStreak,
          text: `${currentProgress.current_streak}/${requiredStreak} day streak`
        };
      case 'total_activities':
        const requiredActivities = quest.completion_requirement.required_activities || 0;
        return {
          current: currentProgress.total_activities,
          max: requiredActivities,
          text: `${currentProgress.total_activities}/${requiredActivities} activities`
        };
      case 'days_with_activity':
        const requiredDays = quest.completion_requirement.required_days || 0;
        if (!currentProgress.first_activity_date) {
          return {
            current: 0,
            max: requiredDays,
            text: `0/${requiredDays} days`
          };
        }
        
        const firstDate = new Date(currentProgress.first_activity_date);
        const lastDate = currentProgress.last_activity_date 
          ? new Date(currentProgress.last_activity_date)
          : firstDate;
        
        const daysPassed = Math.floor(
          (lastDate.getTime() - firstDate.getTime()) / 
          (1000 * 60 * 60 * 24)
        ) + 1; // Add 1 to include both first and last day
        
        return {
          current: Math.min(daysPassed, requiredDays),
          max: requiredDays,
          text: `${daysPassed}/${requiredDays} days`
        };
      case 'strava_distance':
        const requiredDistance = quest.completion_requirement.required_distance || 0;
        return {
          current: 0,
          max: requiredDistance,
          text: `Complete a ${requiredDistance}km run`
        };
      default:
        return null;
    }
  };

  const progressInfo = getProgressDisplay();
  const isAutoComplete = !!quest.completion_type;

  return (
    <div className="flex flex-col gap-2 p-4 rounded-lg border bg-card">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium leading-none mb-1.5">{quest.title}</h4>
          <p className="text-sm text-muted-foreground leading-normal">{quest.description}</p>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className="text-sm font-medium whitespace-nowrap">+{quest.xp_reward} XP</span>
          {completed ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : (
            <Button
              size="sm"
              variant="default"
              onClick={() => onComplete(quest)}
              disabled={isAutoComplete} // Disable button for auto-complete quests
            >
              Complete
            </Button>
          )}
        </div>
      </div>
      {quest.skills && quest.skills.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mt-1">
          {quest.skills.map((skill) => (
            <div
              key={skill.skill_id}
              className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
              style={{ backgroundColor: `${skill.color}20`, color: skill.color }}
            >
              <span>{skill.skill_name}</span>
              {skill.xp_share !== 100 && (
                <span>({skill.xp_share}%)</span>
              )}
            </div>
          ))}
        </div>
      )}
      {progressInfo && (
        <div className="mt-2 space-y-1.5">
          <Progress value={(progressInfo.current / progressInfo.max) * 100} />
          <p className="text-xs text-muted-foreground">{progressInfo.text}</p>
        </div>
      )}
      {resetTimeDisplay && (
        <p className="text-xs text-muted-foreground mt-1">{resetTimeDisplay}</p>
      )}
    </div>
  );
}
