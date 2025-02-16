
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Quest, UserQuest } from "@/types/quest";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export function useQuests() {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [completedQuests, setCompletedQuests] = useState<UserQuest[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    fetchQuests();
    fetchCompletedQuests();

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
      completion_type: quest.completion_type as Quest['completion_type'] | undefined,
      skills: quest.skills.map((s: any) => ({
        skill_id: s.skill_id,
        skill_name: s.skill.name,
        xp_share: s.xp_share,
        color: s.skill.color,
        icon: s.skill.icon
      }))
    }));

    setQuests(typedQuests);
    setLoading(false);
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
          toast.error("You've already completed this quest!");
          await fetchCompletedQuests();
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
    } catch (err) {
      console.error("Quest completion error:", err);
      toast.error("An unexpected error occurred");
    }
  };

  const isQuestCompleted = (questId: string) => {
    const completedQuest = completedQuests.find(cq => cq.quest_id === questId);
    if (!completedQuest) return false;

    const resetTime = new Date(completedQuest.reset_time);
    return now < resetTime;
  };

  const getResetTimeDisplay = (questId: string) => {
    const completedQuest = completedQuests.find(cq => cq.quest_id === questId);
    if (!completedQuest) return null;

    const resetTime = new Date(completedQuest.reset_time);
    if (now >= resetTime) return null;

    return `Resets ${formatDistanceToNow(resetTime, { addSuffix: true })}`;
  };

  return {
    quests,
    loading,
    isQuestCompleted,
    getResetTimeDisplay,
    completeQuest
  };
}
