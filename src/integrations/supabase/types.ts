export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      activity_log: {
        Row: {
          activity_name: string
          created_at: string
          id: string
          skill_id: string | null
          user_id: string | null
          xp_awarded: number
        }
        Insert: {
          activity_name: string
          created_at?: string
          id?: string
          skill_id?: string | null
          user_id?: string | null
          xp_awarded: number
        }
        Update: {
          activity_name?: string
          created_at?: string
          id?: string
          skill_id?: string | null
          user_id?: string | null
          xp_awarded?: number
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skill_trees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          level: number | null
          milestone_level: Database["public"]["Enums"]["milestone_level"] | null
          profile_picture: string | null
          streak_count: number | null
          timezone: string | null
          username: string
          xp_total: number | null
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          level?: number | null
          milestone_level?:
            | Database["public"]["Enums"]["milestone_level"]
            | null
          profile_picture?: string | null
          streak_count?: number | null
          timezone?: string | null
          username: string
          xp_total?: number | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          level?: number | null
          milestone_level?:
            | Database["public"]["Enums"]["milestone_level"]
            | null
          profile_picture?: string | null
          streak_count?: number | null
          timezone?: string | null
          username?: string
          xp_total?: number | null
        }
        Relationships: []
      }
      quest_skills: {
        Row: {
          created_at: string
          id: string
          quest_id: string
          skill_id: string
          xp_share: number
        }
        Insert: {
          created_at?: string
          id?: string
          quest_id: string
          skill_id: string
          xp_share?: number
        }
        Update: {
          created_at?: string
          id?: string
          quest_id?: string
          skill_id?: string
          xp_share?: number
        }
        Relationships: [
          {
            foreignKeyName: "quest_skills_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quest_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skill_trees"
            referencedColumns: ["id"]
          },
        ]
      }
      quests: {
        Row: {
          created_at: string
          description: string
          id: string
          quest_type: string
          title: string
          xp_reward: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          quest_type: string
          title: string
          xp_reward: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          quest_type?: string
          title?: string
          xp_reward?: number
        }
        Relationships: []
      }
      skill_trees: {
        Row: {
          color: string
          created_at: string
          icon: string
          id: string
          name: string
        }
        Insert: {
          color: string
          created_at?: string
          icon: string
          id?: string
          name: string
        }
        Update: {
          color?: string
          created_at?: string
          icon?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      user_quests: {
        Row: {
          completed_at: string
          created_at: string
          id: string
          quest_id: string
          reset_time: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string
          created_at?: string
          id?: string
          quest_id: string
          reset_time?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string
          created_at?: string
          id?: string
          quest_id?: string
          reset_time?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_quests_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_quests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_skills: {
        Row: {
          last_updated: string
          level: number | null
          skill_id: string
          user_id: string
          xp: number | null
        }
        Insert: {
          last_updated?: string
          level?: number | null
          skill_id: string
          user_id: string
          xp?: number | null
        }
        Update: {
          last_updated?: string
          level?: number | null
          skill_id?: string
          user_id?: string
          xp?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skill_trees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_skills_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_xp_for_level: {
        Args: {
          level_num: number
        }
        Returns: number
      }
      calculate_xp_multiplier: {
        Args: {
          p_user_id: string
          p_skill_id: string
        }
        Returns: number
      }
      distribute_quest_xp: {
        Args: {
          p_user_id: string
          p_quest_id: string
        }
        Returns: undefined
      }
      get_milestone_level: {
        Args: {
          p_user_id: string
        }
        Returns: Database["public"]["Enums"]["milestone_level"]
      }
      get_next_reset_time: {
        Args: {
          quest_type: string
        }
        Returns: string
      }
      log_activity_and_update_xp: {
        Args: {
          p_user_id: string
          p_activity_name: string
          p_skill_id: string
          p_xp_awarded: number
        }
        Returns: Json
      }
      should_quest_be_available: {
        Args: {
          p_quest_type: string
          p_last_completion_date: string
        }
        Returns: boolean
      }
    }
    Enums: {
      milestone_level:
        | "none"
        | "five"
        | "ten"
        | "twentyfive"
        | "fifty"
        | "hundred"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
