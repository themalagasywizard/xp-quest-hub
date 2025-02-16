
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Quest, UserQuest } from "@/types/quest";
import { toast } from "sonner";
import { Sidebar } from "@/components/Sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Quests() {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [completedQuests, setCompletedQuests] = useState<UserQuest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuests();
    fetchCompletedQuests();
  }, []);

  const fetchQuests = async () => {
    const { data, error } = await supabase
      .from('quests')
      .select('*')
      .order('created_at');

    if (error) {
      toast.error("Failed to fetch quests");
      return;
    }

    const typedQuests = data.map(quest => ({
      ...quest,
      quest_type: quest.quest_type as Quest['quest_type']
    }));

    setQuests(typedQuests);
  };

  const fetchCompletedQuests = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('user_quests')
      .select('*')
      .eq('user_id', user.id)
      .eq('completed_at', today);

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
        toast.error("You've already completed this quest today!");
      } else {
        toast.error("Failed to complete quest");
      }
      return;
    }

    const { error: activityError } = await supabase.rpc(
      'log_activity_and_update_xp',
      {
        p_user_id: user.id,
        p_activity_name: `Completed Quest: ${quest.title}`,
        p_skill_id: '2d5c37c4-6369-4cb0-a3a3-c6f45d3bda20',
        p_xp_awarded: quest.xp_reward,
      }
    );

    if (activityError) {
      toast.error("Failed to award XP");
      return;
    }

    toast.success(`Quest completed! Earned ${quest.xp_reward} XP`);
    setCompletedQuests([...completedQuests, data]);
    window.dispatchEvent(new CustomEvent('xp-updated'));
  };

  const isQuestCompleted = (questId: string) => {
    return completedQuests.some(cq => cq.quest_id === questId);
  };

  const renderQuestList = (questType: Quest['quest_type']) => {
    return quests
      .filter(quest => quest.quest_type === questType)
      .map((quest) => {
        const completed = isQuestCompleted(quest.id);
        return (
          <div
            key={quest.id}
            className="flex items-center justify-between p-4 rounded-lg border bg-card"
          >
            <div className="space-y-1">
              <h4 className="text-sm font-medium">{quest.title}</h4>
              <p className="text-sm text-muted-foreground">{quest.description}</p>
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
