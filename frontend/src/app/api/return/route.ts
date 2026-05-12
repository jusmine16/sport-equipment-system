import { NextRequest } from 'next/server';
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse,
  validationErrorResponse,
} from '@/lib/api-response';
import { returnEquipmentSchema } from '@/lib/validation';
import { getCurrentUser } from '@/lib/auth';
import {
  mapEquipmentConditionToDb,
  mapReturnConditionToDb,
  supabaseAdmin,
} from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorizedResponse('Not authenticated');
    }

    const body = await request.json();

    // Validate input
    const validation = returnEquipmentSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(
        validation.error.flatten().fieldErrors as Record<string, string>
      );
    }

    const { transaction_id, return_date, condition_on_return } = validation.data;

    const selectedReturnDate = return_date || new Date().toISOString().slice(0, 10);

    const { data: transaction, error: transactionError } = await supabaseAdmin
      .from('borrow_transactions')
      .select('*, equipment:equipment_id(*)')
      .eq('id', transaction_id)
      .single();

    if (transactionError || !transaction) {
      return notFoundResponse('Transaction not found');
    }

    if ((transaction.status || '').toLowerCase() === 'returned') {
      return errorResponse('This equipment has already been returned', 400);
    }

    const qty = Number(transaction.quantity_borrowed || 0);
    const expectedReturnDate = transaction.expected_return_date;

    let isLate = false;
    let overdueCharge = 0;

    // Condition-based penalties applied even when return is on time.
    const conditionPenaltyMap: Record<string, number> = {
      new: 0,
      good: 0,
      fair: 50,
      poor: 100,
    };
    const conditionPenalty = conditionPenaltyMap[condition_on_return] ?? 0;

    if (expectedReturnDate) {
      const returnDateObj = new Date(selectedReturnDate);
      const expectedDateObj = new Date(expectedReturnDate);
      const daysLate = Math.floor((returnDateObj.getTime() - expectedDateObj.getTime()) / (1000 * 60 * 60 * 24));
      if (daysLate > 0) {
        isLate = true;
        if (daysLate === 1) overdueCharge = 20;
        else if (daysLate <= 3) overdueCharge = 50;
        else overdueCharge = 100;
      }
    }

    const damageCharge = conditionPenalty;
    const penaltyAmount = overdueCharge + damageCharge;

    const insertPayload = {
      borrow_transaction_id: transaction_id,
      return_date: selectedReturnDate,
      returned_quantity: qty,
      condition_after: mapReturnConditionToDb(condition_on_return),
      remarks_after: null,
      checked_by: user.username,
      is_late: isLate,
      overdue_charge: overdueCharge,
      damage_charge: damageCharge,
      penalty_amount: penaltyAmount,
      final_status: 'Returned',
    };

    let { error: returnError } = await supabaseAdmin.from('return_transactions').insert(insertPayload);

    if (returnError && /overdue_charge|damage_charge/i.test(returnError.message || '')) {
      const fallbackPayload = {
        borrow_transaction_id: transaction_id,
        return_date: selectedReturnDate,
        returned_quantity: qty,
        condition_after: mapReturnConditionToDb(condition_on_return),
        remarks_after: null,
        checked_by: user.username,
        is_late: isLate,
        penalty_amount: penaltyAmount,
        final_status: 'Returned',
      };
      const fallback = await supabaseAdmin.from('return_transactions').insert(fallbackPayload);
      returnError = fallback.error;
    }

    if (returnError) {
      return errorResponse(returnError.message, 500);
    }

    const available = Number(transaction.equipment?.available_quantity || 0);
    const { error: equipmentError } = await supabaseAdmin
      .from('equipment')
      .update({ available_quantity: available + qty })
      .eq('id', transaction.equipment_id);
    if (equipmentError) {
      return errorResponse(equipmentError.message, 500);
    }

    const { data: updated, error: borrowUpdateError } = await supabaseAdmin
      .from('borrow_transactions')
      .update({ status: 'Returned' })
      .eq('id', transaction_id)
      .select('*, equipment:equipment_id(*)')
      .single();
    if (borrowUpdateError || !updated) {
      return errorResponse(borrowUpdateError?.message || 'Failed to update transaction status', 500);
    }

    await supabaseAdmin.from('condition_logs').insert({
      equipment_id: transaction.equipment_id,
      transaction_type: 'Return',
      condition_status: mapEquipmentConditionToDb(condition_on_return),
      notes: null,
      checked_by: user.username,
    });

    return successResponse(updated, 'Equipment returned successfully');
  } catch (error) {
    console.error('Return equipment error:', error);
    return errorResponse('Internal server error', 500);
  }
}
