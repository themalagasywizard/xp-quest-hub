
import { Target } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { QuestSkillFilters } from "@/components/quest/QuestSkillFilters";
import { QuestTabs } from "@/components/quest/QuestTabs";
import { useQuests } from "@/hooks/useQuests";
import { useSkillFilters } from "@/hooks/useSkillFilters";

export default function Quests() {
  const { 
    quests, 
    loading, 
    isQuestCompleted, 
    getResetTimeDisplay, 
    completeQuest 
  } = useQuests();
  
  const {
    skills,
    selectedSkill,
    setSelectedSkill,
    filterQuestsBySkill
  } = useSkillFilters();

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
          
          <QuestSkillFilters
            skills={skills}
            selectedSkill={selectedSkill}
            onSelectSkill={setSelectedSkill}
          />
          
          <QuestTabs
            quests={filterQuestsBySkill(quests, selectedSkill)}
            isQuestCompleted={isQuestCompleted}
            getResetTimeDisplay={getResetTimeDisplay}
            onCompleteQuest={completeQuest}
          />
        </div>
      </main>
    </div>
  );
}
