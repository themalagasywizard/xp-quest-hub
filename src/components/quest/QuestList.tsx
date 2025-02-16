
import { Quest } from "@/types/quest";
import { QuestItem } from "./QuestItem";
import { useQuestProgress } from "@/hooks/useQuestProgress";

interface QuestListProps {
  quests: Quest[];
  questType: Quest['quest_type'];
  isQuestCompleted: (questId: string) => boolean;
  getResetTimeDisplay: (questId: string) => string | null;
  onCompleteQuest: (quest: Quest) => void;
}

export function QuestList({ 
  quests,
  questType,
  isQuestCompleted,
  getResetTimeDisplay,
  onCompleteQuest
}: QuestListProps) {
  const { questProgress } = useQuestProgress();
  const filteredQuests = quests.filter(quest => quest.quest_type === questType);

  return (
    <div className="space-y-4">
      {filteredQuests.map((quest) => (
        <QuestItem
          key={quest.id}
          quest={quest}
          completed={isQuestCompleted(quest.id)}
          resetTimeDisplay={getResetTimeDisplay(quest.id)}
          onComplete={onCompleteQuest}
          progress={questProgress[quest.id]}
        />
      ))}
    </div>
  );
}
