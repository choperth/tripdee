/**
 * Supabase Database Schema Definitions for TripDee
 */

import { ZoneId } from '@/data/mockData';

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
      quotations: {
        Row: {
          id: string;
          company_name: string;
          contact_name: string | null;
          phone: string;
          travel_date: string;
          route: string;
          passengers: string;
          needs_tax_invoice: boolean;
          estimated_price: number;
          status: 'pending' | 'quoted' | 'confirmed';
          created_at: string;
        };
        Insert: {
          id?: string;
          company_name: string;
          contact_name?: string | null;
          phone: string;
          travel_date?: string;
          route?: string;
          passengers?: string;
          needs_tax_invoice?: boolean;
          estimated_price?: number;
          status?: 'pending' | 'quoted' | 'confirmed';
          created_at?: string;
        };
        Update: {
          id?: string;
          company_name?: string;
          contact_name?: string | null;
          phone?: string;
          travel_date?: string;
          route?: string;
          passengers?: string;
          needs_tax_invoice?: boolean;
          estimated_price?: number;
          status?: 'pending' | 'quoted' | 'confirmed';
          created_at?: string;
        };
        Relationships: [];
      };
      driver_leads: {
        Row: {
          id: string;
          driver_name: string;
          nickname: string;
          phone: string;
          line_id: string;
          vehicle_model: string;
          seats: string;
          plate_number: string | null;
          routes: string;
          status: 'pending' | 'verified' | 'rejected';
          created_at: string;
        };
        Insert: {
          id?: string;
          driver_name: string;
          nickname: string;
          phone: string;
          line_id?: string;
          vehicle_model?: string;
          seats?: string;
          plate_number?: string | null;
          routes?: string;
          status?: 'pending' | 'verified' | 'rejected';
          created_at?: string;
        };
        Update: {
          id?: string;
          driver_name?: string;
          nickname?: string;
          phone?: string;
          line_id?: string;
          vehicle_model?: string;
          seats?: string;
          plate_number?: string | null;
          routes?: string;
          status?: 'pending' | 'verified' | 'rejected';
          created_at?: string;
        };
        Relationships: [];
      };
      vehicles: {
        Row: {
          id: string;
          title: string;
          type: 'van' | 'car' | 'suv';
          seats: number;
          driver_name: string;
          driver_nickname: string;
          driver_phone: string;
          driver_line: string;
          driver_whatsapp: string | null;
          driver_wechat: string | null;
          driver_kakao: string | null;
          languages: string[];
          rating: number;
          review_count: number;
          is_verified: boolean;
          images: string[];
          zone_rates: Record<ZoneId, number>;
          rate_note: string | null;
          location: string;
          region: string;
          popular_routes: string[];
          amenities: string[];
          description: string;
          created_at: string;
        };
        Insert: {
          id: string;
          title: string;
          type: 'van' | 'car' | 'suv';
          seats: number;
          driver_name: string;
          driver_nickname: string;
          driver_phone: string;
          driver_line?: string;
          driver_whatsapp?: string | null;
          driver_wechat?: string | null;
          driver_kakao?: string | null;
          languages?: string[];
          rating?: number;
          review_count?: number;
          is_verified?: boolean;
          images: string[];
          zone_rates: Record<ZoneId, number>;
          rate_note?: string | null;
          location: string;
          region?: string;
          popular_routes?: string[];
          amenities?: string[];
          description?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          type?: 'van' | 'car' | 'suv';
          seats?: number;
          driver_name?: string;
          driver_nickname?: string;
          driver_phone?: string;
          driver_line?: string;
          driver_whatsapp?: string | null;
          driver_wechat?: string | null;
          driver_kakao?: string | null;
          languages?: string[];
          rating?: number;
          review_count?: number;
          is_verified?: boolean;
          images?: string[];
          zone_rates?: Record<ZoneId, number>;
          rate_note?: string | null;
          location?: string;
          region?: string;
          popular_routes?: string[];
          amenities?: string[];
          description?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      board_posts: {
        Row: {
          id: string;
          type: 'request' | 'offer';
          title: string;
          zone_id: ZoneId;
          date: string;
          days: number;
          seats: number;
          price: number;
          price_note: string | null;
          author_name: string;
          author_phone: string;
          author_line: string;
          vehicle_label: string | null;
          detail: string;
          posted_at: string;
          is_verified: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          type: 'request' | 'offer';
          title: string;
          zone_id: ZoneId;
          date: string;
          days?: number;
          seats?: number;
          price: number;
          price_note?: string | null;
          author_name: string;
          author_phone: string;
          author_line: string;
          vehicle_label?: string | null;
          detail: string;
          posted_at?: string;
          is_verified?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          type?: 'request' | 'offer';
          title?: string;
          zone_id?: ZoneId;
          date?: string;
          days?: number;
          seats?: number;
          price?: number;
          price_note?: string | null;
          author_name?: string;
          author_phone?: string;
          author_line?: string;
          vehicle_label?: string | null;
          detail?: string;
          posted_at?: string;
          is_verified?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      analytics_events: {
        Row: {
          id: number;
          event_name: string;
          driver_id: string | null;
          sponsor_id: string | null;
          channel: string | null;
          route_id: string | null;
          timestamp: string;
          meta: Json | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          event_name: string;
          driver_id?: string | null;
          sponsor_id?: string | null;
          channel?: string | null;
          route_id?: string | null;
          timestamp?: string;
          meta?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          event_name?: string;
          driver_id?: string | null;
          sponsor_id?: string | null;
          channel?: string | null;
          route_id?: string | null;
          timestamp?: string;
          meta?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
