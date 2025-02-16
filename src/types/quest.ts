
export interface Quest {
  id: string;
  title: string;
  description: string;
  xp_reward: number;
  quest_type: 'daily' | 'weekly' | 'legacy';
  created_at: string;
  completion_type?: 'daily_streak' | 'total_activities' | 'days_with_activity';
  completion_requirement?: {
    required_streak?: number;
    required_activities?: number;
    required_days?: number;
  };
  parent_quest_id?: string;
  skills?: {
    skill_id: string;
    skill_name: string;
    xp_share: number;
    color: string;
    icon: string;
  }[];
}

export interface UserQuest {
  id: string;
  user_id: string;
  quest_id: string;
  completed_at: string;
  created_at: string;
  reset_time: string;
}

export interface QuestProgress {
  quest_id: string;
  current_streak: number;
  total_activities: number;
  last_activity_date: string | null;
  first_activity_date: string | null;
}
