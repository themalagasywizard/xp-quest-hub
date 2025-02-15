
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

export function SkillTreeProgress() {
  const [skills, setSkills] = useState<SkillProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [progressValues, setProgressValues] = useState<Record<string, number>>({});

  useEffect(() => {
    getSkillProgress();
    
    // Listen for XP updates
    const handleXpUpdate = () => {
      getSkillProgress();
    };
    window.addEventListener('xp-updated', handleXpUpdate);
    
    return () => {
      window.removeEventListener('xp-updated', handleXpUpdate);
    };
  }, []);

  // Calculate XP required for a specific level
  function getXpRequiredForLevel(level: number): number {
    return Math.floor(BASE_XP * Math.pow(GROWTH_FACTOR, level - 1));
  }

  // Calculate the level based on total XP
  function calculateLevel(totalXP: number): number {
    let level = 1;
    while (getXpRequiredForLevel(level + 1) <= totalXP) {
      level++;
    }
    return level;
  }

  // Calculate progress percentage for current level
  function calculateProgress(xp: number, level: number): number {
    const currentLevelXP = getXpRequiredForLevel(level);
    const nextLevelXP = getXpRequiredForLevel(level + 1);
    const xpInCurrentLevel = xp - currentLevelXP;
    const xpNeededForNextLevel = nextLevelXP - currentLevelXP;
    
    return Math.min(100, Math.max(0, Math.floor((xpInCurrentLevel / xpNeededForNextLevel) * 100)));
  }

  async function getSkillProgress() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // First get all skills
      const { data: skills, error: skillsError } = await supabase
        .from('skill_trees')
        .select('*');

      if (skillsError) throw skillsError;

      // Then get all activity logs for this user
      const { data: activityLogs, error: logsError } = await supabase
        .from('activity_log')
        .select('*')
        .eq('user_id', user.id);

      if (logsError) throw logsError;

      console.log('Raw skills:', skills);
      console.log('Activity logs:', activityLogs);

      // Calculate total XP for each skill from activity logs
      const formattedSkills = skills.map(skill => {
        const skillLogs = activityLogs?.filter(log => log.skill_id === skill.id) || [];
        const totalXP = skillLogs.reduce((sum, log) => sum + (log.xp_awarded || 0), 0);
        const level = calculateLevel(totalXP);

        console.log(`Skill ${skill.name} - Total XP: ${totalXP}, Level: ${level}`);
        
        return {
          skill_id: skill.id,
          name: skill.name,
          icon: skill.icon,
          color: skill.color,
          xp: totalXP,
          level: level,
        };
      });

      console.log('Formatted skills with XP from logs:', formattedSkills);
      setSkills(formattedSkills);

      // Calculate progress for each skill
      const newProgressValues: Record<string, number> = {};
      for (const skill of formattedSkills) {
        newProgressValues[skill.skill_id] = calculateProgress(skill.xp, skill.level);
      }
      setProgressValues(newProgressValues);

    } catch (error: any) {
      console.error('Error fetching skill progress:', error);
      toast.error("Failed to load skill progress");
    } finally {
      setLoading(false);
    }
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
                  style={{ width: `${progressValues[skill.skill_id] || 0}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
