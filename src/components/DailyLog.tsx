
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityLogDialog } from "@/components/activity/ActivityLogDialog";
import { useDailyXP } from "@/hooks/useDailyXP";

export function DailyLog() {
  const { todayXP, refreshTodayXP } = useDailyXP();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Today's Progress</CardTitle>
        <ActivityLogDialog onActivityLogged={refreshTodayXP} />
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
