
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Flame } from "lucide-react";

export function ChallengesWidget() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Active Challenges</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-500" />
            <span className="text-sm">Winning Streak</span>
          </div>
          <Badge variant="secondary">3 Days</Badge>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-500" />
            <span className="text-sm">XP Multiplier</span>
          </div>
          <Badge variant="secondary">1.5x</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
