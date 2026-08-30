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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      _prisma_migrations: {
        Row: {
          applied_steps_count: number
          checksum: string
          finished_at: string | null
          id: string
          logs: string | null
          migration_name: string
          rolled_back_at: string | null
          started_at: string
        }
        Insert: {
          applied_steps_count?: number
          checksum: string
          finished_at?: string | null
          id: string
          logs?: string | null
          migration_name: string
          rolled_back_at?: string | null
          started_at?: string
        }
        Update: {
          applied_steps_count?: number
          checksum?: string
          finished_at?: string | null
          id?: string
          logs?: string | null
          migration_name?: string
          rolled_back_at?: string | null
          started_at?: string
        }
        Relationships: []
      }
      chat_sessions: {
        Row: {
          createdAt: string
          draftInvoice: Json | null
          id: string
          messages: Json
          organizationId: string
          status: string
          title: string
          updatedAt: string
          userId: string
        }
        Insert: {
          createdAt?: string
          draftInvoice?: Json | null
          id: string
          messages?: Json
          organizationId: string
          status?: string
          title?: string
          updatedAt: string
          userId: string
        }
        Update: {
          createdAt?: string
          draftInvoice?: Json | null
          id?: string
          messages?: Json
          organizationId?: string
          status?: string
          title?: string
          updatedAt?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_sessions_organizationId_fkey"
            columns: ["organizationId"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_sessions_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          city: string | null
          companyName: string | null
          country: string | null
          createdAt: string
          email: string | null
          id: string
          name: string
          notes: string | null
          organizationId: string
          phone: string | null
          postalCode: string | null
          taxId: string | null
          updatedAt: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          companyName?: string | null
          country?: string | null
          createdAt?: string
          email?: string | null
          id: string
          name: string
          notes?: string | null
          organizationId: string
          phone?: string | null
          postalCode?: string | null
          taxId?: string | null
          updatedAt: string
        }
        Update: {
          address?: string | null
          city?: string | null
          companyName?: string | null
          country?: string | null
          createdAt?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          organizationId?: string
          phone?: string | null
          postalCode?: string | null
          taxId?: string | null
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_organizationId_fkey"
            columns: ["organizationId"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          createdAt: string
          description: string
          id: string
          invoiceId: string
          quantity: number
          total: number
          unitPrice: number
          updatedAt: string
          vatRate: number
        }
        Insert: {
          createdAt?: string
          description: string
          id: string
          invoiceId: string
          quantity?: number
          total?: number
          unitPrice?: number
          updatedAt: string
          vatRate?: number
        }
        Update: {
          createdAt?: string
          description?: string
          id?: string
          invoiceId?: string
          quantity?: number
          total?: number
          unitPrice?: number
          updatedAt?: string
          vatRate?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoiceId_fkey"
            columns: ["invoiceId"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          clientId: string
          createdAt: string
          currency: string
          dueDate: string
          id: string
          invoiceNumber: string
          issueDate: string
          mdContent: string | null
          notes: string | null
          organizationId: string
          paymentTerms: string | null
          pdfUrl: string | null
          publicToken: string
          status: Database["public"]["Enums"]["InvoiceStatus"]
          subtotal: number
          timbreFiscalAmount: number
          total: number
          updatedAt: string
          vatAmount: number
          vatApplicable: boolean
          vatRate: number
        }
        Insert: {
          clientId: string
          createdAt?: string
          currency?: string
          dueDate: string
          id: string
          invoiceNumber: string
          issueDate?: string
          mdContent?: string | null
          notes?: string | null
          organizationId: string
          paymentTerms?: string | null
          pdfUrl?: string | null
          publicToken: string
          status?: Database["public"]["Enums"]["InvoiceStatus"]
          subtotal?: number
          timbreFiscalAmount?: number
          total?: number
          updatedAt: string
          vatAmount?: number
          vatApplicable?: boolean
          vatRate?: number
        }
        Update: {
          clientId?: string
          createdAt?: string
          currency?: string
          dueDate?: string
          id?: string
          invoiceNumber?: string
          issueDate?: string
          mdContent?: string | null
          notes?: string | null
          organizationId?: string
          paymentTerms?: string | null
          pdfUrl?: string | null
          publicToken?: string
          status?: Database["public"]["Enums"]["InvoiceStatus"]
          subtotal?: number
          timbreFiscalAmount?: number
          total?: number
          updatedAt?: string
          vatAmount?: number
          vatApplicable?: boolean
          vatRate?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoices_clientId_fkey"
            columns: ["clientId"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_organizationId_fkey"
            columns: ["organizationId"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          activityType: string | null
          address: string | null
          bankBic: string | null
          bankIban: string | null
          bankName: string | null
          bankRib: string | null
          city: string | null
          country: string
          createdAt: string
          currency: string
          defaultPaymentTerms: string | null
          defaultVatRate: number
          email: string | null
          id: string
          invoiceCounter: number
          invoicePrefix: string
          logoUrl: string | null
          name: string
          ownerUserId: string | null
          phone: string | null
          plan: string
          postalCode: string | null
          signatureImageUrl: string | null
          stampImageUrl: string | null
          taxId: string | null
          taxRegime: Database["public"]["Enums"]["TaxRegime"]
          updatedAt: string
          vatRegistered: boolean
          website: string | null
        }
        Insert: {
          activityType?: string | null
          address?: string | null
          bankBic?: string | null
          bankIban?: string | null
          bankName?: string | null
          bankRib?: string | null
          city?: string | null
          country?: string
          createdAt?: string
          currency?: string
          defaultPaymentTerms?: string | null
          defaultVatRate?: number
          email?: string | null
          id: string
          invoiceCounter?: number
          invoicePrefix?: string
          logoUrl?: string | null
          name: string
          ownerUserId?: string | null
          phone?: string | null
          plan?: string
          postalCode?: string | null
          signatureImageUrl?: string | null
          stampImageUrl?: string | null
          taxId?: string | null
          taxRegime?: Database["public"]["Enums"]["TaxRegime"]
          updatedAt: string
          vatRegistered?: boolean
          website?: string | null
        }
        Update: {
          activityType?: string | null
          address?: string | null
          bankBic?: string | null
          bankIban?: string | null
          bankName?: string | null
          bankRib?: string | null
          city?: string | null
          country?: string
          createdAt?: string
          currency?: string
          defaultPaymentTerms?: string | null
          defaultVatRate?: number
          email?: string | null
          id?: string
          invoiceCounter?: number
          invoicePrefix?: string
          logoUrl?: string | null
          name?: string
          ownerUserId?: string | null
          phone?: string | null
          plan?: string
          postalCode?: string | null
          signatureImageUrl?: string | null
          stampImageUrl?: string | null
          taxId?: string | null
          taxRegime?: Database["public"]["Enums"]["TaxRegime"]
          updatedAt?: string
          vatRegistered?: boolean
          website?: string | null
        }
        Relationships: []
      }
      payment_proofs: {
        Row: {
          amount: number | null
          fileUrl: string
          id: string
          invoiceId: string
          notes: string | null
          organizationId: string
          reviewedAt: string | null
          status: Database["public"]["Enums"]["PaymentProofStatus"]
          submittedAt: string
        }
        Insert: {
          amount?: number | null
          fileUrl: string
          id: string
          invoiceId: string
          notes?: string | null
          organizationId: string
          reviewedAt?: string | null
          status?: Database["public"]["Enums"]["PaymentProofStatus"]
          submittedAt?: string
        }
        Update: {
          amount?: number | null
          fileUrl?: string
          id?: string
          invoiceId?: string
          notes?: string | null
          organizationId?: string
          reviewedAt?: string | null
          status?: Database["public"]["Enums"]["PaymentProofStatus"]
          submittedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_proofs_invoiceId_fkey"
            columns: ["invoiceId"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_proofs_organizationId_fkey"
            columns: ["organizationId"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          company: string | null
          createdAt: string
          id: string
          message: string | null
          name: string
          rating: number
          title: string | null
          updatedAt: string
        }
        Insert: {
          company?: string | null
          createdAt?: string
          id: string
          message?: string | null
          name: string
          rating: number
          title?: string | null
          updatedAt: string
        }
        Update: {
          company?: string | null
          createdAt?: string
          id?: string
          message?: string | null
          name?: string
          rating?: number
          title?: string | null
          updatedAt?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          city: string | null
          country: string | null
          createdAt: string
          email: string
          fullName: string | null
          id: string
          organizationId: string | null
          passwordHash: string | null
          phone: string | null
          postalCode: string | null
          role: Database["public"]["Enums"]["UserRole"]
          state: string | null
          streetAddress: string | null
          updatedAt: string
        }
        Insert: {
          city?: string | null
          country?: string | null
          createdAt?: string
          email: string
          fullName?: string | null
          id: string
          organizationId?: string | null
          passwordHash?: string | null
          phone?: string | null
          postalCode?: string | null
          role?: Database["public"]["Enums"]["UserRole"]
          state?: string | null
          streetAddress?: string | null
          updatedAt: string
        }
        Update: {
          city?: string | null
          country?: string | null
          createdAt?: string
          email?: string
          fullName?: string | null
          id?: string
          organizationId?: string | null
          passwordHash?: string | null
          phone?: string | null
          postalCode?: string | null
          role?: Database["public"]["Enums"]["UserRole"]
          state?: string | null
          streetAddress?: string | null
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_organizationId_fkey"
            columns: ["organizationId"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
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
      InvoiceStatus:
        | "DRAFT"
        | "SENT"
        | "AWAITING_PAYMENT"
        | "PAYMENT_CLAIMED"
        | "PAID"
        | "OVERDUE"
        | "DISPUTED"
        | "CANCELLED"
      PaymentProofStatus: "SUBMITTED" | "CONFIRMED" | "REJECTED"
      TaxRegime: "AUTO_ENTREPRENEUR" | "FORFAITAIRE" | "REEL"
      UserRole: "OWNER" | "MEMBER" | "ADMIN" | "USER" | "DEMO"
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
      InvoiceStatus: [
        "DRAFT",
        "SENT",
        "AWAITING_PAYMENT",
        "PAYMENT_CLAIMED",
        "PAID",
        "OVERDUE",
        "DISPUTED",
        "CANCELLED",
      ],
      PaymentProofStatus: ["SUBMITTED", "CONFIRMED", "REJECTED"],
      TaxRegime: ["AUTO_ENTREPRENEUR", "FORFAITAIRE", "REEL"],
      UserRole: ["OWNER", "MEMBER", "ADMIN", "USER", "DEMO"],
    },
  },
} as const
