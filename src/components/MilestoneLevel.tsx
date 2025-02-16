import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Crown, Lock } from "lucide-react";
type MilestoneLevel = 'none' | 'five' | 'ten' | 'twentyfive' | 'fifty' | 'hundred';
interface MilestoneLevelProps {
  milestone: MilestoneLevel;
  skillLevels: {
    name: string;
    level: number;
    color: string;
  }[];
}
const MILESTONE_REQUIREMENTS = {
  none: {
    level: 1,
    requirement: 2
  },
  five: {
    level: 5,
    requirement: 5
  },
  ten: {
    level: 10,
    requirement: 15
  },
  twentyfive: {
    level: 25,
    requirement: 30
  },
  fifty: {
    level: 50,
    requirement: 60
  },
  hundred: {
    level: 100,
    requirement: 100
  }
};
const MILESTONE_COLORS = {
  none: "bg-gray-100 dark:bg-gray-800",
  five: "bg-blue-100 dark:bg-blue-900",
  ten: "bg-green-100 dark:bg-green-900",
  twentyfive: "bg-yellow-100 dark:bg-yellow-900",
  fifty: "bg-orange-100 dark:bg-orange-900",
  hundred: "bg-purple-100 dark:bg-purple-900"
};
const MILESTONE_TEXT = {
  none: "Novice",
  five: "Initiate",
  ten: "Adept",
  twentyfive: "Expert",
  fifty: "Master",
  hundred: "Grandmaster"
};
export function MilestoneLevel({
  milestone,
  skillLevels
}: MilestoneLevelProps) {
  if (!milestone || !skillLevels) return null;
  const currentRequirement = MILESTONE_REQUIREMENTS[milestone];
  const nextMilestone = Object.entries(MILESTONE_REQUIREMENTS).find(([, value]) => value.level > currentRequirement.level);
  const getNextRequiredLevels = () => {
    if (!nextMilestone) return [];
    const [, {
      requirement
    }] = nextMilestone;
    return skillLevels.map(skill => ({
      ...skill,
      required: requirement,
      progress: skill.level / requirement * 100
    }));
  };
  const requirementsProgress = getNextRequiredLevels();
  return <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className={`${MILESTONE_COLORS[milestone]} flex items-center gap-2`}>
          <Crown className="h-3 w-3" />
          <span>{MILESTONE_TEXT[milestone]}</span>
        </Badge>
        {nextMilestone && <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-medium mb-2">Next milestone requirements:</p>
                <div className="space-y-1.5">
                  {requirementsProgress.map(skill => <p key={skill.name} className="text-sm">
                      {skill.name}: Level {skill.level}/{skill.required}
                    </p>)}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>}
      </div>

      {requirementsProgress.length > 0}
    </div>;
}