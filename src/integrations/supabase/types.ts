export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      approval_requests: {
        Row: {
          created_at: string | null
          file_name: string
          id: string
          request_type: string
          requested_by: string | null
          status: string | null
          template_id: string
          template_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          file_name: string
          id?: string
          request_type: string
          requested_by?: string | null
          status?: string | null
          template_id: string
          template_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          file_name?: string
          id?: string
          request_type?: string
          requested_by?: string | null
          status?: string | null
          template_id?: string
          template_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "approval_requests_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "document_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      deed_templates: {
        Row: {
          created_at: string | null
          custom_placeholders: Json | null
          deed_type: string
          description: string | null
          id: string
          preview_template: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          custom_placeholders?: Json | null
          deed_type: string
          description?: string | null
          id?: string
          preview_template?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          custom_placeholders?: Json | null
          deed_type?: string
          description?: string | null
          id?: string
          preview_template?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      deeds: {
        Row: {
          created_at: string
          custom_fields: Json | null
          date: string
          deed_type: string
          document_number: string
          executed_by: string
          id: string
          in_favour_of: string
          nature_of_doc: string | null
          table_type: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          custom_fields?: Json | null
          date: string
          deed_type: string
          document_number: string
          executed_by: string
          id?: string
          in_favour_of: string
          nature_of_doc?: string | null
          table_type?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          custom_fields?: Json | null
          date?: string
          deed_type?: string
          document_number?: string
          executed_by?: string
          id?: string
          in_favour_of?: string
          nature_of_doc?: string | null
          table_type?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      document_templates: {
        Row: {
          created_at: string
          file_data: string
          file_name: string
          id: string
          template_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          file_data: string
          file_name: string
          id?: string
          template_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          file_data?: string
          file_name?: string
          id?: string
          template_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      drafts: {
        Row: {
          created_at: string
          documents: Json
          draft_name: string
          id: string
          placeholders: Json
          template_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          documents?: Json
          draft_name: string
          id?: string
          placeholders?: Json
          template_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          documents?: Json
          draft_name?: string
          id?: string
          placeholders?: Json
          template_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "drafts_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "document_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      history_of_title_templates: {
        Row: {
          created_at: string | null
          deed_type: string
          id: string
          template_content: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deed_type: string
          id?: string
          template_content: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deed_type?: string
          id?: string
          template_content?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "history_of_title_templates_deed_type_fkey"
            columns: ["deed_type"]
            isOneToOne: true
            referencedRelation: "deed_templates"
            referencedColumns: ["deed_type"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
