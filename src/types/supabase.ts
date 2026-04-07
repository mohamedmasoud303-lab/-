export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      properties: {
        Row: {
          id: string
          created_at: string
          name: string
          address: string
          type: 'residential' | 'commercial' | 'industrial'
          owner_id: string | null
          status: 'active' | 'inactive'
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          address: string
          type: 'residential' | 'commercial' | 'industrial'
          owner_id?: string | null
          status?: 'active' | 'inactive'
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          address?: string
          type?: 'residential' | 'commercial' | 'industrial'
          owner_id?: string | null
          status?: 'active' | 'inactive'
        }
      }
      units: {
        Row: {
          id: string
          property_id: string
          unit_number: string
          floor: number | null
          type: string
          rent_amount: number
          status: 'vacant' | 'occupied' | 'maintenance'
        }
        Insert: {
          id?: string
          property_id: string
          unit_number: string
          floor?: number | null
          type: string
          rent_amount: number
          status?: 'vacant' | 'occupied' | 'maintenance'
        }
        Update: {
          id?: string
          property_id?: string
          unit_number?: string
          floor?: number | null
          type?: string
          rent_amount?: number
          status?: 'vacant' | 'occupied' | 'maintenance'
        }
      }
      profiles: {
        Row: {
          id: string
          full_name: string
          role: 'admin' | 'manager' | 'owner' | 'tenant'
          phone: string | null
          avatar_url: string | null
        }
        Insert: {
          id: string
          full_name: string
          role?: 'admin' | 'manager' | 'owner' | 'tenant'
          phone?: string | null
          avatar_url?: string | null
        }
        Update: {
          id?: string
          full_name?: string
          role?: 'admin' | 'manager' | 'owner' | 'tenant'
          phone?: string | null
          avatar_url?: string | null
        }
      }
      contracts: {
        Row: {
          id: string
          unit_id: string
          tenant_id: string
          start_date: string
          end_date: string
          rent_amount: number
          security_deposit: number
          status: 'active' | 'expired' | 'terminated'
        }
        Insert: {
          id?: string
          unit_id: string
          tenant_id: string
          start_date: string
          end_date: string
          rent_amount: number
          security_deposit: number
          status?: 'active' | 'expired' | 'terminated'
        }
        Update: {
          id?: string
          unit_id?: string
          tenant_id?: string
          start_date?: string
          end_date?: string
          rent_amount?: number
          security_deposit?: number
          status?: 'active' | 'expired' | 'terminated'
        }
      }
      transactions: {
        Row: {
          id: string
          created_at: string
          amount: number
          type: 'income' | 'expense'
          category: string
          description: string | null
          contract_id: string | null
          property_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          amount: number
          type: 'income' | 'expense'
          category: string
          description?: string | null
          contract_id?: string | null
          property_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          amount?: number
          type?: 'income' | 'expense'
          category?: string
          description?: string | null
          contract_id?: string | null
          property_id?: string | null
        }
      }
    }
  }
}
