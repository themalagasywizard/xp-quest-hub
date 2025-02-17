
import { Calendar } from "@/components/ui/calendar";
import { useIsMobile } from "@/hooks/use-mobile";
import { DayActivities } from "./types";

interface ActivityCalendarProps {
  selectedDate: Date | undefined;
  onDateSelect: (date: Date | undefined) => void;
  getDayActivities: (date: Date) => DayActivities | null;
}

export function ActivityCalendar({ selectedDate, onDateSelect, getDayActivities }: ActivityCalendarProps) {
  const isMobile = useIsMobile();

  return (
    <div className="rounded-lg border bg-card p-2 md:p-6">
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={onDateSelect}
        className="w-full"
        disabled={{ after: new Date() }}
        modifiers={{
          hasActivity: (date) => {
            const dayData = getDayActivities(date);
            return dayData !== null && (
              dayData.activities.length > 0 || dayData.completedQuests.length > 0
            );
          },
        }}
        modifiersStyles={{
          hasActivity: {
            backgroundColor: "rgb(var(--primary) / 0.1)",
            color: "rgb(var(--primary))",
          },
        }}
        styles={{
          month: { width: '100%' },
          table: { width: '100%' },
          head_cell: { width: isMobile ? '2.5rem' : '4rem', fontSize: isMobile ? '0.75rem' : '0.875rem' },
          cell: { width: isMobile ? '2.5rem' : '4rem', height: isMobile ? '2.5rem' : '4rem' },
          day: { width: isMobile ? '2.5rem' : '4rem', height: isMobile ? '2.5rem' : '4rem' },
        }}
      />
    </div>
  );
}
