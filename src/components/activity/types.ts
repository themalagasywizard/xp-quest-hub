
export interface ActivityLog {
  activity_name: string;
  xp_awarded: number;
  created_at: string;
  skill: {
    name: string;
    icon: string;
    color: string;
  } | null;
}

export interface CompletedQuest {
  quest: {
    title: string;
    xp_reward: number;
    skills: {
      skill: {
        name: string;
        icon: string;
        color: string;
      }
      xp_share: number;
    }[]
  };
  completed_at: string;
}

export interface DayActivities {
  totalXP: number;
  activities: ActivityLog[];
  completedQuests: CompletedQuest[];
}
