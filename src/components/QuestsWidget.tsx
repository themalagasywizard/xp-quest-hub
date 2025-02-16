
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Quest, UserQuest } from "@/types/quest";
import { toast } from "sonner";

export function QuestsWidget() {
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

    setQuests(data);
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

    // Log activity to award XP
    const { error: activityError } = await supabase.rpc(
      'log_activity_and_update_xp',
      {
        p_user_id: user.id,
        p_activity_name: `Completed Quest: ${quest.title}`,
        p_skill_id: '2d5c37c4-6369-4cb0-a3a3-c6f45d3bda20', // Using Focus skill ID for now
        p_xp_awarded: quest.xp_reward,
      }
    );

    if (activityError) {
      toast.error("Failed to award XP");
      return;
    }

    toast.success(`Quest completed! Earned ${quest.xp_reward} XP`);
    setCompletedQuests([...completedQuests, data]);
    
    // Trigger XP update in the UI
    window.dispatchEvent(new CustomEvent('xp-updated'));
  };

  const isQuestCompleted = (questId: string) => {
    return completedQuests.some(cq => cq.quest_id === questId);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Target className="h-4 w-4" />
            Daily Quests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Target className="h-4 w-4" />
          Daily Quests
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {quests
          .filter(quest => quest.quest_type === 'daily')
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
        })}
      </CardContent>
    </Card>
  );
}
