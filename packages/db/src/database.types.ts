export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      collections: {
        Row: {
          created_at: string
          id: string
          name: string
          parent_id: string | null
          path: string
          position: number
          space_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          parent_id?: string | null
          path: string
          position?: number
          space_id: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          parent_id?: string | null
          path?: string
          position?: number
          space_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collections_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collections_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          color: string | null
          created_at: string
          horizon: string
          id: string
          period_end: string | null
          period_start: string | null
          position: number
          space_id: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
          why: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          horizon?: string
          id?: string
          period_end?: string | null
          period_start?: string | null
          position?: number
          space_id?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id?: string
          why?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string
          horizon?: string
          id?: string
          period_end?: string | null
          period_start?: string | null
          position?: number
          space_id?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
          why?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "goals_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      habit_logs: {
        Row: {
          done_on: string
          habit_id: string
          id: string
          note: string | null
          user_id: string
          value: number
        }
        Insert: {
          done_on?: string
          habit_id: string
          id?: string
          note?: string | null
          user_id?: string
          value?: number
        }
        Update: {
          done_on?: string
          habit_id?: string
          id?: string
          note?: string | null
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "habit_logs_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          active: boolean
          color: string | null
          created_at: string
          goal_id: string | null
          id: string
          position: number
          rrule: string
          target_per_period: number
          title: string
          user_id: string
        }
        Insert: {
          active?: boolean
          color?: string | null
          created_at?: string
          goal_id?: string | null
          id?: string
          position?: number
          rrule?: string
          target_per_period?: number
          title: string
          user_id?: string
        }
        Update: {
          active?: boolean
          color?: string | null
          created_at?: string
          goal_id?: string | null
          id?: string
          position?: number
          rrule?: string
          target_per_period?: number
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habits_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          body: Json | null
          body_text: string | null
          captured_via: string | null
          collection_id: string | null
          created_at: string
          id: string
          is_favorite: boolean
          kind: Database["public"]["Enums"]["item_kind"]
          metadata: Json
          processed_at: string | null
          search_vector: unknown
          source_domain: string | null
          source_url: string | null
          status: Database["public"]["Enums"]["item_status"]
          summary: string | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          body?: Json | null
          body_text?: string | null
          captured_via?: string | null
          collection_id?: string | null
          created_at?: string
          id?: string
          is_favorite?: boolean
          kind?: Database["public"]["Enums"]["item_kind"]
          metadata?: Json
          processed_at?: string | null
          search_vector?: unknown
          source_domain?: string | null
          source_url?: string | null
          status?: Database["public"]["Enums"]["item_status"]
          summary?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          body?: Json | null
          body_text?: string | null
          captured_via?: string | null
          collection_id?: string | null
          created_at?: string
          id?: string
          is_favorite?: boolean
          kind?: Database["public"]["Enums"]["item_kind"]
          metadata?: Json
          processed_at?: string | null
          search_vector?: unknown
          source_domain?: string | null
          source_url?: string | null
          status?: Database["public"]["Enums"]["item_status"]
          summary?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "items_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
        ]
      }
      key_results: {
        Row: {
          current: number
          goal_id: string
          id: string
          position: number
          target: number | null
          title: string
          unit: string | null
          user_id: string
        }
        Insert: {
          current?: number
          goal_id: string
          id?: string
          position?: number
          target?: number | null
          title: string
          unit?: string | null
          user_id?: string
        }
        Update: {
          current?: number
          goal_id?: string
          id?: string
          position?: number
          target?: number | null
          title?: string
          unit?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "key_results_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          locale: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          locale?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          locale?: string
          updated_at?: string
        }
        Relationships: []
      }
      spaces: {
        Row: {
          color: string
          created_at: string
          icon: string | null
          id: string
          name: string
          position: number
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          position?: number
          user_id?: string
        }
        Update: {
          color?: string
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          position?: number
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          completed_at: string | null
          created_at: string
          due_on: string | null
          estimate_min: number | null
          goal_id: string | null
          id: string
          item_id: string | null
          notes: string | null
          position: number
          priority: number
          scheduled_for: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          due_on?: string | null
          estimate_min?: number | null
          goal_id?: string | null
          id?: string
          item_id?: string | null
          notes?: string | null
          position?: number
          priority?: number
          scheduled_for?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          due_on?: string | null
          estimate_min?: number | null
          goal_id?: string | null
          id?: string
          item_id?: string | null
          notes?: string | null
          position?: number
          priority?: number
          scheduled_for?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      slugify: { Args: { valore: string }; Returns: string }
    }
    Enums: {
      item_kind:
        | "note"
        | "article"
        | "video"
        | "reel"
        | "book"
        | "course"
        | "highlight"
      item_status: "inbox" | "processing" | "active" | "archived"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      item_kind: [
        "note",
        "article",
        "video",
        "reel",
        "book",
        "course",
        "highlight",
      ],
      item_status: ["inbox", "processing", "active", "archived"],
    },
  },
} as const

