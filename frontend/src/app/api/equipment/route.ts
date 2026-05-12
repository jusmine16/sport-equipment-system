import { NextRequest } from 'next/server';
import {
  successResponse,
  createdResponse,
  errorResponse,
  unauthorizedResponse,
  validationErrorResponse,
  forbiddenResponse,
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

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorizedResponse('Not authenticated');
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category');
    const status = searchParams.get('status');

    let where: any = {};
    const query = supabaseAdmin
      .from('equipment')
      .select('*')
      .order('equipment_name', { ascending: true });

    if (search) {
      query.or(`equipment_name.ilike.%${search}%,equipment_code.ilike.%${search}%,remarks.ilike.%${search}%`);
    }

    if (category) {
      query.eq('category', category);
    }

    const { data, error } = await query;
    if (error) {
      return errorResponse(error.message, 500);
    }

    const equipment = (data || []).map(toClientEquipment).filter((item) => {
      if (!status) return true;
      return item.status === status;
    });

    return successResponse(equipment);
  } catch (error) {
    console.error('Get equipment error:', error);
    return errorResponse('Internal server error', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorizedResponse('Not authenticated');
    }

    // Check if user is admin
    if (user.role !== 'admin') {
      return forbiddenResponse('Only admins can create equipment');
    }

    const body = await request.json();

    // Validate input
    const validation = equipmentSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(
        validation.error.flatten().fieldErrors as Record<string, string>
      );
    }

    const { name, category, quantity, condition, status, image, description } = validation.data;

    const generatedCode = `EQ-${Date.now()}`;
    const insertData: Record<string, unknown> = {
      equipment_code: generatedCode,
      equipment_name: name,
      category,
      total_quantity: quantity,
      available_quantity: quantity,
      condition_status: mapConditionToDb(condition),
      image_url: image ?? null,
      remarks: description ?? null,
    };

    const { data, error } = await supabaseAdmin.from('equipment').insert(insertData).select('*').single();
    if (error) {
      return errorResponse(error.message, 500);
    }

    const equipment = toClientEquipment(data);

    return createdResponse(equipment, 'Equipment created successfully');
  } catch (error) {
    console.error('Create equipment error:', error);
    return errorResponse('Internal server error', 500);
  }
}
