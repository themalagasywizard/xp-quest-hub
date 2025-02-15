
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const activityOptions = {
  Focus: [
    { name: "30min Deep Work", xp: 25 },
    { name: "1h Deep Work", xp: 50 },
  ],
  Fitness: [
    { name: "Light Workout", xp: 20 },
    { name: "Intense Workout", xp: 40 },
  ],
  Creativity: [
    { name: "1h Creative Session", xp: 30 },
    { name: "Finished Project", xp: 50 },
  ],
  Learning: [
    { name: "30min Reading", xp: 20 },
    { name: "Course Module", xp: 40 },
  ],
  Wellness: [
    { name: "10min Meditation", xp: 15 },
    { name: "Healthy Meal Prep", xp: 30 },
  ],
};

export function DailyLog() {
  const [selectedSkill, setSelectedSkill] = useState<string>("");
  const [selectedActivity, setSelectedActivity] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);
  const [todayXP, setTodayXP] = useState(0);

  async function logActivity() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const activity = activityOptions[selectedSkill as keyof typeof activityOptions]
        .find(a => a.name === selectedActivity);
      
      if (!activity) return;

      const { data: skillData } = await supabase
        .from('skill_trees')
        .select('id')
        .eq('name', selectedSkill)
        .single();

      if (!skillData) return;

      const { data, error } = await supabase.rpc(
        'log_activity_and_update_xp',
        {
          p_user_id: user.id,
          p_activity_name: activity.name,
          p_skill_id: skillData.id,
          p_xp_awarded: activity.xp,
        }
      );

      if (error) throw error;

      setTodayXP(prev => prev + activity.xp);
      toast.success(`Earned ${activity.xp} XP in ${selectedSkill}!`);
      
      if (data.leveled_up) {
        toast.success(`Level Up! You're now level ${data.new_level} in ${selectedSkill}!`);
      }

      setIsOpen(false);
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Today's Progress</CardTitle>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="icon" variant="outline" className="h-8 w-8">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Log Activity</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Skill Tree</label>
                <Select onValueChange={setSelectedSkill}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select skill" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(activityOptions).map((skill) => (
                      <SelectItem key={skill} value={skill}>
                        {skill}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedSkill && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Activity</label>
                  <Select onValueChange={setSelectedActivity}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select activity" />
                    </SelectTrigger>
                    <SelectContent>
                      {activityOptions[selectedSkill as keyof typeof activityOptions].map((activity) => (
                        <SelectItem key={activity.name} value={activity.name}>
                          {activity.name} (+{activity.xp} XP)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button 
                className="w-full" 
                disabled={!selectedSkill || !selectedActivity}
                onClick={logActivity}
              >
                Log Activity
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{todayXP} XP</div>
        <p className="text-xs text-muted-foreground">
          earned today
        </p>
      </CardContent>
    </Card>
  );
}
