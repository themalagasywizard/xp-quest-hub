
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QuestList } from "./QuestList";
import { Quest } from "@/types/quest";

interface QuestTabsProps {
  quests: Quest[];
  isQuestCompleted: (questId: string) => boolean;
  getResetTimeDisplay: (questId: string) => string | null;
  onCompleteQuest: (quest: Quest) => void;
}

export function QuestTabs({
  quests,
  isQuestCompleted,
  getResetTimeDisplay,
  onCompleteQuest
}: QuestTabsProps) {
  return (
    <Tabs defaultValue="daily" className="w-full">
      <TabsList>
        <TabsTrigger value="daily">Daily</TabsTrigger>
        <TabsTrigger value="weekly">Weekly</TabsTrigger>
        <TabsTrigger value="legacy">Legacy</TabsTrigger>
      </TabsList>
      <TabsContent value="daily" className="mt-4">
        <QuestList
          quests={quests}
          questType="daily"
          isQuestCompleted={isQuestCompleted}
          getResetTimeDisplay={getResetTimeDisplay}
          onCompleteQuest={onCompleteQuest}
        />
      </TabsContent>
      <TabsContent value="weekly" className="mt-4">
        <QuestList
          quests={quests}
          questType="weekly"
          isQuestCompleted={isQuestCompleted}
          getResetTimeDisplay={getResetTimeDisplay}
          onCompleteQuest={onCompleteQuest}
        />
      </TabsContent>
      <TabsContent value="legacy" className="mt-4">
        <QuestList
          quests={quests}
          questType="legacy"
          isQuestCompleted={isQuestCompleted}
          getResetTimeDisplay={getResetTimeDisplay}
          onCompleteQuest={onCompleteQuest}
        />
      </TabsContent>
    </Tabs>
  );
}
