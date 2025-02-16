
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Quest, UserQuest } from "@/types/quest";
import { toast } from "sonner";
import { Sidebar } from "@/components/Sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, formatDistanceToNow } from "date-fns";

export default function Quests() {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [completedQuests, setCompletedQuests] = useState<(UserQuest & { reset_time: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    fetchQuests();
    fetchCompletedQuests();

    // Update timer every minute
    const interval = setInterval(() => {
      setNow(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const fetchQuests = async () => {
    const { data, error } = await supabase
      .from('quests')
      .select(`
        *,
        skills:quest_skills(
          skill_id,
          xp_share,
          skill:skill_trees(
            name,
            color,
            icon
          )
        )
      `)
      .order('created_at');

    if (error) {
      toast.error("Failed to fetch quests");
      return;
    }

    const typedQuests = data.map(quest => ({
      ...quest,
      quest_type: quest.quest_type as Quest['quest_type'],
      skills: quest.skills.map((s: any) => ({
        skill_id: s.skill_id,
        skill_name: s.skill.name,
        xp_share: s.xp_share,
        color: s.skill.color,
        icon: s.skill.icon
      }))
    }));

    setQuests(typedQuests);
  };

  const fetchCompletedQuests = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('user_quests')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      toast.error("Failed to fetch completed quests");
      return;
    }

    setCompletedQuests(data);
    setLoading(false);
  };

  const completeQuest = async (quest: Quest) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('user_quests')
      .insert([
        {
          user_id: user.id,
          quest_id: quest.id,
        }
      ])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        toast.error("You've already completed this quest!");
      } else {
        toast.error("Failed to complete quest");
      }
      return;
    }

    const { error: distributeError } = await supabase.rpc(
      'distribute_quest_xp',
      {
        p_user_id: user.id,
        p_quest_id: quest.id
      }
    );

    if (distributeError) {
      toast.error("Failed to award XP");
      return;
    }

    toast.success(`Quest completed! XP distributed to relevant skills`);
    setCompletedQuests([...completedQuests, data]);
    window.dispatchEvent(new CustomEvent('xp-updated'));
  };

  const isQuestAvailable = (questId: string) => {
    const completedQuest = completedQuests.find(cq => cq.quest_id === questId);
    if (!completedQuest) return true;

    const resetTime = new Date(completedQuest.reset_time);
    return now >= resetTime;
  };

  const getResetTimeDisplay = (questId: string) => {
    const completedQuest = completedQuests.find(cq => cq.quest_id === questId);
    if (!completedQuest) return null;

    const resetTime = new Date(completedQuest.reset_time);
    if (now >= resetTime) return null;

    return `Resets ${formatDistanceToNow(resetTime, { addSuffix: true })}`;
  };

  const renderQuestList = (questType: Quest['quest_type']) => {
    return quests
      .filter(quest => quest.quest_type === questType)
      .map((quest) => {
        const completed = !isQuestAvailable(quest.id);
        const resetTimeDisplay = getResetTimeDisplay(quest.id);

        return (
          <div
            key={quest.id}
            className="flex items-center justify-between p-4 rounded-lg border bg-card"
          >
            <div className="space-y-1">
              <h4 className="text-sm font-medium">{quest.title}</h4>
              <p className="text-sm text-muted-foreground">{quest.description}</p>
              {quest.skills && quest.skills.length > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  {quest.skills.map((skill) => (
                    <div
                      key={skill.skill_id}
                      className="flex items-center gap-1 text-xs px-2 py-1 rounded-full"
                      style={{ backgroundColor: `${skill.color}20`, color: skill.color }}
                    >
                      <span>{skill.skill_name}</span>
                      {skill.xp_share !== 100 && (
                        <span>({skill.xp_share}%)</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {resetTimeDisplay && (
                <p className="text-xs text-muted-foreground mt-2">{resetTimeDisplay}</p>
              )}
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">+{quest.xp_reward} XP</span>
              {completed ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <Button
                  size="sm"
                  onClick={() => completeQuest(quest)}
                >
                  Complete
                </Button>
              )}
            </div>
          </div>
        );
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50/50 dark:bg-gray-900/50">
        <Sidebar />
        <main className="flex-1 ml-16 md:ml-64">
          <div className="container py-8">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted rounded-lg" />
              ))}
            </div>
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
          <div className="flex items-center gap-2 mb-6">
            <Target className="h-5 w-5" />
            <h1 className="text-2xl font-bold">Quests</h1>
          </div>
          
          <Tabs defaultValue="daily" className="w-full">
            <TabsList>
              <TabsTrigger value="daily">Daily</TabsTrigger>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="legacy">Legacy</TabsTrigger>
            </TabsList>
            <TabsContent value="daily" className="space-y-4 mt-4">
              {renderQuestList('daily')}
            </TabsContent>
            <TabsContent value="weekly" className="space-y-4 mt-4">
              {renderQuestList('weekly')}
            </TabsContent>
            <TabsContent value="legacy" className="space-y-4 mt-4">
              {renderQuestList('legacy')}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
