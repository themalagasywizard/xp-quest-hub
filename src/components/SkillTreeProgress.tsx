
import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
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

  useEffect(() => {
    getSkillProgress();
  }, []);

  async function getSkillProgress() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('skill_trees')
        .select(`
          id as skill_id,
          name,
          icon,
          color,
          user_skills!inner(xp, level)
        `)
        .eq('user_skills.user_id', user.id);

      if (error) throw error;

      const formattedSkills = data.map(skill => ({
        skill_id: skill.skill_id,
        name: skill.name,
        icon: skill.icon,
        color: skill.color,
        xp: skill.user_skills[0].xp,
        level: skill.user_skills[0].level,
      }));

      setSkills(formattedSkills);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function calculateProgress(xp: number, level: number) {
    const currentLevelXP = await calculateXpForLevel(level);
    const nextLevelXP = await calculateXpForLevel(level + 1);
    const levelXP = xp - currentLevelXP;
    const totalXPNeeded = nextLevelXP - currentLevelXP;
    return Math.floor((levelXP / totalXPNeeded) * 100);
  }

  async function calculateXpForLevel(level: number) {
    return Math.floor(100 * Math.pow(1.5, level - 1));
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
                  style={{ width: `${calculateProgress(skill.xp, skill.level)}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
