import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, CheckCircle2, RefreshCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Quest, UserQuest } from "@/types/quest";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function QuestsWidget() {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [availableQuests, setAvailableQuests] = useState<Quest[]>([]);
  const [completedQuests, setCompletedQuests] = useState<UserQuest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeQuestType, setActiveQuestType] = useState<Quest['quest_type']>('daily');

  useEffect(() => {
    fetchQuests();
    fetchCompletedQuests();
  }, []);

  useEffect(() => {
    if (quests.length > 0) {
      selectRandomQuests();
    }
  }, [quests, completedQuests, activeQuestType]);

  const selectRandomQuests = () => {
    const typeQuests = quests.filter(
      quest => quest.quest_type === activeQuestType && !isQuestCompleted(quest.id)
    );
    const shuffled = [...typeQuests].sort(() => 0.5 - Math.random());
    setAvailableQuests(shuffled.slice(0, 3));
  };

  const getQuestTypeTitle = (type: Quest['quest_type']) => {
    switch (type) {
      case 'daily':
        return 'Daily';
      case 'weekly':
        return 'Weekly';
      case 'legacy':
        return 'Legacy';
      default:
        return '';
    }
  };

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

    try {
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
          await fetchCompletedQuests();
          return;
        } else {
          console.error("Quest completion error:", error);
          toast.error("Failed to complete quest");
          return;
        }
      }

      const { error: distributeError } = await supabase.rpc(
        'distribute_quest_xp',
        {
          p_user_id: user.id,
          p_quest_id: quest.id
        }
      );

      if (distributeError) {
        console.error("XP distribution error:", distributeError);
        toast.error("Failed to award XP");
        return;
      }

      toast.success(`Quest completed! XP distributed to relevant skills`);
      setCompletedQuests([...completedQuests, data]);
      selectRandomQuests(); // Select new quests after completion
      
      window.dispatchEvent(new CustomEvent('xp-updated'));
    } catch (err) {
      console.error("Quest completion error:", err);
      toast.error("An unexpected error occurred");
    }
  };

  const isQuestCompleted = (questId: string) => {
    return completedQuests.some(cq => cq.quest_id === questId);
  };

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Target className="h-4 w-4" />
            Quests
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
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Target className="h-4 w-4" />
            Quests
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={selectRandomQuests}
            className="h-8 w-8"
          >
            <RefreshCcw className="h-4 w-4" />
            <span className="sr-only">Refresh Quests</span>
          </Button>
        </div>
        <div className="flex gap-2 mt-2">
          {(['daily', 'weekly', 'legacy'] as const).map((type) => (
            <Button
              key={type}
              variant={activeQuestType === type ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveQuestType(type)}
              className={cn(
                "flex-1",
                activeQuestType === type && "bg-primary text-primary-foreground"
              )}
            >
              {getQuestTypeTitle(type)}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {availableQuests.map((quest) => {
          const completed = isQuestCompleted(quest.id);
          return (
            <div
              key={quest.id}
              className="flex flex-col gap-2 p-4 rounded-lg border bg-card"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium leading-none mb-1.5">{quest.title}</h4>
                  <p className="text-sm text-muted-foreground leading-normal">{quest.description}</p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className="text-sm font-medium whitespace-nowrap">+{quest.xp_reward} XP</span>
                  {completed ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => completeQuest(quest)}
                    >
                      Complete
                    </Button>
                  )}
                </div>
              </div>
              {quest.skills && quest.skills.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                  {quest.skills.map((skill) => (
                    <div
                      key={skill.skill_id}
                      className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
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
