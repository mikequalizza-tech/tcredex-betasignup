export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      beta_signups: {
        Row: {
          created_at: string | null;
          email: string;
          id: string;
          name: string;
        };
        Insert: {
          created_at?: string | null;
          email: string;
          id?: string;
          name: string;
        };
        Update: {
          created_at?: string | null;
          email?: string;
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      blog_posts: {
        Row: {
          author: string;
          author_img: string | null;
          author_role: string | null;
          category: string | null;
          content: string;
          created_at: string | null;
          created_by: string | null;
          id: string;
          image_url: string | null;
          published_at: string | null;
          slug: string;
          status: string | null;
          summary: string | null;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          author?: string;
          author_img?: string | null;
          author_role?: string | null;
          category?: string | null;
          content: string;
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          image_url?: string | null;
          published_at?: string | null;
          slug: string;
          status?: string | null;
          summary?: string | null;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          author?: string;
          author_img?: string | null;
          author_role?: string | null;
          category?: string | null;
          content?: string;
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          image_url?: string | null;
          published_at?: string | null;
          slug?: string;
          status?: string | null;
          summary?: string | null;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      cde_allocations: {
        Row: {
          available_on_platform: number;
          awarded_amount: number;
          cde_id: string;
          created_at: string | null;
          deployed_amount: number | null;
          deployment_deadline: string | null;
          id: string;
          notes: string | null;
          percentage_won: number | null;
          state_code: string | null;
          type: string;
          updated_at: string | null;
          year: string;
        };
        Insert: {
          available_on_platform: number;
          awarded_amount: number;
          cde_id: string;
          created_at?: string | null;
          deployed_amount?: number | null;
          deployment_deadline?: string | null;
          id?: string;
          notes?: string | null;
          percentage_won?: number | null;
          state_code?: string | null;
          type: string;
          updated_at?: string | null;
          year: string;
        };
        Update: {
          available_on_platform?: number;
          awarded_amount?: number;
          cde_id?: string;
          created_at?: string | null;
          deployed_amount?: number | null;
          deployment_deadline?: string | null;
          id?: string;
          notes?: string | null;
          percentage_won?: number | null;
          state_code?: string | null;
          type?: string;
          updated_at?: string | null;
          year?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cde_allocations_cde_id_fkey";
            columns: ["cde_id"];
            isOneToOne: false;
            referencedRelation: "cdes";
            referencedColumns: ["id"];
          },
        ];
      };
      cdes: {
        Row: {
          address: string | null;
          average_close_time: number | null;
          certification_number: string | null;
          city: string | null;
          created_at: string | null;
          deployment_deadline: string | null;
          description: string | null;
          excluded_states: string[] | null;
          htc_experience: boolean | null;
          id: string;
          impact_priorities: string[] | null;
          lihtc_experience: boolean | null;
          logo_url: string | null;
          max_deal_size: number | null;
          max_project_cost: number | null;
          max_time_to_close: number | null;
          min_deal_size: number | null;
          min_distress_score: number | null;
          min_jobs_created: number | null;
          min_project_cost: number | null;
          mission_statement: string | null;
          native_american_focus: boolean | null;
          nmtc_experience: boolean | null;
          organization_id: string | null;
          organization_name: string | null;
          oz_experience: boolean | null;
          parent_organization: string | null;
          preferred_project_types: string[] | null;
          primary_contact_email: string | null;
          primary_contact_name: string | null;
          primary_contact_phone: string | null;
          primary_contact_title: string | null;
          primary_states: string[] | null;
          related_party_policy: string | null;
          remaining_allocation: number | null;
          require_community_benefits: boolean | null;
          require_qct: boolean | null;
          require_severely_distressed: boolean | null;
          require_shovel_ready: boolean | null;
          rural_focus: boolean | null;
          service_area_type: string | null;
          small_deal_fund: boolean | null;
          special_focus: string[] | null;
          stacked_deals_preferred: boolean | null;
          state: string | null;
          status: string | null;
          target_regions: string[] | null;
          target_sectors: string[] | null;
          total_allocation: number | null;
          total_deals_completed: number | null;
          total_qlici_deployed: number | null;
          underserved_states_focus: boolean | null;
          updated_at: string | null;
          urban_focus: boolean | null;
          website: string | null;
          year_established: number | null;
          zip_code: string | null;
        };
        Insert: {
          address?: string | null;
          average_close_time?: number | null;
          certification_number?: string | null;
          city?: string | null;
          created_at?: string | null;
          deployment_deadline?: string | null;
          description?: string | null;
          excluded_states?: string[] | null;
          htc_experience?: boolean | null;
          id?: string;
          impact_priorities?: string[] | null;
          lihtc_experience?: boolean | null;
          logo_url?: string | null;
          max_deal_size?: number | null;
          max_project_cost?: number | null;
          max_time_to_close?: number | null;
          min_deal_size?: number | null;
          min_distress_score?: number | null;
          min_jobs_created?: number | null;
          min_project_cost?: number | null;
          mission_statement?: string | null;
          native_american_focus?: boolean | null;
          nmtc_experience?: boolean | null;
          organization_id?: string | null;
          organization_name?: string | null;
          oz_experience?: boolean | null;
          parent_organization?: string | null;
          preferred_project_types?: string[] | null;
          primary_contact_email?: string | null;
          primary_contact_name?: string | null;
          primary_contact_phone?: string | null;
          primary_contact_title?: string | null;
          primary_states?: string[] | null;
          related_party_policy?: string | null;
          remaining_allocation?: number | null;
          require_community_benefits?: boolean | null;
          require_qct?: boolean | null;
          require_severely_distressed?: boolean | null;
          require_shovel_ready?: boolean | null;
          rural_focus?: boolean | null;
          service_area_type?: string | null;
          small_deal_fund?: boolean | null;
          special_focus?: string[] | null;
          stacked_deals_preferred?: boolean | null;
          state?: string | null;
          status?: string | null;
          target_regions?: string[] | null;
          target_sectors?: string[] | null;
          total_allocation?: number | null;
          total_deals_completed?: number | null;
          total_qlici_deployed?: number | null;
          underserved_states_focus?: boolean | null;
          updated_at?: string | null;
          urban_focus?: boolean | null;
          website?: string | null;
          year_established?: number | null;
          zip_code?: string | null;
        };
        Update: {
          address?: string | null;
          average_close_time?: number | null;
          certification_number?: string | null;
          city?: string | null;
          created_at?: string | null;
          deployment_deadline?: string | null;
          description?: string | null;
          excluded_states?: string[] | null;
          htc_experience?: boolean | null;
          id?: string;
          impact_priorities?: string[] | null;
          lihtc_experience?: boolean | null;
          logo_url?: string | null;
          max_deal_size?: number | null;
          max_project_cost?: number | null;
          max_time_to_close?: number | null;
          min_deal_size?: number | null;
          min_distress_score?: number | null;
          min_jobs_created?: number | null;
          min_project_cost?: number | null;
          mission_statement?: string | null;
          native_american_focus?: boolean | null;
          nmtc_experience?: boolean | null;
          organization_id?: string | null;
          organization_name?: string | null;
          oz_experience?: boolean | null;
          parent_organization?: string | null;
          preferred_project_types?: string[] | null;
          primary_contact_email?: string | null;
          primary_contact_name?: string | null;
          primary_contact_phone?: string | null;
          primary_contact_title?: string | null;
          primary_states?: string[] | null;
          related_party_policy?: string | null;
          remaining_allocation?: number | null;
          require_community_benefits?: boolean | null;
          require_qct?: boolean | null;
          require_severely_distressed?: boolean | null;
          require_shovel_ready?: boolean | null;
          rural_focus?: boolean | null;
          service_area_type?: string | null;
          small_deal_fund?: boolean | null;
          special_focus?: string[] | null;
          stacked_deals_preferred?: boolean | null;
          state?: string | null;
          status?: string | null;
          target_regions?: string[] | null;
          target_sectors?: string[] | null;
          total_allocation?: number | null;
          total_deals_completed?: number | null;
          total_qlici_deployed?: number | null;
          underserved_states_focus?: boolean | null;
          updated_at?: string | null;
          urban_focus?: boolean | null;
          website?: string | null;
          year_established?: number | null;
          zip_code?: string | null;
        };
        Relationships: [];
      };
      cdes_merged: {
        Row: {
          allocation_type: string | null;
          amount_finalized: number | null;
          amount_remaining: number | null;
          contact_email: string | null;
          contact_name: string | null;
          contact_phone: string | null;
          controlling_entity: string | null;
          created_at: string | null;
          forprofit_accepted: boolean | null;
          id: string;
          innovative_activities: string | null;
          max_deal_size: number | null;
          min_deal_size: number | null;
          min_distress_percentile: number | null;
          minority_focus: boolean | null;
          name: string;
          non_metro_commitment: number | null;
          nonprofit_preferred: boolean | null;
          organization_id: string;
          owner_occupied_preferred: boolean | null;
          predominant_financing: string | null;
          predominant_market: string | null;
          primary_states: string[] | null;
          require_severely_distressed: boolean | null;
          rural_focus: boolean | null;
          service_area: string | null;
          service_area_type: string | null;
          slug: string;
          small_deal_fund: boolean | null;
          status: string | null;
          target_sectors: string[] | null;
          total_allocation: number | null;
          updated_at: string | null;
          urban_focus: boolean | null;
          uts_focus: boolean | null;
          year: number;
        };
        Insert: {
          allocation_type?: string | null;
          amount_finalized?: number | null;
          amount_remaining?: number | null;
          contact_email?: string | null;
          contact_name?: string | null;
          contact_phone?: string | null;
          controlling_entity?: string | null;
          created_at?: string | null;
          forprofit_accepted?: boolean | null;
          id?: string;
          innovative_activities?: string | null;
          max_deal_size?: number | null;
          min_deal_size?: number | null;
          min_distress_percentile?: number | null;
          minority_focus?: boolean | null;
          name: string;
          non_metro_commitment?: number | null;
          nonprofit_preferred?: boolean | null;
          organization_id: string;
          owner_occupied_preferred?: boolean | null;
          predominant_financing?: string | null;
          predominant_market?: string | null;
          primary_states?: string[] | null;
          require_severely_distressed?: boolean | null;
          rural_focus?: boolean | null;
          service_area?: string | null;
          service_area_type?: string | null;
          slug: string;
          small_deal_fund?: boolean | null;
          status?: string | null;
          target_sectors?: string[] | null;
          total_allocation?: number | null;
          updated_at?: string | null;
          urban_focus?: boolean | null;
          uts_focus?: boolean | null;
          year: number;
        };
        Update: {
          allocation_type?: string | null;
          amount_finalized?: number | null;
          amount_remaining?: number | null;
          contact_email?: string | null;
          contact_name?: string | null;
          contact_phone?: string | null;
          controlling_entity?: string | null;
          created_at?: string | null;
          forprofit_accepted?: boolean | null;
          id?: string;
          innovative_activities?: string | null;
          max_deal_size?: number | null;
          min_deal_size?: number | null;
          min_distress_percentile?: number | null;
          minority_focus?: boolean | null;
          name?: string;
          non_metro_commitment?: number | null;
          nonprofit_preferred?: boolean | null;
          organization_id?: string;
          owner_occupied_preferred?: boolean | null;
          predominant_financing?: string | null;
          predominant_market?: string | null;
          primary_states?: string[] | null;
          require_severely_distressed?: boolean | null;
          rural_focus?: boolean | null;
          service_area?: string | null;
          service_area_type?: string | null;
          slug?: string;
          small_deal_fund?: boolean | null;
          status?: string | null;
          target_sectors?: string[] | null;
          total_allocation?: number | null;
          updated_at?: string | null;
          urban_focus?: boolean | null;
          uts_focus?: boolean | null;
          year?: number;
        };
        Relationships: [];
      };
      census_tracts_geom_backup: {
        Row: {
          geoid: string | null;
          geom: unknown;
        };
        Insert: {
          geoid?: string | null;
          geom?: unknown;
        };
        Update: {
          geoid?: string | null;
          geom?: unknown;
        };
        Relationships: [];
      };
      closing_checklist_templates: {
        Row: {
          category: string;
          conditional_on: Json | null;
          created_at: string | null;
          description: string | null;
          id: string;
          item_name: string;
          program_type: string;
          required: boolean | null;
          sort_order: number | null;
        };
        Insert: {
          category: string;
          conditional_on?: Json | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          item_name: string;
          program_type: string;
          required?: boolean | null;
          sort_order?: number | null;
        };
        Update: {
          category?: string;
          conditional_on?: Json | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          item_name?: string;
          program_type?: string;
          required?: boolean | null;
          sort_order?: number | null;
        };
        Relationships: [];
      };
      closing_room_channels: {
        Row: {
          created_at: string | null;
          deal_id: string;
          description: string | null;
          id: string;
          name: string;
          type: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          deal_id: string;
          description?: string | null;
          id?: string;
          name: string;
          type?: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          deal_id?: string;
          description?: string | null;
          id?: string;
          name?: string;
          type?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "closing_room_channels_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "deal_cards";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "closing_room_channels_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "deals";
            referencedColumns: ["id"];
          },
        ];
      };
      closing_room_messages: {
        Row: {
          content: string;
          created_at: string | null;
          deleted: boolean | null;
          file_url: string | null;
          id: string;
          room_id: string;
          room_type: string;
          sender_id: string | null;
          sender_name: string;
          sender_org_id: string | null;
          sender_org_name: string | null;
          updated_at: string | null;
        };
        Insert: {
          content: string;
          created_at?: string | null;
          deleted?: boolean | null;
          file_url?: string | null;
          id?: string;
          room_id: string;
          room_type?: string;
          sender_id?: string | null;
          sender_name: string;
          sender_org_id?: string | null;
          sender_org_name?: string | null;
          updated_at?: string | null;
        };
        Update: {
          content?: string;
          created_at?: string | null;
          deleted?: boolean | null;
          file_url?: string | null;
          id?: string;
          room_id?: string;
          room_type?: string;
          sender_id?: string | null;
          sender_name?: string;
          sender_org_id?: string | null;
          sender_org_name?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "closing_room_messages_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "closing_room_channels";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "closing_room_messages_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      closing_rooms: {
        Row: {
          actual_close_date: string | null;
          checklist_progress: Json | null;
          closed_at: string | null;
          commitment_id: string | null;
          created_at: string | null;
          deal_id: string;
          id: string;
          loi_id: string | null;
          notes: string | null;
          opened_at: string | null;
          participants: Json | null;
          status: string | null;
          target_close_date: string | null;
          updated_at: string | null;
        };
        Insert: {
          actual_close_date?: string | null;
          checklist_progress?: Json | null;
          closed_at?: string | null;
          commitment_id?: string | null;
          created_at?: string | null;
          deal_id: string;
          id?: string;
          loi_id?: string | null;
          notes?: string | null;
          opened_at?: string | null;
          participants?: Json | null;
          status?: string | null;
          target_close_date?: string | null;
          updated_at?: string | null;
        };
        Update: {
          actual_close_date?: string | null;
          checklist_progress?: Json | null;
          closed_at?: string | null;
          commitment_id?: string | null;
          created_at?: string | null;
          deal_id?: string;
          id?: string;
          loi_id?: string | null;
          notes?: string | null;
          opened_at?: string | null;
          participants?: Json | null;
          status?: string | null;
          target_close_date?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "closing_rooms_commitment_id_fkey";
            columns: ["commitment_id"];
            isOneToOne: false;
            referencedRelation: "commitments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "closing_rooms_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: true;
            referencedRelation: "deal_cards";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "closing_rooms_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: true;
            referencedRelation: "deals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "closing_rooms_loi_id_fkey";
            columns: ["loi_id"];
            isOneToOne: false;
            referencedRelation: "letters_of_intent";
            referencedColumns: ["id"];
          },
        ];
      };
      commitment_history: {
        Row: {
          changed_by: string | null;
          commitment_id: string;
          created_at: string | null;
          from_status: Database["public"]["Enums"]["commitment_status"] | null;
          id: string;
          notes: string | null;
          to_status: Database["public"]["Enums"]["commitment_status"];
        };
        Insert: {
          changed_by?: string | null;
          commitment_id: string;
          created_at?: string | null;
          from_status?: Database["public"]["Enums"]["commitment_status"] | null;
          id?: string;
          notes?: string | null;
          to_status: Database["public"]["Enums"]["commitment_status"];
        };
        Update: {
          changed_by?: string | null;
          commitment_id?: string;
          created_at?: string | null;
          from_status?: Database["public"]["Enums"]["commitment_status"] | null;
          id?: string;
          notes?: string | null;
          to_status?: Database["public"]["Enums"]["commitment_status"];
        };
        Relationships: [
          {
            foreignKeyName: "commitment_history_changed_by_fkey";
            columns: ["changed_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "commitment_history_commitment_id_fkey";
            columns: ["commitment_id"];
            isOneToOne: false;
            referencedRelation: "commitments";
            referencedColumns: ["id"];
          },
        ];
      };
      commitments: {
        Row: {
          all_accepted_at: string | null;
          cde_accepted_at: string | null;
          cde_accepted_by: string | null;
          cde_id: string | null;
          commitment_number: string | null;
          conditions: Json | null;
          cra_eligible: boolean | null;
          created_at: string | null;
          credit_rate: number | null;
          credit_type: Database["public"]["Enums"]["program_type"];
          deal_id: string;
          expected_credits: number | null;
          expires_at: string | null;
          id: string;
          investment_amount: number;
          investor_id: string;
          investor_requirements: Json | null;
          issued_at: string | null;
          issued_by: string | null;
          loi_id: string | null;
          net_benefit_to_project: number | null;
          pricing_cents_per_credit: number | null;
          rejected_at: string | null;
          rejected_by: string | null;
          rejection_reason: string | null;
          response_deadline: string | null;
          special_terms: string | null;
          sponsor_accepted_at: string | null;
          sponsor_accepted_by: string | null;
          sponsor_id: string;
          status: Database["public"]["Enums"]["commitment_status"] | null;
          target_closing_date: string | null;
          updated_at: string | null;
          withdrawn_at: string | null;
          withdrawn_by: string | null;
          withdrawn_reason: string | null;
        };
        Insert: {
          all_accepted_at?: string | null;
          cde_accepted_at?: string | null;
          cde_accepted_by?: string | null;
          cde_id?: string | null;
          commitment_number?: string | null;
          conditions?: Json | null;
          cra_eligible?: boolean | null;
          created_at?: string | null;
          credit_rate?: number | null;
          credit_type: Database["public"]["Enums"]["program_type"];
          deal_id: string;
          expected_credits?: number | null;
          expires_at?: string | null;
          id?: string;
          investment_amount: number;
          investor_id: string;
          investor_requirements?: Json | null;
          issued_at?: string | null;
          issued_by?: string | null;
          loi_id?: string | null;
          net_benefit_to_project?: number | null;
          pricing_cents_per_credit?: number | null;
          rejected_at?: string | null;
          rejected_by?: string | null;
          rejection_reason?: string | null;
          response_deadline?: string | null;
          special_terms?: string | null;
          sponsor_accepted_at?: string | null;
          sponsor_accepted_by?: string | null;
          sponsor_id: string;
          status?: Database["public"]["Enums"]["commitment_status"] | null;
          target_closing_date?: string | null;
          updated_at?: string | null;
          withdrawn_at?: string | null;
          withdrawn_by?: string | null;
          withdrawn_reason?: string | null;
        };
        Update: {
          all_accepted_at?: string | null;
          cde_accepted_at?: string | null;
          cde_accepted_by?: string | null;
          cde_id?: string | null;
          commitment_number?: string | null;
          conditions?: Json | null;
          cra_eligible?: boolean | null;
          created_at?: string | null;
          credit_rate?: number | null;
          credit_type?: Database["public"]["Enums"]["program_type"];
          deal_id?: string;
          expected_credits?: number | null;
          expires_at?: string | null;
          id?: string;
          investment_amount?: number;
          investor_id?: string;
          investor_requirements?: Json | null;
          issued_at?: string | null;
          issued_by?: string | null;
          loi_id?: string | null;
          net_benefit_to_project?: number | null;
          pricing_cents_per_credit?: number | null;
          rejected_at?: string | null;
          rejected_by?: string | null;
          rejection_reason?: string | null;
          response_deadline?: string | null;
          special_terms?: string | null;
          sponsor_accepted_at?: string | null;
          sponsor_accepted_by?: string | null;
          sponsor_id?: string;
          status?: Database["public"]["Enums"]["commitment_status"] | null;
          target_closing_date?: string | null;
          updated_at?: string | null;
          withdrawn_at?: string | null;
          withdrawn_by?: string | null;
          withdrawn_reason?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "commitments_cde_accepted_by_fkey";
            columns: ["cde_accepted_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "commitments_cde_id_fkey";
            columns: ["cde_id"];
            isOneToOne: false;
            referencedRelation: "cdes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "commitments_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "deal_cards";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "commitments_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "deals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "commitments_investor_id_fkey";
            columns: ["investor_id"];
            isOneToOne: false;
            referencedRelation: "investors";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "commitments_issued_by_fkey";
            columns: ["issued_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "commitments_loi_id_fkey";
            columns: ["loi_id"];
            isOneToOne: false;
            referencedRelation: "letters_of_intent";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "commitments_rejected_by_fkey";
            columns: ["rejected_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "commitments_sponsor_accepted_by_fkey";
            columns: ["sponsor_accepted_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "commitments_sponsor_id_fkey";
            columns: ["sponsor_id"];
            isOneToOne: false;
            referencedRelation: "sponsors";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "commitments_withdrawn_by_fkey";
            columns: ["withdrawn_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      conversation_participants: {
        Row: {
          conversation_id: string;
          id: string;
          joined_at: string | null;
          last_read_at: string | null;
          left_at: string | null;
          organization_id: string | null;
          organization_name: string | null;
          organization_type: string | null;
          role: string | null;
          unread_count: number | null;
          user_email: string | null;
          user_id: string;
          user_name: string | null;
        };
        Insert: {
          conversation_id: string;
          id?: string;
          joined_at?: string | null;
          last_read_at?: string | null;
          left_at?: string | null;
          organization_id?: string | null;
          organization_name?: string | null;
          organization_type?: string | null;
          role?: string | null;
          unread_count?: number | null;
          user_email?: string | null;
          user_id: string;
          user_name?: string | null;
        };
        Update: {
          conversation_id?: string;
          id?: string;
          joined_at?: string | null;
          last_read_at?: string | null;
          left_at?: string | null;
          organization_id?: string | null;
          organization_name?: string | null;
          organization_type?: string | null;
          role?: string | null;
          unread_count?: number | null;
          user_email?: string | null;
          user_id?: string;
          user_name?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
        ];
      };
      conversations: {
        Row: {
          category: string | null;
          created_at: string | null;
          deal_id: string | null;
          deal_name: string | null;
          id: string;
          last_message: string | null;
          last_message_at: string | null;
          last_sender_id: string | null;
          last_sender_name: string | null;
          name: string | null;
          type: string;
          updated_at: string | null;
        };
        Insert: {
          category?: string | null;
          created_at?: string | null;
          deal_id?: string | null;
          deal_name?: string | null;
          id?: string;
          last_message?: string | null;
          last_message_at?: string | null;
          last_sender_id?: string | null;
          last_sender_name?: string | null;
          name?: string | null;
          type?: string;
          updated_at?: string | null;
        };
        Update: {
          category?: string | null;
          created_at?: string | null;
          deal_id?: string | null;
          deal_name?: string | null;
          id?: string;
          last_message?: string | null;
          last_message_at?: string | null;
          last_sender_id?: string | null;
          last_sender_name?: string | null;
          name?: string | null;
          type?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "conversations_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "deal_cards";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "conversations_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "deals";
            referencedColumns: ["id"];
          },
        ];
      };
      dd_documents: {
        Row: {
          category: string;
          created_at: string | null;
          deal_id: string;
          document_id: string | null;
          expires_at: string | null;
          id: string;
          notes: string | null;
          requested_at: string | null;
          requested_by_id: string | null;
          requested_by_org: string | null;
          required: boolean | null;
          required_by: string | null;
          review_notes: string | null;
          reviewed_at: string | null;
          reviewed_by_id: string | null;
          status: string | null;
          updated_at: string | null;
          uploaded_at: string | null;
        };
        Insert: {
          category: string;
          created_at?: string | null;
          deal_id: string;
          document_id?: string | null;
          expires_at?: string | null;
          id?: string;
          notes?: string | null;
          requested_at?: string | null;
          requested_by_id?: string | null;
          requested_by_org?: string | null;
          required?: boolean | null;
          required_by?: string | null;
          review_notes?: string | null;
          reviewed_at?: string | null;
          reviewed_by_id?: string | null;
          status?: string | null;
          updated_at?: string | null;
          uploaded_at?: string | null;
        };
        Update: {
          category?: string;
          created_at?: string | null;
          deal_id?: string;
          document_id?: string | null;
          expires_at?: string | null;
          id?: string;
          notes?: string | null;
          requested_at?: string | null;
          requested_by_id?: string | null;
          requested_by_org?: string | null;
          required?: boolean | null;
          required_by?: string | null;
          review_notes?: string | null;
          reviewed_at?: string | null;
          reviewed_by_id?: string | null;
          status?: string | null;
          updated_at?: string | null;
          uploaded_at?: string | null;
        };
        Relationships: [];
      };
      dda_metro_2025: {
        Row: {
          area_name: string | null;
          cbsasub: string | null;
          created_at: string | null;
          cumulative_percent: number | null;
          cumulative_population: number | null;
          is_sdda: number | null;
          lihtc_max_rent: number | null;
          pop_over_100: number | null;
          population_2020: number | null;
          population_in_qct: number | null;
          population_not_in_qct: number | null;
          safmr_2br: number | null;
          sdda_ratio: number | null;
          vlil_4person: number | null;
          zcta: string;
        };
        Insert: {
          area_name?: string | null;
          cbsasub?: string | null;
          created_at?: string | null;
          cumulative_percent?: number | null;
          cumulative_population?: number | null;
          is_sdda?: number | null;
          lihtc_max_rent?: number | null;
          pop_over_100?: number | null;
          population_2020?: number | null;
          population_in_qct?: number | null;
          population_not_in_qct?: number | null;
          safmr_2br?: number | null;
          sdda_ratio?: number | null;
          vlil_4person?: number | null;
          zcta: string;
        };
        Update: {
          area_name?: string | null;
          cbsasub?: string | null;
          created_at?: string | null;
          cumulative_percent?: number | null;
          cumulative_population?: number | null;
          is_sdda?: number | null;
          lihtc_max_rent?: number | null;
          pop_over_100?: number | null;
          population_2020?: number | null;
          population_in_qct?: number | null;
          population_not_in_qct?: number | null;
          safmr_2br?: number | null;
          sdda_ratio?: number | null;
          vlil_4person?: number | null;
          zcta?: string;
        };
        Relationships: [];
      };
      dda_metro_2026: {
        Row: {
          area_name: string | null;
          cbsasub: string | null;
          created_at: string | null;
          cumulative_percent: number | null;
          cumulative_population: number | null;
          is_sdda: number | null;
          lihtc_max_rent: number | null;
          pop_over_100: number | null;
          population_2020: number | null;
          population_in_qct: number | null;
          population_not_in_qct: number | null;
          safmr_2br: number | null;
          sdda_ratio: number | null;
          vlil_4person: number | null;
          zcta: string;
        };
        Insert: {
          area_name?: string | null;
          cbsasub?: string | null;
          created_at?: string | null;
          cumulative_percent?: number | null;
          cumulative_population?: number | null;
          is_sdda?: number | null;
          lihtc_max_rent?: number | null;
          pop_over_100?: number | null;
          population_2020?: number | null;
          population_in_qct?: number | null;
          population_not_in_qct?: number | null;
          safmr_2br?: number | null;
          sdda_ratio?: number | null;
          vlil_4person?: number | null;
          zcta: string;
        };
        Update: {
          area_name?: string | null;
          cbsasub?: string | null;
          created_at?: string | null;
          cumulative_percent?: number | null;
          cumulative_population?: number | null;
          is_sdda?: number | null;
          lihtc_max_rent?: number | null;
          pop_over_100?: number | null;
          population_2020?: number | null;
          population_in_qct?: number | null;
          population_not_in_qct?: number | null;
          safmr_2br?: number | null;
          sdda_ratio?: number | null;
          vlil_4person?: number | null;
          zcta?: string;
        };
        Relationships: [];
      };
      dda_nonmetro_2025: {
        Row: {
          area_name: string | null;
          cbsasub: string | null;
          county_fips: string;
          created_at: string | null;
          cumulative_percent: number | null;
          cumulative_population: number | null;
          dda_ratio: number | null;
          effective_population: number | null;
          fmr_2br: number | null;
          is_nmdda: number | null;
          lihtc_max_rent: number | null;
          population_2020: number | null;
          population_in_qct: number | null;
          vlil_4person: number | null;
        };
        Insert: {
          area_name?: string | null;
          cbsasub?: string | null;
          county_fips: string;
          created_at?: string | null;
          cumulative_percent?: number | null;
          cumulative_population?: number | null;
          dda_ratio?: number | null;
          effective_population?: number | null;
          fmr_2br?: number | null;
          is_nmdda?: number | null;
          lihtc_max_rent?: number | null;
          population_2020?: number | null;
          population_in_qct?: number | null;
          vlil_4person?: number | null;
        };
        Update: {
          area_name?: string | null;
          cbsasub?: string | null;
          county_fips?: string;
          created_at?: string | null;
          cumulative_percent?: number | null;
          cumulative_population?: number | null;
          dda_ratio?: number | null;
          effective_population?: number | null;
          fmr_2br?: number | null;
          is_nmdda?: number | null;
          lihtc_max_rent?: number | null;
          population_2020?: number | null;
          population_in_qct?: number | null;
          vlil_4person?: number | null;
        };
        Relationships: [];
      };
      dda_nonmetro_2026: {
        Row: {
          area_name: string | null;
          cbsasub: string | null;
          county_fips: string;
          created_at: string | null;
          cumulative_percent: number | null;
          cumulative_population: number | null;
          dda_ratio: number | null;
          effective_population: number | null;
          fmr_2br: number | null;
          is_nmdda: number | null;
          lihtc_max_rent: number | null;
          population_2020: number | null;
          population_in_qct: number | null;
          vlil_4person: number | null;
        };
        Insert: {
          area_name?: string | null;
          cbsasub?: string | null;
          county_fips: string;
          created_at?: string | null;
          cumulative_percent?: number | null;
          cumulative_population?: number | null;
          dda_ratio?: number | null;
          effective_population?: number | null;
          fmr_2br?: number | null;
          is_nmdda?: number | null;
          lihtc_max_rent?: number | null;
          population_2020?: number | null;
          population_in_qct?: number | null;
          vlil_4person?: number | null;
        };
        Update: {
          area_name?: string | null;
          cbsasub?: string | null;
          county_fips?: string;
          created_at?: string | null;
          cumulative_percent?: number | null;
          cumulative_population?: number | null;
          dda_ratio?: number | null;
          effective_population?: number | null;
          fmr_2br?: number | null;
          is_nmdda?: number | null;
          lihtc_max_rent?: number | null;
          population_2020?: number | null;
          population_in_qct?: number | null;
          vlil_4person?: number | null;
        };
        Relationships: [];
      };
      deal_attachments: {
        Row: {
          category: string | null;
          created_at: string | null;
          deal_id: string;
          file_name: string | null;
          file_size: number | null;
          file_type: string | null;
          file_url: string;
          id: string;
          updated_at: string | null;
          uploaded_by: string | null;
        };
        Insert: {
          category?: string | null;
          created_at?: string | null;
          deal_id: string;
          file_name?: string | null;
          file_size?: number | null;
          file_type?: string | null;
          file_url: string;
          id?: string;
          updated_at?: string | null;
          uploaded_by?: string | null;
        };
        Update: {
          category?: string | null;
          created_at?: string | null;
          deal_id?: string;
          file_name?: string | null;
          file_size?: number | null;
          file_type?: string | null;
          file_url?: string;
          id?: string;
          updated_at?: string | null;
          uploaded_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "deal_attachments_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "deal_cards";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deal_attachments_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "deals";
            referencedColumns: ["id"];
          },
        ];
      };
      deal_checklists: {
        Row: {
          approved_at: string | null;
          approved_by: string | null;
          completed_at: string | null;
          completed_by: string | null;
          created_at: string | null;
          deal_id: string;
          document_id: string | null;
          due_date: string | null;
          id: string;
          notes: string | null;
          status: string | null;
          template_id: string;
          updated_at: string | null;
        };
        Insert: {
          approved_at?: string | null;
          approved_by?: string | null;
          completed_at?: string | null;
          completed_by?: string | null;
          created_at?: string | null;
          deal_id: string;
          document_id?: string | null;
          due_date?: string | null;
          id?: string;
          notes?: string | null;
          status?: string | null;
          template_id: string;
          updated_at?: string | null;
        };
        Update: {
          approved_at?: string | null;
          approved_by?: string | null;
          completed_at?: string | null;
          completed_by?: string | null;
          created_at?: string | null;
          deal_id?: string;
          document_id?: string | null;
          due_date?: string | null;
          id?: string;
          notes?: string | null;
          status?: string | null;
          template_id?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      deal_matches: {
        Row: {
          breakdown: Json | null;
          cde_id: string;
          created_at: string | null;
          deal_id: string;
          id: string;
          match_strength: string;
          reasons: string[] | null;
          score: number;
          updated_at: string | null;
        };
        Insert: {
          breakdown?: Json | null;
          cde_id: string;
          created_at?: string | null;
          deal_id: string;
          id?: string;
          match_strength?: string;
          reasons?: string[] | null;
          score?: number;
          updated_at?: string | null;
        };
        Update: {
          breakdown?: Json | null;
          cde_id?: string;
          created_at?: string | null;
          deal_id?: string;
          id?: string;
          match_strength?: string;
          reasons?: string[] | null;
          score?: number;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "deal_matches_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "deal_cards";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deal_matches_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "deals";
            referencedColumns: ["id"];
          },
        ];
      };
      deal_media: {
        Row: {
          caption: string | null;
          created_at: string | null;
          deal_id: string;
          file_name: string | null;
          file_size: number | null;
          id: string;
          media_type: string;
          order: number | null;
          updated_at: string | null;
          url: string;
        };
        Insert: {
          caption?: string | null;
          created_at?: string | null;
          deal_id: string;
          file_name?: string | null;
          file_size?: number | null;
          id?: string;
          media_type?: string;
          order?: number | null;
          updated_at?: string | null;
          url: string;
        };
        Update: {
          caption?: string | null;
          created_at?: string | null;
          deal_id?: string;
          file_name?: string | null;
          file_size?: number | null;
          id?: string;
          media_type?: string;
          order?: number | null;
          updated_at?: string | null;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: "deal_media_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "deal_cards";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deal_media_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "deals";
            referencedColumns: ["id"];
          },
        ];
      };
      deal_relationship_history: {
        Row: {
          changed_by: string | null;
          created_at: string | null;
          from_status:
            | Database["public"]["Enums"]["relationship_status"]
            | null;
          id: string;
          notes: string | null;
          relationship_id: string;
          to_status: Database["public"]["Enums"]["relationship_status"];
        };
        Insert: {
          changed_by?: string | null;
          created_at?: string | null;
          from_status?:
            | Database["public"]["Enums"]["relationship_status"]
            | null;
          id?: string;
          notes?: string | null;
          relationship_id: string;
          to_status: Database["public"]["Enums"]["relationship_status"];
        };
        Update: {
          changed_by?: string | null;
          created_at?: string | null;
          from_status?:
            | Database["public"]["Enums"]["relationship_status"]
            | null;
          id?: string;
          notes?: string | null;
          relationship_id?: string;
          to_status?: Database["public"]["Enums"]["relationship_status"];
        };
        Relationships: [
          {
            foreignKeyName: "deal_relationship_history_relationship_id_fkey";
            columns: ["relationship_id"];
            isOneToOne: false;
            referencedRelation: "deal_relationships";
            referencedColumns: ["id"];
          },
        ];
      };
      deal_relationships: {
        Row: {
          closed_at: string | null;
          commitment_id: string | null;
          committed_amount: number | null;
          committed_at: string | null;
          contacted_at: string | null;
          created_at: string | null;
          deal_id: string;
          denied_at: string | null;
          id: string;
          interested_at: string | null;
          last_contact_at: string | null;
          last_message: string | null;
          loi_accepted_at: string | null;
          loi_id: string | null;
          loi_issued_at: string | null;
          match_reasons: string[] | null;
          match_score: number | null;
          match_strength: string | null;
          next_action: string | null;
          next_action_due: string | null;
          outreach_id: string | null;
          requested_amount: number | null;
          status: Database["public"]["Enums"]["relationship_status"];
          status_note: string | null;
          target_id: string;
          target_name: string;
          target_org_id: string | null;
          target_type: string;
          updated_at: string | null;
          verbal_approval_at: string | null;
        };
        Insert: {
          closed_at?: string | null;
          commitment_id?: string | null;
          committed_amount?: number | null;
          committed_at?: string | null;
          contacted_at?: string | null;
          created_at?: string | null;
          deal_id: string;
          denied_at?: string | null;
          id?: string;
          interested_at?: string | null;
          last_contact_at?: string | null;
          last_message?: string | null;
          loi_accepted_at?: string | null;
          loi_id?: string | null;
          loi_issued_at?: string | null;
          match_reasons?: string[] | null;
          match_score?: number | null;
          match_strength?: string | null;
          next_action?: string | null;
          next_action_due?: string | null;
          outreach_id?: string | null;
          requested_amount?: number | null;
          status?: Database["public"]["Enums"]["relationship_status"];
          status_note?: string | null;
          target_id: string;
          target_name: string;
          target_org_id?: string | null;
          target_type: string;
          updated_at?: string | null;
          verbal_approval_at?: string | null;
        };
        Update: {
          closed_at?: string | null;
          commitment_id?: string | null;
          committed_amount?: number | null;
          committed_at?: string | null;
          contacted_at?: string | null;
          created_at?: string | null;
          deal_id?: string;
          denied_at?: string | null;
          id?: string;
          interested_at?: string | null;
          last_contact_at?: string | null;
          last_message?: string | null;
          loi_accepted_at?: string | null;
          loi_id?: string | null;
          loi_issued_at?: string | null;
          match_reasons?: string[] | null;
          match_score?: number | null;
          match_strength?: string | null;
          next_action?: string | null;
          next_action_due?: string | null;
          outreach_id?: string | null;
          requested_amount?: number | null;
          status?: Database["public"]["Enums"]["relationship_status"];
          status_note?: string | null;
          target_id?: string;
          target_name?: string;
          target_org_id?: string | null;
          target_type?: string;
          updated_at?: string | null;
          verbal_approval_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "deal_relationships_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "deal_cards";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deal_relationships_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "deals";
            referencedColumns: ["id"];
          },
        ];
      };
      deals: {
        Row: {
          acquisition_cost: number | null;
          address: string | null;
          affordable_housing_units: number | null;
          ai_flags: string[] | null;
          assigned_cde_id: string | null;
          assigned_cde_name: string | null;
          building_permits: string | null;
          census_tract: string | null;
          checklist: Json | null;
          city: string | null;
          closed_at: string | null;
          closing_started_at: string | null;
          commercial_sqft: number | null;
          committed_capital_pct: number | null;
          community_benefit: string | null;
          construction_cost: number | null;
          construction_drawings: string | null;
          construction_jobs_fte: number | null;
          construction_start_date: string | null;
          contingency: number | null;
          county: string | null;
          created_at: string | null;
          debt_amount: number | null;
          developer_fee: number | null;
          draft_data: Json | null;
          equity_amount: number | null;
          exclusivity_agreed: boolean | null;
          exclusivity_agreed_at: string | null;
          financing_costs: number | null;
          financing_gap: number | null;
          grant_amount: number | null;
          housing_units: number | null;
          htc_data: Json | null;
          id: string;
          intake_data: Json | null;
          investor_id: string | null;
          investor_name: string | null;
          jobs_created: number | null;
          jobs_retained: number | null;
          land_cost: number | null;
          latitude: number | null;
          longitude: number | null;
          matched_at: string | null;
          nmtc_financing_requested: number | null;
          other_amount: number | null;
          permanent_jobs_fte: number | null;
          phase: string | null;
          phase_i_environmental: string | null;
          program_level: string | null;
          programs: Database["public"]["Enums"]["program_type"][];
          project_description: string | null;
          project_name: string;
          project_type: string | null;
          projected_closing_date: string | null;
          projected_completion_date: string | null;
          qalicb_data: Json | null;
          readiness_score: number | null;
          reserves: number | null;
          scoring_breakdown: Json | null;
          site_control: string | null;
          site_control_date: string | null;
          soft_costs: number | null;
          sponsor_id: string;
          sponsor_name: string | null;
          sponsor_organization_id: string | null;
          state: string | null;
          state_program: string | null;
          status: Database["public"]["Enums"]["deal_status"] | null;
          submitted_at: string | null;
          tenant_mix: string | null;
          tier: number | null;
          total_project_cost: number | null;
          tract_classification: string | null;
          tract_eligible: boolean | null;
          tract_median_income: number | null;
          tract_poverty_rate: number | null;
          tract_severely_distressed: boolean | null;
          tract_types: string[] | null;
          tract_unemployment: number | null;
          updated_at: string | null;
          venture_type: string | null;
          visibility_level: string | null;
          visible: boolean | null;
          zip_code: string | null;
          zoning_approval: string | null;
        };
        Insert: {
          acquisition_cost?: number | null;
          address?: string | null;
          affordable_housing_units?: number | null;
          ai_flags?: string[] | null;
          assigned_cde_id?: string | null;
          assigned_cde_name?: string | null;
          building_permits?: string | null;
          census_tract?: string | null;
          checklist?: Json | null;
          city?: string | null;
          closed_at?: string | null;
          closing_started_at?: string | null;
          commercial_sqft?: number | null;
          committed_capital_pct?: number | null;
          community_benefit?: string | null;
          construction_cost?: number | null;
          construction_drawings?: string | null;
          construction_jobs_fte?: number | null;
          construction_start_date?: string | null;
          contingency?: number | null;
          county?: string | null;
          created_at?: string | null;
          debt_amount?: number | null;
          developer_fee?: number | null;
          draft_data?: Json | null;
          equity_amount?: number | null;
          exclusivity_agreed?: boolean | null;
          exclusivity_agreed_at?: string | null;
          financing_costs?: number | null;
          financing_gap?: number | null;
          grant_amount?: number | null;
          housing_units?: number | null;
          htc_data?: Json | null;
          id?: string;
          intake_data?: Json | null;
          investor_id?: string | null;
          investor_name?: string | null;
          jobs_created?: number | null;
          jobs_retained?: number | null;
          land_cost?: number | null;
          latitude?: number | null;
          longitude?: number | null;
          matched_at?: string | null;
          nmtc_financing_requested?: number | null;
          other_amount?: number | null;
          permanent_jobs_fte?: number | null;
          phase?: string | null;
          phase_i_environmental?: string | null;
          program_level?: string | null;
          programs?: Database["public"]["Enums"]["program_type"][];
          project_description?: string | null;
          project_name: string;
          project_type?: string | null;
          projected_closing_date?: string | null;
          projected_completion_date?: string | null;
          qalicb_data?: Json | null;
          readiness_score?: number | null;
          reserves?: number | null;
          scoring_breakdown?: Json | null;
          site_control?: string | null;
          site_control_date?: string | null;
          soft_costs?: number | null;
          sponsor_id: string;
          sponsor_name?: string | null;
          sponsor_organization_id?: string | null;
          state?: string | null;
          state_program?: string | null;
          status?: Database["public"]["Enums"]["deal_status"] | null;
          submitted_at?: string | null;
          tenant_mix?: string | null;
          tier?: number | null;
          total_project_cost?: number | null;
          tract_classification?: string | null;
          tract_eligible?: boolean | null;
          tract_median_income?: number | null;
          tract_poverty_rate?: number | null;
          tract_severely_distressed?: boolean | null;
          tract_types?: string[] | null;
          tract_unemployment?: number | null;
          updated_at?: string | null;
          venture_type?: string | null;
          visibility_level?: string | null;
          visible?: boolean | null;
          zip_code?: string | null;
          zoning_approval?: string | null;
        };
        Update: {
          acquisition_cost?: number | null;
          address?: string | null;
          affordable_housing_units?: number | null;
          ai_flags?: string[] | null;
          assigned_cde_id?: string | null;
          assigned_cde_name?: string | null;
          building_permits?: string | null;
          census_tract?: string | null;
          checklist?: Json | null;
          city?: string | null;
          closed_at?: string | null;
          closing_started_at?: string | null;
          commercial_sqft?: number | null;
          committed_capital_pct?: number | null;
          community_benefit?: string | null;
          construction_cost?: number | null;
          construction_drawings?: string | null;
          construction_jobs_fte?: number | null;
          construction_start_date?: string | null;
          contingency?: number | null;
          county?: string | null;
          created_at?: string | null;
          debt_amount?: number | null;
          developer_fee?: number | null;
          draft_data?: Json | null;
          equity_amount?: number | null;
          exclusivity_agreed?: boolean | null;
          exclusivity_agreed_at?: string | null;
          financing_costs?: number | null;
          financing_gap?: number | null;
          grant_amount?: number | null;
          housing_units?: number | null;
          htc_data?: Json | null;
          id?: string;
          intake_data?: Json | null;
          investor_id?: string | null;
          investor_name?: string | null;
          jobs_created?: number | null;
          jobs_retained?: number | null;
          land_cost?: number | null;
          latitude?: number | null;
          longitude?: number | null;
          matched_at?: string | null;
          nmtc_financing_requested?: number | null;
          other_amount?: number | null;
          permanent_jobs_fte?: number | null;
          phase?: string | null;
          phase_i_environmental?: string | null;
          program_level?: string | null;
          programs?: Database["public"]["Enums"]["program_type"][];
          project_description?: string | null;
          project_name?: string;
          project_type?: string | null;
          projected_closing_date?: string | null;
          projected_completion_date?: string | null;
          qalicb_data?: Json | null;
          readiness_score?: number | null;
          reserves?: number | null;
          scoring_breakdown?: Json | null;
          site_control?: string | null;
          site_control_date?: string | null;
          soft_costs?: number | null;
          sponsor_id?: string;
          sponsor_name?: string | null;
          sponsor_organization_id?: string | null;
          state?: string | null;
          state_program?: string | null;
          status?: Database["public"]["Enums"]["deal_status"] | null;
          submitted_at?: string | null;
          tenant_mix?: string | null;
          tier?: number | null;
          total_project_cost?: number | null;
          tract_classification?: string | null;
          tract_eligible?: boolean | null;
          tract_median_income?: number | null;
          tract_poverty_rate?: number | null;
          tract_severely_distressed?: boolean | null;
          tract_types?: string[] | null;
          tract_unemployment?: number | null;
          updated_at?: string | null;
          venture_type?: string | null;
          visibility_level?: string | null;
          visible?: boolean | null;
          zip_code?: string | null;
          zoning_approval?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "deals_assigned_cde_id_fkey";
            columns: ["assigned_cde_id"];
            isOneToOne: false;
            referencedRelation: "cdes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deals_investor_id_fkey";
            columns: ["investor_id"];
            isOneToOne: false;
            referencedRelation: "investors";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deals_sponsor_id_fkey";
            columns: ["sponsor_id"];
            isOneToOne: false;
            referencedRelation: "sponsors";
            referencedColumns: ["id"];
          },
        ];
      };
      discord_channels: {
        Row: {
          created_at: string | null;
          created_by: string;
          description: string | null;
          id: string;
          is_private: boolean | null;
          name: string;
          server_id: string;
          type: Database["public"]["Enums"]["discord_channel_type"];
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          created_by: string;
          description?: string | null;
          id?: string;
          is_private?: boolean | null;
          name: string;
          server_id: string;
          type?: Database["public"]["Enums"]["discord_channel_type"];
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          created_by?: string;
          description?: string | null;
          id?: string;
          is_private?: boolean | null;
          name?: string;
          server_id?: string;
          type?: Database["public"]["Enums"]["discord_channel_type"];
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "discord_channels_server_id_fkey";
            columns: ["server_id"];
            isOneToOne: false;
            referencedRelation: "discord_servers";
            referencedColumns: ["id"];
          },
        ];
      };
      discord_conversations: {
        Row: {
          created_at: string | null;
          id: string;
          member_one_id: string;
          member_two_id: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          member_one_id: string;
          member_two_id: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          member_one_id?: string;
          member_two_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "discord_conversations_member_one_id_fkey";
            columns: ["member_one_id"];
            isOneToOne: false;
            referencedRelation: "discord_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "discord_conversations_member_two_id_fkey";
            columns: ["member_two_id"];
            isOneToOne: false;
            referencedRelation: "discord_members";
            referencedColumns: ["id"];
          },
        ];
      };
      discord_direct_messages: {
        Row: {
          content: string;
          conversation_id: string;
          created_at: string | null;
          deleted: boolean | null;
          edited: boolean | null;
          file_name: string | null;
          file_type: string | null;
          file_url: string | null;
          id: string;
          member_id: string;
          updated_at: string | null;
        };
        Insert: {
          content: string;
          conversation_id: string;
          created_at?: string | null;
          deleted?: boolean | null;
          edited?: boolean | null;
          file_name?: string | null;
          file_type?: string | null;
          file_url?: string | null;
          id?: string;
          member_id: string;
          updated_at?: string | null;
        };
        Update: {
          content?: string;
          conversation_id?: string;
          created_at?: string | null;
          deleted?: boolean | null;
          edited?: boolean | null;
          file_name?: string | null;
          file_type?: string | null;
          file_url?: string | null;
          id?: string;
          member_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "discord_direct_messages_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "discord_conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "discord_direct_messages_member_id_fkey";
            columns: ["member_id"];
            isOneToOne: false;
            referencedRelation: "discord_members";
            referencedColumns: ["id"];
          },
        ];
      };
      discord_members: {
        Row: {
          created_at: string | null;
          id: string;
          role: Database["public"]["Enums"]["discord_member_role"];
          server_id: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          role?: Database["public"]["Enums"]["discord_member_role"];
          server_id: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          role?: Database["public"]["Enums"]["discord_member_role"];
          server_id?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "discord_members_server_id_fkey";
            columns: ["server_id"];
            isOneToOne: false;
            referencedRelation: "discord_servers";
            referencedColumns: ["id"];
          },
        ];
      };
      discord_messages: {
        Row: {
          channel_id: string;
          content: string;
          created_at: string | null;
          deleted: boolean | null;
          edited: boolean | null;
          file_name: string | null;
          file_type: string | null;
          file_url: string | null;
          id: string;
          member_id: string;
          updated_at: string | null;
        };
        Insert: {
          channel_id: string;
          content: string;
          created_at?: string | null;
          deleted?: boolean | null;
          edited?: boolean | null;
          file_name?: string | null;
          file_type?: string | null;
          file_url?: string | null;
          id?: string;
          member_id: string;
          updated_at?: string | null;
        };
        Update: {
          channel_id?: string;
          content?: string;
          created_at?: string | null;
          deleted?: boolean | null;
          edited?: boolean | null;
          file_name?: string | null;
          file_type?: string | null;
          file_url?: string | null;
          id?: string;
          member_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "discord_messages_channel_id_fkey";
            columns: ["channel_id"];
            isOneToOne: false;
            referencedRelation: "discord_channels";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "discord_messages_member_id_fkey";
            columns: ["member_id"];
            isOneToOne: false;
            referencedRelation: "discord_members";
            referencedColumns: ["id"];
          },
        ];
      };
      discord_servers: {
        Row: {
          created_at: string | null;
          deal_id: string | null;
          id: string;
          image_url: string | null;
          invite_code: string;
          name: string;
          organization_id: string | null;
          owner_id: string;
          server_type: Database["public"]["Enums"]["discord_server_type"];
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          deal_id?: string | null;
          id?: string;
          image_url?: string | null;
          invite_code: string;
          name: string;
          organization_id?: string | null;
          owner_id: string;
          server_type?: Database["public"]["Enums"]["discord_server_type"];
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          deal_id?: string | null;
          id?: string;
          image_url?: string | null;
          invite_code?: string;
          name?: string;
          organization_id?: string | null;
          owner_id?: string;
          server_type?: Database["public"]["Enums"]["discord_server_type"];
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "discord_servers_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "deal_cards";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "discord_servers_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "deals";
            referencedColumns: ["id"];
          },
        ];
      };
      documents: {
        Row: {
          ai_flags: string[] | null;
          ai_summary: string | null;
          category: string | null;
          closing_room_id: string | null;
          content_hash: string | null;
          created_at: string | null;
          deal_id: string | null;
          file_size: number | null;
          file_url: string;
          id: string;
          mime_type: string | null;
          name: string;
          organization_id: string | null;
          parent_document_id: string | null;
          review_notes: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          status: Database["public"]["Enums"]["document_status"] | null;
          tags: string[] | null;
          updated_at: string | null;
          uploaded_by: string | null;
          version: number | null;
        };
        Insert: {
          ai_flags?: string[] | null;
          ai_summary?: string | null;
          category?: string | null;
          closing_room_id?: string | null;
          content_hash?: string | null;
          created_at?: string | null;
          deal_id?: string | null;
          file_size?: number | null;
          file_url: string;
          id?: string;
          mime_type?: string | null;
          name: string;
          organization_id?: string | null;
          parent_document_id?: string | null;
          review_notes?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: Database["public"]["Enums"]["document_status"] | null;
          tags?: string[] | null;
          updated_at?: string | null;
          uploaded_by?: string | null;
          version?: number | null;
        };
        Update: {
          ai_flags?: string[] | null;
          ai_summary?: string | null;
          category?: string | null;
          closing_room_id?: string | null;
          content_hash?: string | null;
          created_at?: string | null;
          deal_id?: string | null;
          file_size?: number | null;
          file_url?: string;
          id?: string;
          mime_type?: string | null;
          name?: string;
          organization_id?: string | null;
          parent_document_id?: string | null;
          review_notes?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: Database["public"]["Enums"]["document_status"] | null;
          tags?: string[] | null;
          updated_at?: string | null;
          uploaded_by?: string | null;
          version?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "documents_closing_room_id_fkey";
            columns: ["closing_room_id"];
            isOneToOne: false;
            referencedRelation: "closing_rooms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "documents_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "deal_cards";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "documents_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "deals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "documents_parent_document_id_fkey";
            columns: ["parent_document_id"];
            isOneToOne: false;
            referencedRelation: "documents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "documents_reviewed_by_fkey";
            columns: ["reviewed_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey";
            columns: ["uploaded_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      historic_buildings: {
        Row: {
          acreage: number | null;
          address: string | null;
          area_of_significance: string | null;
          category: string | null;
          city: string | null;
          county: string | null;
          created_at: string | null;
          external_link: string | null;
          id: number;
          is_htc_eligible: boolean | null;
          is_nhl: boolean | null;
          latitude: number | null;
          listed_date: string | null;
          longitude: number | null;
          multiple_property_listing: string | null;
          nhl_designated_date: string | null;
          other_names: string | null;
          park_name: string | null;
          periods_of_significance: string | null;
          prefix: string | null;
          property_id: string | null;
          property_name: string;
          ref_number: string | null;
          request_type: string | null;
          restricted_address: boolean | null;
          significance_international: boolean | null;
          significance_local: boolean | null;
          significance_national: boolean | null;
          significance_not_indicated: boolean | null;
          significance_state: boolean | null;
          state: string | null;
          state_abbr: string | null;
          status: string | null;
          street_address: string | null;
          zip_code: string | null;
        };
        Insert: {
          acreage?: number | null;
          address?: string | null;
          area_of_significance?: string | null;
          category?: string | null;
          city?: string | null;
          county?: string | null;
          created_at?: string | null;
          external_link?: string | null;
          id?: number;
          is_htc_eligible?: boolean | null;
          is_nhl?: boolean | null;
          latitude?: number | null;
          listed_date?: string | null;
          longitude?: number | null;
          multiple_property_listing?: string | null;
          nhl_designated_date?: string | null;
          other_names?: string | null;
          park_name?: string | null;
          periods_of_significance?: string | null;
          prefix?: string | null;
          property_id?: string | null;
          property_name: string;
          ref_number?: string | null;
          request_type?: string | null;
          restricted_address?: boolean | null;
          significance_international?: boolean | null;
          significance_local?: boolean | null;
          significance_national?: boolean | null;
          significance_not_indicated?: boolean | null;
          significance_state?: boolean | null;
          state?: string | null;
          state_abbr?: string | null;
          status?: string | null;
          street_address?: string | null;
          zip_code?: string | null;
        };
        Update: {
          acreage?: number | null;
          address?: string | null;
          area_of_significance?: string | null;
          category?: string | null;
          city?: string | null;
          county?: string | null;
          created_at?: string | null;
          external_link?: string | null;
          id?: number;
          is_htc_eligible?: boolean | null;
          is_nhl?: boolean | null;
          latitude?: number | null;
          listed_date?: string | null;
          longitude?: number | null;
          multiple_property_listing?: string | null;
          nhl_designated_date?: string | null;
          other_names?: string | null;
          park_name?: string | null;
          periods_of_significance?: string | null;
          prefix?: string | null;
          property_id?: string | null;
          property_name?: string;
          ref_number?: string | null;
          request_type?: string | null;
          restricted_address?: boolean | null;
          significance_international?: boolean | null;
          significance_local?: boolean | null;
          significance_national?: boolean | null;
          significance_not_indicated?: boolean | null;
          significance_state?: boolean | null;
          state?: string | null;
          state_abbr?: string | null;
          status?: string | null;
          street_address?: string | null;
          zip_code?: string | null;
        };
        Relationships: [];
      };
      hoa_data: {
        Row: {
          county: string | null;
          ct_duplicate: number | null;
          dda_flag: number | null;
          fips11: string | null;
          geoid: string;
          high_opp: number | null;
          msa23: string | null;
          qap_flag: number | null;
          state: string | null;
          tract: string | null;
        };
        Insert: {
          county?: string | null;
          ct_duplicate?: number | null;
          dda_flag?: number | null;
          fips11?: string | null;
          geoid: string;
          high_opp?: number | null;
          msa23?: string | null;
          qap_flag?: number | null;
          state?: string | null;
          tract?: string | null;
        };
        Update: {
          county?: string | null;
          ct_duplicate?: number | null;
          dda_flag?: number | null;
          fips11?: string | null;
          geoid?: string;
          high_opp?: number | null;
          msa23?: string | null;
          qap_flag?: number | null;
          state?: string | null;
          tract?: string | null;
        };
        Relationships: [];
      };
      investors: {
        Row: {
          accredited: boolean | null;
          address: string | null;
          city: string | null;
          cra_motivated: boolean | null;
          created_at: string | null;
          description: string | null;
          id: string;
          investor_type: string | null;
          logo_url: string | null;
          max_investment: number | null;
          min_investment: number | null;
          organization_id: string | null;
          organization_name: string | null;
          primary_contact_email: string | null;
          primary_contact_name: string | null;
          primary_contact_phone: string | null;
          state: string | null;
          target_credit_types:
            | Database["public"]["Enums"]["program_type"][]
            | null;
          target_sectors: string[] | null;
          target_states: string[] | null;
          total_invested: number | null;
          total_investments: number | null;
          updated_at: string | null;
          verified_at: string | null;
          website: string | null;
          year_founded: number | null;
          zip_code: string | null;
        };
        Insert: {
          accredited?: boolean | null;
          address?: string | null;
          city?: string | null;
          cra_motivated?: boolean | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          investor_type?: string | null;
          logo_url?: string | null;
          max_investment?: number | null;
          min_investment?: number | null;
          organization_id?: string | null;
          organization_name?: string | null;
          primary_contact_email?: string | null;
          primary_contact_name?: string | null;
          primary_contact_phone?: string | null;
          state?: string | null;
          target_credit_types?:
            | Database["public"]["Enums"]["program_type"][]
            | null;
          target_sectors?: string[] | null;
          target_states?: string[] | null;
          total_invested?: number | null;
          total_investments?: number | null;
          updated_at?: string | null;
          verified_at?: string | null;
          website?: string | null;
          year_founded?: number | null;
          zip_code?: string | null;
        };
        Update: {
          accredited?: boolean | null;
          address?: string | null;
          city?: string | null;
          cra_motivated?: boolean | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          investor_type?: string | null;
          logo_url?: string | null;
          max_investment?: number | null;
          min_investment?: number | null;
          organization_id?: string | null;
          organization_name?: string | null;
          primary_contact_email?: string | null;
          primary_contact_name?: string | null;
          primary_contact_phone?: string | null;
          state?: string | null;
          target_credit_types?:
            | Database["public"]["Enums"]["program_type"][]
            | null;
          target_sectors?: string[] | null;
          target_states?: string[] | null;
          total_invested?: number | null;
          total_investments?: number | null;
          updated_at?: string | null;
          verified_at?: string | null;
          website?: string | null;
          year_founded?: number | null;
          zip_code?: string | null;
        };
        Relationships: [];
      };
      knowledge_chunks: {
        Row: {
          content: string;
          created_at: string | null;
          document_id: string | null;
          embedding: string | null;
          id: string;
          metadata: Json | null;
        };
        Insert: {
          content: string;
          created_at?: string | null;
          document_id?: string | null;
          embedding?: string | null;
          id?: string;
          metadata?: Json | null;
        };
        Update: {
          content?: string;
          created_at?: string | null;
          document_id?: string | null;
          embedding?: string | null;
          id?: string;
          metadata?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "knowledge_chunks_document_id_fkey";
            columns: ["document_id"];
            isOneToOne: false;
            referencedRelation: "knowledge_documents";
            referencedColumns: ["id"];
          },
        ];
      };
      knowledge_documents: {
        Row: {
          category: string;
          checksum: string | null;
          filename: string;
          id: string;
          page_count: number | null;
          program: string | null;
          source: string | null;
          title: string | null;
          uploaded_at: string | null;
          uploaded_by: string | null;
        };
        Insert: {
          category: string;
          checksum?: string | null;
          filename: string;
          id?: string;
          page_count?: number | null;
          program?: string | null;
          source?: string | null;
          title?: string | null;
          uploaded_at?: string | null;
          uploaded_by?: string | null;
        };
        Update: {
          category?: string;
          checksum?: string | null;
          filename?: string;
          id?: string;
          page_count?: number | null;
          program?: string | null;
          source?: string | null;
          title?: string | null;
          uploaded_at?: string | null;
          uploaded_by?: string | null;
        };
        Relationships: [];
      };
      ledger_anchors: {
        Row: {
          anchor_type: string;
          anchored_at: string | null;
          anchored_hash: string;
          external_reference: string | null;
          id: number;
          ledger_event_id: number;
          metadata: Json | null;
          verified: boolean | null;
          verified_at: string | null;
        };
        Insert: {
          anchor_type: string;
          anchored_at?: string | null;
          anchored_hash: string;
          external_reference?: string | null;
          id?: number;
          ledger_event_id: number;
          metadata?: Json | null;
          verified?: boolean | null;
          verified_at?: string | null;
        };
        Update: {
          anchor_type?: string;
          anchored_at?: string | null;
          anchored_hash?: string;
          external_reference?: string | null;
          id?: number;
          ledger_event_id?: number;
          metadata?: Json | null;
          verified?: boolean | null;
          verified_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "ledger_anchors_ledger_event_id_fkey";
            columns: ["ledger_event_id"];
            isOneToOne: false;
            referencedRelation: "ledger_events";
            referencedColumns: ["id"];
          },
        ];
      };
      ledger_events: {
        Row: {
          action: string;
          actor_id: string;
          actor_type: Database["public"]["Enums"]["ledger_actor_type"];
          created_at: string | null;
          entity_id: string;
          entity_type: string;
          event_timestamp: string | null;
          hash: string;
          id: number;
          model_version: string | null;
          payload_json: Json | null;
          prev_hash: string | null;
          reason_codes: Json | null;
          sig: string | null;
        };
        Insert: {
          action: string;
          actor_id: string;
          actor_type: Database["public"]["Enums"]["ledger_actor_type"];
          created_at?: string | null;
          entity_id: string;
          entity_type: string;
          event_timestamp?: string | null;
          hash: string;
          id?: number;
          model_version?: string | null;
          payload_json?: Json | null;
          prev_hash?: string | null;
          reason_codes?: Json | null;
          sig?: string | null;
        };
        Update: {
          action?: string;
          actor_id?: string;
          actor_type?: Database["public"]["Enums"]["ledger_actor_type"];
          created_at?: string | null;
          entity_id?: string;
          entity_type?: string;
          event_timestamp?: string | null;
          hash?: string;
          id?: number;
          model_version?: string | null;
          payload_json?: Json | null;
          prev_hash?: string | null;
          reason_codes?: Json | null;
          sig?: string | null;
        };
        Relationships: [];
      };
      ledger_verifications: {
        Row: {
          anchor_matched: boolean | null;
          chain_valid: boolean;
          completed_at: string | null;
          end_event_id: number | null;
          events_checked: number;
          id: number;
          issues: Json | null;
          requested_by: string | null;
          signatures_valid: boolean | null;
          start_event_id: number | null;
          started_at: string | null;
        };
        Insert: {
          anchor_matched?: boolean | null;
          chain_valid: boolean;
          completed_at?: string | null;
          end_event_id?: number | null;
          events_checked: number;
          id?: number;
          issues?: Json | null;
          requested_by?: string | null;
          signatures_valid?: boolean | null;
          start_event_id?: number | null;
          started_at?: string | null;
        };
        Update: {
          anchor_matched?: boolean | null;
          chain_valid?: boolean;
          completed_at?: string | null;
          end_event_id?: number | null;
          events_checked?: number;
          id?: number;
          issues?: Json | null;
          requested_by?: string | null;
          signatures_valid?: boolean | null;
          start_event_id?: number | null;
          started_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "ledger_verifications_end_event_id_fkey";
            columns: ["end_event_id"];
            isOneToOne: false;
            referencedRelation: "ledger_events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ledger_verifications_start_event_id_fkey";
            columns: ["start_event_id"];
            isOneToOne: false;
            referencedRelation: "ledger_events";
            referencedColumns: ["id"];
          },
        ];
      };
      letters_of_intent: {
        Row: {
          allocation_amount: number;
          cde_id: string;
          cde_requirements: Json | null;
          conditions: Json | null;
          counter_terms: Json | null;
          created_at: string | null;
          deal_id: string;
          expected_closing_date: string | null;
          expires_at: string | null;
          id: string;
          issued_at: string | null;
          issued_by: string | null;
          leverage_structure: string | null;
          loi_number: string | null;
          qlici_rate: number | null;
          special_terms: string | null;
          sponsor_id: string;
          sponsor_response_at: string | null;
          sponsor_response_deadline: string | null;
          sponsor_response_notes: string | null;
          status: Database["public"]["Enums"]["loi_status"] | null;
          superseded_by: string | null;
          term_years: number | null;
          updated_at: string | null;
          withdrawn_at: string | null;
          withdrawn_by: string | null;
          withdrawn_reason: string | null;
        };
        Insert: {
          allocation_amount: number;
          cde_id: string;
          cde_requirements?: Json | null;
          conditions?: Json | null;
          counter_terms?: Json | null;
          created_at?: string | null;
          deal_id: string;
          expected_closing_date?: string | null;
          expires_at?: string | null;
          id?: string;
          issued_at?: string | null;
          issued_by?: string | null;
          leverage_structure?: string | null;
          loi_number?: string | null;
          qlici_rate?: number | null;
          special_terms?: string | null;
          sponsor_id: string;
          sponsor_response_at?: string | null;
          sponsor_response_deadline?: string | null;
          sponsor_response_notes?: string | null;
          status?: Database["public"]["Enums"]["loi_status"] | null;
          superseded_by?: string | null;
          term_years?: number | null;
          updated_at?: string | null;
          withdrawn_at?: string | null;
          withdrawn_by?: string | null;
          withdrawn_reason?: string | null;
        };
        Update: {
          allocation_amount?: number;
          cde_id?: string;
          cde_requirements?: Json | null;
          conditions?: Json | null;
          counter_terms?: Json | null;
          created_at?: string | null;
          deal_id?: string;
          expected_closing_date?: string | null;
          expires_at?: string | null;
          id?: string;
          issued_at?: string | null;
          issued_by?: string | null;
          leverage_structure?: string | null;
          loi_number?: string | null;
          qlici_rate?: number | null;
          special_terms?: string | null;
          sponsor_id?: string;
          sponsor_response_at?: string | null;
          sponsor_response_deadline?: string | null;
          sponsor_response_notes?: string | null;
          status?: Database["public"]["Enums"]["loi_status"] | null;
          superseded_by?: string | null;
          term_years?: number | null;
          updated_at?: string | null;
          withdrawn_at?: string | null;
          withdrawn_by?: string | null;
          withdrawn_reason?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "letters_of_intent_cde_id_fkey";
            columns: ["cde_id"];
            isOneToOne: false;
            referencedRelation: "cdes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "letters_of_intent_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "deal_cards";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "letters_of_intent_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "deals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "letters_of_intent_issued_by_fkey";
            columns: ["issued_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "letters_of_intent_sponsor_id_fkey";
            columns: ["sponsor_id"];
            isOneToOne: false;
            referencedRelation: "sponsors";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "letters_of_intent_superseded_by_fkey";
            columns: ["superseded_by"];
            isOneToOne: false;
            referencedRelation: "letters_of_intent";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "letters_of_intent_withdrawn_by_fkey";
            columns: ["withdrawn_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      lihtc_qct_2025: {
        Row: {
          adj_inc_lim_20: string | null;
          adj_inc_lim_21: string | null;
          adj_inc_lim_22: string | null;
          Area_Pop: string | null;
          AvgHHSize: string | null;
          B17001est1_20: string | null;
          B17001est1_21: string | null;
          B17001est1_22: string | null;
          B17001est2_20: string | null;
          B17001est2_21: string | null;
          B17001est2_22: string | null;
          B17001me1_20: string | null;
          B17001me1_21: string | null;
          B17001me1_22: string | null;
          B17001me2_20: string | null;
          B17001me2_21: string | null;
          B17001me2_22: string | null;
          B19013est1_20: string | null;
          B19013est1_21: string | null;
          B19013est1_22: string | null;
          B19013me1_20: string | null;
          B19013me1_21: string | null;
          B19013me1_22: string | null;
          cbsa: string | null;
          cbsasub24: string | null;
          county: string | null;
          geoid: string;
          H1: string | null;
          inc_factor_20: string | null;
          inc_factor_21: string | null;
          inc_factor_22: string | null;
          metro: string | null;
          P1: string | null;
          P5: string | null;
          pov_rate_20: string | null;
          pov_rate_21: string | null;
          pov_rate_22: string | null;
          qct: string | null;
          qct_id: string | null;
          split_tr: string | null;
          state: string | null;
          stcnty: string | null;
          tract: string | null;
          VLIL4_2020: string | null;
          VLIL4_2021: string | null;
          VLIL4_2022: string | null;
        };
        Insert: {
          adj_inc_lim_20?: string | null;
          adj_inc_lim_21?: string | null;
          adj_inc_lim_22?: string | null;
          Area_Pop?: string | null;
          AvgHHSize?: string | null;
          B17001est1_20?: string | null;
          B17001est1_21?: string | null;
          B17001est1_22?: string | null;
          B17001est2_20?: string | null;
          B17001est2_21?: string | null;
          B17001est2_22?: string | null;
          B17001me1_20?: string | null;
          B17001me1_21?: string | null;
          B17001me1_22?: string | null;
          B17001me2_20?: string | null;
          B17001me2_21?: string | null;
          B17001me2_22?: string | null;
          B19013est1_20?: string | null;
          B19013est1_21?: string | null;
          B19013est1_22?: string | null;
          B19013me1_20?: string | null;
          B19013me1_21?: string | null;
          B19013me1_22?: string | null;
          cbsa?: string | null;
          cbsasub24?: string | null;
          county?: string | null;
          geoid: string;
          H1?: string | null;
          inc_factor_20?: string | null;
          inc_factor_21?: string | null;
          inc_factor_22?: string | null;
          metro?: string | null;
          P1?: string | null;
          P5?: string | null;
          pov_rate_20?: string | null;
          pov_rate_21?: string | null;
          pov_rate_22?: string | null;
          qct?: string | null;
          qct_id?: string | null;
          split_tr?: string | null;
          state?: string | null;
          stcnty?: string | null;
          tract?: string | null;
          VLIL4_2020?: string | null;
          VLIL4_2021?: string | null;
          VLIL4_2022?: string | null;
        };
        Update: {
          adj_inc_lim_20?: string | null;
          adj_inc_lim_21?: string | null;
          adj_inc_lim_22?: string | null;
          Area_Pop?: string | null;
          AvgHHSize?: string | null;
          B17001est1_20?: string | null;
          B17001est1_21?: string | null;
          B17001est1_22?: string | null;
          B17001est2_20?: string | null;
          B17001est2_21?: string | null;
          B17001est2_22?: string | null;
          B17001me1_20?: string | null;
          B17001me1_21?: string | null;
          B17001me1_22?: string | null;
          B17001me2_20?: string | null;
          B17001me2_21?: string | null;
          B17001me2_22?: string | null;
          B19013est1_20?: string | null;
          B19013est1_21?: string | null;
          B19013est1_22?: string | null;
          B19013me1_20?: string | null;
          B19013me1_21?: string | null;
          B19013me1_22?: string | null;
          cbsa?: string | null;
          cbsasub24?: string | null;
          county?: string | null;
          geoid?: string;
          H1?: string | null;
          inc_factor_20?: string | null;
          inc_factor_21?: string | null;
          inc_factor_22?: string | null;
          metro?: string | null;
          P1?: string | null;
          P5?: string | null;
          pov_rate_20?: string | null;
          pov_rate_21?: string | null;
          pov_rate_22?: string | null;
          qct?: string | null;
          qct_id?: string | null;
          split_tr?: string | null;
          state?: string | null;
          stcnty?: string | null;
          tract?: string | null;
          VLIL4_2020?: string | null;
          VLIL4_2021?: string | null;
          VLIL4_2022?: string | null;
        };
        Relationships: [];
      };
      lihtc_qct_2026: {
        Row: {
          county: string | null;
          geoid: string;
          is_qct: boolean | null;
          metro: string | null;
          pov_rate_21: string | null;
          pov_rate_22: string | null;
          pov_rate_23: string | null;
          state: string | null;
          stcnty: string | null;
          tract: string | null;
        };
        Insert: {
          county?: string | null;
          geoid: string;
          is_qct?: boolean | null;
          metro?: string | null;
          pov_rate_21?: string | null;
          pov_rate_22?: string | null;
          pov_rate_23?: string | null;
          state?: string | null;
          stcnty?: string | null;
          tract?: string | null;
        };
        Update: {
          county?: string | null;
          geoid?: string;
          is_qct?: boolean | null;
          metro?: string | null;
          pov_rate_21?: string | null;
          pov_rate_22?: string | null;
          pov_rate_23?: string | null;
          state?: string | null;
          stcnty?: string | null;
          tract?: string | null;
        };
        Relationships: [];
      };
      loi_history: {
        Row: {
          changed_by: string | null;
          created_at: string | null;
          from_status: Database["public"]["Enums"]["loi_status"] | null;
          id: string;
          loi_id: string;
          notes: string | null;
          to_status: Database["public"]["Enums"]["loi_status"];
        };
        Insert: {
          changed_by?: string | null;
          created_at?: string | null;
          from_status?: Database["public"]["Enums"]["loi_status"] | null;
          id?: string;
          loi_id: string;
          notes?: string | null;
          to_status: Database["public"]["Enums"]["loi_status"];
        };
        Update: {
          changed_by?: string | null;
          created_at?: string | null;
          from_status?: Database["public"]["Enums"]["loi_status"] | null;
          id?: string;
          loi_id?: string;
          notes?: string | null;
          to_status?: Database["public"]["Enums"]["loi_status"];
        };
        Relationships: [
          {
            foreignKeyName: "loi_history_changed_by_fkey";
            columns: ["changed_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "loi_history_loi_id_fkey";
            columns: ["loi_id"];
            isOneToOne: false;
            referencedRelation: "letters_of_intent";
            referencedColumns: ["id"];
          },
        ];
      };
      master_tax_credit_sot: {
        Row: {
          centroid_lat: number | null;
          centroid_lng: number | null;
          county_fips: string | null;
          county_name: string | null;
          created_at: string | null;
          geoid: string;
          geom: unknown;
          geom_simplified: unknown;
          has_brownfield_credit: boolean | null;
          has_state_htc: boolean | null;
          has_state_lihtc: boolean | null;
          has_state_nmtc: boolean | null;
          has_state_oz_conformity: boolean | null;
          high_opp_category: number | null;
          is_acp: boolean | null;
          is_dda_2025: boolean | null;
          is_dda_2026: boolean | null;
          is_high_opportunity_area: boolean | null;
          is_lihtc_qct_2025: boolean | null;
          is_lihtc_qct_2026: boolean | null;
          is_nmtc_eligible: boolean | null;
          is_nmtc_high_migration: boolean | null;
          is_oz_designated: boolean | null;
          is_rcap: boolean | null;
          is_severely_distressed: boolean | null;
          is_tribal_area: boolean | null;
          metro_status: string | null;
          nmtc_mfi_percent: number | null;
          nmtc_poverty_rate: number | null;
          nmtc_unemployment_rate: number | null;
          stack_score: number | null;
          state_fips: string | null;
          state_name: string | null;
          tract_fips: string | null;
          tribal_aian_code: number | null;
          updated_at: string | null;
        };
        Insert: {
          centroid_lat?: number | null;
          centroid_lng?: number | null;
          county_fips?: string | null;
          county_name?: string | null;
          created_at?: string | null;
          geoid: string;
          geom?: unknown;
          geom_simplified?: unknown;
          has_brownfield_credit?: boolean | null;
          has_state_htc?: boolean | null;
          has_state_lihtc?: boolean | null;
          has_state_nmtc?: boolean | null;
          has_state_oz_conformity?: boolean | null;
          high_opp_category?: number | null;
          is_acp?: boolean | null;
          is_dda_2025?: boolean | null;
          is_dda_2026?: boolean | null;
          is_high_opportunity_area?: boolean | null;
          is_lihtc_qct_2025?: boolean | null;
          is_lihtc_qct_2026?: boolean | null;
          is_nmtc_eligible?: boolean | null;
          is_nmtc_high_migration?: boolean | null;
          is_oz_designated?: boolean | null;
          is_rcap?: boolean | null;
          is_severely_distressed?: boolean | null;
          is_tribal_area?: boolean | null;
          metro_status?: string | null;
          nmtc_mfi_percent?: number | null;
          nmtc_poverty_rate?: number | null;
          nmtc_unemployment_rate?: number | null;
          stack_score?: number | null;
          state_fips?: string | null;
          state_name?: string | null;
          tract_fips?: string | null;
          tribal_aian_code?: number | null;
          updated_at?: string | null;
        };
        Update: {
          centroid_lat?: number | null;
          centroid_lng?: number | null;
          county_fips?: string | null;
          county_name?: string | null;
          created_at?: string | null;
          geoid?: string;
          geom?: unknown;
          geom_simplified?: unknown;
          has_brownfield_credit?: boolean | null;
          has_state_htc?: boolean | null;
          has_state_lihtc?: boolean | null;
          has_state_nmtc?: boolean | null;
          has_state_oz_conformity?: boolean | null;
          high_opp_category?: number | null;
          is_acp?: boolean | null;
          is_dda_2025?: boolean | null;
          is_dda_2026?: boolean | null;
          is_high_opportunity_area?: boolean | null;
          is_lihtc_qct_2025?: boolean | null;
          is_lihtc_qct_2026?: boolean | null;
          is_nmtc_eligible?: boolean | null;
          is_nmtc_high_migration?: boolean | null;
          is_oz_designated?: boolean | null;
          is_rcap?: boolean | null;
          is_severely_distressed?: boolean | null;
          is_tribal_area?: boolean | null;
          metro_status?: string | null;
          nmtc_mfi_percent?: number | null;
          nmtc_poverty_rate?: number | null;
          nmtc_unemployment_rate?: number | null;
          stack_score?: number | null;
          state_fips?: string | null;
          state_name?: string | null;
          tract_fips?: string | null;
          tribal_aian_code?: number | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      match_requests: {
        Row: {
          claim_code: string | null;
          cooldown_ends_at: string | null;
          created_at: string | null;
          deal_id: string;
          expires_at: string | null;
          id: string;
          message: string | null;
          requested_at: string | null;
          responded_at: string | null;
          responded_by_id: string | null;
          response_message: string | null;
          sponsor_id: string;
          status: string;
          target_id: string;
          target_org_id: string | null;
          target_type: string;
          updated_at: string | null;
        };
        Insert: {
          claim_code?: string | null;
          cooldown_ends_at?: string | null;
          created_at?: string | null;
          deal_id: string;
          expires_at?: string | null;
          id?: string;
          message?: string | null;
          requested_at?: string | null;
          responded_at?: string | null;
          responded_by_id?: string | null;
          response_message?: string | null;
          sponsor_id: string;
          status?: string;
          target_id: string;
          target_org_id?: string | null;
          target_type: string;
          updated_at?: string | null;
        };
        Update: {
          claim_code?: string | null;
          cooldown_ends_at?: string | null;
          created_at?: string | null;
          deal_id?: string;
          expires_at?: string | null;
          id?: string;
          message?: string | null;
          requested_at?: string | null;
          responded_at?: string | null;
          responded_by_id?: string | null;
          response_message?: string | null;
          sponsor_id?: string;
          status?: string;
          target_id?: string;
          target_org_id?: string | null;
          target_type?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "match_requests_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "deal_cards";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "match_requests_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "deals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "match_requests_sponsor_id_fkey";
            columns: ["sponsor_id"];
            isOneToOne: false;
            referencedRelation: "sponsors";
            referencedColumns: ["id"];
          },
        ];
      };
      message_reads: {
        Row: {
          id: string;
          message_id: string;
          read_at: string | null;
          user_id: string;
        };
        Insert: {
          id?: string;
          message_id: string;
          read_at?: string | null;
          user_id: string;
        };
        Update: {
          id?: string;
          message_id?: string;
          read_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "message_reads_message_id_fkey";
            columns: ["message_id"];
            isOneToOne: false;
            referencedRelation: "messages";
            referencedColumns: ["id"];
          },
        ];
      };
      messages: {
        Row: {
          content: string;
          conversation_id: string;
          created_at: string | null;
          deleted_at: string | null;
          edited_at: string | null;
          file_name: string | null;
          file_size: number | null;
          file_type: string | null;
          file_url: string | null;
          id: string;
          is_deleted: boolean | null;
          is_edited: boolean | null;
          message_type: string | null;
          metadata: Json | null;
          sender_id: string;
          sender_name: string | null;
          sender_org: string | null;
          sender_org_id: string | null;
        };
        Insert: {
          content: string;
          conversation_id: string;
          created_at?: string | null;
          deleted_at?: string | null;
          edited_at?: string | null;
          file_name?: string | null;
          file_size?: number | null;
          file_type?: string | null;
          file_url?: string | null;
          id?: string;
          is_deleted?: boolean | null;
          is_edited?: boolean | null;
          message_type?: string | null;
          metadata?: Json | null;
          sender_id: string;
          sender_name?: string | null;
          sender_org?: string | null;
          sender_org_id?: string | null;
        };
        Update: {
          content?: string;
          conversation_id?: string;
          created_at?: string | null;
          deleted_at?: string | null;
          edited_at?: string | null;
          file_name?: string | null;
          file_size?: number | null;
          file_type?: string | null;
          file_url?: string | null;
          id?: string;
          is_deleted?: boolean | null;
          is_edited?: boolean | null;
          message_type?: string | null;
          metadata?: Json | null;
          sender_id?: string;
          sender_name?: string | null;
          sender_org?: string | null;
          sender_org_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
        ];
      };
      nmtc_cde_allocatees: {
        Row: {
          amount_finalized: string | null;
          amount_remaining: string | null;
          contact_email: string | null;
          contact_name: string | null;
          contact_person: string | null;
          contact_phone: string | null;
          controlling_entity: string | null;
          id: number;
          innovative_activities: string | null;
          name_of_allocatee: string | null;
          non_metro_commitment: string | null;
          predominant_financing: string | null;
          predominant_market_served: string | null;
          service_area: string | null;
          total_allocation: string | null;
          year_of_award: string | null;
        };
        Insert: {
          amount_finalized?: string | null;
          amount_remaining?: string | null;
          contact_email?: string | null;
          contact_name?: string | null;
          contact_person?: string | null;
          contact_phone?: string | null;
          controlling_entity?: string | null;
          id?: number;
          innovative_activities?: string | null;
          name_of_allocatee?: string | null;
          non_metro_commitment?: string | null;
          predominant_financing?: string | null;
          predominant_market_served?: string | null;
          service_area?: string | null;
          total_allocation?: string | null;
          year_of_award?: string | null;
        };
        Update: {
          amount_finalized?: string | null;
          amount_remaining?: string | null;
          contact_email?: string | null;
          contact_name?: string | null;
          contact_person?: string | null;
          contact_phone?: string | null;
          controlling_entity?: string | null;
          id?: number;
          innovative_activities?: string | null;
          name_of_allocatee?: string | null;
          non_metro_commitment?: string | null;
          predominant_financing?: string | null;
          predominant_market_served?: string | null;
          service_area?: string | null;
          total_allocation?: string | null;
          year_of_award?: string | null;
        };
        Relationships: [];
      };
      nmtc_census_tracts: {
        Row: {
          county_code: string | null;
          county_name: string | null;
          geoid: string;
          is_nmtc_eligible: boolean | null;
          metro_designation: string | null;
          mfi_percent: number | null;
          mfi_qualified: boolean | null;
          population: number | null;
          poverty_qualified: boolean | null;
          poverty_rate: number | null;
          state_name: string | null;
          unemployment_high: boolean | null;
          unemployment_rate: number | null;
          unemployment_ratio: number | null;
        };
        Insert: {
          county_code?: string | null;
          county_name?: string | null;
          geoid: string;
          is_nmtc_eligible?: boolean | null;
          metro_designation?: string | null;
          mfi_percent?: number | null;
          mfi_qualified?: boolean | null;
          population?: number | null;
          poverty_qualified?: boolean | null;
          poverty_rate?: number | null;
          state_name?: string | null;
          unemployment_high?: boolean | null;
          unemployment_rate?: number | null;
          unemployment_ratio?: number | null;
        };
        Update: {
          county_code?: string | null;
          county_name?: string | null;
          geoid?: string;
          is_nmtc_eligible?: boolean | null;
          metro_designation?: string | null;
          mfi_percent?: number | null;
          mfi_qualified?: boolean | null;
          population?: number | null;
          poverty_qualified?: boolean | null;
          poverty_rate?: number | null;
          state_name?: string | null;
          unemployment_high?: boolean | null;
          unemployment_rate?: number | null;
          unemployment_ratio?: number | null;
        };
        Relationships: [];
      };
      nmtc_ct_data_2025: {
        Row: {
          county_fips: string | null;
          county_name: string | null;
          created_at: string | null;
          data_source: string | null;
          geoid: string;
          is_deeply_distressed: boolean | null;
          is_high_migration: boolean | null;
          is_lic_eligible: boolean | null;
          is_non_metro: boolean | null;
          is_severely_distressed: boolean | null;
          metro_status: string | null;
          mfi_pct: number | null;
          population: number | null;
          poverty_rate: number | null;
          qualifies_mfi: boolean | null;
          qualifies_poverty: boolean | null;
          state_fips: string | null;
          state_name: string | null;
          tract_fips: string | null;
          unemployment_rate: number | null;
          unemployment_ratio: number | null;
          updated_at: string | null;
        };
        Insert: {
          county_fips?: string | null;
          county_name?: string | null;
          created_at?: string | null;
          data_source?: string | null;
          geoid: string;
          is_deeply_distressed?: boolean | null;
          is_high_migration?: boolean | null;
          is_lic_eligible?: boolean | null;
          is_non_metro?: boolean | null;
          is_severely_distressed?: boolean | null;
          metro_status?: string | null;
          mfi_pct?: number | null;
          population?: number | null;
          poverty_rate?: number | null;
          qualifies_mfi?: boolean | null;
          qualifies_poverty?: boolean | null;
          state_fips?: string | null;
          state_name?: string | null;
          tract_fips?: string | null;
          unemployment_rate?: number | null;
          unemployment_ratio?: number | null;
          updated_at?: string | null;
        };
        Update: {
          county_fips?: string | null;
          county_name?: string | null;
          created_at?: string | null;
          data_source?: string | null;
          geoid?: string;
          is_deeply_distressed?: boolean | null;
          is_high_migration?: boolean | null;
          is_lic_eligible?: boolean | null;
          is_non_metro?: boolean | null;
          is_severely_distressed?: boolean | null;
          metro_status?: string | null;
          mfi_pct?: number | null;
          population?: number | null;
          poverty_rate?: number | null;
          qualifies_mfi?: boolean | null;
          qualifies_poverty?: boolean | null;
          state_fips?: string | null;
          state_name?: string | null;
          tract_fips?: string | null;
          unemployment_rate?: number | null;
          unemployment_ratio?: number | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          action_url: string | null;
          body: string | null;
          created_at: string | null;
          deal_id: string | null;
          entity_id: string | null;
          entity_type: string | null;
          event: string | null;
          expires_at: string | null;
          id: string;
          message: string | null;
          priority: string | null;
          read: boolean | null;
          read_at: string | null;
          title: string;
          type: string;
          user_id: string;
        };
        Insert: {
          action_url?: string | null;
          body?: string | null;
          created_at?: string | null;
          deal_id?: string | null;
          entity_id?: string | null;
          entity_type?: string | null;
          event?: string | null;
          expires_at?: string | null;
          id?: string;
          message?: string | null;
          priority?: string | null;
          read?: boolean | null;
          read_at?: string | null;
          title: string;
          type: string;
          user_id: string;
        };
        Update: {
          action_url?: string | null;
          body?: string | null;
          created_at?: string | null;
          deal_id?: string | null;
          entity_id?: string | null;
          entity_type?: string | null;
          event?: string | null;
          expires_at?: string | null;
          id?: string;
          message?: string | null;
          priority?: string | null;
          read?: boolean | null;
          read_at?: string | null;
          title?: string;
          type?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      opportunity_zones_staging: {
        Row: {
          COUNTY: string | null;
          created_at: string | null;
          GEOID: string | null;
          id: number;
          OBJECTID: number | null;
          Shape__Area: number | null;
          Shape__Length: number | null;
          STATE: string | null;
          STATE_NAME: string | null;
          STUSAB: string | null;
          TRACT: string | null;
        };
        Insert: {
          COUNTY?: string | null;
          created_at?: string | null;
          GEOID?: string | null;
          id?: number;
          OBJECTID?: number | null;
          Shape__Area?: number | null;
          Shape__Length?: number | null;
          STATE?: string | null;
          STATE_NAME?: string | null;
          STUSAB?: string | null;
          TRACT?: string | null;
        };
        Update: {
          COUNTY?: string | null;
          created_at?: string | null;
          GEOID?: string | null;
          id?: number;
          OBJECTID?: number | null;
          Shape__Area?: number | null;
          Shape__Length?: number | null;
          STATE?: string | null;
          STATE_NAME?: string | null;
          STUSAB?: string | null;
          TRACT?: string | null;
        };
        Relationships: [];
      };
      organization_subscriptions: {
        Row: {
          created_at: string | null;
          current_period_end: string | null;
          current_period_start: string | null;
          current_plan_slug: string | null;
          current_status: string | null;
          external_subscription_id: string | null;
          external_subscription_item_id: string | null;
          external_updated_at: string | null;
          id: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          current_period_end?: string | null;
          current_period_start?: string | null;
          current_plan_slug?: string | null;
          current_status?: string | null;
          external_subscription_id?: string | null;
          external_subscription_item_id?: string | null;
          external_updated_at?: string | null;
          id?: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          current_period_end?: string | null;
          current_period_start?: string | null;
          current_plan_slug?: string | null;
          current_status?: string | null;
          external_subscription_id?: string | null;
          external_subscription_item_id?: string | null;
          external_updated_at?: string | null;
          id?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      poverty_data: {
        Row: {
          acp2024: number | null;
          county: string | null;
          geoid: string;
          msa2023: string | null;
          qct2023: number | null;
          qct2024: number | null;
          rcap2024: number | null;
          state: string | null;
          tract: string | null;
        };
        Insert: {
          acp2024?: number | null;
          county?: string | null;
          geoid: string;
          msa2023?: string | null;
          qct2023?: number | null;
          qct2024?: number | null;
          rcap2024?: number | null;
          state?: string | null;
          tract?: string | null;
        };
        Update: {
          acp2024?: number | null;
          county?: string | null;
          geoid?: string;
          msa2023?: string | null;
          qct2023?: number | null;
          qct2024?: number | null;
          rcap2024?: number | null;
          state?: string | null;
          tract?: string | null;
        };
        Relationships: [];
      };
      project_assignments: {
        Row: {
          assigned_at: string | null;
          assigned_by: string | null;
          deal_id: string;
          id: string;
          role: string | null;
          user_id: string;
        };
        Insert: {
          assigned_at?: string | null;
          assigned_by?: string | null;
          deal_id: string;
          id?: string;
          role?: string | null;
          user_id: string;
        };
        Update: {
          assigned_at?: string | null;
          assigned_by?: string | null;
          deal_id?: string;
          id?: string;
          role?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "project_assignments_assigned_by_fkey";
            columns: ["assigned_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_assignments_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "deal_cards";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_assignments_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "deals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_assignments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      small_financial_institutions: {
        Row: {
          address: string | null;
          agency_file: string | null;
          city: string | null;
          fca_inst_number: string | null;
          fdic_cert_number: string | null;
          fhfa_sfi_number: string | null;
          id: number;
          institution_name: string | null;
          ncua_cu_number: string | null;
          reporting_date: string | null;
          rssd_id: string | null;
          state: string | null;
        };
        Insert: {
          address?: string | null;
          agency_file?: string | null;
          city?: string | null;
          fca_inst_number?: string | null;
          fdic_cert_number?: string | null;
          fhfa_sfi_number?: string | null;
          id?: number;
          institution_name?: string | null;
          ncua_cu_number?: string | null;
          reporting_date?: string | null;
          rssd_id?: string | null;
          state?: string | null;
        };
        Update: {
          address?: string | null;
          agency_file?: string | null;
          city?: string | null;
          fca_inst_number?: string | null;
          fdic_cert_number?: string | null;
          fhfa_sfi_number?: string | null;
          id?: number;
          institution_name?: string | null;
          ncua_cu_number?: string | null;
          reporting_date?: string | null;
          rssd_id?: string | null;
          state?: string | null;
        };
        Relationships: [];
      };
      spatial_ref_sys: {
        Row: {
          auth_name: string | null;
          auth_srid: number | null;
          proj4text: string | null;
          srid: number;
          srtext: string | null;
        };
        Insert: {
          auth_name?: string | null;
          auth_srid?: number | null;
          proj4text?: string | null;
          srid: number;
          srtext?: string | null;
        };
        Update: {
          auth_name?: string | null;
          auth_srid?: number | null;
          proj4text?: string | null;
          srid?: number;
          srtext?: string | null;
        };
        Relationships: [];
      };
      sponsors: {
        Row: {
          address: string | null;
          city: string | null;
          created_at: string | null;
          description: string | null;
          exclusivity_agreed: boolean | null;
          exclusivity_agreed_at: string | null;
          id: string;
          logo_url: string | null;
          low_income_owned: boolean | null;
          minority_owned: boolean | null;
          organization_id: string | null;
          organization_name: string | null;
          organization_type: string | null;
          primary_contact_email: string | null;
          primary_contact_name: string | null;
          primary_contact_phone: string | null;
          state: string | null;
          total_project_value: number | null;
          total_projects_completed: number | null;
          updated_at: string | null;
          veteran_owned: boolean | null;
          website: string | null;
          woman_owned: boolean | null;
          year_founded: number | null;
          zip_code: string | null;
        };
        Insert: {
          address?: string | null;
          city?: string | null;
          created_at?: string | null;
          description?: string | null;
          exclusivity_agreed?: boolean | null;
          exclusivity_agreed_at?: string | null;
          id?: string;
          logo_url?: string | null;
          low_income_owned?: boolean | null;
          minority_owned?: boolean | null;
          organization_id?: string | null;
          organization_name?: string | null;
          organization_type?: string | null;
          primary_contact_email?: string | null;
          primary_contact_name?: string | null;
          primary_contact_phone?: string | null;
          state?: string | null;
          total_project_value?: number | null;
          total_projects_completed?: number | null;
          updated_at?: string | null;
          veteran_owned?: boolean | null;
          website?: string | null;
          woman_owned?: boolean | null;
          year_founded?: number | null;
          zip_code?: string | null;
        };
        Update: {
          address?: string | null;
          city?: string | null;
          created_at?: string | null;
          description?: string | null;
          exclusivity_agreed?: boolean | null;
          exclusivity_agreed_at?: string | null;
          id?: string;
          logo_url?: string | null;
          low_income_owned?: boolean | null;
          minority_owned?: boolean | null;
          organization_id?: string | null;
          organization_name?: string | null;
          organization_type?: string | null;
          primary_contact_email?: string | null;
          primary_contact_name?: string | null;
          primary_contact_phone?: string | null;
          state?: string | null;
          total_project_value?: number | null;
          total_projects_completed?: number | null;
          updated_at?: string | null;
          veteran_owned?: boolean | null;
          website?: string | null;
          woman_owned?: boolean | null;
          year_founded?: number | null;
          zip_code?: string | null;
        };
        Relationships: [];
      };
      state_fips_lookup: {
        Row: {
          fips: string;
          state_abbrev: string;
          state_name: string;
        };
        Insert: {
          fips: string;
          state_abbrev: string;
          state_name: string;
        };
        Update: {
          fips?: string;
          state_abbrev?: string;
          state_name?: string;
        };
        Relationships: [];
      };
      state_tax_credit_programs_staging: {
        Row: {
          admin_agency: string | null;
          admin_agent_lihtc: string | null;
          admin_agent_sthtc: string | null;
          "Administering Agency": string | null;
          "Administering Agency_OZ": string | null;
          annual_or_per_project_cap: string | null;
          brownfield_credit: string | null;
          created_at: string | null;
          "Credit % / Amount": string | null;
          "Credit Type": string | null;
          credit_structure: string | null;
          geoid: string | null;
          id: number;
          "Notes / Statutes": string | null;
          "Notes / Statutory Reference": string | null;
          oz_to_fed: string | null;
          "Program Type": string | null;
          program_name: string | null;
          program_size: string | null;
          "Refundable / Transferable_BROWNFIELD": string | null;
          refundable_transferable_stc: string | null;
          st_htc_refundable: string | null;
          st_htc_transferable: string | null;
          st_oz_tc: string | null;
          "Stackable With": string | null;
          state_htc: string | null;
          state_lihtc: string | null;
          state_name: string | null;
          state_nmtc: string | null;
          state_nmtc_transferable: string | null;
          "tc_%_years": string | null;
          "tc%": string | null;
        };
        Insert: {
          admin_agency?: string | null;
          admin_agent_lihtc?: string | null;
          admin_agent_sthtc?: string | null;
          "Administering Agency"?: string | null;
          "Administering Agency_OZ"?: string | null;
          annual_or_per_project_cap?: string | null;
          brownfield_credit?: string | null;
          created_at?: string | null;
          "Credit % / Amount"?: string | null;
          "Credit Type"?: string | null;
          credit_structure?: string | null;
          geoid?: string | null;
          id?: number;
          "Notes / Statutes"?: string | null;
          "Notes / Statutory Reference"?: string | null;
          oz_to_fed?: string | null;
          "Program Type"?: string | null;
          program_name?: string | null;
          program_size?: string | null;
          "Refundable / Transferable_BROWNFIELD"?: string | null;
          refundable_transferable_stc?: string | null;
          st_htc_refundable?: string | null;
          st_htc_transferable?: string | null;
          st_oz_tc?: string | null;
          "Stackable With"?: string | null;
          state_htc?: string | null;
          state_lihtc?: string | null;
          state_name?: string | null;
          state_nmtc?: string | null;
          state_nmtc_transferable?: string | null;
          "tc_%_years"?: string | null;
          "tc%"?: string | null;
        };
        Update: {
          admin_agency?: string | null;
          admin_agent_lihtc?: string | null;
          admin_agent_sthtc?: string | null;
          "Administering Agency"?: string | null;
          "Administering Agency_OZ"?: string | null;
          annual_or_per_project_cap?: string | null;
          brownfield_credit?: string | null;
          created_at?: string | null;
          "Credit % / Amount"?: string | null;
          "Credit Type"?: string | null;
          credit_structure?: string | null;
          geoid?: string | null;
          id?: number;
          "Notes / Statutes"?: string | null;
          "Notes / Statutory Reference"?: string | null;
          oz_to_fed?: string | null;
          "Program Type"?: string | null;
          program_name?: string | null;
          program_size?: string | null;
          "Refundable / Transferable_BROWNFIELD"?: string | null;
          refundable_transferable_stc?: string | null;
          st_htc_refundable?: string | null;
          st_htc_transferable?: string | null;
          st_oz_tc?: string | null;
          "Stackable With"?: string | null;
          state_htc?: string | null;
          state_lihtc?: string | null;
          state_name?: string | null;
          state_nmtc?: string | null;
          state_nmtc_transferable?: string | null;
          "tc_%_years"?: string | null;
          "tc%"?: string | null;
        };
        Relationships: [];
      };
      team_members: {
        Row: {
          accepted_at: string | null;
          created_at: string | null;
          id: string;
          invite_token: string | null;
          invited_at: string | null;
          invited_by: string | null;
          is_active: boolean | null;
          role: Database["public"]["Enums"]["user_role"] | null;
          title: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          accepted_at?: string | null;
          created_at?: string | null;
          id?: string;
          invite_token?: string | null;
          invited_at?: string | null;
          invited_by?: string | null;
          is_active?: boolean | null;
          role?: Database["public"]["Enums"]["user_role"] | null;
          title?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          accepted_at?: string | null;
          created_at?: string | null;
          id?: string;
          invite_token?: string | null;
          invited_at?: string | null;
          invited_by?: string | null;
          is_active?: boolean | null;
          role?: Database["public"]["Enums"]["user_role"] | null;
          title?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "team_members_invited_by_fkey";
            columns: ["invited_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      tract_geometries: {
        Row: {
          county_fips: string | null;
          geoid: string | null;
          geometry: unknown;
          geometry_simplified: unknown;
          land_area: number | null;
          state_fips: string | null;
          tract_code: string | null;
          tract_name: string | null;
          water_area: number | null;
        };
        Insert: {
          county_fips?: string | null;
          geoid?: string | null;
          geometry?: unknown;
          geometry_simplified?: unknown;
          land_area?: number | null;
          state_fips?: string | null;
          tract_code?: string | null;
          tract_name?: string | null;
          water_area?: number | null;
        };
        Update: {
          county_fips?: string | null;
          geoid?: string | null;
          geometry?: unknown;
          geometry_simplified?: unknown;
          land_area?: number | null;
          state_fips?: string | null;
          tract_code?: string | null;
          tract_name?: string | null;
          water_area?: number | null;
        };
        Relationships: [];
      };
      tribal_data: {
        Row: {
          aian: number | null;
          county: string | null;
          dts_ia: number | null;
          geoid: string;
          msa2023: string | null;
          state: string | null;
          tract: string | null;
        };
        Insert: {
          aian?: number | null;
          county?: string | null;
          dts_ia?: number | null;
          geoid: string;
          msa2023?: string | null;
          state?: string | null;
          tract?: string | null;
        };
        Update: {
          aian?: number | null;
          county?: string | null;
          dts_ia?: number | null;
          geoid?: string;
          msa2023?: string | null;
          state?: string | null;
          tract?: string | null;
        };
        Relationships: [];
      };
      users: {
        Row: {
          avatar_url: string | null;
          created_at: string | null;
          email: string;
          email_verified: boolean | null;
          id: string;
          invite_code: string | null;
          invite_expires_at: string | null;
          is_active: boolean | null;
          last_login_at: string | null;
          name: string;
          organization_id: string | null;
          organization_name: string | null;
          phone: string | null;
          role: Database["public"]["Enums"]["user_role"] | null;
          role_type: string | null;
          title: string | null;
          updated_at: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string | null;
          email: string;
          email_verified?: boolean | null;
          id?: string;
          invite_code?: string | null;
          invite_expires_at?: string | null;
          is_active?: boolean | null;
          last_login_at?: string | null;
          name: string;
          organization_id?: string | null;
          organization_name?: string | null;
          phone?: string | null;
          role?: Database["public"]["Enums"]["user_role"] | null;
          role_type?: string | null;
          title?: string | null;
          updated_at?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string | null;
          email?: string;
          email_verified?: boolean | null;
          id?: string;
          invite_code?: string | null;
          invite_expires_at?: string | null;
          is_active?: boolean | null;
          last_login_at?: string | null;
          name?: string;
          organization_id?: string | null;
          organization_name?: string | null;
          phone?: string | null;
          role?: Database["public"]["Enums"]["user_role"] | null;
          role_type?: string | null;
          title?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      zip_tract_crosswalk: {
        Row: {
          res_ratio: number | null;
          tract: string;
          zip: string;
        };
        Insert: {
          res_ratio?: number | null;
          tract: string;
          zip: string;
        };
        Update: {
          res_ratio?: number | null;
          tract?: string;
          zip?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      deal_cards: {
        Row: {
          census_tract: string | null;
          city: string | null;
          created_at: string | null;
          id: string | null;
          jobs_created: number | null;
          nmtc_financing_requested: number | null;
          programs: Database["public"]["Enums"]["program_type"][] | null;
          project_name: string | null;
          project_type: string | null;
          readiness_score: number | null;
          sponsor_name: string | null;
          state: string | null;
          status: Database["public"]["Enums"]["deal_status"] | null;
          tier: number | null;
          total_project_cost: number | null;
          tract_eligible: boolean | null;
          tract_severely_distressed: boolean | null;
        };
        Insert: {
          census_tract?: string | null;
          city?: string | null;
          created_at?: string | null;
          id?: string | null;
          jobs_created?: number | null;
          nmtc_financing_requested?: number | null;
          programs?: Database["public"]["Enums"]["program_type"][] | null;
          project_name?: string | null;
          project_type?: string | null;
          readiness_score?: number | null;
          sponsor_name?: string | null;
          state?: string | null;
          status?: Database["public"]["Enums"]["deal_status"] | null;
          tier?: number | null;
          total_project_cost?: number | null;
          tract_eligible?: boolean | null;
          tract_severely_distressed?: boolean | null;
        };
        Update: {
          census_tract?: string | null;
          city?: string | null;
          created_at?: string | null;
          id?: string | null;
          jobs_created?: number | null;
          nmtc_financing_requested?: number | null;
          programs?: Database["public"]["Enums"]["program_type"][] | null;
          project_name?: string | null;
          project_type?: string | null;
          readiness_score?: number | null;
          sponsor_name?: string | null;
          state?: string | null;
          status?: Database["public"]["Enums"]["deal_status"] | null;
          tier?: number | null;
          total_project_cost?: number | null;
          tract_eligible?: boolean | null;
          tract_severely_distressed?: boolean | null;
        };
        Relationships: [];
      };
      deal_pipeline_summary: {
        Row: {
          cde_count: number | null;
          closed_count: number | null;
          committed_count: number | null;
          contacted_count: number | null;
          deal_id: string | null;
          denied_count: number | null;
          interested_count: number | null;
          investor_count: number | null;
          loi_count: number | null;
          reviewing_count: number | null;
          total_committed: number | null;
          verbal_count: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "deal_relationships_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "deal_cards";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deal_relationships_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "deals";
            referencedColumns: ["id"];
          },
        ];
      };
      geography_columns: {
        Row: {
          coord_dimension: number | null;
          f_geography_column: unknown;
          f_table_catalog: unknown;
          f_table_name: unknown;
          f_table_schema: unknown;
          srid: number | null;
          type: string | null;
        };
        Relationships: [];
      };
      geometry_columns: {
        Row: {
          coord_dimension: number | null;
          f_geometry_column: unknown;
          f_table_catalog: string | null;
          f_table_name: unknown;
          f_table_schema: unknown;
          srid: number | null;
          type: string | null;
        };
        Insert: {
          coord_dimension?: number | null;
          f_geometry_column?: unknown;
          f_table_catalog?: string | null;
          f_table_name?: unknown;
          f_table_schema?: unknown;
          srid?: number | null;
          type?: string | null;
        };
        Update: {
          coord_dimension?: number | null;
          f_geometry_column?: unknown;
          f_table_catalog?: string | null;
          f_table_name?: unknown;
          f_table_schema?: unknown;
          srid?: number | null;
          type?: string | null;
        };
        Relationships: [];
      };
      nmtc_2025_summary: {
        Row: {
          avg_mfi_pct: number | null;
          avg_poverty_rate: number | null;
          high_migration: number | null;
          lic_eligible: number | null;
          non_metro: number | null;
          severely_distressed: number | null;
          state: string | null;
          total_tracts: number | null;
        };
        Relationships: [];
      };
      tract_map_layer: {
        Row: {
          geoid: string | null;
          geom_json: string | null;
          has_any_tax_credit: boolean | null;
          has_brownfield_credit: boolean | null;
          has_state_htc: boolean | null;
          has_state_lihtc: boolean | null;
          has_state_nmtc: boolean | null;
          is_dda: boolean | null;
          is_nmtc_eligible: boolean | null;
          is_nmtc_high_migration: boolean | null;
          is_oz: boolean | null;
          is_qct: boolean | null;
          mfi_pct: number | null;
          poverty_rate: number | null;
          stack_score: number | null;
          unemployment_rate: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      _postgis_deprecate: {
        Args: { newname: string; oldname: string; version: string };
        Returns: undefined;
      };
      _postgis_index_extent: {
        Args: { col: string; tbl: unknown };
        Returns: unknown;
      };
      _postgis_pgsql_version: { Args: never; Returns: string };
      _postgis_scripts_pgsql_version: { Args: never; Returns: string };
      _postgis_selectivity: {
        Args: { att_name: string; geom: unknown; mode?: string; tbl: unknown };
        Returns: number;
      };
      _postgis_stats: {
        Args: { ""?: string; att_name: string; tbl: unknown };
        Returns: string;
      };
      _st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: boolean;
      };
      _st_contains: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: boolean;
      };
      _st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: boolean;
      };
      _st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean };
      _st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean };
      _st_crosses: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: boolean;
      };
      _st_dwithin: {
        Args: {
          geog1: unknown;
          geog2: unknown;
          tolerance: number;
          use_spheroid?: boolean;
        };
        Returns: boolean;
      };
      _st_equals: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: boolean;
      };
      _st_intersects: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: boolean;
      };
      _st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown };
        Returns: number;
      };
      _st_longestline: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: unknown;
      };
      _st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: number;
      };
      _st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: boolean;
      };
      _st_overlaps: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: boolean;
      };
      _st_sortablehash: { Args: { geom: unknown }; Returns: number };
      _st_touches: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: boolean;
      };
      _st_voronoi: {
        Args: {
          clip?: unknown;
          g1: unknown;
          return_polygons?: boolean;
          tolerance?: number;
        };
        Returns: unknown;
      };
      _st_within: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: boolean;
      };
      addauth: { Args: { "": string }; Returns: boolean };
      addgeometrycolumn:
        | {
            Args: {
              catalog_name: string;
              column_name: string;
              new_dim: number;
              new_srid_in: number;
              new_type: string;
              schema_name: string;
              table_name: string;
              use_typmod?: boolean;
            };
            Returns: string;
          }
        | {
            Args: {
              column_name: string;
              new_dim: number;
              new_srid: number;
              new_type: string;
              schema_name: string;
              table_name: string;
              use_typmod?: boolean;
            };
            Returns: string;
          }
        | {
            Args: {
              column_name: string;
              new_dim: number;
              new_srid: number;
              new_type: string;
              table_name: string;
              use_typmod?: boolean;
            };
            Returns: string;
          };
      disablelongtransactions: { Args: never; Returns: string };
      dropgeometrycolumn:
        | {
            Args: {
              catalog_name: string;
              column_name: string;
              schema_name: string;
              table_name: string;
            };
            Returns: string;
          }
        | {
            Args: {
              column_name: string;
              schema_name: string;
              table_name: string;
            };
            Returns: string;
          }
        | {
            Args: { column_name: string; table_name: string };
            Returns: string;
          };
      dropgeometrytable:
        | {
            Args: {
              catalog_name: string;
              schema_name: string;
              table_name: string;
            };
            Returns: string;
          }
        | { Args: { schema_name: string; table_name: string }; Returns: string }
        | { Args: { table_name: string }; Returns: string };
      enablelongtransactions: { Args: never; Returns: string };
      equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean };
      geometry: { Args: { "": string }; Returns: unknown };
      geometry_above: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: boolean;
      };
      geometry_below: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: boolean;
      };
      geometry_cmp: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: number;
      };
      geometry_contained_3d: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: boolean;
      };
      geometry_contains: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: boolean;
      };
      geometry_contains_3d: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: boolean;
      };
      geometry_distance_box: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: number;
      };
      geometry_distance_centroid: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: number;
      };
      geometry_eq: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: boolean;
      };
      geometry_ge: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: boolean;
      };
      geometry_gt: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: boolean;
      };
      geometry_le: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: boolean;
      };
      geometry_left: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: boolean;
      };
      geometry_lt: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: boolean;
      };
      geometry_overabove: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: boolean;
      };
      geometry_overbelow: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: boolean;
      };
      geometry_overlaps: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: boolean;
      };
      geometry_overlaps_3d: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: boolean;
      };
      geometry_overleft: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: boolean;
      };
      geometry_overright: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: boolean;
      };
      geometry_right: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: boolean;
      };
      geometry_same: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: boolean;
      };
      geometry_same_3d: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: boolean;
      };
      geometry_within: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: boolean;
      };
      geomfromewkt: { Args: { "": string }; Returns: unknown };
      get_all_tracts_geojson: { Args: { row_limit?: number }; Returns: Json[] };
      get_historic_buildings_near_point: {
        Args: {
          p_lat: number;
          p_limit?: number;
          p_lng: number;
          p_radius_miles?: number;
        };
        Returns: {
          category: string;
          city: string;
          distance_miles: number;
          id: number;
          listed_date: string;
          property_name: string;
          state: string;
          status: string;
          street_address: string;
        }[];
      };
      get_lic_tracts_by_state: {
        Args: {
          p_limit?: number;
          p_severely_distressed_only?: boolean;
          p_state_name: string;
        };
        Returns: {
          county_name: string;
          geoid: string;
          is_high_migration: boolean;
          is_non_metro: boolean;
          is_severely_distressed: boolean;
          mfi_pct: number;
          poverty_rate: number;
        }[];
      };
      get_lic_tracts_for_matching: {
        Args: {
          p_high_migration_only?: boolean;
          p_limit?: number;
          p_non_metro_only?: boolean;
          p_severely_distressed_only?: boolean;
          p_state_name: string;
        };
        Returns: {
          county_name: string;
          geoid: string;
          is_high_migration: boolean;
          is_non_metro: boolean;
          is_oz: boolean;
          is_qct: boolean;
          is_severely_distressed: boolean;
          mfi_pct: number;
          poverty_rate: number;
          unemployment_rate: number;
        }[];
      };
      get_map_tracts_in_bbox: {
        Args: {
          p_limit?: number;
          p_max_lat: number;
          p_max_lng: number;
          p_min_lat: number;
          p_min_lng: number;
        };
        Returns: {
          geoid: string;
          geom_json: string;
          has_state_lihtc: boolean;
          has_state_nmtc: boolean;
          is_dda: boolean;
          is_lihtc_qct: boolean;
          is_nmtc_eligible: boolean;
          is_nmtc_high_migration: boolean;
          is_oz_designated: boolean;
          median_family_income_pct: number;
          poverty_rate: number;
          severely_distressed: boolean;
        }[];
      };
      get_nmtc_distress_for_scoring: {
        Args: { p_geoid: string };
        Returns: {
          county_name: string;
          geoid: string;
          is_deeply_distressed: boolean;
          is_high_migration: boolean;
          is_lic_eligible: boolean;
          is_non_metro: boolean;
          is_oz: boolean;
          is_qct: boolean;
          is_severely_distressed: boolean;
          mfi_pct: number;
          poverty_rate: number;
          state_name: string;
          unemployment_rate: number;
          unemployment_ratio: number;
        }[];
      };
      get_nmtc_tract_for_scoring: {
        Args: { p_geoid: string };
        Returns: {
          county_name: string;
          geoid: string;
          is_high_migration: boolean;
          is_lic_eligible: boolean;
          is_non_metro: boolean;
          is_severely_distressed: boolean;
          mfi_pct: number;
          poverty_rate: number;
          state_name: string;
          unemployment_rate: number;
        }[];
      };
      get_or_create_direct_conversation: {
        Args: {
          p_category?: string;
          p_user1_id: string;
          p_user1_name: string;
          p_user1_org_id: string;
          p_user1_org_name: string;
          p_user1_org_type: string;
          p_user2_id: string;
          p_user2_name: string;
          p_user2_org_id: string;
          p_user2_org_name: string;
          p_user2_org_type: string;
        };
        Returns: string;
      };
      get_simplified_tracts_in_bbox: {
        Args: {
          p_max_lat: number;
          p_max_lng: number;
          p_min_lat: number;
          p_min_lng: number;
        };
        Returns: {
          geoid: string;
          geom_json: string;
          has_brownfield_credit: boolean;
          has_state_htc: boolean;
          has_state_nmtc: boolean;
          is_lihtc_qct: boolean;
          is_oz_designated: boolean;
          severely_distressed: boolean;
        }[];
      };
      get_tile: { Args: { x: number; y: number; z: number }; Returns: string };
      get_tract_at_point: {
        Args: { p_lat: number; p_lng: number };
        Returns: {
          geoid: string;
          geom_json: string;
          has_any_tax_credit: boolean;
          has_state_lihtc: boolean;
          has_state_nmtc: boolean;
          is_dda: boolean;
          is_nmtc_eligible: boolean;
          is_nmtc_high_migration: boolean;
          is_oz: boolean;
          is_qct: boolean;
          mfi_pct: number;
          poverty_rate: number;
          stack_score: number;
          unemployment_rate: number;
        }[];
      };
      get_tract_by_geoid: {
        Args: { p_geoid: string };
        Returns: {
          county_fips: string;
          county_name: string;
          geoid: string;
          geom_json: string;
          has_brownfield_credit: boolean;
          has_state_htc: boolean;
          has_state_lihtc: boolean;
          has_state_nmtc: boolean;
          has_state_oz_conformity: boolean;
          is_lihtc_qct: boolean;
          is_oz_designated: boolean;
          median_family_income_pct: number;
          poverty_rate: number;
          severely_distressed: boolean;
          state_fips: string;
          state_htc_refundable: boolean;
          state_htc_transferable: boolean;
          state_name: string;
          state_nmtc_transferable: boolean;
          unemployment_rate: number;
        }[];
      };
      get_tract_by_point: {
        Args: { p_lat: number; p_lng: number };
        Returns: {
          county_fips: string;
          geoid: string;
          state_fips: string;
          tract_code: string;
        }[];
      };
      get_tract_centroids_in_bbox: {
        Args: {
          p_limit?: number;
          p_max_lat: number;
          p_max_lng: number;
          p_min_lat: number;
          p_min_lng: number;
        };
        Returns: {
          geoid: string;
          has_state_htc: boolean;
          has_state_nmtc: boolean;
          is_lihtc_qct: boolean;
          is_oz_designated: boolean;
          lat: number;
          lng: number;
          severely_distressed: boolean;
        }[];
      };
      get_tract_distress_stats: {
        Args: { p_geoids: string[] };
        Returns: {
          avg_mfi_pct: number;
          avg_poverty_rate: number;
          high_migration: number;
          lic_eligible: number;
          non_metro: number;
          oz_designated: number;
          qct_designated: number;
          severely_distressed: number;
          total_tracts: number;
        }[];
      };
      get_tract_eligibility: {
        Args: { p_lat: number; p_lng: number };
        Returns: {
          brownfield_credit: string;
          county_name: string;
          geoid: string;
          is_nmtc_lic: boolean;
          lihtc_qct: boolean;
          metro_status: string;
          mfi_pct: number;
          mfi_qualifies: boolean;
          oz_designated: boolean;
          poverty_qualifies: boolean;
          poverty_rate: number;
          severely_distressed: boolean;
          state_htc: string;
          state_name: string;
          state_nmtc: string;
          unemployment_qualifies: boolean;
          unemployment_rate: number;
        }[];
      };
      get_tract_from_coordinates: {
        Args: { p_lat: number; p_lng: number };
        Returns: {
          county_name: string;
          geoid: string;
          geom_json: string;
          has_brownfield_credit: boolean;
          has_state_htc: boolean;
          has_state_nmtc: boolean;
          is_lihtc_qct: boolean;
          is_oz_designated: boolean;
          median_family_income_pct: number;
          poverty_rate: number;
          severely_distressed: boolean;
          state_name: string;
        }[];
      };
      get_tract_mvt: {
        Args: { x: number; y: number; z: number };
        Returns: string;
      };
      get_tract_with_credits: {
        Args: { p_geoid: string };
        Returns: {
          geoid: string;
          geom_json: string;
          has_any_tax_credit: boolean;
          has_state_lihtc: boolean;
          has_state_nmtc: boolean;
          is_dda: boolean;
          is_nmtc_eligible: boolean;
          is_nmtc_high_migration: boolean;
          is_oz: boolean;
          is_qct: boolean;
          mfi_pct: number;
          poverty_rate: number;
          stack_score: number;
          unemployment_rate: number;
        }[];
      };
      get_tracts_by_state: {
        Args: { p_limit?: number; p_state_name: string };
        Returns: {
          county_name: string;
          geoid: string;
          geom_json: string;
          has_brownfield_credit: boolean;
          has_state_htc: boolean;
          has_state_nmtc: boolean;
          is_lihtc_qct: boolean;
          is_oz_designated: boolean;
        }[];
      };
      get_tracts_geojson: {
        Args: { bbox_param?: string; limit_param?: number };
        Returns: Json[];
      };
      get_tracts_geojson_bbox: {
        Args: {
          max_lat: number;
          max_lng: number;
          min_lat: number;
          min_lng: number;
          row_limit?: number;
        };
        Returns: Json[];
      };
      get_tracts_in_bbox: {
        Args: {
          p_max_lat: number;
          p_max_lng: number;
          p_min_lat: number;
          p_min_lng: number;
        };
        Returns: {
          geoid: string;
          geom_json: string;
          has_any_tax_credit: boolean;
          has_brownfield_credit: boolean;
          has_state_htc: boolean;
          has_state_nmtc: boolean;
          is_dda: boolean;
          is_nmtc_eligible: boolean;
          is_oz: boolean;
          is_qct: boolean;
          mfi_pct: number;
          poverty_rate: number;
          stack_score: number;
          unemployment_rate: number;
        }[];
      };
      get_user_org_id: { Args: never; Returns: string };
      get_user_org_type: {
        Args: never;
        Returns: Database["public"]["Enums"]["org_type"];
      };
      get_vector_tile: {
        Args: { p_x: number; p_y: number; p_z: number };
        Returns: string;
      };
      gettransactionid: { Args: never; Returns: unknown };
      increment_referral_clicks: {
        Args: { referral_code: string };
        Returns: undefined;
      };
      longtransactionsenabled: { Args: never; Returns: boolean };
      populate_geometry_columns:
        | { Args: { tbl_oid: unknown; use_typmod?: boolean }; Returns: number }
        | { Args: { use_typmod?: boolean }; Returns: string };
      postgis_constraint_dims: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string };
        Returns: number;
      };
      postgis_constraint_srid: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string };
        Returns: number;
      };
      postgis_constraint_type: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string };
        Returns: string;
      };
      postgis_extensions_upgrade: { Args: never; Returns: string };
      postgis_full_version: { Args: never; Returns: string };
      postgis_geos_version: { Args: never; Returns: string };
      postgis_lib_build_date: { Args: never; Returns: string };
      postgis_lib_revision: { Args: never; Returns: string };
      postgis_lib_version: { Args: never; Returns: string };
      postgis_libjson_version: { Args: never; Returns: string };
      postgis_liblwgeom_version: { Args: never; Returns: string };
      postgis_libprotobuf_version: { Args: never; Returns: string };
      postgis_libxml_version: { Args: never; Returns: string };
      postgis_proj_version: { Args: never; Returns: string };
      postgis_scripts_build_date: { Args: never; Returns: string };
      postgis_scripts_installed: { Args: never; Returns: string };
      postgis_scripts_released: { Args: never; Returns: string };
      postgis_svn_version: { Args: never; Returns: string };
      postgis_type_name: {
        Args: {
          coord_dimension: number;
          geomname: string;
          use_new_name?: boolean;
        };
        Returns: string;
      };
      postgis_version: { Args: never; Returns: string };
      postgis_wagyu_version: { Args: never; Returns: string };
      search_knowledge: {
        Args: {
          filter_categories?: string[];
          filter_programs?: string[];
          match_count?: number;
          match_threshold?: number;
          query_embedding: string;
        };
        Returns: {
          content: string;
          created_at: string;
          document_id: string;
          id: string;
          metadata: Json;
          similarity: number;
        }[];
      };
      st_3dclosestpoint: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: unknown;
      };
      st_3ddistance: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: number;
      };
      st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: boolean;
      };
      st_3dlongestline: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: unknown;
      };
      st_3dmakebox: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: unknown;
      };
      st_3dmaxdistance: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: number;
      };
      st_3dshortestline: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: unknown;
      };
      st_addpoint: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: unknown;
      };
      st_angle:
        | { Args: { line1: unknown; line2: unknown }; Returns: number }
        | {
            Args: { pt1: unknown; pt2: unknown; pt3: unknown; pt4?: unknown };
            Returns: number;
          };
      st_area:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number };
      st_asencodedpolyline: {
        Args: { geom: unknown; nprecision?: number };
        Returns: string;
      };
      st_asewkt: { Args: { "": string }; Returns: string };
      st_asgeojson:
        | {
            Args: {
              geog: unknown;
              maxdecimaldigits?: number;
              options?: number;
            };
            Returns: string;
          }
        | {
            Args: {
              geom: unknown;
              maxdecimaldigits?: number;
              options?: number;
            };
            Returns: string;
          }
        | {
            Args: {
              geom_column?: string;
              maxdecimaldigits?: number;
              pretty_bool?: boolean;
              r: Record<string, unknown>;
            };
            Returns: string;
          }
        | { Args: { "": string }; Returns: string };
      st_asgml:
        | {
            Args: {
              geog: unknown;
              id?: string;
              maxdecimaldigits?: number;
              nprefix?: string;
              options?: number;
            };
            Returns: string;
          }
        | {
            Args: {
              geom: unknown;
              maxdecimaldigits?: number;
              options?: number;
            };
            Returns: string;
          }
        | { Args: { "": string }; Returns: string }
        | {
            Args: {
              geog: unknown;
              id?: string;
              maxdecimaldigits?: number;
              nprefix?: string;
              options?: number;
              version: number;
            };
            Returns: string;
          }
        | {
            Args: {
              geom: unknown;
              id?: string;
              maxdecimaldigits?: number;
              nprefix?: string;
              options?: number;
              version: number;
            };
            Returns: string;
          };
      st_askml:
        | {
            Args: {
              geog: unknown;
              maxdecimaldigits?: number;
              nprefix?: string;
            };
            Returns: string;
          }
        | {
            Args: {
              geom: unknown;
              maxdecimaldigits?: number;
              nprefix?: string;
            };
            Returns: string;
          }
        | { Args: { "": string }; Returns: string };
      st_aslatlontext: {
        Args: { geom: unknown; tmpl?: string };
        Returns: string;
      };
      st_asmarc21: {
        Args: { format?: string; geom: unknown };
        Returns: string;
      };
      st_asmvtgeom: {
        Args: {
          bounds: unknown;
          buffer?: number;
          clip_geom?: boolean;
          extent?: number;
          geom: unknown;
        };
        Returns: unknown;
      };
      st_assvg:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; rel?: number };
            Returns: string;
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; rel?: number };
            Returns: string;
          }
        | { Args: { "": string }; Returns: string };
      st_astext: { Args: { "": string }; Returns: string };
      st_astwkb:
        | {
            Args: {
              geom: unknown;
              prec?: number;
              prec_m?: number;
              prec_z?: number;
              with_boxes?: boolean;
              with_sizes?: boolean;
            };
            Returns: string;
          }
        | {
            Args: {
              geom: unknown[];
              ids: number[];
              prec?: number;
              prec_m?: number;
              prec_z?: number;
              with_boxes?: boolean;
              with_sizes?: boolean;
            };
            Returns: string;
          };
      st_asx3d: {
        Args: { geom: unknown; maxdecimaldigits?: number; options?: number };
        Returns: string;
      };
      st_azimuth:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: number }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number };
      st_boundingdiagonal: {
        Args: { fits?: boolean; geom: unknown };
        Returns: unknown;
      };
      st_buffer:
        | {
            Args: { geom: unknown; options?: string; radius: number };
            Returns: unknown;
          }
        | {
            Args: { geom: unknown; quadsegs: number; radius: number };
            Returns: unknown;
          };
      st_centroid: { Args: { "": string }; Returns: unknown };
      st_clipbybox2d: {
        Args: { box: unknown; geom: unknown };
        Returns: unknown;
      };
      st_closestpoint: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: unknown;
      };
      st_collect: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: unknown;
      };
      st_concavehull: {
        Args: {
          param_allow_holes?: boolean;
          param_geom: unknown;
          param_pctconvex: number;
        };
        Returns: unknown;
      };
      st_contains: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: boolean;
      };
      st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: boolean;
      };
      st_coorddim: { Args: { geometry: unknown }; Returns: number };
      st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean };
      st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean };
      st_crosses: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: boolean;
      };
      st_curvetoline: {
        Args: { flags?: number; geom: unknown; tol?: number; toltype?: number };
        Returns: unknown;
      };
      st_delaunaytriangles: {
        Args: { flags?: number; g1: unknown; tolerance?: number };
        Returns: unknown;
      };
      st_difference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number };
        Returns: unknown;
      };
      st_disjoint: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: boolean;
      };
      st_distance:
        | {
            Args: { geog1: unknown; geog2: unknown; use_spheroid?: boolean };
            Returns: number;
          }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number };
      st_distancesphere:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
        | {
            Args: { geom1: unknown; geom2: unknown; radius: number };
            Returns: number;
          };
      st_distancespheroid: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: number;
      };
      st_dwithin: {
        Args: {
          geog1: unknown;
          geog2: unknown;
          tolerance: number;
          use_spheroid?: boolean;
        };
        Returns: boolean;
      };
      st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean };
      st_expand:
        | { Args: { box: unknown; dx: number; dy: number }; Returns: unknown }
        | {
            Args: { box: unknown; dx: number; dy: number; dz?: number };
            Returns: unknown;
          }
        | {
            Args: {
              dm?: number;
              dx: number;
              dy: number;
              dz?: number;
              geom: unknown;
            };
            Returns: unknown;
          };
      st_force3d: {
        Args: { geom: unknown; zvalue?: number };
        Returns: unknown;
      };
      st_force3dm: {
        Args: { geom: unknown; mvalue?: number };
        Returns: unknown;
      };
      st_force3dz: {
        Args: { geom: unknown; zvalue?: number };
        Returns: unknown;
      };
      st_force4d: {
        Args: { geom: unknown; mvalue?: number; zvalue?: number };
        Returns: unknown;
      };
      st_generatepoints:
        | { Args: { area: unknown; npoints: number }; Returns: unknown }
        | {
            Args: { area: unknown; npoints: number; seed: number };
            Returns: unknown;
          };
      st_geogfromtext: { Args: { "": string }; Returns: unknown };
      st_geographyfromtext: { Args: { "": string }; Returns: unknown };
      st_geohash:
        | { Args: { geog: unknown; maxchars?: number }; Returns: string }
        | { Args: { geom: unknown; maxchars?: number }; Returns: string };
      st_geomcollfromtext: { Args: { "": string }; Returns: unknown };
      st_geometricmedian: {
        Args: {
          fail_if_not_converged?: boolean;
          g: unknown;
          max_iter?: number;
          tolerance?: number;
        };
        Returns: unknown;
      };
      st_geometryfromtext: { Args: { "": string }; Returns: unknown };
      st_geomfromewkt: { Args: { "": string }; Returns: unknown };
      st_geomfromgeojson:
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": string }; Returns: unknown };
      st_geomfromgml: { Args: { "": string }; Returns: unknown };
      st_geomfromkml: { Args: { "": string }; Returns: unknown };
      st_geomfrommarc21: { Args: { marc21xml: string }; Returns: unknown };
      st_geomfromtext: { Args: { "": string }; Returns: unknown };
      st_gmltosql: { Args: { "": string }; Returns: unknown };
      st_hasarc: { Args: { geometry: unknown }; Returns: boolean };
      st_hausdorffdistance: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: number;
      };
      st_hexagon: {
        Args: {
          cell_i: number;
          cell_j: number;
          origin?: unknown;
          size: number;
        };
        Returns: unknown;
      };
      st_hexagongrid: {
        Args: { bounds: unknown; size: number };
        Returns: Record<string, unknown>[];
      };
      st_interpolatepoint: {
        Args: { line: unknown; point: unknown };
        Returns: number;
      };
      st_intersection: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number };
        Returns: unknown;
      };
      st_intersects:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean };
      st_isvaliddetail: {
        Args: { flags?: number; geom: unknown };
        Returns: Database["public"]["CompositeTypes"]["valid_detail"];
        SetofOptions: {
          from: "*";
          to: "valid_detail";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      st_length:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number };
      st_letters: { Args: { font?: Json; letters: string }; Returns: unknown };
      st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown };
        Returns: number;
      };
      st_linefromencodedpolyline: {
        Args: { nprecision?: number; txtin: string };
        Returns: unknown;
      };
      st_linefromtext: { Args: { "": string }; Returns: unknown };
      st_linelocatepoint: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: number;
      };
      st_linetocurve: { Args: { geometry: unknown }; Returns: unknown };
      st_locatealong: {
        Args: { geometry: unknown; leftrightoffset?: number; measure: number };
        Returns: unknown;
      };
      st_locatebetween: {
        Args: {
          frommeasure: number;
          geometry: unknown;
          leftrightoffset?: number;
          tomeasure: number;
        };
        Returns: unknown;
      };
      st_locatebetweenelevations: {
        Args: { fromelevation: number; geometry: unknown; toelevation: number };
        Returns: unknown;
      };
      st_longestline: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: unknown;
      };
      st_makebox2d: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: unknown;
      };
      st_makeline: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: unknown;
      };
      st_makevalid: {
        Args: { geom: unknown; params: string };
        Returns: unknown;
      };
      st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: number;
      };
      st_minimumboundingcircle: {
        Args: { inputgeom: unknown; segs_per_quarter?: number };
        Returns: unknown;
      };
      st_mlinefromtext: { Args: { "": string }; Returns: unknown };
      st_mpointfromtext: { Args: { "": string }; Returns: unknown };
      st_mpolyfromtext: { Args: { "": string }; Returns: unknown };
      st_multilinestringfromtext: { Args: { "": string }; Returns: unknown };
      st_multipointfromtext: { Args: { "": string }; Returns: unknown };
      st_multipolygonfromtext: { Args: { "": string }; Returns: unknown };
      st_node: { Args: { g: unknown }; Returns: unknown };
      st_normalize: { Args: { geom: unknown }; Returns: unknown };
      st_offsetcurve: {
        Args: { distance: number; line: unknown; params?: string };
        Returns: unknown;
      };
      st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: boolean;
      };
      st_overlaps: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: boolean;
      };
      st_perimeter: {
        Args: { geog: unknown; use_spheroid?: boolean };
        Returns: number;
      };
      st_pointfromtext: { Args: { "": string }; Returns: unknown };
      st_pointm: {
        Args: {
          mcoordinate: number;
          srid?: number;
          xcoordinate: number;
          ycoordinate: number;
        };
        Returns: unknown;
      };
      st_pointz: {
        Args: {
          srid?: number;
          xcoordinate: number;
          ycoordinate: number;
          zcoordinate: number;
        };
        Returns: unknown;
      };
      st_pointzm: {
        Args: {
          mcoordinate: number;
          srid?: number;
          xcoordinate: number;
          ycoordinate: number;
          zcoordinate: number;
        };
        Returns: unknown;
      };
      st_polyfromtext: { Args: { "": string }; Returns: unknown };
      st_polygonfromtext: { Args: { "": string }; Returns: unknown };
      st_project: {
        Args: { azimuth: number; distance: number; geog: unknown };
        Returns: unknown;
      };
      st_quantizecoordinates: {
        Args: {
          g: unknown;
          prec_m?: number;
          prec_x: number;
          prec_y?: number;
          prec_z?: number;
        };
        Returns: unknown;
      };
      st_reduceprecision: {
        Args: { geom: unknown; gridsize: number };
        Returns: unknown;
      };
      st_relate: { Args: { geom1: unknown; geom2: unknown }; Returns: string };
      st_removerepeatedpoints: {
        Args: { geom: unknown; tolerance?: number };
        Returns: unknown;
      };
      st_segmentize: {
        Args: { geog: unknown; max_segment_length: number };
        Returns: unknown;
      };
      st_setsrid:
        | { Args: { geog: unknown; srid: number }; Returns: unknown }
        | { Args: { geom: unknown; srid: number }; Returns: unknown };
      st_sharedpaths: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: unknown;
      };
      st_shortestline: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: unknown;
      };
      st_simplifypolygonhull: {
        Args: { geom: unknown; is_outer?: boolean; vertex_fraction: number };
        Returns: unknown;
      };
      st_split: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown };
      st_square: {
        Args: {
          cell_i: number;
          cell_j: number;
          origin?: unknown;
          size: number;
        };
        Returns: unknown;
      };
      st_squaregrid: {
        Args: { bounds: unknown; size: number };
        Returns: Record<string, unknown>[];
      };
      st_srid:
        | { Args: { geog: unknown }; Returns: number }
        | { Args: { geom: unknown }; Returns: number };
      st_subdivide: {
        Args: { geom: unknown; gridsize?: number; maxvertices?: number };
        Returns: unknown[];
      };
      st_swapordinates: {
        Args: { geom: unknown; ords: unknown };
        Returns: unknown;
      };
      st_symdifference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number };
        Returns: unknown;
      };
      st_symmetricdifference: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: unknown;
      };
      st_tileenvelope: {
        Args: {
          bounds?: unknown;
          margin?: number;
          x: number;
          y: number;
          zoom: number;
        };
        Returns: unknown;
      };
      st_touches: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: boolean;
      };
      st_transform:
        | {
            Args: { from_proj: string; geom: unknown; to_proj: string };
            Returns: unknown;
          }
        | {
            Args: { from_proj: string; geom: unknown; to_srid: number };
            Returns: unknown;
          }
        | { Args: { geom: unknown; to_proj: string }; Returns: unknown };
      st_triangulatepolygon: { Args: { g1: unknown }; Returns: unknown };
      st_union:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
        | {
            Args: { geom1: unknown; geom2: unknown; gridsize: number };
            Returns: unknown;
          };
      st_voronoilines: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number };
        Returns: unknown;
      };
      st_voronoipolygons: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number };
        Returns: unknown;
      };
      st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean };
      st_wkbtosql: { Args: { wkb: string }; Returns: unknown };
      st_wkttosql: { Args: { "": string }; Returns: unknown };
      st_wrapx: {
        Args: { geom: unknown; move: number; wrap: number };
        Returns: unknown;
      };
      unlockrows: { Args: { "": string }; Returns: number };
      updategeometrysrid: {
        Args: {
          catalogn_name: string;
          column_name: string;
          new_srid_in: number;
          schema_name: string;
          table_name: string;
        };
        Returns: string;
      };
      user_has_deal_access: { Args: { deal_uuid: string }; Returns: boolean };
    };
    Enums: {
      commitment_status:
        | "draft"
        | "issued"
        | "pending_sponsor"
        | "pending_cde"
        | "all_accepted"
        | "rejected"
        | "withdrawn"
        | "expired"
        | "closing"
        | "closed";
      deal_status:
        | "draft"
        | "submitted"
        | "under_review"
        | "available"
        | "seeking_capital"
        | "matched"
        | "closing"
        | "closed"
        | "withdrawn";
      discord_channel_type: "TEXT" | "AUDIO" | "VIDEO";
      discord_member_role: "ADMIN" | "MODERATOR" | "GUEST";
      discord_server_type: "organization" | "deal" | "closing_room";
      document_status: "pending" | "approved" | "rejected" | "needs_review";
      ledger_action:
        | "application_created"
        | "application_updated"
        | "application_submitted"
        | "application_status_changed"
        | "distress_score_calculated"
        | "impact_score_calculated"
        | "eligibility_determined"
        | "cde_match_suggested"
        | "cde_match_accepted"
        | "cde_match_rejected"
        | "cde_match_override"
        | "document_uploaded"
        | "document_hashed"
        | "document_signed"
        | "document_executed"
        | "closing_initiated"
        | "closing_milestone_reached"
        | "funding_approved"
        | "funding_disbursed"
        | "closing_completed"
        | "compliance_check_performed"
        | "annual_report_submitted"
        | "amendment_recorded";
      ledger_actor_type: "system" | "human" | "api_key";
      ledger_entity_type:
        | "application"
        | "project"
        | "tract"
        | "cde"
        | "investor"
        | "sponsor"
        | "document"
        | "closing"
        | "qalicb"
        | "qlici";
      loi_status:
        | "draft"
        | "issued"
        | "pending_sponsor"
        | "sponsor_accepted"
        | "sponsor_rejected"
        | "sponsor_countered"
        | "withdrawn"
        | "expired"
        | "superseded";
      org_type: "cde" | "sponsor" | "investor" | "admin";
      program_combo: "NMTC_HTC_STATE";
      program_type: "NMTC" | "HTC" | "LIHTC" | "OZ" | "Brownfield";
      relationship_status:
        | "contacted"
        | "viewed"
        | "in_review"
        | "interested"
        | "verbal_approval"
        | "loi_issued"
        | "loi_accepted"
        | "committed"
        | "closing"
        | "closed"
        | "denied"
        | "withdrawn"
        | "expired";
      user_role: "ORG_ADMIN" | "PROJECT_ADMIN" | "MEMBER" | "VIEWER";
    };
    CompositeTypes: {
      geometry_dump: {
        path: number[] | null;
        geom: unknown;
      };
      valid_detail: {
        valid: boolean | null;
        reason: string | null;
        location: unknown;
      };
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      commitment_status: [
        "draft",
        "issued",
        "pending_sponsor",
        "pending_cde",
        "all_accepted",
        "rejected",
        "withdrawn",
        "expired",
        "closing",
        "closed",
      ],
      deal_status: [
        "draft",
        "submitted",
        "under_review",
        "available",
        "seeking_capital",
        "matched",
        "closing",
        "closed",
        "withdrawn",
      ],
      discord_channel_type: ["TEXT", "AUDIO", "VIDEO"],
      discord_member_role: ["ADMIN", "MODERATOR", "GUEST"],
      discord_server_type: ["organization", "deal", "closing_room"],
      document_status: ["pending", "approved", "rejected", "needs_review"],
      ledger_action: [
        "application_created",
        "application_updated",
        "application_submitted",
        "application_status_changed",
        "distress_score_calculated",
        "impact_score_calculated",
        "eligibility_determined",
        "cde_match_suggested",
        "cde_match_accepted",
        "cde_match_rejected",
        "cde_match_override",
        "document_uploaded",
        "document_hashed",
        "document_signed",
        "document_executed",
        "closing_initiated",
        "closing_milestone_reached",
        "funding_approved",
        "funding_disbursed",
        "closing_completed",
        "compliance_check_performed",
        "annual_report_submitted",
        "amendment_recorded",
      ],
      ledger_actor_type: ["system", "human", "api_key"],
      ledger_entity_type: [
        "application",
        "project",
        "tract",
        "cde",
        "investor",
        "sponsor",
        "document",
        "closing",
        "qalicb",
        "qlici",
      ],
      loi_status: [
        "draft",
        "issued",
        "pending_sponsor",
        "sponsor_accepted",
        "sponsor_rejected",
        "sponsor_countered",
        "withdrawn",
        "expired",
        "superseded",
      ],
      org_type: ["cde", "sponsor", "investor", "admin"],
      program_combo: ["NMTC_HTC_STATE"],
      program_type: ["NMTC", "HTC", "LIHTC", "OZ", "Brownfield"],
      relationship_status: [
        "contacted",
        "viewed",
        "in_review",
        "interested",
        "verbal_approval",
        "loi_issued",
        "loi_accepted",
        "committed",
        "closing",
        "closed",
        "denied",
        "withdrawn",
        "expired",
      ],
      user_role: ["ORG_ADMIN", "PROJECT_ADMIN", "MEMBER", "VIEWER"],
    },
  },
} as const;
