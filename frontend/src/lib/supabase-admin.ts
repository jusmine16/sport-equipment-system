import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export const mapEquipmentConditionToDb = (value?: string | null) => {
  const normalized = (value || '').toLowerCase();
  if (normalized === 'new' || normalized === 'good') return 'Good';
  if (normalized === 'fair') return 'Slightly Damaged';
  if (normalized === 'poor') return 'Needs Repair';
  return 'Good';
};

export const mapEquipmentConditionFromDb = (value?: string | null) => {
  const normalized = (value || '').toLowerCase();
  if (normalized.includes('good')) return 'good';
  if (normalized.includes('slight')) return 'fair';
  if (normalized.includes('repair') || normalized.includes('damage')) return 'poor';
  return 'good';
};

export const mapReturnConditionToDb = (value?: string | null) => {
  const normalized = (value || '').toLowerCase();
  if (normalized === 'new' || normalized === 'good') return 'Good';
  if (normalized === 'fair') return 'Damaged';
  if (normalized === 'poor') return 'Lost';
  return 'Good';
};

export const mapReturnConditionFromDb = (value?: string | null) => {
  const normalized = (value || '').toLowerCase();
  if (normalized.includes('good')) return 'good';
  if (normalized.includes('damag')) return 'fair';
  if (normalized.includes('lost')) return 'poor';
  return 'good';
};

export const mapConditionToDb = mapEquipmentConditionToDb;
export const mapConditionFromDb = mapEquipmentConditionFromDb;

export const mapStatusFromQuantity = (availableQuantity: number) => {
  return availableQuantity > 0 ? 'available' : 'maintenance';
};

export const mapBorrowStatusToClient = (status?: string | null) => {
  const normalized = (status || '').toLowerCase();
  if (normalized === 'pending') return 'pending';
  if (normalized === 'approved' || normalized === 'borrowed') return 'approved';
  if (normalized === 'cancelled' || normalized === 'rejected') return 'rejected';
  if (normalized === 'returned') return 'approved';
  return 'pending';
};
