
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

  async function getSkillProgress() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('skill_trees')
        .select('id, name, icon, color, user_skills(xp, level)')
        .eq('user_skills.user_id', user.id);

      if (error) throw error;

      const formattedSkills = data.map(skill => ({
        skill_id: skill.id,
        name: skill.name,
        icon: skill.icon,
        color: skill.color,
        xp: skill.user_skills[0]?.xp ?? 0,
        level: skill.user_skills[0]?.level ?? 1,
      }));

      setSkills(formattedSkills);

      // Calculate progress for each skill
      const newProgressValues: Record<string, number> = {};
      for (const skill of formattedSkills) {
        newProgressValues[skill.skill_id] = calculateProgress(skill.xp, skill.level);
      }
      setProgressValues(newProgressValues);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  function calculateProgress(xp: number, level: number) {
    // For level 1, we need 100 XP
    if (level === 1) {
      return Math.min(100, Math.max(0, Math.floor((xp / 100) * 100)));
    }
    
    // For higher levels, calculate based on the XP between current and next level
    const currentLevelXP = Math.floor(100 * Math.pow(1.5, level - 2)); // XP needed for current level
    const nextLevelXP = Math.floor(100 * Math.pow(1.5, level - 1)); // XP needed for next level
    const progressInLevel = xp - currentLevelXP;
    const xpNeededForNextLevel = nextLevelXP - currentLevelXP;
    
    return Math.min(100, Math.max(0, Math.floor((progressInLevel / xpNeededForNextLevel) * 100)));
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
        return (
          <div key={skill.skill_id} className="flex items-center gap-4">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex justify-between text-sm">
                <span>{skill.name}</span>
                <span className="text-muted-foreground">Level {skill.level}</span>
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
