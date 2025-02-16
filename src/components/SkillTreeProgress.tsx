
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

// Color gradients for different level ranges
const getLevelGradient = (level: number) => {
  if (level === 0) return "from-blue-400 to-blue-500";
  if (level === 1) return "from-green-400 to-green-500";
  if (level === 2) return "from-yellow-400 to-yellow-500";
  if (level === 3) return "from-orange-400 to-orange-500";
  return "from-purple-400 to-purple-500";
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
    if (totalXP === 0) return 0;
    
    let level = 1;
    let xpRequired = getXpRequiredForLevel(level);
    
    while (totalXP >= xpRequired) {
      level++;
      xpRequired = getXpRequiredForLevel(level);
    }
    
    return level - 1;
  }

  async function getSkillProgress() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: skillsData, error: skillsError } = await supabase
        .from('skill_trees')
        .select('*')
        .order('name');

      if (skillsError) {
        console.error('Error fetching skills:', skillsError);
        throw skillsError;
      }

      const { data: logs, error: logsError } = await supabase
        .from('activity_log')
        .select('skill_id, xp_awarded')
        .eq('user_id', user.id);

      if (logsError) {
        console.error('Error fetching logs:', logsError);
        throw logsError;
      }

      // Process each skill
      const formattedSkills = skillsData.map(skill => {
        // Get all activity logs for this skill
        const skillLogs = logs?.filter(log => log.skill_id === skill.id) || [];
        
        // Sum up all XP for this skill
        const totalXP = skillLogs.reduce((sum, log) => sum + (log.xp_awarded || 0), 0);
        
        // Calculate level based on total XP
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
    if (skill.level === 0 && skill.xp === 0) return 0;
    
    const currentLevelXP = skill.level === 0 ? 0 : getXpRequiredForLevel(skill.level);
    const nextLevelXP = getXpRequiredForLevel(skill.level + 1);
    const xpInCurrentLevel = skill.xp - currentLevelXP;
    const xpRequiredForNextLevel = nextLevelXP - currentLevelXP;
    
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
        const currentLevelXP = skill.level === 0 ? 0 : getXpRequiredForLevel(skill.level);
        const nextLevelXP = getXpRequiredForLevel(skill.level + 1);
        const xpInCurrentLevel = skill.xp - currentLevelXP;
        const xpNeededForNextLevel = nextLevelXP - currentLevelXP;
        const levelGradient = getLevelGradient(skill.level);

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
                  className={`absolute inset-y-0 left-0 transition-all bg-gradient-to-r ${levelGradient}`}
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
