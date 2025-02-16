
import { Sidebar } from "@/components/Sidebar";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SkillTreeProgress } from "@/components/SkillTreeProgress";
import { MilestoneLevel } from "@/components/MilestoneLevel";
import { useQuery } from "@tanstack/react-query";

interface UserProfile {
  username: string;
  email: string;
  level: number;
  xp_total: number;
  milestone_level: 'none' | 'five' | 'ten' | 'twentyfive' | 'fifty' | 'hundred';
}

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const { data: skillLevels } = useQuery({
    queryKey: ['skill-levels'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: skills, error } = await supabase
        .from('activity_log')
        .select(`
          skill_id,
          skill_trees (
            name,
            color
          ),
          xp_awarded
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      // Group and sum XP by skill
      const skillXP = skills.reduce((acc, log) => {
        const skillId = log.skill_id;
        if (!acc[skillId]) {
          acc[skillId] = {
            name: log.skill_trees.name,
            color: log.skill_trees.color,
            totalXP: 0
          };
        }
        acc[skillId].totalXP += log.xp_awarded || 0;
        return acc;
      }, {} as Record<string, { name: string; color: string; totalXP: number; }>);

      // Calculate level for each skill based on XP
      return Object.values(skillXP).map(skill => ({
        name: skill.name,
        color: skill.color,
        level: calculateLevel(skill.totalXP),
      }));
    }
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to view your profile");
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('username, email, level, xp_total, milestone_level')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  // Helper function to calculate level based on XP
  function calculateLevel(totalXP: number): number {
    const BASE_XP = 100;
    const GROWTH_FACTOR = 1.5;
    
    if (totalXP === 0) return 0;
    
    let level = 1;
    let xpRequired = BASE_XP;
    
    while (totalXP >= xpRequired) {
      level++;
      xpRequired = Math.floor(BASE_XP * Math.pow(GROWTH_FACTOR, level - 1));
    }
    
    return level - 1;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50/50 dark:bg-gray-900/50">
        <Sidebar />
        <main className="flex-1 ml-16 md:ml-64">
          <div className="container py-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded w-1/4"></div>
              <div className="h-32 bg-muted rounded"></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen bg-gray-50/50 dark:bg-gray-900/50">
        <Sidebar />
        <main className="flex-1 ml-16 md:ml-64">
          <div className="container py-8">
            <p className="text-muted-foreground">Please sign in to view your profile.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50/50 dark:bg-gray-900/50">
      <Sidebar />
      <main className="flex-1 ml-16 md:ml-64">
        <div className="container py-8">
          <div className="space-y-6">
            <div className="rounded-lg border bg-card p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-bold mb-4">{profile.username}</h1>
                  <div className="space-y-2">
                    <p className="text-muted-foreground">Level {profile.level}</p>
                    <p className="text-muted-foreground">Total XP: {profile.xp_total}</p>
                    <p className="text-muted-foreground">{profile.email}</p>
                  </div>
                </div>
                {skillLevels && profile.milestone_level && (
                  <div className="w-72">
                    <MilestoneLevel 
                      milestone={profile.milestone_level} 
                      skillLevels={skillLevels}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-lg border bg-card p-6">
              <h2 className="text-xl font-semibold mb-4">Skill Progress</h2>
              <SkillTreeProgress />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
