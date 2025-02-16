
export interface Quest {
  id: string;
  title: string;
  description: string;
  xp_reward: number;
  quest_type: 'daily' | 'weekly' | 'legacy';
  created_at: string;
}

export interface UserQuest {
  id: string;
  user_id: string;
  quest_id: string;
  completed_at: string;
  created_at: string;
}
