import { z } from 'zod';

export const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(12, 'Password must be at least 12 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')
    .refine((value) => !/password/i.test(value), {
      message: 'Password cannot contain common weak phrases such as "password"',
    }),
  password_confirm: z.string().min(8),
  first_name: z.string().optional().nullable(),
  last_name: z.string().optional().nullable(),
}).refine((data) => data.password === data.password_confirm, {
  message: "Passwords don't match",
  path: ['password_confirm'],
});

export const loginSchema = z.object({
  identifier: z.string().min(1, 'Username or Email is required'),
  password: z.string().min(1, 'Password is required'),
});

export const equipmentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: z.enum(['balls', 'rackets', 'protective', 'fitness', 'other']),
  quantity: z.number().int().min(0, 'Quantity cannot be negative'),
  condition: z.enum(['new', 'good', 'fair', 'poor']),
  status: z.enum(['available', 'maintenance', 'retired']),
  image: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});

export const borrowItemSchema = z.object({
  equipment: z.number().int().positive(),
  quantity: z.number().int().positive('Quantity must be at least 1'),
});

export const borrowRequestSchema = z.object({
  borrowerName: z.string().min(1, 'Borrower name is required'),
  idNumber: z.string().min(1, 'ID number is required'),
  departmentCourse: z.string().min(1, 'Department/Course is required'),
  contactNumber: z.string().min(1, 'Contact number is required'),
  expectedReturnDate: z.string().optional(),
  purpose: z.string().optional(),
  items: z.array(borrowItemSchema).min(1, 'At least one item is required'),
});

export const returnEquipmentSchema = z.object({
  transaction_id: z.number().int().positive(),
  return_date: z.string().optional(),
  condition_on_return: z.enum(['new', 'good', 'fair', 'poor']),
});

export const approveBorrowSchema = z.object({
  notes: z.string().optional().nullable(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type EquipmentInput = z.infer<typeof equipmentSchema>;
export type BorrowRequestInput = z.infer<typeof borrowRequestSchema>;
export type ReturnEquipmentInput = z.infer<typeof returnEquipmentSchema>;
export type ApproveBorrowInput = z.infer<typeof approveBorrowSchema>;
