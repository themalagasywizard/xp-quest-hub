
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { Quest } from "@/types/quest";

interface QuestItemProps {
  quest: Quest;
  completed: boolean;
  resetTimeDisplay: string | null;
  onComplete: (quest: Quest) => void;
}

export function QuestItem({ quest, completed, resetTimeDisplay, onComplete }: QuestItemProps) {
  return (
    <div className="flex items-start justify-between p-4 rounded-lg border bg-card">
      <div className="space-y-1">
        <h4 className="text-sm font-medium">{quest.title}</h4>
        <p className="text-sm text-muted-foreground">{quest.description}</p>
        {quest.skills && quest.skills.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {quest.skills.map((skill) => (
              <div
                key={skill.skill_id}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded-full"
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
        {resetTimeDisplay && (
          <p className="text-xs text-muted-foreground mt-2">{resetTimeDisplay}</p>
        )}
      </div>
      <div className="flex items-center gap-4 shrink-0">
        <span className="text-sm font-medium">+{quest.xp_reward} XP</span>
        {completed ? (
          <CheckCircle2 className="h-5 w-5 text-green-500" />
        ) : (
          <Button
            size="sm"
            onClick={() => onComplete(quest)}
          >
            Complete
          </Button>
        )}
      </div>
    </div>
  );
}
