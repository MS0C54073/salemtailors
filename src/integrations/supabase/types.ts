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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          id: string
          member_discount_percent: number
          member_priority_enabled: boolean
          notification_email: string | null
          notification_whatsapp: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          member_discount_percent?: number
          member_priority_enabled?: boolean
          notification_email?: string | null
          notification_whatsapp?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          member_discount_percent?: number
          member_priority_enabled?: boolean
          notification_email?: string | null
          notification_whatsapp?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      appointment_slots: {
        Row: {
          appointment_id: string | null
          booked_by: string | null
          created_at: string
          created_by: string | null
          duration_minutes: number
          id: string
          is_available: boolean
          notes: string | null
          slot_at: string
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          booked_by?: string | null
          created_at?: string
          created_by?: string | null
          duration_minutes?: number
          id?: string
          is_available?: boolean
          notes?: string | null
          slot_at: string
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          booked_by?: string | null
          created_at?: string
          created_by?: string | null
          duration_minutes?: number
          id?: string
          is_available?: boolean
          notes?: string | null
          slot_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      appointments: {
        Row: {
          appointment_type: Database["public"]["Enums"]["appointment_type"]
          client_id: string
          created_at: string
          garment_request_id: string | null
          id: string
          notes: string | null
          scheduled_at: string
          status: Database["public"]["Enums"]["appointment_status"]
          updated_at: string
        }
        Insert: {
          appointment_type: Database["public"]["Enums"]["appointment_type"]
          client_id: string
          created_at?: string
          garment_request_id?: string | null
          id?: string
          notes?: string | null
          scheduled_at: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Update: {
          appointment_type?: Database["public"]["Enums"]["appointment_type"]
          client_id?: string
          created_at?: string
          garment_request_id?: string | null
          id?: string
          notes?: string | null
          scheduled_at?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_garment_request_id_fkey"
            columns: ["garment_request_id"]
            isOneToOne: false
            referencedRelation: "garment_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      catalogue_categories: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      catalogue_item_images: {
        Row: {
          alt_text: string | null
          created_at: string
          display_order: number
          id: string
          image_url: string
          item_id: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          display_order?: number
          id?: string
          image_url: string
          item_id: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string
          item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalogue_item_images_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "catalogue_items"
            referencedColumns: ["id"]
          },
        ]
      }
      catalogue_item_variants: {
        Row: {
          created_at: string
          display_order: number
          id: string
          item_id: string
          name: string
          price_override: number | null
          sku: string | null
          stock_status: Database["public"]["Enums"]["stock_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          item_id: string
          name: string
          price_override?: number | null
          sku?: string | null
          stock_status?: Database["public"]["Enums"]["stock_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          item_id?: string
          name?: string
          price_override?: number | null
          sku?: string | null
          stock_status?: Database["public"]["Enums"]["stock_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalogue_item_variants_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "catalogue_items"
            referencedColumns: ["id"]
          },
        ]
      }
      catalogue_items: {
        Row: {
          base_price: number | null
          category_id: string | null
          created_at: string
          created_by: string | null
          currency: string
          description: string | null
          display_order: number
          id: string
          is_featured: boolean
          name: string
          primary_image_url: string | null
          slug: string
          status: Database["public"]["Enums"]["catalogue_status"]
          stock_status: Database["public"]["Enums"]["stock_status"]
          updated_at: string
        }
        Insert: {
          base_price?: number | null
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          display_order?: number
          id?: string
          is_featured?: boolean
          name: string
          primary_image_url?: string | null
          slug: string
          status?: Database["public"]["Enums"]["catalogue_status"]
          stock_status?: Database["public"]["Enums"]["stock_status"]
          updated_at?: string
        }
        Update: {
          base_price?: number | null
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          display_order?: number
          id?: string
          is_featured?: boolean
          name?: string
          primary_image_url?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["catalogue_status"]
          stock_status?: Database["public"]["Enums"]["stock_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalogue_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "catalogue_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_measurements: {
        Row: {
          created_at: string
          customer_id: string | null
          id: string
          measurements: Json
          notes: string | null
          profile_user_id: string | null
          template: Database["public"]["Enums"]["measurement_template"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          id?: string
          measurements?: Json
          notes?: string | null
          profile_user_id?: string | null
          template: Database["public"]["Enums"]["measurement_template"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          id?: string
          measurements?: Json
          notes?: string | null
          profile_user_id?: string | null
          template?: Database["public"]["Enums"]["measurement_template"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_measurements_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          created_at: string
          created_by: string | null
          email: string | null
          full_name: string
          id: string
          measurements: Json | null
          notes: string | null
          phone: string
          tier: Database["public"]["Enums"]["customer_tier"]
          tier_since: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          email?: string | null
          full_name: string
          id?: string
          measurements?: Json | null
          notes?: string | null
          phone: string
          tier?: Database["public"]["Enums"]["customer_tier"]
          tier_since?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          email?: string | null
          full_name?: string
          id?: string
          measurements?: Json | null
          notes?: string | null
          phone?: string
          tier?: Database["public"]["Enums"]["customer_tier"]
          tier_since?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: Database["public"]["Enums"]["expense_category"]
          created_at: string
          description: string
          expense_date: string
          id: string
          notes: string | null
          recorded_by: string | null
        }
        Insert: {
          amount: number
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          description: string
          expense_date?: string
          id?: string
          notes?: string | null
          recorded_by?: string | null
        }
        Update: {
          amount?: number
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          description?: string
          expense_date?: string
          id?: string
          notes?: string | null
          recorded_by?: string | null
        }
        Relationships: []
      }
      garment_requests: {
        Row: {
          assigned_to: string | null
          category: Database["public"]["Enums"]["garment_category"]
          client_id: string | null
          created_at: string
          customer_id: string | null
          customer_name: string | null
          customer_phone: string | null
          description: string
          discount_percent: number
          due_date: string | null
          estimated_cost: number | null
          event_date: string | null
          id: string
          is_member_priority: boolean
          measurements: Json | null
          notes: string | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          preferences: Json
          reference_images: string[] | null
          service_type: string | null
          status: Database["public"]["Enums"]["order_status"]
          total_price: number | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          category: Database["public"]["Enums"]["garment_category"]
          client_id?: string | null
          created_at?: string
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          description: string
          discount_percent?: number
          due_date?: string | null
          estimated_cost?: number | null
          event_date?: string | null
          id?: string
          is_member_priority?: boolean
          measurements?: Json | null
          notes?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          preferences?: Json
          reference_images?: string[] | null
          service_type?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total_price?: number | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          category?: Database["public"]["Enums"]["garment_category"]
          client_id?: string | null
          created_at?: string
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          description?: string
          discount_percent?: number
          due_date?: string | null
          estimated_cost?: number | null
          event_date?: string | null
          id?: string
          is_member_priority?: boolean
          measurements?: Json | null
          notes?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          preferences?: Json
          reference_images?: string[] | null
          service_type?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total_price?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          garment_request_id: string | null
          id: string
          is_read: boolean
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          garment_request_id?: string | null
          id?: string
          is_read?: boolean
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          garment_request_id?: string | null
          id?: string
          is_read?: boolean
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_garment_request_id_fkey"
            columns: ["garment_request_id"]
            isOneToOne: false
            referencedRelation: "garment_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          customer_id: string | null
          garment_request_id: string | null
          id: string
          notes: string | null
          paid_at: string
          payment_method: string | null
          payment_type: Database["public"]["Enums"]["payment_type"]
          recorded_by: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          customer_id?: string | null
          garment_request_id?: string | null
          id?: string
          notes?: string | null
          paid_at?: string
          payment_method?: string | null
          payment_type?: Database["public"]["Enums"]["payment_type"]
          recorded_by?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          customer_id?: string | null
          garment_request_id?: string | null
          id?: string
          notes?: string | null
          paid_at?: string
          payment_method?: string | null
          payment_type?: Database["public"]["Enums"]["payment_type"]
          recorded_by?: string | null
        }
        Relationships: []
      }
      portfolio_items: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          display_order: number
          id: string
          image_url: string
          is_featured: boolean
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number
          id?: string
          image_url: string
          is_featured?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number
          id?: string
          image_url?: string
          is_featured?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          phone: string
          tier: Database["public"]["Enums"]["customer_tier"]
          tier_since: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          phone: string
          tier?: Database["public"]["Enums"]["customer_tier"]
          tier_since?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          phone?: string
          tier?: Database["public"]["Enums"]["customer_tier"]
          tier_since?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      shop_orders: {
        Row: {
          created_at: string
          currency: string
          customer_email: string | null
          customer_name: string
          customer_phone: string
          id: string
          items: Json
          notes: string | null
          status: Database["public"]["Enums"]["shop_order_status"]
          subtotal: number
          updated_at: string
          user_id: string | null
          whatsapp_sent: boolean
        }
        Insert: {
          created_at?: string
          currency?: string
          customer_email?: string | null
          customer_name: string
          customer_phone: string
          id?: string
          items?: Json
          notes?: string | null
          status?: Database["public"]["Enums"]["shop_order_status"]
          subtotal?: number
          updated_at?: string
          user_id?: string | null
          whatsapp_sent?: boolean
        }
        Update: {
          created_at?: string
          currency?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          id?: string
          items?: Json
          notes?: string | null
          status?: Database["public"]["Enums"]["shop_order_status"]
          subtotal?: number
          updated_at?: string
          user_id?: string | null
          whatsapp_sent?: boolean
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_appointment_slots_with_notes: {
        Args: never
        Returns: {
          appointment_id: string | null
          booked_by: string | null
          created_at: string
          created_by: string | null
          duration_minutes: number
          id: string
          is_available: boolean
          notes: string | null
          slot_at: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "appointment_slots"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_member_discount: { Args: never; Returns: number }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      track_shop_orders: {
        Args: { _phone: string }
        Returns: {
          created_at: string
          currency: string
          customer_name: string
          id: string
          items: Json
          status: Database["public"]["Enums"]["shop_order_status"]
          subtotal: number
          updated_at: string
          whatsapp_sent: boolean
        }[]
      }
      upsert_catalogue_item: {
        Args: { _images: Json; _item: Json; _variants: Json }
        Returns: string
      }
    }
    Enums: {
      app_role: "super_admin" | "admin" | "sub_admin" | "client"
      appointment_status:
        | "pending"
        | "confirmed"
        | "completed"
        | "cancelled"
        | "rescheduled"
      appointment_type: "consultation" | "measurement" | "fitting" | "pickup"
      catalogue_status: "active" | "draft" | "sold_out"
      customer_tier: "regular" | "member"
      expense_category:
        | "fabric"
        | "supplies"
        | "rent"
        | "utilities"
        | "transport"
        | "salaries"
        | "other"
      garment_category:
        | "chitenge_men"
        | "chitenge_women"
        | "wedding_bride"
        | "wedding_groom"
        | "bridesmaids_groomsmen"
        | "casual_wear"
        | "formal_wear"
        | "alterations"
        | "custom_designs"
      measurement_template: "male" | "female" | "child"
      order_status:
        | "request_submitted"
        | "consultation_scheduled"
        | "measurement_taken"
        | "in_progress"
        | "ready_for_fitting"
        | "adjustments_ongoing"
        | "completed"
        | "ready_for_pickup"
      payment_status: "not_paid" | "deposit_paid" | "fully_paid"
      payment_type: "deposit" | "balance" | "full" | "refund"
      shop_order_status:
        | "new"
        | "contacted"
        | "confirmed"
        | "fulfilled"
        | "cancelled"
      stock_status: "in_stock" | "low_stock" | "out_of_stock"
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
      app_role: ["super_admin", "admin", "sub_admin", "client"],
      appointment_status: [
        "pending",
        "confirmed",
        "completed",
        "cancelled",
        "rescheduled",
      ],
      appointment_type: ["consultation", "measurement", "fitting", "pickup"],
      catalogue_status: ["active", "draft", "sold_out"],
      customer_tier: ["regular", "member"],
      expense_category: [
        "fabric",
        "supplies",
        "rent",
        "utilities",
        "transport",
        "salaries",
        "other",
      ],
      garment_category: [
        "chitenge_men",
        "chitenge_women",
        "wedding_bride",
        "wedding_groom",
        "bridesmaids_groomsmen",
        "casual_wear",
        "formal_wear",
        "alterations",
        "custom_designs",
      ],
      measurement_template: ["male", "female", "child"],
      order_status: [
        "request_submitted",
        "consultation_scheduled",
        "measurement_taken",
        "in_progress",
        "ready_for_fitting",
        "adjustments_ongoing",
        "completed",
        "ready_for_pickup",
      ],
      payment_status: ["not_paid", "deposit_paid", "fully_paid"],
      payment_type: ["deposit", "balance", "full", "refund"],
      shop_order_status: [
        "new",
        "contacted",
        "confirmed",
        "fulfilled",
        "cancelled",
      ],
      stock_status: ["in_stock", "low_stock", "out_of_stock"],
    },
  },
} as const
