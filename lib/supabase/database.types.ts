export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string | null
          email: string | null
          role: string | null
          is_banned: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          name?: string | null
          email?: string | null
          role?: string | null
          is_banned?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string | null
          email?: string | null
          role?: string | null
          is_banned?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      categories: {
        Row: {
          id: string
          name: string
          icon: string | null
          bg_color: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          icon?: string | null
          bg_color?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          icon?: string | null
          bg_color?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      subcategories: {
        Row: {
          id: string
          name: string
          category_id: string
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          category_id: string
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          category_id?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          }
        ]
      }
      businesses: {
        Row: {
          id: string
          business_name: string
          business_owner_id: string
          location: string | null
          description: string | null
          website: string | null
          is_banned: boolean | null
          rating_count: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          business_name: string
          business_owner_id: string
          location?: string | null
          description?: string | null
          website?: string | null
          is_banned?: boolean | null
          rating_count?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          business_name?: string
          business_owner_id?: string
          location?: string | null
          description?: string | null
          website?: string | null
          is_banned?: boolean | null
          rating_count?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "businesses_business_owner_id_fkey"
            columns: ["business_owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      business_documents: {
        Row: {
          id: string
          business_id: string
          document_url: string
          document_name: string | null
          uploaded_at: string | null
          status: string | null
        }
        Insert: {
          id?: string
          business_id: string
          document_url: string
          document_name?: string | null
          uploaded_at?: string | null
          status?: string | null
        }
        Update: {
          id?: string
          business_id?: string
          document_url?: string
          document_name?: string | null
          uploaded_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_documents_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          }
        ]
      }
      business_categories: {
        Row: {
          business_id: string
          category_id: string
        }
        Insert: {
          business_id: string
          category_id: string
        }
        Update: {
          business_id?: string
          category_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_categories_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          }
        ]
      }
      business_subcategories: {
        Row: {
          business_id: string
          subcategory_id: string
        }
        Insert: {
          business_id: string
          subcategory_id: string
        }
        Update: {
          business_id?: string
          subcategory_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_subcategories_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_subcategories_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategories"
            referencedColumns: ["id"]
          }
        ]
      }
      reviews: {
        Row: {
          id: string
          rating: number
          comment: string | null
          reviewee_id: string
          reviewer_id: string
          is_verified: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          rating: number
          comment?: string | null
          reviewee_id: string
          reviewer_id: string
          is_verified?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          rating?: number
          comment?: string | null
          reviewee_id?: string
          reviewer_id?: string
          is_verified?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_reviewee_id_fkey"
            columns: ["reviewee_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      review_comments: {
        Row: {
          id: string
          review_id: string
          commenter_id: string
          comment: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          review_id: string
          commenter_id: string
          comment: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          review_id?: string
          commenter_id?: string
          comment?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "review_comments_commenter_id_fkey"
            columns: ["commenter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_comments_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          }
        ]
      }
      blogs: {
        Row: {
          id: string
          title: string
          business_id: string
          content: string
          thumbnail_image: string | null
          read_count: number | null
          published: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          business_id: string
          content: string
          thumbnail_image?: string | null
          read_count?: number | null
          published?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          business_id?: string
          content?: string
          thumbnail_image?: string | null
          read_count?: number | null
          published?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blogs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          }
        ]
      }
      user_reads: {
        Row: {
          id: string
          user_id: string
          blog_id: string
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          blog_id: string
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          blog_id?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_reads_blog_id_fkey"
            columns: ["blog_id"]
            isOneToOne: false
            referencedRelation: "blogs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_reads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      user_reviews: {
        Row: {
          id: string
          user_id: string
          review_id: string
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          review_id: string
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          review_id?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_reviews_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
      Database["public"]["Views"])
  ? (Database["public"]["Tables"] &
      Database["public"]["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
  ? Database["public"]["Enums"][PublicEnumNameOrOptions]
  : never