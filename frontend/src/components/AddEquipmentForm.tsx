'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Notification from './Notification';
import { createEquipment } from '@/lib/api';
import { assertSupabaseEnv, supabase } from '@/lib/supabase';

interface AddEquipmentFormData {
  equipment_code: string;
  equipment_name: string;
  category: string;
  total_quantity: string;
  condition_status: string;
  remarks: string;
  image?: File;
}

interface FormErrors {
  [key: string]: string;
}

export default function AddEquipmentForm() {
  const router = useRouter();
  const [formData, setFormData] = useState<AddEquipmentFormData>({
    equipment_code: '',
    equipment_name: '',
    category: '',
    total_quantity: '',
    condition_status: 'Good',
    remarks: '',
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const normalizeCategory = (value: string): 'balls' | 'rackets' | 'protective' | 'fitness' | 'other' => {
    const v = value.trim().toLowerCase();
    if (v.includes('ball')) return 'balls';
    if (v.includes('racket')) return 'rackets';
    if (v.includes('protect')) return 'protective';
    if (v.includes('fit')) return 'fitness';
    return 'other';
  };

  const normalizeCondition = (value: string): 'new' | 'good' | 'fair' | 'poor' => {
    const v = value.trim().toLowerCase();
    if (v === 'good') return 'good';
    if (v.includes('slight')) return 'fair';
    if (v.includes('repair')) return 'poor';
    return 'good';
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.equipment_code.trim()) {
      newErrors.equipment_code = 'Equipment code is required';
    }
    if (!formData.equipment_name.trim()) {
      newErrors.equipment_name = 'Equipment name is required';
    }
    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }

    const qty = parseInt(formData.total_quantity, 10);
    if (!formData.total_quantity || isNaN(qty) || qty < 0) {
      newErrors.total_quantity = 'Enter a valid quantity';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setNotification({
          type: 'error',
          message: 'Please select a valid image file',
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setNotification({
          type: 'error',
          message: 'Image size must be less than 5MB',
        });
        return;
      }

      setFormData((prev) => ({ ...prev, image: file }));

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      setNotification({
        type: 'error',
        message: 'Please fix the errors above',
      });
      return;
    }

    setLoading(true);

    try {
      const qty = parseInt(formData.total_quantity, 10);
      let imageUrl: string | undefined;
      let uploadNotice: string | null = null;

      if (formData.image) {
        assertSupabaseEnv();
        const cleanName = formData.image.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const filePath = `equipment-${Date.now()}-${cleanName}`;

        const { error: uploadError } = await supabase.storage
          .from('equipment-images')
          .upload(filePath, formData.image, { upsert: false });

        if (uploadError) {
          // Fallback to data URL when storage RLS blocks upload.
          imageUrl = imagePreview ?? undefined;
          uploadNotice =
            'Supabase storage upload was blocked by RLS policy. Image was saved locally in app database.';
        } else {
          const { data: publicData } = supabase.storage
            .from('equipment-images')
            .getPublicUrl(filePath);

          imageUrl = publicData.publicUrl;
        }
      }

      await createEquipment({
        name: `${formData.equipment_code} - ${formData.equipment_name}`,
        category: normalizeCategory(formData.category),
        quantity: qty,
        condition: normalizeCondition(formData.condition_status),
        status: 'available',
        image: imageUrl,
      });

      setShowSuccess(true);
      setNotification({
        type: 'success',
        message: uploadNotice || 'Equipment added successfully!',
      });

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/equipment');
      }, 2000);
    } catch (error) {
      setNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'An error occurred',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      equipment_code: '',
      equipment_name: '',
      category: '',
      total_quantity: '',
      condition_status: 'Good',
      remarks: '',
      image: undefined,
    });
    setImagePreview(null);
    setErrors({});
  };

  if (showSuccess) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-slate-800 rounded-xl border border-slate-700">
        <div className="text-center py-12">
          <div className="mb-4 text-5xl">✓</div>
          <h2 className="text-2xl font-bold text-emerald-400 mb-2">Success!</h2>
          <p className="text-slate-400 mb-6">
            Equipment "{formData.equipment_name}" has been added successfully.
          </p>
          <p className="text-xs text-slate-400">Redirecting to equipment list...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Add Equipment</h1>
        <p className="text-slate-400">Create a new equipment entry with all details and photo</p>
      </div>

      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      <form onSubmit={handleSubmit} encType="multipart/form-data" className="space-y-6">
        {/* Equipment Information */}
        <div className="p-6 bg-slate-800 rounded-xl border border-slate-700">
          <h2 className="text-lg font-semibold text-white mb-6 flex items-center">
            <span className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-3 text-sm">
              1
            </span>
            Equipment Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Equipment Code *
              </label>
              <input
                type="text"
                name="equipment_code"
                value={formData.equipment_code}
                onChange={handleInputChange}
                placeholder="e.g., EQ-001"
                className={`w-full px-4 py-2 bg-slate-700 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                  errors.equipment_code ? 'border-red-500' : 'border-slate-600'
                }`}
                required
              />
              {errors.equipment_code && (
                <p className="text-red-400 text-xs mt-1">{errors.equipment_code}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Equipment Name *
              </label>
              <input
                type="text"
                name="equipment_name"
                value={formData.equipment_name}
                onChange={handleInputChange}
                placeholder="e.g., Basketball"
                className={`w-full px-4 py-2 bg-slate-700 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                  errors.equipment_name ? 'border-red-500' : 'border-slate-600'
                }`}
                required
              />
              {errors.equipment_name && (
                <p className="text-red-400 text-xs mt-1">{errors.equipment_name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Category *
              </label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                placeholder="e.g., Ball Sports"
                className={`w-full px-4 py-2 bg-slate-700 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                  errors.category ? 'border-red-500' : 'border-slate-600'
                }`}
                required
              />
              {errors.category && (
                <p className="text-red-400 text-xs mt-1">{errors.category}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Total Quantity *
              </label>
              <input
                type="number"
                name="total_quantity"
                value={formData.total_quantity}
                onChange={handleInputChange}
                placeholder="0"
                min="0"
                className={`w-full px-4 py-2 bg-slate-700 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                  errors.total_quantity ? 'border-red-500' : 'border-slate-600'
                }`}
                required
              />
              {errors.total_quantity && (
                <p className="text-red-400 text-xs mt-1">{errors.total_quantity}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Condition Status
              </label>
              <select
                name="condition_status"
                value={formData.condition_status}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              >
                <option value="Good">🟢 Good</option>
                <option value="Slightly Damaged">🟡 Slightly Damaged</option>
                <option value="Needs Repair">🔴 Needs Repair</option>
              </select>
            </div>
          </div>

          <div className="mt-5">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Remarks
            </label>
            <textarea
              name="remarks"
              value={formData.remarks}
              onChange={handleInputChange}
              placeholder="Additional notes about the equipment..."
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
              rows={3}
            />
          </div>
        </div>

        {/* Equipment Image */}
        <div className="p-6 bg-slate-800 rounded-xl border border-slate-700">
          <h2 className="text-lg font-semibold text-white mb-6 flex items-center">
            <span className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center mr-3 text-sm">
              2
            </span>
            Equipment Photo
          </h2>

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Upload Equipment Image
            </label>
            <label className="flex items-center justify-center w-full px-6 py-8 border-2 border-dashed border-slate-600 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-slate-700/50 transition">
              <div className="text-center">
                <div className="text-3xl mb-2">📷</div>
                <p className="text-sm font-medium text-slate-300">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  PNG, JPG, WebP up to 5MB
                </p>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          </div>

          {imagePreview && (
            <div className="mt-4">
              <p className="text-sm font-medium text-slate-300 mb-3">Image Preview:</p>
              <div className="relative inline-block">
                <div className="w-full max-w-xs overflow-hidden rounded-lg border border-slate-600 bg-slate-900">
                  <img
                    src={imagePreview}
                    alt="Equipment preview"
                    className="w-full h-48 object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setImagePreview(null);
                    setFormData((prev) => ({ ...prev, image: undefined }));
                  }}
                  className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold transition"
                >
                  ×
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="px-6 py-2.5 border border-slate-600 text-slate-300 font-medium rounded-lg hover:bg-slate-700 transition"
          >
            Clear Form
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-medium rounded-lg transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="animate-spin">⚙️</span>
                Adding...
              </>
            ) : (
              <>✓ Add Equipment</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
