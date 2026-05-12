/**
 * API client for local Next.js API routes.
 */

export interface Equipment {
  id: number;
  name: string;
  image?: string | null;
  category: string;
  category_display: string;
  quantity: number;
  available_quantity: number;
  condition: string;
  condition_display: string;
  status: string;
  status_display: string;
}

export interface BorrowItem {
  id: number;
  equipment: number;
  equipment_name: string;
  quantity: number;
}

export interface BorrowRequest {
  id: number;
  user: string;
  user_name: string;
  borrower_name: string;
  id_number: string;
  department_course: string;
  contact_number: string;
  expected_return_date: string | null;
  purpose: string;
  status: string;
  request_date: string;
  items: BorrowItem[];
}

export interface Transaction {
  id: number;
  equipment_name: string;
  quantity: number;
  borrow_date: string;
  expected_return_date: string | null;
  return_date: string | null;
  condition_on_return: string | null;
  penalty_amount?: number;
  overdue_charge?: number;
  damage_charge?: number;
  is_late?: boolean;
}

export interface Reports {
  total_equipment: number;
  total_units: number;
  available_units: number;
  borrowed_units: number;
  pending_requests: number;
  active_transactions: number;
  total_penalty_amount?: number;
  total_overdue_charges?: number;
  total_damage_charges?: number;
  total_late_returns?: number;
}

const AUTH_FLAG_KEY = "supabase_logged_in";
const AUTH_TOKEN_KEY = "auth_token";

const setAuthFlag = (value: boolean) => {
  if (typeof window === "undefined") return;
  if (value) {
    localStorage.setItem(AUTH_FLAG_KEY, "1");
  } else {
    localStorage.removeItem(AUTH_FLAG_KEY);
  }
};

const setClientToken = (token: string | null) => {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }
};

export const clearAuth = () => {
  setAuthFlag(false);
  setClientToken(null);
};

type ApiError = Error & { status?: number; data?: unknown };

type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

const toError = (message: string, status?: number, data?: unknown): ApiError => {
  const err = new Error(message) as ApiError;
  err.status = status;
  err.data = data;
  return err;
};

const apiRequest = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const token = typeof window !== "undefined" ? localStorage.getItem(AUTH_TOKEN_KEY) : null;
  const response = await fetch(url, {
    credentials: "include",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });

  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;
  if (!response.ok || !payload?.success) {
    throw toError(payload?.error || "Request failed", response.status, payload);
  }

  return payload.data as T;
};

const categoryDisplay = (category: string) => {
  const map: Record<string, string> = {
    balls: "Balls",
    rackets: "Rackets",
    protective: "Protective Gear",
    fitness: "Fitness Equipment",
    other: "Other",
  };
  return map[category] ?? category;
};

const conditionDisplay = (condition: string) => {
  const map: Record<string, string> = {
    new: "New",
    good: "Good",
    fair: "Fair",
    poor: "Poor",
  };
  return map[condition] ?? condition;
};

const statusDisplay = (status: string) => {
  const map: Record<string, string> = {
    available: "Available",
    maintenance: "Under Maintenance",
    retired: "Retired",
  };
  return map[status] ?? status;
};

const resolveImageUrl = (value?: string | null) => {
  if (!value) return null;
  if (value.startsWith("data:")) {
    return value;
  }

  // Keep local static assets from /public untouched.
  if (value.startsWith("/")) {
    return value;
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    // Normalize old/non-public Supabase object URLs:
    // /storage/v1/object/equipment-images/<file> -> /storage/v1/object/public/equipment-images/<file>
    if (value.includes("/storage/v1/object/equipment-images/")) {
      return value.replace(
        "/storage/v1/object/equipment-images/",
        "/storage/v1/object/public/equipment-images/"
      );
    }
    return value;
  }

  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!baseUrl) return value;
  return `${baseUrl}/storage/v1/object/public/equipment-images/${value.replace(/^\/+/, "")}`;
};

