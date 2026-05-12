import { NextRequest } from 'next/server';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api-response';
import { getCurrentUser } from '@/lib/auth';
import { mapReturnConditionFromDb, supabaseAdmin } from '@/lib/supabase-admin';

type ReturnRow = {
  return_date: string | null;
  condition_after: string | null;
  penalty_amount: number | null;
  overdue_charge?: number | null;
  damage_charge?: number | null;
  is_late: boolean | null;
};

type BorrowTransactionRow = {
  id: number | null;
  quantity_borrowed: number | null;
  borrow_date: string | null;
  expected_return_date: string | null;
  returns: ReturnRow[] | null;
  equipment: {
    id: number | null;
    equipment_name: string | null;
  } | null;
};

type TransactionResponseRow = {
  id: number;
  quantity: number;
  borrowDate: string | null;
  expectedReturnDate: string | null;
  returnDate: string | null;
  conditionOnReturn: string | null;
  penaltyAmount: number;
  overdueCharge: number;
  damageCharge: number;
  isLate: boolean;
  equipment: {
    id: number;
    name: string;
  };
};

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorizedResponse('Not authenticated');
    }

    const { searchParams } = new URL(request.url);
    const returnedOnly = searchParams.get('returned') === 'true';
    const activeOnly = searchParams.get('active') === 'true';

    let { data, error } = await supabaseAdmin
      .from('borrow_transactions')
      .select('*, equipment:equipment_id(*), returns:return_transactions(return_date, condition_after, penalty_amount, is_late, overdue_charge, damage_charge), expected_return_date')
      .order('borrow_date', { ascending: false });

    if (error && /overdue_charge|damage_charge/i.test(error.message || '')) {
      const fallback = await supabaseAdmin
        .from('borrow_transactions')
        .select('*, equipment:equipment_id(*), returns:return_transactions(return_date, condition_after, penalty_amount, is_late), expected_return_date')
        .order('borrow_date', { ascending: false });

      data = fallback.data;
      error = fallback.error;
    }

    if (error) {
      return errorResponse(error.message, 500);
    }

    const typedRows = (data || []) as BorrowTransactionRow[];

    const rows = typedRows.map((row) => {
      const latestReturn = Array.isArray(row.returns) && row.returns.length > 0 ? row.returns[0] : null;
      return {
        id: Number(row.id),
        quantity: Number(row.quantity_borrowed || 0),
        borrowDate: row.borrow_date,
        expectedReturnDate: row.expected_return_date || null,
        returnDate: latestReturn?.return_date || null,
        conditionOnReturn: latestReturn?.condition_after ? mapReturnConditionFromDb(latestReturn.condition_after) : null,
        penaltyAmount: latestReturn?.penalty_amount ?? 0,
        overdueCharge: latestReturn?.overdue_charge ?? 0,
        damageCharge: latestReturn?.damage_charge ?? 0,
        isLate: latestReturn?.is_late ?? false,
        equipment: {
          id: Number(row.equipment?.id || 0),
          name: row.equipment?.equipment_name || 'Unknown',
        },
      };
    }).filter((row: TransactionResponseRow) => {
      if (returnedOnly) return !!row.returnDate;
      if (activeOnly) return !row.returnDate;
      return true;
    });

    return successResponse(rows);
  } catch (error) {
    console.error('Get transactions error:', error);
    return errorResponse('Internal server error', 500);
  }
}
