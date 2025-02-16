
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Quest } from "@/types/quest";

export interface SkillFilter {
  id: string;
  name: string;
  color: string;
}

export function useSkillFilters() {
  const [skills, setSkills] = useState<SkillFilter[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);

  useEffect(() => {
    fetchSkills();
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

  const filterQuestsBySkill = (quests: Quest[], skillId: string | null) => {
    if (!skillId) return quests;
    return quests.filter(quest => 
      quest.skills?.some(skill => skill.skill_id === skillId)
    );
  };

  return {
    skills,
    selectedSkill,
    setSelectedSkill,
    filterQuestsBySkill
  };
}
