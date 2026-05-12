import { NextRequest } from 'next/server';
import {
  successResponse,
  createdResponse,
  errorResponse,
  unauthorizedResponse,
  validationErrorResponse,
} from '@/lib/api-response';
import { borrowRequestSchema } from '@/lib/validation';
import { getCurrentUser } from '@/lib/auth';
import { mapBorrowStatusToClient, mapConditionToDb, supabaseAdmin } from '@/lib/supabase-admin';

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

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorizedResponse('Not authenticated');
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = supabaseAdmin
      .from('borrow_transactions')
      .select('*, borrower:borrower_id(*), equipment:equipment_id(*)')
      .order('created_at', { ascending: false });

    if (status) {
      const statusMap: Record<string, string[]> = {
        pending: ['Pending'],
        approved: ['Approved', 'Borrowed', 'Returned'],
        rejected: ['Cancelled', 'Rejected'],
      };
      const statuses = statusMap[status] || [];
      if (statuses.length > 0) {
        query = query.in('status', statuses);
      }
    }

    const { data, error } = await query;
    if (error) {
      return errorResponse(error.message, 500);
    }

    return successResponse((data || []).map(toBorrowRequest));
  } catch (error) {
    console.error('Get borrow requests error:', error);
    return errorResponse('Internal server error', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorizedResponse('Not authenticated');
    }

    const body = await request.json();

    // Validate input
    const validation = borrowRequestSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(
        validation.error.flatten().fieldErrors as Record<string, string>
      );
    }

    const { items, borrowerName, idNumber, departmentCourse, contactNumber, expectedReturnDate, purpose } = validation.data;

    const { data: borrower, error: borrowerError } = await supabaseAdmin
      .from('borrowers')
      .upsert(
        {
          borrower_name: borrowerName,
          id_number: idNumber,
          department_course: departmentCourse,
          contact_number: contactNumber,
        },
        { onConflict: 'id_number' }
      )
      .select('*')
      .single();

    if (borrowerError || !borrower) {
      return errorResponse(borrowerError?.message || 'Failed to save borrower', 500);
    }

    const createdRows: any[] = [];

    const borrowDate = new Date().toISOString().slice(0, 10);
    const returnDate = expectedReturnDate || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

    for (const item of items) {
      const { data: equipment, error: equipmentError } = await supabaseAdmin
        .from('equipment')
        .select('*')
        .eq('id', item.equipment)
        .single();

      if (equipmentError || !equipment) {
        return errorResponse(`Equipment with id ${item.equipment} not found`, 404);
      }

      const available = Number(equipment.available_quantity ?? 0);
      if (available < item.quantity) {
        return errorResponse(
          `Not enough stock for ${equipment.equipment_name}. Available: ${available}`,
          400
        );
      }

      const { data: created, error: createError } = await supabaseAdmin
        .from('borrow_transactions')
        .insert({
          borrower_id: borrower.id,
          equipment_id: item.equipment,
          quantity_borrowed: item.quantity,
          purpose: purpose || null,
          borrow_date: borrowDate,
          expected_return_date: returnDate,
          approved_by: null,
          checked_by: user.username,
          condition_before: mapConditionToDb('good'),
          remarks_before: null,
          agreement_accepted: true,
          status: 'Pending',
        })
        .select('*, borrower:borrower_id(*), equipment:equipment_id(*)')
        .single();

      if (createError || !created) {
        return errorResponse(createError?.message || 'Failed to create borrow request', 500);
      }

      createdRows.push(created);
    }

    return createdResponse(toBorrowRequest(createdRows[0]), 'Borrow request created successfully');
  } catch (error) {
    console.error('Create borrow request error:', error);
    return errorResponse('Internal server error', 500);
  }
}
