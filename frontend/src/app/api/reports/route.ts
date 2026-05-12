import { NextRequest } from 'next/server';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/lib/api-response';
import { getCurrentUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

type EquipmentRow = {
  category: string | null;
  total_quantity: number | null;
  available_quantity: number | null;
};

type BorrowRow = {
  status: string | null;
  quantity_borrowed: number | null;
};

type ReturnRow = {
  penalty_amount: number | null;
  is_late: boolean | null;
  overdue_charge?: number | null;
  damage_charge?: number | null;
};

type ReturnRowQuery = {
  penalty_amount: number | null;
  is_late: boolean | null;
  overdue_charge?: number | null;
  damage_charge?: number | null;
};

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorizedResponse('Not authenticated');
    }

    // Only admins can view reports
    if (user.role !== 'admin') {
      return forbiddenResponse('Only admins can view reports');
    }

    const { data: equipmentRows, error: equipmentError } = await supabaseAdmin
      .from('equipment')
      .select('id, category, total_quantity, available_quantity');
    if (equipmentError) {
      return errorResponse(equipmentError.message, 500);
    }

    const { data: borrowRows, error: borrowError } = await supabaseAdmin
      .from('borrow_transactions')
      .select('status, quantity_borrowed');
    if (borrowError) {
      return errorResponse(borrowError.message, 500);
    }

    const returnResult = await supabaseAdmin
      .from('return_transactions')
      .select('penalty_amount, is_late, overdue_charge, damage_charge');
    let returnRows = returnResult.data as ReturnRowQuery[] | null;
    let returnError = returnResult.error;

    if (returnError && /overdue_charge|damage_charge/i.test(returnError.message || '')) {
      const fallback = await supabaseAdmin
        .from('return_transactions')
        .select('penalty_amount, is_late');
      returnRows = fallback.data as ReturnRowQuery[] | null;
      returnError = fallback.error;
    }
    if (returnError) {
      return errorResponse(returnError.message, 500);
    }

    const { count: totalUsers, error: usersError } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    if (usersError) {
      return errorResponse(usersError.message, 500);
    }

    const typedEquipmentRows = (equipmentRows || []) as EquipmentRow[];
    const typedBorrowRows = (borrowRows || []) as BorrowRow[];
    const typedReturnRows = (returnRows || []) as ReturnRowQuery[];

    const totalEquipment = typedEquipmentRows.length;
    const availableQty = typedEquipmentRows.reduce((sum, row) => sum + Number(row.available_quantity || 0), 0);
    const totalQty = typedEquipmentRows.reduce((sum, row) => sum + Number(row.total_quantity || 0), 0);

    const totalBorrowed = typedBorrowRows
      .filter((row) => ['Approved', 'Borrowed'].includes(row.status || ''))
      .reduce((sum, row) => sum + Number(row.quantity_borrowed || 0), 0);

    const totalReturned = typedBorrowRows
      .filter((row) => row.status === 'Returned')
      .reduce((sum, row) => sum + Number(row.quantity_borrowed || 0), 0);

    const pendingRequests = typedBorrowRows.filter((row) => row.status === 'Pending').length;
    const approvedRequests = typedBorrowRows.filter((row) => ['Approved', 'Borrowed', 'Returned'].includes(row.status || '')).length;
    const rejectedRequests = typedBorrowRows.filter((row) => ['Cancelled', 'Rejected'].includes(row.status || '')).length;

    const categoryMap = new Map<string, { category: string; quantity: number; availableQuantity: number; _count: number }>();
    for (const row of typedEquipmentRows) {
      const category = row.category || 'other';
      const existing = categoryMap.get(category) || {
        category,
        quantity: 0,
        availableQuantity: 0,
        _count: 0,
      };
      existing.quantity += Number(row.total_quantity || 0);
      existing.availableQuantity += Number(row.available_quantity || 0);
      existing._count += 1;
      categoryMap.set(category, existing);
    }
    const categoryBreakdown = Array.from(categoryMap.values());

    const totalPenaltyAmount = typedReturnRows.reduce((sum, row) => sum + Number(row.penalty_amount || 0), 0);

    const totalOverdueCharges = typedReturnRows.reduce((sum, row) => sum + Number(row.overdue_charge || 0), 0);

    const totalDamageCharges = typedReturnRows.reduce((sum, row) => sum + Number(row.damage_charge || 0), 0);

    const totalLateReturns = typedReturnRows.filter((row) => Boolean(row.is_late)).length;

    const reports = {
      equipment: {
        total: totalEquipment,
        totalQuantity: totalQty,
        availableQuantity: availableQty,
        categoryBreakdown,
      },
      borrowing: {
        totalBorrowed,
        totalReturned,
        totalPenaltyAmount,
        totalOverdueCharges,
        totalDamageCharges,
        totalLateReturns,
      },
      requests: {
        pending: pendingRequests,
        approved: approvedRequests,
        rejected: rejectedRequests,
      },
      users: {
        total: totalUsers ?? 0,
      },
    };

    return successResponse(reports);
  } catch (error) {
    console.error('Get reports error:', error);
    return errorResponse('Internal server error', 500);
  }
}
