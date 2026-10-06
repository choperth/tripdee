/**
 * Supabase Database Schema Definitions for TripDee
 */

import { ZoneId } from '@/data/mockData';
import type { LeadFeeStatus, OrgType, VehicleTier } from '@/lib/b2b';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type QuotationStatus = 'pending' | 'quoted' | 'confirmed' | 'cancelled';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'expired';

export interface Booking {
  id: string;
  vehicleId?: string | null;
  driverId?: string | null;
  customerName: string;
  customerPhone: string;
  customerLine?: string | null;
  route: string;
  travelDate: string;
  totalDays: number;
  totalPrice: number;
  depositAmount: number;
  remainingAmount: number;
  paymentStatus: PaymentStatus;
  chillpayTransactionId?: string | null;
  chillpayPaymentUrl?: string | null;
  chillpayQrPayload?: string | null;
  isContactUnlocked: boolean;
  createdAt: string;
  paidAt?: string | null;
}

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
          car_count: number;
          vehicle_tier: VehicleTier;
          org_type: OrgType;
          include_insurance: boolean;
          assigned_partner: string | null;
          lead_fee_status: LeadFeeStatus;
          lead_fee_amount: number;
          status: QuotationStatus;
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
          car_count?: number;
          vehicle_tier?: VehicleTier;
          org_type?: OrgType;
          include_insurance?: boolean;
          assigned_partner?: string | null;
          lead_fee_status?: LeadFeeStatus;
          lead_fee_amount?: number;
          status?: QuotationStatus;
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
          car_count?: number;
          vehicle_tier?: VehicleTier;
          org_type?: OrgType;
          include_insurance?: boolean;
          assigned_partner?: string | null;
          lead_fee_status?: LeadFeeStatus;
          lead_fee_amount?: number;
          status?: QuotationStatus;
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
          whatsapp?: string | null;
          wechat?: string | null;
          kakao?: string | null;
          vehicle_model: string;
          seats: string;
          plate_number: string | null;
          routes: string;
          status: 'pending' | 'verified' | 'rejected';
          plate_type: 'yellow' | 'blue' | null;
          can_issue_tax_invoice: boolean | null;
          business_type: 'company' | 'individual' | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          driver_name: string;
          nickname: string;
          phone: string;
          line_id?: string;
          whatsapp?: string | null;
          wechat?: string | null;
          kakao?: string | null;
          vehicle_model?: string;
          seats?: string;
          plate_number?: string | null;
          routes?: string;
          status?: 'pending' | 'verified' | 'rejected';
          plate_type?: 'yellow' | 'blue' | null;
          can_issue_tax_invoice?: boolean | null;
          business_type?: 'company' | 'individual' | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          driver_name?: string;
          nickname?: string;
          phone?: string;
          line_id?: string;
          whatsapp?: string | null;
          wechat?: string | null;
          kakao?: string | null;
          vehicle_model?: string;
          seats?: string;
          plate_number?: string | null;
          routes?: string;
          status?: 'pending' | 'verified' | 'rejected';
          plate_type?: 'yellow' | 'blue' | null;
          can_issue_tax_invoice?: boolean | null;
          business_type?: 'company' | 'individual' | null;
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
          plate_type: 'yellow' | 'blue' | null;
          plate_number: string | null;
          can_issue_tax_invoice: boolean | null;
          business_type: 'company' | 'individual' | null;
          is_available: boolean | null;
          rental_type?: 'with_driver' | 'self_drive' | null;
          transmission?: 'auto' | 'manual' | null;
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
          driver_line?: string | null;
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
          plate_type?: 'yellow' | 'blue' | null;
          plate_number?: string | null;
          can_issue_tax_invoice?: boolean | null;
          business_type?: 'company' | 'individual' | null;
          is_available?: boolean | null;
          rental_type?: 'with_driver' | 'self_drive' | null;
          transmission?: 'auto' | 'manual' | null;
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
          driver_line?: string | null;
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
          plate_type?: 'yellow' | 'blue' | null;
          plate_number?: string | null;
          can_issue_tax_invoice?: boolean | null;
          business_type?: 'company' | 'individual' | null;
          is_available?: boolean | null;
          rental_type?: 'with_driver' | 'self_drive' | null;
          transmission?: 'auto' | 'manual' | null;
          created_at?: string;
        };
        Relationships: [];
      };
      board_posts: {
        Row: {
          id: string;
          type: 'request' | 'share' | 'offer';
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
          author_whatsapp?: string | null;
          author_wechat?: string | null;
          vehicle_label: string | null;
          detail: string;
          posted_at: string;
          is_verified: boolean;
          category: 'general' | 'corporate' | null;
          pin: string | null;
          is_closed: boolean | null;
          is_negotiable?: boolean | null;
          max_quotes?: number | null;
          quote_count?: number | null;
          accepted_quote_id?: string | null;
          view_token?: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          type: 'request' | 'share' | 'offer';
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
          author_whatsapp?: string | null;
          author_wechat?: string | null;
          vehicle_label?: string | null;
          detail: string;
          posted_at?: string;
          is_verified?: boolean;
          category?: 'general' | 'corporate' | null;
          pin?: string | null;
          is_closed?: boolean | null;
          is_negotiable?: boolean | null;
          max_quotes?: number | null;
          quote_count?: number | null;
          accepted_quote_id?: string | null;
          view_token?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          type?: 'request' | 'share' | 'offer';
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
          author_whatsapp?: string | null;
          author_wechat?: string | null;
          vehicle_label?: string | null;
          detail?: string;
          posted_at?: string;
          is_verified?: boolean;
          category?: 'general' | 'corporate' | null;
          pin?: string | null;
          is_closed?: boolean | null;
          is_negotiable?: boolean | null;
          max_quotes?: number | null;
          quote_count?: number | null;
          accepted_quote_id?: string | null;
          view_token?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      board_quotes: {
        Row: {
          id: string;
          post_id: string;
          driver_name: string;
          driver_phone: string;
          driver_line: string | null;
          driver_whatsapp?: string | null;
          vehicle_model: string;
          price: number;
          price_note: string | null;
          message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          driver_name: string;
          driver_phone: string;
          driver_line?: string | null;
          driver_whatsapp?: string | null;
          vehicle_model: string;
          price: number;
          price_note?: string | null;
          message?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          driver_name?: string;
          driver_phone?: string;
          driver_line?: string | null;
          driver_whatsapp?: string | null;
          vehicle_model?: string;
          price?: number;
          price_note?: string | null;
          message?: string | null;
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
      sponsors: {
        Row: {
          id: string;
          title: string;
          category: 'hotel' | 'auto_service' | 'restaurant' | 'activity' | 'insurance' | 'fuel' | 'tour' | 'cooking';
          category_label: string;
          tagline: string | null;
          badge_text: string | null;
          image: string;
          link: string;
          discount_text: string | null;
          location: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          title: string;
          category: 'hotel' | 'auto_service' | 'restaurant' | 'activity' | 'insurance' | 'fuel' | 'tour' | 'cooking';
          category_label: string;
          tagline?: string | null;
          badge_text?: string | null;
          image: string;
          link: string;
          discount_text?: string | null;
          location?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          category?: 'hotel' | 'auto_service' | 'restaurant' | 'activity' | 'insurance' | 'fuel' | 'tour' | 'cooking';
          category_label?: string;
          tagline?: string | null;
          badge_text?: string | null;
          image?: string;
          link?: string;
          discount_text?: string | null;
          location?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      push_subscriptions: {
        Row: {
          id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          role: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          role?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          endpoint?: string;
          p256dh?: string;
          auth?: string;
          role?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      bookings: {
        Row: {
          id: string;
          vehicle_id: string | null;
          driver_id: string | null;
          customer_name: string;
          customer_phone: string;
          customer_line: string | null;
          route: string;
          travel_date: string;
          total_days: number;
          total_price: number;
          deposit_amount: number;
          remaining_amount: number;
          payment_status: PaymentStatus;
          chillpay_transaction_id: string | null;
          chillpay_payment_url: string | null;
          chillpay_qr_payload: string | null;
          is_contact_unlocked: boolean;
          created_at: string;
          paid_at: string | null;
        };
        Insert: {
          id?: string;
          vehicle_id?: string | null;
          driver_id?: string | null;
          customer_name: string;
          customer_phone: string;
          customer_line?: string | null;
          route: string;
          travel_date: string;
          total_days?: number;
          total_price: number;
          deposit_amount: number;
          remaining_amount: number;
          payment_status?: PaymentStatus;
          chillpay_transaction_id?: string | null;
          chillpay_payment_url?: string | null;
          chillpay_qr_payload?: string | null;
          is_contact_unlocked?: boolean;
          created_at?: string;
          paid_at?: string | null;
        };
        Update: {
          id?: string;
          vehicle_id?: string | null;
          driver_id?: string | null;
          customer_name?: string;
          customer_phone?: string;
          customer_line?: string | null;
          route?: string;
          travel_date?: string;
          total_days?: number;
          total_price?: number;
          deposit_amount?: number;
          remaining_amount?: number;
          payment_status?: PaymentStatus;
          chillpay_transaction_id?: string | null;
          chillpay_payment_url?: string | null;
          chillpay_qr_payload?: string | null;
          is_contact_unlocked?: boolean;
          created_at?: string;
          paid_at?: string | null;
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
