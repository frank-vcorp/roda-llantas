/**
 * Tipos globales del proyecto
 *
 * @author SOFIA - Builder
 * @id IMPL-20260129-SPRINT3
 * @ref context/SPEC-DATA-MODEL.md
 */

export interface InventoryItem {
  id: string;
  profile_id: string;
  sku: string | null;
  description?: string; // Descripción original del Excel (Raw)
  brand: string;
  model: string;
  medida_full: string;
  width: number;
  aspect_ratio: number;
  rim: number;
  load_index: string | null;
  cost_price: number;
  stock: number;
  stock_location: string | null;
  manual_price: number | null; // Precio manual override
  updated_at: string;
  _publicPrice?: {
    public_price: number;
    is_manual: boolean;
    rule_applied?: string;
    margin_percentage?: number;
    volume_tiers?: { min_qty: number; price: number; margin: number }[];
  };
  warehouses?: { name: string; quantity: number }[]; // Multi-warehouse breakdown
}

export interface PricingRule {
  id: string;
  profile_id: string;
  name: string;
  brand_pattern: string | null;
  margin_percentage: number;
  priority: number;
  is_active: boolean;
  volume_rules?: VolumeRule[]; // FIX-20260204: Escalas por volumen
}

export interface VolumeRule {
  min_qty: number;
  margin_percentage: number;
}

export interface Customer {
  id: string;
  profile_id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  tax_id: string | null;
  created_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'seller';
  created_at: string;
  updated_at: string;
}

export interface OrganizationSettings {
  id: string;
  profile_id: string;
  name: string;
  address: string | null;
  phone: string | null;
  website: string | null;
  logo_url: string | null;
  ticket_footer_message: string;
  created_at: string;
  updated_at: string;
}

export type UserRole = 'admin' | 'seller';

