
import { useState, useEffect } from "react";
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

  const getTodayXP = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get today's XP for each skill
      const { data, error } = await supabase
        .from('activity_log')
        .select('xp_awarded')
        .eq('user_id', user.id)
        .gte('created_at', today.toISOString());

      if (error) throw error;

      const totalXP = data.reduce((sum, activity) => sum + activity.xp_awarded, 0);
      setTodayXP(totalXP);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    getTodayXP();
  }, []);

  async function logActivity() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const activity = activityOptions[selectedSkill as keyof typeof activityOptions]
        .find(a => a.name === selectedActivity);
      
      if (!activity) return;

      // First get the skill_id for the selected skill name
      const { data: skillData, error: skillError } = await supabase
        .from('skill_trees')
        .select('id')
        .eq('name', selectedSkill)
        .single();

      if (skillError) throw skillError;
      if (!skillData) {
        toast.error(`Skill ${selectedSkill} not found`);
        return;
      }

      // Log the activity with the correct skill_id
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

      const result = data as {
        new_xp: number;
        new_level: number;
        leveled_up: boolean;
        xp_for_next_level: number;
      };

      // Update today's total XP
      setTodayXP(prev => prev + activity.xp);
      toast.success(`Earned ${activity.xp} XP in ${selectedSkill}!`);
      
      if (result.leveled_up) {
        toast.success(`Level Up! You're now level ${result.new_level} in ${selectedSkill}!`);
      }

      // Reset selection and close dialog
      setSelectedSkill("");
      setSelectedActivity("");
      setIsOpen(false);

      // Emit event to update skill progress
      window.dispatchEvent(new CustomEvent('xp-updated'));
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
