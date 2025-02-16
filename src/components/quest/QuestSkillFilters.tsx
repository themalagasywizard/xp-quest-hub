
import { Badge } from "@/components/ui/badge";

interface SkillFilter {
  id: string;
  name: string;
  color: string;
}

interface QuestSkillFiltersProps {
  skills: SkillFilter[];
  selectedSkill: string | null;
  onSelectSkill: (skillId: string | null) => void;
}

export function QuestSkillFilters({ 
  skills, 
  selectedSkill, 
  onSelectSkill 
}: QuestSkillFiltersProps) {
  return (
    <div className="mb-6 flex flex-wrap gap-2">
      <Badge
        variant={selectedSkill === null ? "default" : "secondary"}
        className="cursor-pointer"
        onClick={() => onSelectSkill(null)}
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
          onClick={() => onSelectSkill(skill.id)}
        >
          {skill.name}
        </Badge>
      ))}
    </div>
  );
}
