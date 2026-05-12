import { NextRequest } from 'next/server';
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
} from '@/lib/api-response';
import { getCurrentUser } from '@/lib/auth';
import { mapBorrowStatusToClient, supabaseAdmin } from '@/lib/supabase-admin';

const toBorrowRequest = (row: any) => ({
  id: Number(row.id),
  userId: row.checked_by || row.approved_by || 'system',
  status: mapBorrowStatusToClient(row.status),
  requestDate: row.created_at,
  borrowerName: row.borrower?.borrower_name || '',
  idNumber: row.borrower?.id_number || '',
  departmentCourse: row.borrower?.department_course || '',
  contactNumber: row.borrower?.contact_number || '',
  expectedReturnDate: row.expected_return_date,
  purpose: row.purpose || '',
  user: {
    id: row.checked_by || row.approved_by || 'system',
    username: row.borrower?.borrower_name || 'Unknown',
  },
  items: [
    {
      id: Number(row.id),
      equipmentId: Number(row.equipment?.id || 0),
      quantity: Number(row.quantity_borrowed || 0),
      equipment: {
        id: Number(row.equipment?.id || 0),
        name: row.equipment?.equipment_name || 'Unknown',
      },
    },
  ],
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return unauthorizedResponse('Not authenticated');
    }

    const { data: borrowRequest, error } = await supabaseAdmin
      .from('borrow_transactions')
      .select('*, borrower:borrower_id(*), equipment:equipment_id(*)')
      .eq('id', parseInt(id))
      .single();

    if (error || !borrowRequest) {
      return notFoundResponse('Borrow request not found');
    }

    // Check permission
    if (user.role !== 'admin') {
      return forbiddenResponse('You do not have permission to view this request');
    }

    return successResponse(toBorrowRequest(borrowRequest));
  } catch (error) {
    console.error('Get borrow request error:', error);
    return errorResponse('Internal server error', 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return unauthorizedResponse('Not authenticated');
    }

    const { data: borrowRequest, error: borrowError } = await supabaseAdmin
      .from('borrow_transactions')
      .select('*, equipment:equipment_id(*)')
      .eq('id', parseInt(id))
      .single();

    if (borrowError || !borrowRequest) {
      return notFoundResponse('Borrow request not found');
    }

    if (user.role !== 'admin') {
      return forbiddenResponse('Only admins can update borrow requests');
    }

    if ((borrowRequest.status || '').toLowerCase() !== 'pending') {
      return errorResponse(
        `Request is already ${borrowRequest.status}`,
        400
      );
    }

    const body = await request.json();
    const { action, notes } = body;

    if (action === 'approve') {
      const available = Number(borrowRequest.equipment?.available_quantity ?? 0);
      const qty = Number(borrowRequest.quantity_borrowed ?? 0);
      if (available < qty) {
        return errorResponse(
          `Not enough stock for ${borrowRequest.equipment?.equipment_name || 'equipment'}. Available: ${available}`,
          400
        );
      }

      const { error: updateEquipmentError } = await supabaseAdmin
        .from('equipment')
        .update({ available_quantity: available - qty })
        .eq('id', borrowRequest.equipment_id);

      if (updateEquipmentError) {
        return errorResponse(updateEquipmentError.message, 500);
      }

      const { data: updated, error: updateBorrowError } = await supabaseAdmin
        .from('borrow_transactions')
        .update({
          status: 'Approved',
          approved_by: user.username,
          remarks_before: notes || borrowRequest.remarks_before,
        })
        .eq('id', parseInt(id))
        .select('*, borrower:borrower_id(*), equipment:equipment_id(*)')
        .single();

      if (updateBorrowError || !updated) {
        return errorResponse(updateBorrowError?.message || 'Failed to approve borrow request', 500);
      }

      return successResponse(toBorrowRequest(updated), 'Borrow request approved');
    } else if (action === 'reject') {
      const { data: updated, error: rejectError } = await supabaseAdmin
        .from('borrow_transactions')
        .update({
          status: 'Cancelled',
          remarks_before: notes || borrowRequest.remarks_before,
        })
        .eq('id', parseInt(id))
        .select('*, borrower:borrower_id(*), equipment:equipment_id(*)')
        .single();

      if (rejectError || !updated) {
        return errorResponse(rejectError?.message || 'Failed to reject borrow request', 500);
      }

      return successResponse(toBorrowRequest(updated), 'Borrow request rejected');
    } else {
      return errorResponse('Invalid action', 400);
    }
  } catch (error) {
    console.error('Update borrow request error:', error);
    return errorResponse('Internal server error', 500);
  }
}
