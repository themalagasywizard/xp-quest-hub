
import { useEffect, useState } from "react";
import { Brain, Dumbbell, Palette, Book, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SkillProgress {
  skill_id: string;
  name: string;
  icon: string;
  color: string;
  xp: number;
  level: number;
}

const iconMap = {
  brain: Brain,
  dumbbell: Dumbbell,
  palette: Palette,
  book: Book,
  heart: Heart,
};

// Constants for XP calculation
const BASE_XP = 100;
const GROWTH_FACTOR = 1.5;

// Known skill IDs
const SKILL_IDS = {
  FITNESS: 'c8066fcd-13df-456f-9c7b-4e5368377827',
  CREATIVITY: 'ccdbee23-bcba-47a8-bd69-e484e6b2717d'
};

export function SkillTreeProgress() {
  const [skills, setSkills] = useState<SkillProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSkillProgress();
    
    const handleXpUpdate = () => {
      getSkillProgress();
    };
    window.addEventListener('xp-updated', handleXpUpdate);
    
    return () => {
      window.removeEventListener('xp-updated', handleXpUpdate);
    };
  }, []);

  function getXpRequiredForLevel(level: number): number {
    return Math.floor(BASE_XP * Math.pow(GROWTH_FACTOR, level - 1));
  }

  function calculateLevel(totalXP: number): number {
    let level = 1;
    while (getXpRequiredForLevel(level + 1) <= totalXP) {
      level++;
    }
    return level;
  }

  async function getSkillProgress() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get all skills
      const { data: skillsData, error: skillsError } = await supabase
        .from('skill_trees')
        .select('*')
        .order('name');

      if (skillsError) throw skillsError;

      // Get all activity logs for this user
      const { data: logs, error: logsError } = await supabase
        .from('activity_log')
        .select('*')
        .eq('user_id', user.id);

      if (logsError) throw logsError;

      console.log('All activity logs:', logs);

      const formattedSkills = skillsData.map(skill => {
        // Get logs for this specific skill
        const skillLogs = logs?.filter(log => log.skill_id === skill.id) || [];
        
        // Calculate total XP
        const totalXP = skillLogs.reduce((sum, log) => sum + (log.xp_awarded || 0), 0);

        // Special logging for Fitness and Creativity
        if (skill.id === SKILL_IDS.FITNESS) {
          console.log('Fitness logs:', skillLogs);
          console.log('Fitness total XP:', totalXP);
        }
        if (skill.id === SKILL_IDS.CREATIVITY) {
          console.log('Creativity logs:', skillLogs);
          console.log('Creativity total XP:', totalXP);
        }

        // Calculate level based on XP
        const level = calculateLevel(totalXP);

        return {
          skill_id: skill.id,
          name: skill.name,
          icon: skill.icon,
          color: skill.color,
          xp: totalXP,
          level: level,
        };
      });

      setSkills(formattedSkills);
    } catch (error: any) {
      console.error('Error fetching skill progress:', error);
      toast.error("Failed to load skill progress");
    } finally {
      setLoading(false);
    }
  }

  function calculateProgressBar(skill: SkillProgress) {
    const currentLevelThreshold = getXpRequiredForLevel(skill.level);
    const nextLevelThreshold = getXpRequiredForLevel(skill.level + 1);
    const xpInCurrentLevel = skill.xp - currentLevelThreshold;
    const xpRequiredForNextLevel = nextLevelThreshold - currentLevelThreshold;
    return Math.min(100, Math.max(0, 
      Math.floor((xpInCurrentLevel / xpRequiredForNextLevel) * 100)
    ));
  }

  if (loading) {
    return <div className="animate-pulse space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded w-24" />
            <div className="h-2 bg-muted rounded" />
          </div>
        </div>
      ))}
    </div>;
  }

  return (
    <div className="grid gap-4">
      {skills.map((skill) => {
        const Icon = iconMap[skill.icon as keyof typeof iconMap];
        const progressPercentage = calculateProgressBar(skill);

        // Calculate XP for current level display
        const currentLevelXP = getXpRequiredForLevel(skill.level);
        const nextLevelXP = getXpRequiredForLevel(skill.level + 1);
        const xpInCurrentLevel = Math.max(0, skill.xp - currentLevelXP);
        const xpNeededForNextLevel = nextLevelXP - currentLevelXP;

        return (
          <div key={skill.skill_id} className="flex items-center gap-4">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex justify-between text-sm">
                <span>{skill.name}</span>
                <span className="text-muted-foreground">
                  Level {skill.level} • {xpInCurrentLevel}/{xpNeededForNextLevel} XP
                </span>
              </div>
              <div className="relative h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={`absolute inset-y-0 left-0 transition-all bg-gradient-to-r ${skill.color}`}
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
