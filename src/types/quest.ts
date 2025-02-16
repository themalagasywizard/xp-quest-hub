
export interface Quest {
  id: string;
  title: string;
  description: string;
  xp_reward: number;
  quest_type: 'daily' | 'weekly' | 'legacy';
  created_at: string;
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
