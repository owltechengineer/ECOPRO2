// Auto-generated types stub — mirrors supabase/migrations/001_initial_schema.sql
// To regenerate: npx supabase gen types typescript --linked > src/lib/supabase/database.types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          avatar_url: string | null;
          settings: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          settings?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };

      activities: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          sector: string;
          business_models: string[];
          geography: string[];
          lifecycle_stage: string;
          capital_invested: number;
          weekly_time_allocated: number;
          color: string;
          icon: string | null;
          is_active: boolean;
          settings: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          sector: string;
          business_models?: string[];
          geography?: string[];
          lifecycle_stage: string;
          capital_invested?: number;
          weekly_time_allocated?: number;
          color?: string;
          icon?: string | null;
          is_active?: boolean;
          settings?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["activities"]["Insert"]>;
      };

      projects: {
        Row: {
          id: string;
          activity_id: string;
          user_id: string;
          name: string;
          description: string | null;
          methodology: string;
          status: string;
          priority: string;
          owner_id: string | null;
          start_date: string;
          end_date: string;
          actual_end_date: string | null;
          budget_estimated: number;
          budget_actual: number;
          revenue_estimated: number;
          revenue_actual: number;
          completion_pct: number;
          tags: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          activity_id: string;
          user_id: string;
          name: string;
          description?: string | null;
          methodology?: string;
          status?: string;
          priority?: string;
          owner_id?: string | null;
          start_date: string;
          end_date: string;
          actual_end_date?: string | null;
          budget_estimated?: number;
          budget_actual?: number;
          revenue_estimated?: number;
          revenue_actual?: number;
          completion_pct?: number;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["projects"]["Insert"]>;
      };

      milestones: {
        Row: {
          id: string;
          project_id: string;
          activity_id: string;
          user_id: string;
          name: string;
          description: string | null;
          due_date: string;
          reached_at: string | null;
          is_reached: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          activity_id: string;
          user_id: string;
          name: string;
          description?: string | null;
          due_date: string;
          reached_at?: string | null;
          is_reached?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["milestones"]["Insert"]>;
      };

      tasks: {
        Row: {
          id: string;
          project_id: string;
          activity_id: string;
          user_id: string;
          name: string;
          description: string | null;
          status: string;
          priority: string;
          owner: string | null;
          estimated_hours: number;
          actual_hours: number;
          start_date: string | null;
          deadline: string;
          completion_pct: number;
          dependencies: string[];
          tags: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          activity_id: string;
          user_id: string;
          name: string;
          description?: string | null;
          status?: string;
          priority?: string;
          owner?: string | null;
          estimated_hours?: number;
          actual_hours?: number;
          start_date?: string | null;
          deadline: string;
          completion_pct?: number;
          dependencies?: string[];
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["tasks"]["Insert"]>;
      };

      financial_records: {
        Row: {
          id: string;
          activity_id: string;
          project_id: string | null;
          user_id: string;
          type: string;
          category: string;
          description: string;
          amount: number;
          currency: string;
          date: string;
          is_recurring: boolean;
          recurring_interval: string | null;
          invoice_ref: string | null;
          tags: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          activity_id: string;
          project_id?: string | null;
          user_id: string;
          type: string;
          category: string;
          description: string;
          amount: number;
          currency?: string;
          date: string;
          is_recurring?: boolean;
          recurring_interval?: string | null;
          invoice_ref?: string | null;
          tags?: string[];
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["financial_records"]["Insert"]>;
      };

      forecast_scenarios: {
        Row: {
          id: string;
          activity_id: string;
          user_id: string;
          name: string;
          type: string;
          description: string | null;
          is_active: boolean;
          assumptions: Json;
          projections: Json;
          projected_revenue: number;
          projected_costs: number;
          projected_margin: number;
          projected_margin_pct: number;
          projected_roi: number;
          break_even_month: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          activity_id: string;
          user_id: string;
          name: string;
          type?: string;
          description?: string | null;
          is_active?: boolean;
          assumptions?: Json;
          projections?: Json;
          projected_revenue?: number;
          projected_costs?: number;
          projected_margin?: number;
          projected_margin_pct?: number;
          projected_roi?: number;
          break_even_month?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["forecast_scenarios"]["Insert"]>;
      };

      market_profiles: {
        Row: {
          id: string;
          activity_id: string;
          user_id: string;
          market_size_tam: number;
          market_size_sam: number;
          market_size_som: number;
          growth_rate: number;
          competitor_intensity: number;
          pricing_average: number;
          barriers_to_entry: string[];
          key_trends: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          activity_id: string;
          user_id: string;
          market_size_tam?: number;
          market_size_sam?: number;
          market_size_som?: number;
          growth_rate?: number;
          competitor_intensity?: number;
          pricing_average?: number;
          barriers_to_entry?: string[];
          key_trends?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["market_profiles"]["Insert"]>;
      };

      competitors: {
        Row: {
          id: string;
          market_profile_id: string;
          activity_id: string;
          user_id: string;
          name: string;
          market_share: number;
          strengths: string[];
          weaknesses: string[];
          pricing: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          market_profile_id: string;
          activity_id: string;
          user_id: string;
          name: string;
          market_share?: number;
          strengths?: string[];
          weaknesses?: string[];
          pricing?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["competitors"]["Insert"]>;
      };

      ai_reports: {
        Row: {
          id: string;
          activity_id: string;
          user_id: string;
          type: string;
          title: string;
          summary: string;
          insights: Json;
          recommendations: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          activity_id: string;
          user_id: string;
          type: string;
          title: string;
          summary: string;
          insights?: Json;
          recommendations?: Json;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["ai_reports"]["Insert"]>;
      };

      alerts: {
        Row: {
          id: string;
          activity_id: string;
          project_id: string | null;
          user_id: string;
          type: string;
          severity: string;
          title: string;
          message: string;
          is_read: boolean;
          action_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          activity_id: string;
          project_id?: string | null;
          user_id: string;
          type: string;
          severity: string;
          title: string;
          message: string;
          is_read?: boolean;
          action_url?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["alerts"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
