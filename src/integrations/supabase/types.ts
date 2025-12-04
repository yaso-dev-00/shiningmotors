export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)";
  };
  public: {
    Tables: {
      cart_items: {
        Row: {
          created_at: string;
          id: string;
          product_id: string;
          quantity: number;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          product_id: string;
          quantity?: number;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          product_id?: string;
          quantity?: number;
          user_id?: string;
        };
        Relationships: [];
      };
      comments: {
        Row: {
          content: string;
          created_at: string;
          id: string;
          parent_id: string | null;
          post_id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          content: string;
          created_at?: string;
          id?: string;
          parent_id?: string | null;
          post_id: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          id?: string;
          parent_id?: string | null;
          post_id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comments_user_id_fkey1";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      event_registrations: {
        Row: {
          created_at: string;
          device_info: Json | null;
          event_id: string;
          id: string;
          payment_amount: number | null;
          payment_currency: string | null;
          payment_id: string | null;
          payment_status: string | null;
          registration_data: Json | null;
          status: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          device_info?: Json | null;
          event_id: string;
          id?: string;
          payment_amount?: number | null;
          payment_currency?: string | null;
          payment_id?: string | null;
          payment_status?: string | null;
          registration_data?: Json | null;
          status?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          device_info?: Json | null;
          event_id?: string;
          id?: string;
          payment_amount?: number | null;
          payment_currency?: string | null;
          payment_id?: string | null;
          payment_status?: string | null;
          registration_data?: Json | null;
          status?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "event_registrations_user_id_fkey1";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      events: {
        Row: {
          banner_image_url: string | null;
          category: string;
          category_details: Json | null;
          city: string | null;
          country: string | null;
          created_at: string;
          created_by: string | null;
          description: string | null;
          end_date: string | null;
          end_time: string | null;
          features: string[] | null;
          fee_amount: number | null;
          fee_currency: string | null;
          gallery_urls: string[] | null;
          id: string;
          max_participants: number | null;
          organizer_id: string | null;
          promo_video_url: string | null;
          registration_end_date: string | null;
          registration_required: boolean | null;
          registration_start_date: string | null;
          start_date: string | null;
          start_time: string | null;
          state: string | null;
          status: string;
          tags: string[] | null;
          title: string;
          updated_at: string;
          venue: string | null;
        };
        Insert: {
          banner_image_url?: string | null;
          category: string;
          category_details?: Json | null;
          city?: string | null;
          country?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          end_date?: string | null;
          end_time?: string | null;
          features?: string[] | null;
          fee_amount?: number | null;
          fee_currency?: string | null;
          gallery_urls?: string[] | null;
          id?: string;
          max_participants?: number | null;
          organizer_id?: string | null;
          promo_video_url?: string | null;
          registration_end_date?: string | null;
          registration_required?: boolean | null;
          registration_start_date?: string | null;
          start_date?: string | null;
          start_time?: string | null;
          state?: string | null;
          status?: string;
          tags?: string[] | null;
          title: string;
          updated_at?: string;
          venue?: string | null;
        };
        Update: {
          banner_image_url?: string | null;
          category?: string;
          category_details?: Json | null;
          city?: string | null;
          country?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          end_date?: string | null;
          end_time?: string | null;
          features?: string[] | null;
          fee_amount?: number | null;
          fee_currency?: string | null;
          gallery_urls?: string[] | null;
          id?: string;
          max_participants?: number | null;
          organizer_id?: string | null;
          promo_video_url?: string | null;
          registration_end_date?: string | null;
          registration_required?: boolean | null;
          registration_start_date?: string | null;
          start_date?: string | null;
          start_time?: string | null;
          state?: string | null;
          status?: string;
          tags?: string[] | null;
          title?: string;
          updated_at?: string;
          venue?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "events_organizer_id_fkey1";
            columns: ["organizer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      Filters: {
        Row: {
          category: string;
          created_at: string;
          filters: Json | null;
          id: number;
          product_ids: Json | null;
        };
        Insert: {
          category: string;
          created_at?: string;
          filters?: Json | null;
          id?: number;
          product_ids?: Json | null;
        };
        Update: {
          category?: string;
          created_at?: string;
          filters?: Json | null;
          id?: number;
          product_ids?: Json | null;
        };
        Relationships: [];
      };
      likes: {
        Row: {
          created_at: string;
          id: string;
          post_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          post_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          post_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "likes_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          }
        ];
      };
      messages: {
        Row: {
          content: string | null;
          created_at: string | null;
          id: string;
          message_type: Database["public"]["Enums"]["message_type"] | null;
          reaction: string | null;
          receiver_id: string | null;
          sender_id: string;
        };
        Insert: {
          content?: string | null;
          created_at?: string | null;
          id?: string;
          message_type?: Database["public"]["Enums"]["message_type"] | null;
          reaction?: string | null;
          receiver_id?: string | null;
          sender_id: string;
        };
        Update: {
          content?: string | null;
          created_at?: string | null;
          id?: string;
          message_type?: Database["public"]["Enums"]["message_type"] | null;
          reaction?: string | null;
          receiver_id?: string | null;
          sender_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "messages_receiver_id_fkey";
            columns: ["receiver_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      notifications: {
        Row: {
          created_at: string;
          data: Json | null;
          id: string;
          message: string;
          read: boolean | null;
          title: string;
          type: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          data?: Json | null;
          id?: string;
          message: string;
          read?: boolean | null;
          title: string;
          type: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          data?: Json | null;
          id?: string;
          message?: string;
          read?: boolean | null;
          title?: string;
          type?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          created_at: string;
          id: string;
          order_id: string;
          price: number;
          product_id: string | null;
          quantity: number;
          simProduct_id: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          order_id: string;
          price: number;
          product_id?: string | null;
          quantity?: number;
          simProduct_id?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          order_id?: string;
          price?: number;
          product_id?: string | null;
          quantity?: number;
          simProduct_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_simProduct_id_fkey";
            columns: ["simProduct_id"];
            isOneToOne: false;
            referencedRelation: "sim_products";
            referencedColumns: ["id"];
          }
        ];
      };
      orders: {
        Row: {
          created_at: string;
          id: string;
          payment_intent_id: string | null;
          shipping_address: Json | null;
          status: string;
          stripe_session_id: string | null;
          total: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          payment_intent_id?: string | null;
          shipping_address?: Json | null;
          status?: string;
          stripe_session_id?: string | null;
          total: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          payment_intent_id?: string | null;
          shipping_address?: Json | null;
          status?: string;
          stripe_session_id?: string | null;
          total?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey1";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      posts: {
        Row: {
          category: string | null;
          comments_count: number | null;
          content: string | null;
          created_at: string;
          id: string;
          likes: string[] | null;
          likes_count: number | null;
          location: string | null;
          media_urls: string[] | null;
          reference_id: string | null;
          tags: string[] | null;
          updated_at: string;
          user_id: string;
          user_tag: string | null;
        };
        Insert: {
          category?: string | null;
          comments_count?: number | null;
          content?: string | null;
          created_at?: string;
          id?: string;
          likes?: string[] | null;
          likes_count?: number | null;
          location?: string | null;
          media_urls?: string[] | null;
          reference_id?: string | null;
          tags?: string[] | null;
          updated_at?: string;
          user_id: string;
          user_tag?: string | null;
        };
        Update: {
          category?: string | null;
          comments_count?: number | null;
          content?: string | null;
          created_at?: string;
          id?: string;
          likes?: string[] | null;
          likes_count?: number | null;
          location?: string | null;
          media_urls?: string[] | null;
          reference_id?: string | null;
          tags?: string[] | null;
          updated_at?: string;
          user_id?: string;
          user_tag?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "posts_user_id_fkey1";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      products: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          images: string[] | null
          inventory: number
          name: string
          parts: string | null
          price: number
          seller_id: string | null
          status: string | null
          subCategory: string | null
          updated_at: string
          weight: number | null
          length: number | null
          breadth: number | null
          height: number | null
          pickup_postcode: string | null
          gst_percentage: number | null
          filter_options: Json | null
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          inventory?: number
          name: string
          parts?: string | null
          price: number
          seller_id?: string | null
          status?: string | null
          subCategory?: string | null
          updated_at?: string
          weight?: number | null
          length?: number | null
          breadth?: number | null
          height?: number | null
          pickup_postcode?: string | null
          gst_percentage?: number | null
          filter_options?: Json | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          inventory?: number
          name?: string
          parts?: string | null
          price?: number
          seller_id?: string | null
          status?: string | null
          subCategory?: string | null
          updated_at?: string
          weight?: number | null
          length?: number | null
          breadth?: number | null
          height?: number | null
          pickup_postcode?: string | null
          gst_percentage?: number | null
          filter_options?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_seller";
            columns: ["seller_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          bio: string | null;
          cover_url: string | null;
          created_at: string;
          followers: string[] | null;
          following: string[] | null;
          full_name: string | null;
          id: string;
          is_vendor: boolean | null;
          is_verified: boolean | null;
          last_seen: string | null;
          location: string | null;
          mobile_phone: string | null;
          notification_preferences: Json | null;
          phone_verified: boolean | null;
          role: string | null;
          saved: string[] | null;
          tag: string[] | null;
          updated_at: string;
          username: string | null;
          vendor_categories: string[] | null;
          website: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          bio?: string | null;
          cover_url?: string | null;
          created_at?: string;
          followers?: string[] | null;
          following?: string[] | null;
          full_name?: string | null;
          id: string;
          is_vendor?: boolean | null;
          is_verified?: boolean | null;
          last_seen?: string | null;
          location?: string | null;
          mobile_phone?: string | null;
          notification_preferences?: Json | null;
          phone_verified?: boolean | null;
          role?: string | null;
          saved?: string[] | null;
          tag?: string[] | null;
          updated_at?: string;
          username?: string | null;
          vendor_categories?: string[] | null;
          website?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          bio?: string | null;
          cover_url?: string | null;
          created_at?: string;
          followers?: string[] | null;
          following?: string[] | null;
          full_name?: string | null;
          id?: string;
          is_vendor?: boolean | null;
          is_verified?: boolean | null;
          last_seen?: string | null;
          location?: string | null;
          mobile_phone?: string | null;
          notification_preferences?: Json | null;
          phone_verified?: boolean | null;
          role?: string | null;
          saved?: string[] | null;
          tag?: string[] | null;
          updated_at?: string;
          username?: string | null;
          vendor_categories?: string[] | null;
          website?: string | null;
        };
        Relationships: [];
      };
      push_subscriptions: {
        Row: {
          created_at: string;
          id: string;
          subscription: Json;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          subscription: Json;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          subscription?: Json;
          user_id?: string;
        };
        Relationships: [];
      };
      report: {
        Row: {
          content: string | null;
          created_at: string;
          id: string;
          post_id: string | null;
          user_id: string | null;
        };
        Insert: {
          content?: string | null;
          created_at?: string;
          id?: string;
          post_id?: string | null;
          user_id?: string | null;
        };
        Update: {
          content?: string | null;
          created_at?: string;
          id?: string;
          post_id?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "report_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "report_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      saved_post: {
        Row: {
          created_at: string;
          id: string;
          post_id: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          post_id?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          post_id?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "saved_post_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          }
        ];
      };
      service_bookings: {
        Row: {
          booking_date: string | null;
          booking_slot: string | null;
          created_at: string;
          id: number;
          notes: string | null;
          service_id: string | null;
          status: string | null;
          updated_at: string | null;
          user_id: string | null;
          vendor_id: string | null;
        };
        Insert: {
          booking_date?: string | null;
          booking_slot?: string | null;
          created_at?: string;
          id?: number;
          notes?: string | null;
          service_id?: string | null;
          status?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
          vendor_id?: string | null;
        };
        Update: {
          booking_date?: string | null;
          booking_slot?: string | null;
          created_at?: string;
          id?: number;
          notes?: string | null;
          service_id?: string | null;
          status?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
          vendor_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "service_bookings_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "services";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "service_bookings_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "service_bookings_vendor_id_fkey";
            columns: ["vendor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      services: {
        Row: {
          availability: Json | null;
          category: string | null;
          contact: string | null;
          created_at: string;
          description: string | null;
          duration: string | null;
          id: string;
          location: string | null;
          media_urls: string[] | null;
          price: string | null;
          title: string | null;
          vendor_id: string | null;
        };
        Insert: {
          availability?: Json | null;
          category?: string | null;
          contact?: string | null;
          created_at?: string;
          description?: string | null;
          duration?: string | null;
          id?: string;
          location?: string | null;
          media_urls?: string[] | null;
          price?: string | null;
          title?: string | null;
          vendor_id?: string | null;
        };
        Update: {
          availability?: Json | null;
          category?: string | null;
          contact?: string | null;
          created_at?: string;
          description?: string | null;
          duration?: string | null;
          id?: string;
          location?: string | null;
          media_urls?: string[] | null;
          price?: string | null;
          title?: string | null;
          vendor_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "services_vendor_id_fkey";
            columns: ["vendor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      sim_academy_courses: {
        Row: {
          content_type: string | null;
          created_at: string | null;
          description: string | null;
          difficulty:
            | Database["public"]["Enums"]["sim_difficulty_level"]
            | null;
          duration: number | null;
          id: string;
          instructor_id: string | null;
          price: number | null;
          title: string;
          type: string | null;
          updated_at: string | null;
        };
        Insert: {
          content_type?: string | null;
          created_at?: string | null;
          description?: string | null;
          difficulty?:
            | Database["public"]["Enums"]["sim_difficulty_level"]
            | null;
          duration?: number | null;
          id?: string;
          instructor_id?: string | null;
          price?: number | null;
          title: string;
          type?: string | null;
          updated_at?: string | null;
        };
        Update: {
          content_type?: string | null;
          created_at?: string | null;
          description?: string | null;
          difficulty?:
            | Database["public"]["Enums"]["sim_difficulty_level"]
            | null;
          duration?: number | null;
          id?: string;
          instructor_id?: string | null;
          price?: number | null;
          title?: string;
          type?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "sim_academy_courses_instructor_id_fkey";
            columns: ["instructor_id"];
            isOneToOne: false;
            referencedRelation: "sim_users";
            referencedColumns: ["id"];
          }
        ];
      };
      sim_creator_events: {
        Row: {
          creator_id: string | null;
          event_id: string | null;
          id: string;
          is_fan_voted: boolean | null;
          is_host: boolean | null;
        };
        Insert: {
          creator_id?: string | null;
          event_id?: string | null;
          id?: string;
          is_fan_voted?: boolean | null;
          is_host?: boolean | null;
        };
        Update: {
          creator_id?: string | null;
          event_id?: string | null;
          id?: string;
          is_fan_voted?: boolean | null;
          is_host?: boolean | null;
        };
        Relationships: [
          {
            foreignKeyName: "sim_creator_events_creator_id_fkey";
            columns: ["creator_id"];
            isOneToOne: false;
            referencedRelation: "sim_creators";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sim_creator_events_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "sim_events";
            referencedColumns: ["id"];
          }
        ];
      };
      sim_creator_livestreams: {
        Row: {
          creator_id: string | null;
          id: string;
          platform: string | null;
          scheduled_at: string | null;
          title: string | null;
          url: string;
        };
        Insert: {
          creator_id?: string | null;
          id?: string;
          platform?: string | null;
          scheduled_at?: string | null;
          title?: string | null;
          url: string;
        };
        Update: {
          creator_id?: string | null;
          id?: string;
          platform?: string | null;
          scheduled_at?: string | null;
          title?: string | null;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sim_creator_livestreams_creator_id_fkey";
            columns: ["creator_id"];
            isOneToOne: false;
            referencedRelation: "sim_creators";
            referencedColumns: ["id"];
          }
        ];
      };
      sim_creators: {
        Row: {
          created_at: string | null;
          id: string;
          is_verified: boolean | null;
          revenue_share_percentage: number | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          is_verified?: boolean | null;
          revenue_share_percentage?: number | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          is_verified?: boolean | null;
          revenue_share_percentage?: number | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "sim_creators_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "sim_users";
            referencedColumns: ["id"];
          }
        ];
      };
      sim_event_participants_solo: {
        Row: {
          car_class: string | null;
          car_number: number | null;
          event_id: string | null;
          finish_position: number | null;
          id: string;
          points_earned: number | null;
          qualifying_time: number | null;
          registration_date: string | null;
          status: string | null;
          user_id: string | null;
        };
        Insert: {
          car_class?: string | null;
          car_number?: number | null;
          event_id?: string | null;
          finish_position?: number | null;
          id?: string;
          points_earned?: number | null;
          qualifying_time?: number | null;
          registration_date?: string | null;
          status?: string | null;
          user_id?: string | null;
        };
        Update: {
          car_class?: string | null;
          car_number?: number | null;
          event_id?: string | null;
          finish_position?: number | null;
          id?: string;
          points_earned?: number | null;
          qualifying_time?: number | null;
          registration_date?: string | null;
          status?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "sim_event_participants_solo_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "sim_events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sim_event_participants_solo_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "sim_users";
            referencedColumns: ["id"];
          }
        ];
      };
      sim_event_participants_team: {
        Row: {
          car_class: string | null;
          car_number: number | null;
          event_id: string | null;
          finish_position: number | null;
          id: string;
          points_earned: number | null;
          qualifying_time: number | null;
          registration_date: string | null;
          status: string | null;
          team_id: string | null;
        };
        Insert: {
          car_class?: string | null;
          car_number?: number | null;
          event_id?: string | null;
          finish_position?: number | null;
          id?: string;
          points_earned?: number | null;
          qualifying_time?: number | null;
          registration_date?: string | null;
          status?: string | null;
          team_id?: string | null;
        };
        Update: {
          car_class?: string | null;
          car_number?: number | null;
          event_id?: string | null;
          finish_position?: number | null;
          id?: string;
          points_earned?: number | null;
          qualifying_time?: number | null;
          registration_date?: string | null;
          status?: string | null;
          team_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "sim_event_participants_team_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "sim_events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sim_event_participants_team_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "sim_teams";
            referencedColumns: ["id"];
          }
        ];
      };
      sim_events: {
        Row: {
          car_class: string | null;
          car_setup: string | null;
          created_at: string | null;
          created_by: string | null;
          description: string | null;
          end_date: string | null;
          event_type: Database["public"]["Enums"]["sim_event_type"];
          format: string | null;
          id: string;
          league_id: string | null;
          max_participants: number | null;
          platform: Database["public"]["Enums"]["sim_platform_type"] | null;
          registration_type: Database["public"]["Enums"]["sim_registration_type"];
          replay_url: string | null;
          results: Json | null;
          start_date: string | null;
          title: string;
          track: string | null;
          updated_at: string | null;
        };
        Insert: {
          car_class?: string | null;
          car_setup?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          end_date?: string | null;
          event_type: Database["public"]["Enums"]["sim_event_type"];
          format?: string | null;
          id?: string;
          league_id?: string | null;
          max_participants?: number | null;
          platform?: Database["public"]["Enums"]["sim_platform_type"] | null;
          registration_type: Database["public"]["Enums"]["sim_registration_type"];
          replay_url?: string | null;
          results?: Json | null;
          start_date?: string | null;
          title: string;
          track?: string | null;
          updated_at?: string | null;
        };
        Update: {
          car_class?: string | null;
          car_setup?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          end_date?: string | null;
          event_type?: Database["public"]["Enums"]["sim_event_type"];
          format?: string | null;
          id?: string;
          league_id?: string | null;
          max_participants?: number | null;
          platform?: Database["public"]["Enums"]["sim_platform_type"] | null;
          registration_type?: Database["public"]["Enums"]["sim_registration_type"];
          replay_url?: string | null;
          results?: Json | null;
          start_date?: string | null;
          title?: string;
          track?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "sim_events_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sim_events_league_id_fkey";
            columns: ["league_id"];
            isOneToOne: false;
            referencedRelation: "sim_leagues";
            referencedColumns: ["id"];
          }
        ];
      };
      sim_garage_services: {
        Row: {
          available_online: boolean | null;
          booking_link: string | null;
          created_at: string | null;
          description: string | null;
          duration: string | null;
          garage_id: string | null;
          id: string;
          price: number | null;
          service_type: string | null;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          available_online?: boolean | null;
          booking_link?: string | null;
          created_at?: string | null;
          description?: string | null;
          duration?: string | null;
          garage_id?: string | null;
          id?: string;
          price?: number | null;
          service_type?: string | null;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          available_online?: boolean | null;
          booking_link?: string | null;
          created_at?: string | null;
          description?: string | null;
          duration?: string | null;
          garage_id?: string | null;
          id?: string;
          price?: number | null;
          service_type?: string | null;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "sim_garage_services_garage_id_fkey";
            columns: ["garage_id"];
            isOneToOne: false;
            referencedRelation: "sim_garages";
            referencedColumns: ["id"];
          }
        ];
      };
      sim_garages: {
        Row: {
          city: string | null;
          country: string | null;
          created_at: string | null;
          email: string | null;
          id: string;
          logo: string | null;
          name: string;
          phone: string | null;
          ratings: Json | null;
          services_offered: string[] | null;
          state: string | null;
          updated_at: string | null;
          website: string | null;
        };
        Insert: {
          city?: string | null;
          country?: string | null;
          created_at?: string | null;
          email?: string | null;
          id?: string;
          logo?: string | null;
          name: string;
          phone?: string | null;
          ratings?: Json | null;
          services_offered?: string[] | null;
          state?: string | null;
          updated_at?: string | null;
          website?: string | null;
        };
        Update: {
          city?: string | null;
          country?: string | null;
          created_at?: string | null;
          email?: string | null;
          id?: string;
          logo?: string | null;
          name?: string;
          phone?: string | null;
          ratings?: Json | null;
          services_offered?: string[] | null;
          state?: string | null;
          updated_at?: string | null;
          website?: string | null;
        };
        Relationships: [];
      };
      sim_leaderboard_entries: {
        Row: {
          date_achieved: string | null;
          id: string;
          lap_time: number | null;
          leaderboard_id: string | null;
          position: number | null;
          replay_url: string | null;
          team_id: string | null;
          user_id: string | null;
          verified: boolean | null;
        };
        Insert: {
          date_achieved?: string | null;
          id?: string;
          lap_time?: number | null;
          leaderboard_id?: string | null;
          position?: number | null;
          replay_url?: string | null;
          team_id?: string | null;
          user_id?: string | null;
          verified?: boolean | null;
        };
        Update: {
          date_achieved?: string | null;
          id?: string;
          lap_time?: number | null;
          leaderboard_id?: string | null;
          position?: number | null;
          replay_url?: string | null;
          team_id?: string | null;
          user_id?: string | null;
          verified?: boolean | null;
        };
        Relationships: [
          {
            foreignKeyName: "sim_leaderboard_entries_leaderboard_id_fkey";
            columns: ["leaderboard_id"];
            isOneToOne: false;
            referencedRelation: "sim_leaderboards";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sim_leaderboard_entries_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "sim_teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sim_leaderboard_entries_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "sim_users";
            referencedColumns: ["id"];
          }
        ];
      };
      sim_leaderboards: {
        Row: {
          car_class: string | null;
          created_at: string | null;
          event_type: Database["public"]["Enums"]["sim_event_type"] | null;
          id: string;
          platform: Database["public"]["Enums"]["sim_platform_type"] | null;
          scope: string | null;
          title: string;
          track: string | null;
          updated_at: string | null;
        };
        Insert: {
          car_class?: string | null;
          created_at?: string | null;
          event_type?: Database["public"]["Enums"]["sim_event_type"] | null;
          id?: string;
          platform?: Database["public"]["Enums"]["sim_platform_type"] | null;
          scope?: string | null;
          title: string;
          track?: string | null;
          updated_at?: string | null;
        };
        Update: {
          car_class?: string | null;
          created_at?: string | null;
          event_type?: Database["public"]["Enums"]["sim_event_type"] | null;
          id?: string;
          platform?: Database["public"]["Enums"]["sim_platform_type"] | null;
          scope?: string | null;
          title?: string;
          track?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      sim_league_participants_solo: {
        Row: {
          car_class: string | null;
          car_number: number | null;
          id: string;
          league_id: string | null;
          registration_date: string | null;
          status: string | null;
          total_points: number | null;
          user_id: string | null;
        };
        Insert: {
          car_class?: string | null;
          car_number?: number | null;
          id?: string;
          league_id?: string | null;
          registration_date?: string | null;
          status?: string | null;
          total_points?: number | null;
          user_id?: string | null;
        };
        Update: {
          car_class?: string | null;
          car_number?: number | null;
          id?: string;
          league_id?: string | null;
          registration_date?: string | null;
          status?: string | null;
          total_points?: number | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "sim_league_participants_solo_league_id_fkey";
            columns: ["league_id"];
            isOneToOne: false;
            referencedRelation: "sim_leagues";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sim_league_participants_solo_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "sim_users";
            referencedColumns: ["id"];
          }
        ];
      };
      sim_league_participants_team: {
        Row: {
          car_class: string | null;
          car_number: number | null;
          id: string;
          league_id: string | null;
          registration_date: string | null;
          status: string | null;
          team_id: string | null;
          total_points: number | null;
        };
        Insert: {
          car_class?: string | null;
          car_number?: number | null;
          id?: string;
          league_id?: string | null;
          registration_date?: string | null;
          status?: string | null;
          team_id?: string | null;
          total_points?: number | null;
        };
        Update: {
          car_class?: string | null;
          car_number?: number | null;
          id?: string;
          league_id?: string | null;
          registration_date?: string | null;
          status?: string | null;
          team_id?: string | null;
          total_points?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "sim_league_participants_team_league_id_fkey";
            columns: ["league_id"];
            isOneToOne: false;
            referencedRelation: "sim_leagues";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sim_league_participants_team_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "sim_teams";
            referencedColumns: ["id"];
          }
        ];
      };
      sim_league_team_drivers: {
        Row: {
          driver_id: string | null;
          id: string;
          league_team_id: string | null;
          role: string | null;
        };
        Insert: {
          driver_id?: string | null;
          id?: string;
          league_team_id?: string | null;
          role?: string | null;
        };
        Update: {
          driver_id?: string | null;
          id?: string;
          league_team_id?: string | null;
          role?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "sim_league_team_drivers_driver_id_fkey";
            columns: ["driver_id"];
            isOneToOne: false;
            referencedRelation: "sim_users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sim_league_team_drivers_league_team_id_fkey";
            columns: ["league_team_id"];
            isOneToOne: false;
            referencedRelation: "sim_league_participants_team";
            referencedColumns: ["id"];
          }
        ];
      };
      sim_leagues: {
        Row: {
          created_at: string | null;
          description: string | null;
          end_date: string | null;
          id: string;
          max_participants: number | null;
          name: string;
          organizer_id: string | null;
          platform: Database["public"]["Enums"]["sim_platform_type"] | null;
          points_system: Json | null;
          registration_type:
            | Database["public"]["Enums"]["sim_registration_type"]
            | null;
          start_date: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          end_date?: string | null;
          id?: string;
          max_participants?: number | null;
          name: string;
          organizer_id?: string | null;
          platform?: Database["public"]["Enums"]["sim_platform_type"] | null;
          points_system?: Json | null;
          registration_type?:
            | Database["public"]["Enums"]["sim_registration_type"]
            | null;
          start_date?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          end_date?: string | null;
          id?: string;
          max_participants?: number | null;
          name?: string;
          organizer_id?: string | null;
          platform?: Database["public"]["Enums"]["sim_platform_type"] | null;
          points_system?: Json | null;
          registration_type?:
            | Database["public"]["Enums"]["sim_registration_type"]
            | null;
          start_date?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "sim_leagues_organizer_id_fkey";
            columns: ["organizer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      sim_media_uploads: {
        Row: {
          caption: string | null;
          created_at: string | null;
          id: string;
          media_url: string;
          related_event_id: string | null;
          type: string | null;
          uploader_id: string | null;
        };
        Insert: {
          caption?: string | null;
          created_at?: string | null;
          id?: string;
          media_url: string;
          related_event_id?: string | null;
          type?: string | null;
          uploader_id?: string | null;
        };
        Update: {
          caption?: string | null;
          created_at?: string | null;
          id?: string;
          media_url?: string;
          related_event_id?: string | null;
          type?: string | null;
          uploader_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "sim_media_uploads_related_event_id_fkey";
            columns: ["related_event_id"];
            isOneToOne: false;
            referencedRelation: "sim_events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sim_media_uploads_uploader_id_fkey";
            columns: ["uploader_id"];
            isOneToOne: false;
            referencedRelation: "sim_users";
            referencedColumns: ["id"];
          }
        ];
      };
      sim_order_items: {
        Row: {
          id: string;
          order_id: string | null;
          price: number;
          product_id: string | null;
          quantity: number;
        };
        Insert: {
          id?: string;
          order_id?: string | null;
          price: number;
          product_id?: string | null;
          quantity: number;
        };
        Update: {
          id?: string;
          order_id?: string | null;
          price?: number;
          product_id?: string | null;
          quantity?: number;
        };
        Relationships: [
          {
            foreignKeyName: "sim_order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "sim_product_orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sim_order_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "sim_products";
            referencedColumns: ["id"];
          }
        ];
      };
      sim_product_orders: {
        Row: {
          created_at: string | null;
          id: string;
          payment_id: string | null;
          shipping_address: Json | null;
          status: string | null;
          total_price: number;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          payment_id?: string | null;
          shipping_address?: Json | null;
          status?: string | null;
          total_price: number;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          payment_id?: string | null;
          shipping_address?: Json | null;
          status?: string | null;
          total_price?: number;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "sim_product_orders_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "sim_users";
            referencedColumns: ["id"];
          }
        ];
      };
      sim_products: {
        Row: {
          brand: string | null;
          category: string | null;
          created_at: string | null;
          description: string | null;
          features: Json | null;
          id: string;
          image_url: string[] | null;
          name: string;
          price: number;
          stock: number | null;
          updated_at: string | null;
        };
        Insert: {
          brand?: string | null;
          category?: string | null;
          created_at?: string | null;
          description?: string | null;
          features?: Json | null;
          id?: string;
          image_url?: string[] | null;
          name: string;
          price: number;
          stock?: number | null;
          updated_at?: string | null;
        };
        Update: {
          brand?: string | null;
          category?: string | null;
          created_at?: string | null;
          description?: string | null;
          features?: Json | null;
          id?: string;
          image_url?: string[] | null;
          name?: string;
          price?: number;
          stock?: number | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      sim_service_bookings: {
        Row: {
          booking_date: string | null;
          created_at: string | null;
          garage_service_id: string | null;
          id: string;
          notes: string | null;
          status: Database["public"]["Enums"]["sim_booking_status"] | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          booking_date?: string | null;
          created_at?: string | null;
          garage_service_id?: string | null;
          id?: string;
          notes?: string | null;
          status?: Database["public"]["Enums"]["sim_booking_status"] | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          booking_date?: string | null;
          created_at?: string | null;
          garage_service_id?: string | null;
          id?: string;
          notes?: string | null;
          status?: Database["public"]["Enums"]["sim_booking_status"] | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "sim_service_bookings_garage_service_id_fkey";
            columns: ["garage_service_id"];
            isOneToOne: false;
            referencedRelation: "sim_garage_services";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sim_service_bookings_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "sim_users";
            referencedColumns: ["id"];
          }
        ];
      };
      sim_team_drivers: {
        Row: {
          driver_id: string | null;
          id: string;
          role: string | null;
          team_participant_id: string | null;
        };
        Insert: {
          driver_id?: string | null;
          id?: string;
          role?: string | null;
          team_participant_id?: string | null;
        };
        Update: {
          driver_id?: string | null;
          id?: string;
          role?: string | null;
          team_participant_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "sim_team_drivers_driver_id_fkey";
            columns: ["driver_id"];
            isOneToOne: false;
            referencedRelation: "sim_users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sim_team_drivers_team_participant_id_fkey";
            columns: ["team_participant_id"];
            isOneToOne: false;
            referencedRelation: "sim_teams";
            referencedColumns: ["id"];
          }
        ];
      };
      sim_teams: {
        Row: {
          created_at: string | null;
          creator_id: string | null;
          description: string | null;
          id: string;
          livery_design: string | null;
          livestream_link: string | null;
          logo: string | null;
          name: string;
          sponsor_garage_id: string | null;
          stats: Json | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          creator_id?: string | null;
          description?: string | null;
          id?: string;
          livery_design?: string | null;
          livestream_link?: string | null;
          logo?: string | null;
          name: string;
          sponsor_garage_id?: string | null;
          stats?: Json | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          creator_id?: string | null;
          description?: string | null;
          id?: string;
          livery_design?: string | null;
          livestream_link?: string | null;
          logo?: string | null;
          name?: string;
          sponsor_garage_id?: string | null;
          stats?: Json | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "sim_teams_creator_id_fkey";
            columns: ["creator_id"];
            isOneToOne: false;
            referencedRelation: "sim_users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sim_teams_sponsor_garage_id_fkey";
            columns: ["sponsor_garage_id"];
            isOneToOne: false;
            referencedRelation: "sim_garages";
            referencedColumns: ["id"];
          }
        ];
      };
      sim_to_real: {
        Row: {
          created_at: string | null;
          date: string | null;
          description: string | null;
          experience_type: string | null;
          garage_id: string | null;
          id: string;
          media_links: string[] | null;
          pro_driver: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          date?: string | null;
          description?: string | null;
          experience_type?: string | null;
          garage_id?: string | null;
          id?: string;
          media_links?: string[] | null;
          pro_driver?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          date?: string | null;
          description?: string | null;
          experience_type?: string | null;
          garage_id?: string | null;
          id?: string;
          media_links?: string[] | null;
          pro_driver?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "sim_to_real_garage_id_fkey";
            columns: ["garage_id"];
            isOneToOne: false;
            referencedRelation: "sim_garages";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sim_to_real_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "sim_users";
            referencedColumns: ["id"];
          }
        ];
      };
      sim_users: {
        Row: {
          badges: string[] | null;
          created_at: string | null;
          email: string;
          id: string;
          profile_picture: string | null;
          rank: string | null;
          sim_ids: Json | null;
          stats: Json | null;
          team_id: string | null;
          updated_at: string | null;
          username: string;
        };
        Insert: {
          badges?: string[] | null;
          created_at?: string | null;
          email: string;
          id: string;
          profile_picture?: string | null;
          rank?: string | null;
          sim_ids?: Json | null;
          stats?: Json | null;
          team_id?: string | null;
          updated_at?: string | null;
          username?: string;
        };
        Update: {
          badges?: string[] | null;
          created_at?: string | null;
          email?: string;
          id?: string;
          profile_picture?: string | null;
          rank?: string | null;
          sim_ids?: Json | null;
          stats?: Json | null;
          team_id?: string | null;
          updated_at?: string | null;
          username?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sim_users_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "sim_teams";
            referencedColumns: ["id"];
          }
        ];
      };
      stories: {
        Row: {
          caption: string | null;
          created_at: string;
          expires_at: string;
          id: string;
          media_url: string;
          overlays: Json | null;
          story_type: string;
          user_id: string;
          viewed_by: string[] | null;
          views_count: number | null;
        };
        Insert: {
          caption?: string | null;
          created_at?: string;
          expires_at?: string;
          id?: string;
          media_url: string;
          overlays?: Json | null;
          story_type?: string;
          user_id: string;
          viewed_by?: string[] | null;
          views_count?: number | null;
        };
        Update: {
          caption?: string | null;
          created_at?: string;
          expires_at?: string;
          id?: string;
          media_url?: string;
          overlays?: Json | null;
          story_type?: string;
          user_id?: string;
          viewed_by?: string[] | null;
          views_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "stories_user_id_fkey1";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      story_details: {
        Row: {
          avatar_url: string | null;
          caption: string | null;
          created_at: string;
          expires_at: string | null;
          full_name: string | null;
          id: number;
          media_url: string | null;
          story_type: string | null;
          user_id: string | null;
          username: string | null;
          viewed_by: string[] | null;
        };
        Insert: {
          avatar_url?: string | null;
          caption?: string | null;
          created_at?: string;
          expires_at?: string | null;
          full_name?: string | null;
          id?: number;
          media_url?: string | null;
          story_type?: string | null;
          user_id?: string | null;
          username?: string | null;
          viewed_by?: string[] | null;
        };
        Update: {
          avatar_url?: string | null;
          caption?: string | null;
          created_at?: string;
          expires_at?: string | null;
          full_name?: string | null;
          id?: number;
          media_url?: string | null;
          story_type?: string | null;
          user_id?: string | null;
          username?: string | null;
          viewed_by?: string[] | null;
        };
        Relationships: [];
      };
      story_viewer_details: {
        Row: {
          id: string;
          story_id: string | null;
          viewed_at: string | null;
          viewer_id: string[] | null;
          viewers_id: string | null;
        };
        Insert: {
          id?: string;
          story_id?: string | null;
          viewed_at?: string | null;
          viewer_id?: string[] | null;
          viewers_id?: string | null;
        };
        Update: {
          id?: string;
          story_id?: string | null;
          viewed_at?: string | null;
          viewer_id?: string[] | null;
          viewers_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "story_viewer_details_story_id_fkey";
            columns: ["story_id"];
            isOneToOne: false;
            referencedRelation: "stories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "story_viewer_details_story_id_fkey";
            columns: ["story_id"];
            isOneToOne: false;
            referencedRelation: "unique_stories_view";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "story_viewer_details_viewers_id_fkey";
            columns: ["viewers_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      story_views: {
        Row: {
          id: string;
          story_id: string;
          viewed_at: string;
          viewer_id: string;
        };
        Insert: {
          id?: string;
          story_id: string;
          viewed_at?: string;
          viewer_id: string;
        };
        Update: {
          id?: string;
          story_id?: string;
          viewed_at?: string;
          viewer_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "story_views_story_id_fkey";
            columns: ["story_id"];
            isOneToOne: false;
            referencedRelation: "stories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "story_views_story_id_fkey";
            columns: ["story_id"];
            isOneToOne: false;
            referencedRelation: "unique_stories_view";
            referencedColumns: ["id"];
          }
        ];
      };
      testing: {
        Row: {
          created_at: string;
          id: number;
          name: string | null;
        };
        Insert: {
          created_at?: string;
          id?: number;
          name?: string | null;
        };
        Update: {
          created_at?: string;
          id?: number;
          name?: string | null;
        };
        Relationships: [];
      };
      user: {
        Row: {
          created_at: string;
          email: string | null;
          id: number;
          userName: string | null;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          id?: number;
          userName?: string | null;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          id?: number;
          userName?: string | null;
        };
        Relationships: [];
      };
      user_addresses: {
        Row: {
          city: string | null;
          country: string | null;
          created_at: string | null;
          id: string | null;
          id_1: string | null;
          is_default: boolean | null;
          line1: string | null;
          line2: string | null;
          name: string | null;
          phone: string | null;
          postal_code: number | null;
          state: string | null;
          user_id: string | null;
        };
        Insert: {
          city?: string | null;
          country?: string | null;
          created_at?: string | null;
          id?: string | null;
          id_1?: string | null;
          is_default?: boolean | null;
          line1?: string | null;
          line2?: string | null;
          name?: string | null;
          phone?: string | null;
          postal_code?: number | null;
          state?: string | null;
          user_id?: string | null;
        };
        Update: {
          city?: string | null;
          country?: string | null;
          created_at?: string | null;
          id?: string | null;
          id_1?: string | null;
          is_default?: boolean | null;
          line1?: string | null;
          line2?: string | null;
          name?: string | null;
          phone?: string | null;
          postal_code?: number | null;
          state?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      user_follows: {
        Row: {
          created_at: string;
          follower_id: string;
          following_id: string;
          id: string;
        };
        Insert: {
          created_at?: string;
          follower_id: string;
          following_id: string;
          id?: string;
        };
        Update: {
          created_at?: string;
          follower_id?: string;
          following_id?: string;
          id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_follows_follower_id_fkey1";
            columns: ["follower_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_follows_following_id_fkey1";
            columns: ["following_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      user_purchases: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          purchase_date: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id: string;
          purchase_date?: string;
          user_id: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string;
          purchase_date?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_purchases_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_purchases_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          }
        ];
      };
      vehicles: {
        Row: {
          category: string;
          condition: string | null;
          created_at: string;
          description: string | null;
          fuel_type: string | null;
          id: string;
          images: string[] | null;
          make: string;
          mileage: number | null;
          model: string;
          price: number;
          seats: number | null;
          seller_id: string | null;
          status: string | null;
          title: string;
          updated_at: string;
          year: number | null;
        };
        Insert: {
          category: string;
          condition?: string | null;
          created_at?: string;
          description?: string | null;
          fuel_type?: string | null;
          id?: string;
          images?: string[] | null;
          make: string;
          mileage?: number | null;
          model: string;
          price: number;
          seats?: number | null;
          seller_id?: string | null;
          status?: string | null;
          title: string;
          updated_at?: string;
          year?: number | null;
        };
        Update: {
          category?: string;
          condition?: string | null;
          created_at?: string;
          description?: string | null;
          fuel_type?: string | null;
          id?: string;
          images?: string[] | null;
          make?: string;
          mileage?: number | null;
          model?: string;
          price?: number;
          seats?: number | null;
          seller_id?: string | null;
          status?: string | null;
          title?: string;
          updated_at?: string;
          year?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "fk_vehicles_seller";
            columns: ["seller_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      vendor_registration_history: {
        Row: {
          action_by: string | null;
          action_date: string;
          action_type: string;
          changes_made: Json | null;
          details: Json | null;
          id: string;
          rejection_reason: string | null;
          vendor_registration_id: string;
        };
        Insert: {
          action_by?: string | null;
          action_date?: string;
          action_type: string;
          changes_made?: Json | null;
          details?: Json | null;
          id?: string;
          rejection_reason?: string | null;
          vendor_registration_id: string;
        };
        Update: {
          action_by?: string | null;
          action_date?: string;
          action_type?: string;
          changes_made?: Json | null;
          details?: Json | null;
          id?: string;
          rejection_reason?: string | null;
          vendor_registration_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "vendor_registration_history_action_by_fkey1";
            columns: ["action_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "vendor_registration_history_vendor_registration_id_fkey";
            columns: ["vendor_registration_id"];
            isOneToOne: false;
            referencedRelation: "vendor_registrations";
            referencedColumns: ["id"];
          }
        ];
      };
      vendor_registrations: {
        Row: {
          account_holder_name: string | null;
          bank_account_number: string | null;
          bank_proof_document_url: string | null;
          branches: Json | null;
          business_logo_url: string | null;
          business_name: string | null;
          categories: string[];
          category_specific_details: Json | null;
          created_at: string;
          email: string;
          government_id_document_url: string | null;
          government_id_number: string | null;
          government_id_type: string | null;
          gst_certificate_url: string | null;
          id: string;
          ifsc_code: string | null;
          is_mobile_verified: boolean | null;
          is_verified_by_admin: boolean | null;
          last_updated_fields: Json | null;
          mobile: string;
          msme_or_udyam_url: string | null;
          personal_name: string;
          property_tax_receipt_url: string | null;
          rejection_reason: string | null;
          rent_agreement_url: string | null;
          shop_certificate_url: string | null;
          status: string;
          step: string | null;
          submitted_at: string | null;
          trade_license_url: string | null;
          updated_at: string;
          user_id: string;
          utility_bill_url: string | null;
          verified_at: string | null;
          whatsapp_number: string | null;
        };
        Insert: {
          account_holder_name?: string | null;
          bank_account_number?: string | null;
          bank_proof_document_url?: string | null;
          branches?: Json | null;
          business_logo_url?: string | null;
          business_name?: string | null;
          categories: string[];
          category_specific_details?: Json | null;
          created_at?: string;
          email: string;
          government_id_document_url?: string | null;
          government_id_number?: string | null;
          government_id_type?: string | null;
          gst_certificate_url?: string | null;
          id?: string;
          ifsc_code?: string | null;
          is_mobile_verified?: boolean | null;
          is_verified_by_admin?: boolean | null;
          last_updated_fields?: Json | null;
          mobile: string;
          msme_or_udyam_url?: string | null;
          personal_name: string;
          property_tax_receipt_url?: string | null;
          rejection_reason?: string | null;
          rent_agreement_url?: string | null;
          shop_certificate_url?: string | null;
          status?: string;
          step?: string | null;
          submitted_at?: string | null;
          trade_license_url?: string | null;
          updated_at?: string;
          user_id: string;
          utility_bill_url?: string | null;
          verified_at?: string | null;
          whatsapp_number?: string | null;
        };
        Update: {
          account_holder_name?: string | null;
          bank_account_number?: string | null;
          bank_proof_document_url?: string | null;
          branches?: Json | null;
          business_logo_url?: string | null;
          business_name?: string | null;
          categories?: string[];
          category_specific_details?: Json | null;
          created_at?: string;
          email?: string;
          government_id_document_url?: string | null;
          government_id_number?: string | null;
          government_id_type?: string | null;
          gst_certificate_url?: string | null;
          id?: string;
          ifsc_code?: string | null;
          is_mobile_verified?: boolean | null;
          is_verified_by_admin?: boolean | null;
          last_updated_fields?: Json | null;
          mobile?: string;
          msme_or_udyam_url?: string | null;
          personal_name?: string;
          property_tax_receipt_url?: string | null;
          rejection_reason?: string | null;
          rent_agreement_url?: string | null;
          shop_certificate_url?: string | null;
          status?: string;
          step?: string | null;
          submitted_at?: string | null;
          trade_license_url?: string | null;
          updated_at?: string;
          user_id?: string;
          utility_bill_url?: string | null;
          verified_at?: string | null;
          whatsapp_number?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "vendor_registrations_user_id_fkey1";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      vendor_update_requests: {
        Row: {
          created_at: string;
          current_data: Json;
          id: string;
          rejection_reason: string | null;
          request_type: string;
          requested_by: string;
          requested_changes: Json;
          reviewed_at: string | null;
          reviewed_by: string | null;
          status: string;
          updated_at: string;
          vendor_registration_id: string;
        };
        Insert: {
          created_at?: string;
          current_data: Json;
          id?: string;
          rejection_reason?: string | null;
          request_type: string;
          requested_by: string;
          requested_changes: Json;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: string;
          updated_at?: string;
          vendor_registration_id: string;
        };
        Update: {
          created_at?: string;
          current_data?: Json;
          id?: string;
          rejection_reason?: string | null;
          request_type?: string;
          requested_by?: string;
          requested_changes?: Json;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: string;
          updated_at?: string;
          vendor_registration_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "vendor_update_requests_requested_by_fkey1";
            columns: ["requested_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "vendor_update_requests_reviewed_by_fkey1";
            columns: ["reviewed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "vendor_update_requests_vendor_registration_id_fkey";
            columns: ["vendor_registration_id"];
            isOneToOne: false;
            referencedRelation: "vendor_registrations";
            referencedColumns: ["id"];
          }
        ];
      };
      wishlist: {
        Row: {
          created_at: string;
          id: string;
          item_id: string;
          item_type: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          item_id: string;
          item_type: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          item_id?: string;
          item_type?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      unique_stories_view: {
        Row: {
          avatar_url: string | null;
          caption: string | null;
          created_at: string | null;
          expires_at: string | null;
          full_name: string | null;
          id: string | null;
          media_url: string | null;
          story_type: string | null;
          user_id: string | null;
          username: string | null;
          viewed_by: string[] | null;
        };
        Relationships: [
          {
            foreignKeyName: "stories_user_id_fkey1";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Functions: {
      add_to_viewed_by: {
        Args:
          | { story_id_input: string }
          | { story_id_input: string; viewer_id_input: string };
        Returns: undefined;
      };
      delete_expired_stories: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      fetch_user_conversations_with_last_seen: {
        Args: { current_user_id: string };
        Returns: {
          user_id: string;
          full_name: string;
          username: string;
          avatar_url: string;
          last_seen: string;
          last_message: string;
          last_message_type: string;
          last_message_time: string;
          unread_count: number;
        }[];
      };
      get_notifications: {
        Args: { p_user_id: string };
        Returns: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          message: string;
          data: Json;
          read: boolean;
          created_at: string;
        }[];
      };
      get_user_conversations: {
        Args: { user_id: string };
        Returns: {
          user_id: string;
          last_message: string;
          last_message_type: string;
          last_message_time: string;
        }[];
      };
      mark_all_notifications_read: {
        Args: { p_user_id: string };
        Returns: undefined;
      };
      mark_notification_read: {
        Args: { p_notification_id: string };
        Returns: undefined;
      };
      send_notification_to_user: {
        Args: {
          p_user_id: string;
          p_type: string;
          p_title: string;
          p_message: string;
          p_data?: Json;
        };
        Returns: string;
      };
    };
    Enums: {
      message_type: "video" | "text" | "image" | "post";
      role: "ADMIN" | "USER" | "VENDOR";
      sim_booking_status: "pending" | "confirmed" | "completed" | "cancelled";
      sim_difficulty_level: "beginner" | "intermediate" | "advanced" | "pro";
      sim_event_type:
        | "race"
        | "time_trial"
        | "qualification"
        | "practice"
        | "championship"
        | "bootcamp"
        | "tournament";
      sim_platform_type:
        | "iracing"
        | "assetto_corsa"
        | "rfactor2"
        | "automobilista"
        | "project_cars"
        | "gran_turismo"
        | "forza"
        | "other";
      sim_registration_type: "solo" | "team" | "invitation_only" | "open";
    };
    CompositeTypes: {
      [_ in never]: never;
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
    : never = never
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
    : never = never
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
    : never = never
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
    : never = never
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never;

export const Constants = {
  public: {
    Enums: {
      message_type: ["video", "text", "image", "post"],
      role: ["ADMIN", "USER", "VENDOR"],
      sim_booking_status: ["pending", "confirmed", "completed", "cancelled"],
      sim_difficulty_level: ["beginner", "intermediate", "advanced", "pro"],
      sim_event_type: [
        "race",
        "time_trial",
        "qualification",
        "practice",
        "championship",
        "bootcamp",
        "tournament",
      ],
      sim_platform_type: [
        "iracing",
        "assetto_corsa",
        "rfactor2",
        "automobilista",
        "project_cars",
        "gran_turismo",
        "forza",
        "other",
      ],
      sim_registration_type: ["solo", "team", "invitation_only", "open"],
    },
  },
} as const;
