
import { Progress } from "@/components/ui/progress";
import { Brain, Dumbbell, Palette, Book, Heart } from "lucide-react";

const skills = [
  { name: "Focus", icon: Brain, progress: 75, color: "from-blue-500 to-blue-600" },
  { name: "Fitness", icon: Dumbbell, progress: 45, color: "from-green-500 to-green-600" },
  { name: "Creativity", icon: Palette, progress: 60, color: "from-purple-500 to-purple-600" },
  { name: "Learning", icon: Book, progress: 30, color: "from-yellow-500 to-yellow-600" },
  { name: "Wellness", icon: Heart, progress: 90, color: "from-red-500 to-red-600" },
];

export function SkillTreeProgress() {
  return (
    <div className="grid gap-4">
      {skills.map((skill) => (
        <div key={skill.name} className="flex items-center gap-4">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
            <skill.icon className="w-4 h-4" />
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex justify-between text-sm">
              <span>{skill.name}</span>
              <span className="text-muted-foreground">{skill.progress}%</span>
            </div>
            <div className="relative h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={`absolute inset-y-0 left-0 transition-all bg-gradient-to-r ${skill.color}`}
                style={{ width: `${skill.progress}%` }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
