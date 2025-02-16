import { useEffect, useState } from "react";
import { Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Quest, UserQuest } from "@/types/quest";
import { toast } from "sonner";
import { Sidebar } from "@/components/Sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDistanceToNow } from "date-fns";
import { QuestList } from "@/components/quest/QuestList";
import { Badge } from "@/components/ui/badge";

interface SkillFilter {
  id: string;
  name: string;
  color: string;
}

export default function Quests() {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [completedQuests, setCompletedQuests] = useState<UserQuest[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());
  const [skills, setSkills] = useState<SkillFilter[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);

  useEffect(() => {
    fetchQuests();
    fetchCompletedQuests();
    fetchSkills();

    // Update timer every minute
    const interval = setInterval(() => {
      setNow(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const fetchSkills = async () => {
    const { data, error } = await supabase
      .from('skill_trees')
      .select('id, name, color')
      .order('name');

    if (error) {
      toast.error("Failed to fetch skills");
      return;
    }

    setSkills(data);
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

  const filterQuestsBySkill = (quests: Quest[], skillId: string | null) => {
    if (!skillId) return quests;
    return quests.filter(quest => 
      quest.skills?.some(skill => skill.skill_id === skillId)
    );
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
          
          <div className="mb-6 flex flex-wrap gap-2">
            <Badge
              variant={selectedSkill === null ? "default" : "secondary"}
              className="cursor-pointer"
              onClick={() => setSelectedSkill(null)}
            >
              All Skills
            </Badge>
            {skills.map((skill) => (
              <Badge
                key={skill.id}
                variant={selectedSkill === skill.id ? "default" : "secondary"}
                className="cursor-pointer"
                style={{
                  backgroundColor: selectedSkill === skill.id ? skill.color : undefined,
                  color: selectedSkill === skill.id ? 'white' : skill.color,
                  borderColor: skill.color
                }}
                onClick={() => setSelectedSkill(skill.id)}
              >
                {skill.name}
              </Badge>
            ))}
          </div>
          
          <Tabs defaultValue="daily" className="w-full">
            <TabsList>
              <TabsTrigger value="daily">Daily</TabsTrigger>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="legacy">Legacy</TabsTrigger>
            </TabsList>
            <TabsContent value="daily" className="mt-4">
              <QuestList
                quests={filterQuestsBySkill(quests, selectedSkill)}
                questType="daily"
                isQuestCompleted={isQuestCompleted}
                getResetTimeDisplay={getResetTimeDisplay}
                onCompleteQuest={completeQuest}
              />
            </TabsContent>
            <TabsContent value="weekly" className="mt-4">
              <QuestList
                quests={filterQuestsBySkill(quests, selectedSkill)}
                questType="weekly"
                isQuestCompleted={isQuestCompleted}
                getResetTimeDisplay={getResetTimeDisplay}
                onCompleteQuest={completeQuest}
              />
            </TabsContent>
            <TabsContent value="legacy" className="mt-4">
              <QuestList
                quests={filterQuestsBySkill(quests, selectedSkill)}
                questType="legacy"
                isQuestCompleted={isQuestCompleted}
                getResetTimeDisplay={getResetTimeDisplay}
                onCompleteQuest={completeQuest}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
