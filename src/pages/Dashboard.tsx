
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { DashboardHeader } from "@/components/DashboardHeader";
import { SkillTreeProgress } from "@/components/SkillTreeProgress";
import { DailyLog } from "@/components/DailyLog";
import { ChallengesWidget } from "@/components/ChallengesWidget";
import { Sidebar } from "@/components/Sidebar";

interface Profile {
  username: string;
  xp_total: number;
  level: number;
  streak_count: number;
  profile_picture?: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProfile();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  async function getProfile() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('username, xp_total, level, streak_count, profile_picture')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!profile) return null;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-16 md:ml-64">
        <div className="container py-8 max-w-6xl">
          <DashboardHeader
            username={profile.username}
            level={profile.level}
            xpTotal={profile.xp_total}
            profilePicture={profile.profile_picture}
          />
          
          <div className="grid gap-6 md:grid-cols-12">
            <div className="md:col-span-8 space-y-6">
              <div className="p-6 rounded-lg bg-card border border-border">
                <h3 className="text-lg font-semibold mb-4">Skill Tree Progress</h3>
                <SkillTreeProgress />
              </div>
              
              <div className="grid gap-6 md:grid-cols-2">
                <DailyLog />
                <ChallengesWidget />
              </div>
            </div>
            
            <div className="md:col-span-4">
              {/* Additional widgets can be added here */}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