const asInt = (value: unknown) => {
  if (typeof value === "number") return value;
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

type DbEquipment = {
  id: number;
  name: string;
  image?: string | null;
  image_url?: string | null;
  imageUrl?: string | null;
  category: string;
  quantity: number;
  available_quantity?: number;
  availableQuantity?: number;
  condition: string;
  status: string;
};

type BorrowApiItem = {
  id?: number | string | null;
  equipmentId?: number | string | null;
  equipment?: { name?: string | null } | number | null;
  equipment_name?: string | null;
  quantity?: number | string | null;
};

type BorrowApiRow = {
  id?: number | string | null;
  userId?: string | null;
  user?: { id?: string | number | null; username?: string | null } | null;
  user_name?: string | null;
  borrowerName?: string | null;
  borrower_name?: string | null;
  idNumber?: string | null;
  id_number?: string | null;
  departmentCourse?: string | null;
  department_course?: string | null;
  contactNumber?: string | null;
  contact_number?: string | null;
  expectedReturnDate?: string | null;
  expected_return_date?: string | null;
  purpose?: string | null;
  status?: string | null;
  requestDate?: string | null;
  request_date?: string | null;
  items?: BorrowApiItem[] | null;
};

type TransactionApiEquipment = {
  name?: string | null;
};

type TransactionApiRow = {
  id?: number | string | null;
  equipment?: TransactionApiEquipment | null;
  equipment_name?: string | null;
  quantity?: number | string | null;
  borrowDate?: string | null;
  borrow_date?: string | null;
  expectedReturnDate?: string | null;
  expected_return_date?: string | null;
  returnDate?: string | null;
  return_date?: string | null;
  conditionOnReturn?: string | null;
  condition_on_return?: string | null;
  penaltyAmount?: number | string | null;
  penalty_amount?: number | string | null;
  overdueCharge?: number | string | null;
  overdue_charge?: number | string | null;
  damageCharge?: number | string | null;
  damage_charge?: number | string | null;
  isLate?: boolean | null;
  is_late?: boolean | null;
};

type ReportsApiPayload = {
  equipment?: {
    total?: number | string | null;
    totalQuantity?: number | string | null;
    availableQuantity?: number | string | null;
  } | null;
  borrowing?: {
    totalBorrowed?: number | string | null;
    totalPenaltyAmount?: number | string | null;
    totalOverdueCharges?: number | string | null;
    totalDamageCharges?: number | string | null;
    totalLateReturns?: number | string | null;
  } | null;
  requests?: {
    pending?: number | string | null;
  } | null;
};

const mapEquipment = (row: DbEquipment): Equipment => ({
  id: row.id,
  name: row.name,
  image: resolveImageUrl(row.image ?? row.image_url ?? row.imageUrl ?? null),
  category: row.category,
  category_display: categoryDisplay(row.category),
  quantity: asInt(row.quantity),
  available_quantity: asInt(row.available_quantity ?? row.availableQuantity),
  condition: row.condition,
  condition_display: conditionDisplay(row.condition),
  status: row.status,
  status_display: statusDisplay(row.status),
});

export const register = async (data: {
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  password: string;
  password_confirm: string;
}) => {
  if (data.password !== data.password_confirm) {
    throw toError("Passwords do not match", 400);
  }

  await apiRequest<{ user_id: string; username: string }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });

  return { message: "User registered successfully" };
};

export const login = async (identifier: string, password: string) => {
  const result = await apiRequest<{ access: string; refresh: string }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ identifier, password }),
  });

  setAuthFlag(true);
  setClientToken(result.access ?? "");

  return { access: result.access ?? "", refresh: result.refresh ?? "" };
};

export const getUser = async (): Promise<{ id: number; username: string; role: string }> => {
  const result = await apiRequest<{ id: number; username: string; role: string }>("/api/auth/user");

  return {
    id: asInt(result.id),
    username: result.username,
    role: result.role,
  };
};

export const getEquipment = async (search = "", category = "") => {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (category) params.set("category", category);
  const suffix = params.toString() ? `?${params.toString()}` : "";
  const data = await apiRequest<DbEquipment[]>(`/api/equipment${suffix}`);
  return (data ?? []).map((row) => mapEquipment(row));
};

