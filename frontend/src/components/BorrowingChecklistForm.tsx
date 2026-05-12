'use client';

import { useEffect, useState } from 'react';
import Notification from '@/components/Notification';
import { createBorrow, getEquipment, type Equipment } from '@/lib/api';

interface BorrowFormData {
  borrowerName: string;
  idNumber: string;
  departmentCourse: string;
  contactNumber: string;
  items: { equipmentId: number | ''; quantity: string }[];
  expectedReturnDate: string;
  purpose: string;
  agreementAccepted: boolean;
  borrowStatus: string;
  conditionBeforeReturn: string;
  conditionAfterReturn: string;
  approvedBy: string;
  receivedBy: string;
  staff: string;
}

export function BorrowingChecklistForm() {
  const [formData, setFormData] = useState<BorrowFormData>({
    borrowerName: '',
    idNumber: '',
    departmentCourse: '',
    contactNumber: '',
    items: [{ equipmentId: '', quantity: '1' }],
    expectedReturnDate: '',
    purpose: '',
    agreementAccepted: false,
    borrowStatus: 'pending',
    conditionBeforeReturn: 'good',
    conditionAfterReturn: 'good',
    approvedBy: 'Admin John',
    receivedBy: 'Admin John',
    staff: 'Admin John',
  });
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingEquipment, setLoadingEquipment] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    const loadEquipment = async () => {
      setLoadingEquipment(true);
      try {
        const data = await getEquipment();
        setEquipment(data.filter((item) => item.status === 'available' && item.available_quantity > 0));
      } catch (error) {
        setNotification({ type: 'error', message: error instanceof Error ? error.message : 'Failed to load equipment' });
      } finally {
        setLoadingEquipment(false);
      }
    };

    loadEquipment();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleItemChange = (index: number, field: 'equipmentId' | 'quantity', value: string) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item, itemIndex) => {
        if (itemIndex !== index) return item;
        if (field === 'equipmentId') {
          return { ...item, equipmentId: value ? parseInt(value, 10) : '' };
        }
        return { ...item, quantity: value };
      }),
    }));
  };

  const addItemRow = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { equipmentId: '', quantity: '1' }],
    }));
  };

  const removeItemRow = (index: number) => {
    setFormData((prev) => {
      if (prev.items.length === 1) return prev;
      return {
        ...prev,
        items: prev.items.filter((_, itemIndex) => itemIndex !== index),
      };
    });
  };

  const clearForm = () => {
    setFormData({
      borrowerName: '',
      idNumber: '',
      departmentCourse: '',
      contactNumber: '',
      items: [{ equipmentId: '', quantity: '1' }],
      expectedReturnDate: '',
      purpose: '',
      agreementAccepted: false,
      borrowStatus: 'pending',
      conditionBeforeReturn: 'good',
      conditionAfterReturn: 'good',
      approvedBy: 'Admin John',
      receivedBy: 'Admin John',
      staff: 'Admin John',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.items.length === 0) {
      setNotification({ type: 'error', message: 'Please add at least one item' });
      return;
    }

    if (!formData.borrowerName.trim()) {
      setNotification({ type: 'error', message: 'Borrower name is required' });
      return;
    }

    if (!formData.idNumber.trim()) {
      setNotification({ type: 'error', message: 'ID number is required' });
      return;
    }

    if (!formData.departmentCourse.trim()) {
      setNotification({ type: 'error', message: 'Department/Course is required' });
      return;
    }

    if (!formData.contactNumber.trim()) {
      setNotification({ type: 'error', message: 'Contact number is required' });
      return;
    }

    const parsedItems: { equipment: number; quantity: number }[] = [];
    for (const item of formData.items) {
      if (!item.equipmentId) {
        setNotification({ type: 'error', message: 'Please select equipment for each item' });
        return;
      }

      const qty = parseInt(item.quantity, 10);
      if (Number.isNaN(qty) || qty <= 0) {
        setNotification({ type: 'error', message: 'Quantity must be greater than 0 for all items' });
        return;
      }

      parsedItems.push({ equipment: item.equipmentId as number, quantity: qty });
    }

    if (!formData.agreementAccepted) {
      setNotification({ type: 'error', message: 'Please accept the agreement' });
      return;
    }

    setLoading(true);
    try {
      await createBorrow(
        parsedItems,
        {
          borrowerName: formData.borrowerName.trim(),
          idNumber: formData.idNumber.trim(),
          departmentCourse: formData.departmentCourse.trim(),
          contactNumber: formData.contactNumber.trim(),
          expectedReturnDate: formData.expectedReturnDate || undefined,
          purpose: formData.purpose || undefined,
        }
      );
      setNotification({ type: 'success', message: 'Borrow checklist submitted successfully' });
      clearForm();
    } catch (error) {
      setNotification({ type: 'error', message: error instanceof Error ? error.message : 'Failed to submit borrow request' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-4xl rounded-lg border border-white/10 bg-white/6 p-5 shadow-sm md:p-6">
      <h1 className="mb-6 text-center text-3xl font-bold text-slate-800">Sports Equipment Borrowing Checklist</h1>

      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      <fieldset className="mb-5 rounded-md border border-white/10 p-3">
        <legend className="px-1 text-lg font-semibold text-slate-200">Borrower Information</legend>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <input name="borrowerName" value={formData.borrowerName} onChange={handleChange} placeholder="Borrower Name" className="w-full rounded-md border border-white/10 px-3 py-2" />
          <input name="idNumber" value={formData.idNumber} onChange={handleChange} placeholder="ID Number" className="w-full rounded-md border border-white/10 px-3 py-2" />
          <input name="departmentCourse" value={formData.departmentCourse} onChange={handleChange} placeholder="Department / Course" className="w-full rounded-md border border-white/10 px-3 py-2" />
          <input name="contactNumber" value={formData.contactNumber} onChange={handleChange} placeholder="Contact Number" className="w-full rounded-md border border-white/10 px-3 py-2" />
        </div>
      </fieldset>

      <fieldset className="mb-5 rounded-md border border-white/10 p-3">
        <legend className="px-1 text-lg font-semibold text-slate-200">Equipment Information</legend>
        <div className="space-y-3">
          {formData.items.map((item, index) => (
            <div key={index} className="grid grid-cols-1 gap-3 rounded-md border border-white/10 bg-white/8 p-3 md:grid-cols-[2fr_1fr_auto]">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-200">Equipment</label>
                <select
                  value={item.equipmentId}
                  onChange={(e) => handleItemChange(index, 'equipmentId', e.target.value)}
                  className="w-full rounded-md border border-white/10 px-3 py-2"
                  required
                  disabled={loadingEquipment}
                >
                  <option value="">{loadingEquipment ? 'Loading equipment...' : 'Select equipment'}</option>
                  {equipment.map((equipmentItem) => (
                    <option key={equipmentItem.id} value={equipmentItem.id}>
                      {equipmentItem.name} ({equipmentItem.available_quantity} available)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-200">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                  className="w-full rounded-md border border-white/10 px-3 py-2"
                  required
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => removeItemRow(index)}
                  disabled={formData.items.length === 1}
                  className="rounded-md bg-red-100 px-3 py-2 text-sm font-semibold text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}

          <div>
            <button
              type="button"
              onClick={addItemRow}
              className="rounded-md bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-200"
            >
              + Add Item
            </button>
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-slate-200">Expected Return Date</label>
            <input type="date" name="expectedReturnDate" value={formData.expectedReturnDate} onChange={handleChange} className="w-full rounded-md border border-white/10 px-3 py-2" />
          </div>
        </div>
      </fieldset>

      <fieldset className="mb-5 rounded-md border border-white/10 bg-amber-50/50 p-3">
        <legend className="px-1 text-lg font-semibold text-slate-200">Borrow Details</legend>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-200">Status</label>
            <input value="Pending" readOnly className="w-full rounded-md border border-white/10 bg-slate-100 px-3 py-2 text-slate-300" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-200">Return Date</label>
            <input type="date" value={formData.expectedReturnDate} readOnly className="w-full rounded-md border border-white/10 bg-slate-100 px-3 py-2 text-slate-300" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-200">Condition Before Return</label>
            <select name="conditionBeforeReturn" value={formData.conditionBeforeReturn} onChange={handleChange} className="w-full rounded-md border border-white/10 px-3 py-2">
              <option value="new">New</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-200">Remarks</label>
            <input name="purpose" value={formData.purpose} onChange={handleChange} placeholder="No damage" className="w-full rounded-md border border-white/10 px-3 py-2" />
          </div>
        </div>
      </fieldset>

      <fieldset className="mb-5 rounded-md border border-white/10 bg-indigo-50/40 p-3">
        <legend className="px-1 text-lg font-semibold text-slate-200">Approval Section</legend>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-200">Status</label>
            <input value="Pending" readOnly className="w-full rounded-md border border-white/10 bg-slate-100 px-3 py-2 text-slate-300" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-200">Return Date</label>
            <input type="date" value={formData.expectedReturnDate} readOnly className="w-full rounded-md border border-white/10 bg-slate-100 px-3 py-2 text-slate-300" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-200">Condition After Return</label>
            <select name="conditionAfterReturn" value={formData.conditionAfterReturn} onChange={handleChange} className="w-full rounded-md border border-white/10 px-3 py-2">
              <option value="new">New</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-200">Remarks</label>
            <input placeholder="No damage" className="w-full rounded-md border border-white/10 px-3 py-2" />
          </div>
        </div>
      </fieldset>

      <fieldset className="mb-6 rounded-md border border-white/10 p-3">
        <legend className="px-1 text-lg font-semibold text-slate-200">Approval Section</legend>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-200">Approved By</label>
            <input name="approvedBy" value={formData.approvedBy} onChange={handleChange} className="w-full rounded-md border border-white/10 px-3 py-2" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-200">Received By</label>
            <input name="receivedBy" value={formData.receivedBy} onChange={handleChange} className="w-full rounded-md border border-white/10 px-3 py-2" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-200">Staff</label>
            <input name="staff" value={formData.staff} onChange={handleChange} className="w-full rounded-md border border-white/10 px-3 py-2" />
          </div>
        </div>
      </fieldset>

      <fieldset className="mb-6 rounded-md border border-white/10 p-3">
        <legend className="px-1 text-lg font-semibold text-slate-200">Agreement</legend>
        <label className="flex items-start gap-3 text-slate-200">
          <input type="checkbox" name="agreementAccepted" checked={formData.agreementAccepted} onChange={handleChange} className="mt-1 h-5 w-5" />
          <span>I confirm the details are correct and I agree to return equipment responsibly.</span>
        </label>
      </fieldset>

      <div className="flex justify-end gap-3">
        <button type="button" onClick={clearForm} className="rounded-md bg-slate-200 px-5 py-2 font-semibold text-slate-200 hover:bg-slate-300">
          Clear
        </button>
        <button type="submit" disabled={loading} className="rounded-md bg-amber-500 px-5 py-2 font-semibold text-white hover:bg-amber-600 disabled:bg-slate-400">
          {loading ? 'Submitting...' : 'Submit Borrow Request'}
        </button>
      </div>
    </form>
  );
}
