import { NextRequest } from 'next/server';
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  validationErrorResponse,
} from '@/lib/api-response';
import { equipmentSchema } from '@/lib/validation';
import { getCurrentUser } from '@/lib/auth';
import { mapConditionFromDb, mapConditionToDb, mapStatusFromQuantity, supabaseAdmin } from '@/lib/supabase-admin';

const toClientEquipment = (row: any) => ({
  id: Number(row.id),
  name: row.equipment_name,
  category: (row.category || 'other').toLowerCase(),
  quantity: Number(row.total_quantity ?? 0),
  availableQuantity: Number(row.available_quantity ?? 0),
  condition: mapConditionFromDb(row.condition_status),
  status: mapStatusFromQuantity(Number(row.available_quantity ?? 0)),
  imageUrl: row.image_url ?? null,
  description: row.remarks ?? null,
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

    const { data, error } = await supabaseAdmin.from('equipment').select('*').eq('id', parseInt(id)).single();

    if (error || !data) {
      return notFoundResponse('Equipment not found');
    }

    return successResponse(toClientEquipment(data));
  } catch (error) {
    console.error('Get equipment error:', error);
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

    if (user.role !== 'admin') {
      return forbiddenResponse('Only admins can update equipment');
    }

    const body = await request.json();
    const validation = equipmentSchema.partial().safeParse(body);

    if (!validation.success) {
      return validationErrorResponse(
        validation.error.flatten().fieldErrors as Record<string, string>
      );
    }

    const { data: equipment, error: equipmentError } = await supabaseAdmin
      .from('equipment')
      .select('*')
      .eq('id', parseInt(id))
      .single();

    if (equipmentError || !equipment) {
      return notFoundResponse('Equipment not found');
    }

    const updateData: any = {};
    if (typeof validation.data.name === 'string') updateData.equipment_name = validation.data.name;
    if (typeof validation.data.category === 'string') updateData.category = validation.data.category;
    if (typeof validation.data.condition === 'string') updateData.condition_status = mapConditionToDb(validation.data.condition);
    if ('image' in validation.data) updateData.image_url = validation.data.image ?? null;
    if ('description' in validation.data) updateData.remarks = validation.data.description ?? null;
    
    // Handle quantity update
    if (typeof validation.data.quantity === 'number') {
      const newQty = validation.data.quantity;
      const oldQty = Number(equipment.total_quantity ?? 0);
      const oldAvailable = Number(equipment.available_quantity ?? 0);
      const diff = newQty - oldQty;
      updateData.total_quantity = newQty;
      updateData.available_quantity = Math.max(0, oldAvailable + diff);
    }

    const { data: updatedEquipment, error: updateError } = await supabaseAdmin
      .from('equipment')
      .update(updateData)
      .eq('id', parseInt(id))
      .select('*')
      .single();

    if (updateError || !updatedEquipment) {
      return errorResponse(updateError?.message || 'Failed to update equipment', 500);
    }

    return successResponse(toClientEquipment(updatedEquipment), 'Equipment updated successfully');
  } catch (error) {
    console.error('Update equipment error:', error);
    return errorResponse('Internal server error', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const equipmentId = parseInt(id, 10);

    if (Number.isNaN(equipmentId)) {
      return errorResponse('Invalid equipment id', 400);
    }

    const user = await getCurrentUser();
    if (!user) {
      return unauthorizedResponse('Not authenticated');
    }

    if (user.role !== 'admin') {
      return forbiddenResponse('Only admins can delete equipment');
    }

    const { data: equipment, error: equipmentError } = await supabaseAdmin
      .from('equipment')
      .select('id')
      .eq('id', equipmentId)
      .single();

    if (equipmentError || !equipment) {
      return notFoundResponse('Equipment not found');
    }

    const { count: activeTransactionsCount } = await supabaseAdmin
      .from('borrow_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('equipment_id', equipmentId)
      .in('status', ['Pending', 'Approved', 'Borrowed']);

    if ((activeTransactionsCount || 0) > 0) {
      return errorResponse('Cannot delete equipment that has active transactions', 400);
    }

    const { error: deleteError } = await supabaseAdmin.from('equipment').delete().eq('id', equipmentId);
    if (deleteError) {
      return errorResponse(deleteError.message, 500);
    }

    return successResponse({ id: equipmentId }, 'Equipment deleted successfully');
  } catch (error) {
    console.error('Delete equipment error:', error);
    return errorResponse('Internal server error', 500);
  }
}
