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
      capture_events: {
        Row: {
          created_at: string
          id: number
          source: string | null
          status: number
          token_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: never
          source?: string | null
          status: number
          token_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: never
          source?: string | null
          status?: number
          token_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "capture_events_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "capture_tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      capture_tokens: {
        Row: {
          created_at: string
          id: string
          last_used_at: string | null
          name: string
          revoked_at: string | null
          token_hash: string
          token_hint: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_used_at?: string | null
          name: string
          revoked_at?: string | null
          token_hash: string
          token_hint: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_used_at?: string | null
          name?: string
          revoked_at?: string | null
          token_hash?: string
          token_hint?: string
          user_id?: string
        }
        Relationships: []
      }
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
      pomodoro_sessions: {
        Row: {
          completed: boolean
          ended_at: string
          id: string
          kind: string
          minutes: number
          started_at: string
          task_id: string | null
          user_id: string
        }
        Insert: {
          completed?: boolean
          ended_at?: string
          id?: string
          kind: string
          minutes: number
          started_at: string
          task_id?: string | null
          user_id?: string
        }
        Update: {
          completed?: boolean
          ended_at?: string
          id?: string
          kind?: string
          minutes?: number
          started_at?: string
          task_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pomodoro_sessions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      pomodoro_settings: {
        Row: {
          auto_start_next: boolean
          cycles_before_long: number
          long_break_minutes: number
          short_break_minutes: number
          suono: boolean
          updated_at: string
          user_id: string
          work_minutes: number
        }
        Insert: {
          auto_start_next?: boolean
          cycles_before_long?: number
          long_break_minutes?: number
          short_break_minutes?: number
          suono?: boolean
          updated_at?: string
          user_id?: string
          work_minutes?: number
        }
        Update: {
          auto_start_next?: boolean
          cycles_before_long?: number
          long_break_minutes?: number
          short_break_minutes?: number
          suono?: boolean
          updated_at?: string
          user_id?: string
          work_minutes?: number
        }
        Relationships: []
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
      projects: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          goal_id: string | null
          id: string
          name: string
          position: number
          space_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          goal_id?: string | null
          id?: string
          name: string
          position?: number
          space_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          goal_id?: string | null
          id?: string
          name?: string
          position?: number
          space_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
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
      task_columns: {
        Row: {
          color: string | null
          created_at: string
          id: string
          is_done: boolean
          name: string
          position: number
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          is_done?: boolean
          name: string
          position?: number
          user_id?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          is_done?: boolean
          name?: string
          position?: number
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          column_id: string | null
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
          project_id: string | null
          scheduled_for: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          column_id?: string | null
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
          project_id?: string | null
          scheduled_for?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          column_id?: string | null
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
          project_id?: string | null
          scheduled_for?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_column_id_fkey"
            columns: ["column_id"]
            isOneToOne: false
            referencedRelation: "task_columns"
            referencedColumns: ["id"]
          },
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
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      crea_colonne_iniziali: { Args: { id_utente: string }; Returns: undefined }
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

