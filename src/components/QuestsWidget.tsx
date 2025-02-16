
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
                className="flex flex-col gap-3 p-4 rounded-lg border bg-card"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <h4 className="text-sm font-medium">{quest.title}</h4>
                    <p className="text-sm text-muted-foreground">{quest.description}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-medium whitespace-nowrap">+{quest.xp_reward} XP</span>
                    {completed ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => completeQuest(quest)}
                        className="shrink-0"
                      >
                        Complete
                      </Button>
                    )}
                  </div>
                </div>
                {quest.skills && quest.skills.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
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
              </div>
            );
        })}
      </CardContent>
    </Card>
  );
}
