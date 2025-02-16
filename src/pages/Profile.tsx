
import { Sidebar } from "@/components/Sidebar";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SkillTreeProgress } from "@/components/SkillTreeProgress";

interface UserProfile {
  username: string;
  email: string;
  level: number;
  xp_total: number;
}

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

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
        .select('username, email, level, xp_total')
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
              <h1 className="text-2xl font-bold mb-4">{profile.username}</h1>
              <div className="space-y-2">
                <p className="text-muted-foreground">Level {profile.level}</p>
                <p className="text-muted-foreground">Total XP: {profile.xp_total}</p>
                <p className="text-muted-foreground">{profile.email}</p>
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
