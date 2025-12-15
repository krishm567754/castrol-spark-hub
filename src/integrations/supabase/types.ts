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
      customers: {
        Row: {
          address: string | null
          category: string | null
          city: string | null
          created_at: string
          customer_code: string
          customer_name: string
          gst: string | null
          id: string
          phone: string | null
          sales_executive: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          category?: string | null
          city?: string | null
          created_at?: string
          customer_code: string
          customer_name: string
          gst?: string | null
          id?: string
          phone?: string | null
          sales_executive?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          category?: string | null
          city?: string | null
          created_at?: string
          customer_code?: string
          customer_name?: string
          gst?: string | null
          id?: string
          phone?: string | null
          sales_executive?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          created_at: string
          customer_code: string | null
          customer_name: string
          district_name: string | null
          fiscal_year: string | null
          id: string
          invoice_date: string
          invoice_no: string
          is_current_year: boolean | null
          master_brand_name: string | null
          product_brand_name: string | null
          product_name: string | null
          product_volume: number | null
          sales_exec_name: string | null
          state_name: string | null
          total_value: number | null
        }
        Insert: {
          created_at?: string
          customer_code?: string | null
          customer_name: string
          district_name?: string | null
          fiscal_year?: string | null
          id?: string
          invoice_date: string
          invoice_no: string
          is_current_year?: boolean | null
          master_brand_name?: string | null
          product_brand_name?: string | null
          product_name?: string | null
          product_volume?: number | null
          sales_exec_name?: string | null
          state_name?: string | null
          total_value?: number | null
        }
        Update: {
          created_at?: string
          customer_code?: string | null
          customer_name?: string
          district_name?: string | null
          fiscal_year?: string | null
          id?: string
          invoice_date?: string
          invoice_no?: string
          is_current_year?: boolean | null
          master_brand_name?: string | null
          product_brand_name?: string | null
          product_name?: string | null
          product_volume?: number | null
          sales_exec_name?: string | null
          state_name?: string | null
          total_value?: number | null
        }
        Relationships: []
      }
      kpi_configs: {
        Row: {
          aggregation_type: string
          created_at: string
          display_order: number | null
          field_name: string
          field_value: string
          icon_name: string | null
          id: string
          is_active: boolean | null
          kpi_type: string
          name: string
          operator: string
          short_key: string
          updated_at: string
        }
        Insert: {
          aggregation_type: string
          created_at?: string
          display_order?: number | null
          field_name: string
          field_value: string
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          kpi_type: string
          name: string
          operator: string
          short_key: string
          updated_at?: string
        }
        Update: {
          aggregation_type?: string
          created_at?: string
          display_order?: number | null
          field_name?: string
          field_value?: string
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          kpi_type?: string
          name?: string
          operator?: string
          short_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      open_orders: {
        Row: {
          created_at: string
          customer_code: string | null
          customer_name: string | null
          id: string
          order_date: string
          order_no: string
          product_name: string | null
          quantity: number | null
          sales_exec_name: string | null
          status: string | null
        }
        Insert: {
          created_at?: string
          customer_code?: string | null
          customer_name?: string | null
          id?: string
          order_date: string
          order_no: string
          product_name?: string | null
          quantity?: number | null
          sales_exec_name?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string
          customer_code?: string | null
          customer_name?: string | null
          id?: string
          order_date?: string
          order_no?: string
          product_name?: string | null
          quantity?: number | null
          sales_exec_name?: string | null
          status?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          id: string
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      sales_executives: {
        Row: {
          code: string | null
          created_at: string
          id: string
          name: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      stock: {
        Row: {
          brand: string | null
          created_at: string
          id: string
          pack_size: string | null
          product_code: string
          product_name: string
          quantity: number | null
          updated_at: string
        }
        Insert: {
          brand?: string | null
          created_at?: string
          id?: string
          pack_size?: string | null
          product_code: string
          product_name: string
          quantity?: number | null
          updated_at?: string
        }
        Update: {
          brand?: string | null
          created_at?: string
          id?: string
          pack_size?: string | null
          product_code?: string
          product_name?: string
          quantity?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_sales_exec_access: {
        Row: {
          has_all_access: boolean
          id: string
          sales_exec_id: string | null
          user_id: string
        }
        Insert: {
          has_all_access?: boolean
          id?: string
          sales_exec_id?: string | null
          user_id: string
        }
        Update: {
          has_all_access?: boolean
          id?: string
          sales_exec_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sales_exec_access_sales_exec_id_fkey"
            columns: ["sales_exec_id"]
            isOneToOne: false
            referencedRelation: "sales_executives"
            referencedColumns: ["id"]
          },
        ]
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
