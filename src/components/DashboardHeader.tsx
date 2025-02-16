
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import { Link } from "react-router-dom";
import { MilestoneLevel } from "./MilestoneLevel";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface DashboardHeaderProps {
  username: string;
  level: number;
  xpTotal: number;
  profilePicture?: string;
  milestone: 'none' | 'five' | 'ten' | 'twentyfive' | 'fifty' | 'hundred';
}

export function DashboardHeader({ 
  username, 
  level, 
  xpTotal, 
  profilePicture,
  milestone 
}: DashboardHeaderProps) {
  const { data: skillLevels } = useQuery({
    queryKey: ['skill-levels'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: skills, error } = await supabase
        .from('user_skills')
        .select(`
          level,
          skill_trees (
            name,
            color
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      return skills.map(skill => ({
        name: skill.skill_trees.name,
        level: skill.level || 1,
        color: skill.skill_trees.color,
      }));
    }
  });

  return (
    <div className="flex items-center justify-between p-6 mb-6 bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
      <div className="flex items-start gap-4">
        <Link to="/profile" className="flex-shrink-0 hover:opacity-80 transition-opacity">
          <Avatar className="h-14 w-14 ring-2 ring-purple-500/20 ring-offset-2 ring-offset-background">
            <AvatarImage src={profilePicture} />
            <AvatarFallback className="bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300">
              {username[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{username}</h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">Level {level}</span>
          </div>
          {skillLevels && <MilestoneLevel milestone={milestone} skillLevels={skillLevels} />}
        </div>
      </div>
      <Badge 
        variant="secondary" 
        className="flex items-center gap-2 px-4 py-2 bg-purple-50 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 border border-purple-200/50 dark:border-purple-700/50"
      >
        <Star className="h-4 w-4 text-purple-500" />
        <span className="text-sm font-medium">{(xpTotal || 0).toLocaleString()} XP</span>
      </Badge>
    </div>
  );
}