export const createEquipment = async (data: Partial<Equipment>) => {
  const payload = {
    name: data.name,
    category: data.category,
    quantity: asInt(data.quantity),
    condition: data.condition,
    status: data.status,
    image: data.image ?? null,
  };
  await apiRequest("/api/equipment", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return { ok: true };
};

export const updateEquipment = async (id: number, data: Partial<Equipment>) => {
  await apiRequest(`/api/equipment/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      name: data.name,
      category: data.category,
      quantity: data.quantity,
      condition: data.condition,
      status: data.status,
    }),
  });
  return { ok: true };
};

export const deleteEquipment = async (id: number) => {
  await apiRequest(`/api/equipment/${id}`, {
    method: "DELETE",
  });
  return { ok: true };
};

export const createBorrow = async (
  items: { equipment: number; quantity: number }[],
  borrowerInfo: {
    borrowerName: string;
    idNumber: string;
    departmentCourse: string;
    contactNumber: string;
    expectedReturnDate?: string;
    purpose?: string;
  }
) => {
  const data = await apiRequest<{ id: number }>("/api/borrow", {
    method: "POST",
    body: JSON.stringify({
      items,
      ...borrowerInfo,
    }),
  });
  return { id: data.id };
};

export const setAuthToken = () => {
  // Kept for compatibility with existing context code.
};

export const getBorrows = async () => {
  const requests = await apiRequest<BorrowApiRow[]>("/api/borrow");

  return (requests ?? []).map((r) => ({
    id: asInt(r.id),
    user: String(r.userId ?? r.user?.id ?? ""),
    user_name: String(r.user?.username ?? r.user_name ?? "Unknown"),
    borrower_name: String(r.borrowerName ?? r.borrower_name ?? ""),
    id_number: String(r.idNumber ?? r.id_number ?? ""),
    department_course: String(r.departmentCourse ?? r.department_course ?? ""),
    contact_number: String(r.contactNumber ?? r.contact_number ?? ""),
    expected_return_date: r.expectedReturnDate ?? r.expected_return_date ?? null,
    purpose: String(r.purpose ?? ""),
    status: String(r.status),
    request_date: String(r.requestDate ?? r.request_date ?? ""),
    items: (r.items ?? []).map((i) => ({
      id: asInt(i.id),
      equipment: asInt(i.equipmentId ?? (typeof i.equipment === "number" ? i.equipment : undefined)),
      equipment_name: String(
        typeof i.equipment === "object" && i.equipment !== null && "name" in i.equipment
          ? (i.equipment as { name?: string | null }).name ?? i.equipment_name ?? "Unknown"
          : i.equipment_name ?? "Unknown"
      ),
      quantity: asInt(i.quantity),
    })),
  })) as BorrowRequest[];
};

export const approveBorrow = async (id: number) => {
  await apiRequest(`/api/borrow/${id}`, {
    method: "PUT",
    body: JSON.stringify({ action: "approve" }),
  });
  return { ok: true };
};

export const rejectBorrow = async (id: number, notes = "") => {
  await apiRequest(`/api/borrow/${id}`, {
    method: "PUT",
    body: JSON.stringify({ action: "reject", notes }),
  });
  return { ok: true };
};

export const returnEquipment = async (data: {
  transaction_id?: number;
  equipment_id?: number;
  quantity?: number;
  return_date?: string;
  condition_on_return: string;
}) => {
  if (!data.transaction_id) {
    throw toError("transaction_id is required", 400);
  }

  await apiRequest("/api/return", {
    method: "POST",
    body: JSON.stringify({
      transaction_id: data.transaction_id,
      return_date: data.return_date,
      condition_on_return: data.condition_on_return,
    }),
  });

  return { ok: true };
};

export const getTransactions = async () => {
  const rows = await apiRequest<TransactionApiRow[]>("/api/transactions");

  return (rows ?? []).map((t) => ({
    id: asInt(t.id),
    equipment_name: String(
      typeof t.equipment === "object" && t.equipment !== null && "name" in t.equipment
        ? (t.equipment as TransactionApiEquipment).name ?? t.equipment_name ?? "Unknown"
        : t.equipment_name ?? "Unknown"
    ),
    quantity: asInt(t.quantity),
    borrow_date: String(t.borrowDate ?? t.borrow_date ?? ""),
    expected_return_date: String(t.expectedReturnDate ?? t.expected_return_date ?? null),
    return_date: (t.returnDate ?? t.return_date ?? null) as string | null,
    condition_on_return: (t.conditionOnReturn ?? t.condition_on_return ?? null) as string | null,
    penalty_amount: asInt(t.penaltyAmount ?? t.penalty_amount ?? 0),
    overdue_charge: asInt(t.overdueCharge ?? t.overdue_charge ?? 0),
    damage_charge: asInt(t.damageCharge ?? t.damage_charge ?? 0),
    is_late: Boolean(t.isLate ?? t.is_late ?? false),
  })) as Transaction[];
};

export const getReports = async () => {
  const payload = await apiRequest<ReportsApiPayload>("/api/reports");

  return {
    total_equipment: asInt(payload?.equipment?.total),
    total_units: asInt(payload?.equipment?.totalQuantity),
    available_units: asInt(payload?.equipment?.availableQuantity),
    borrowed_units: asInt(payload?.borrowing?.totalBorrowed),
    pending_requests: asInt(payload?.requests?.pending),
    active_transactions: asInt(payload?.borrowing?.totalBorrowed),
    total_penalty_amount: asInt(payload?.borrowing?.totalPenaltyAmount ?? 0),
    total_overdue_charges: asInt(payload?.borrowing?.totalOverdueCharges ?? 0),
    total_damage_charges: asInt(payload?.borrowing?.totalDamageCharges ?? 0),
    total_late_returns: asInt(payload?.borrowing?.totalLateReturns ?? 0),
  } as Reports;
};

export const isLoggedIn = () =>
  typeof window !== "undefined" && localStorage.getItem(AUTH_FLAG_KEY) === "1";
