'use client';

import { useEffect, useMemo, useState } from 'react';
import Notification from '@/components/Notification';
import { getTransactions, returnEquipment, type Transaction } from '@/lib/api';

interface ReturnFormData {
  transactionId: number | '';
  returnDate: string;
  returnedQuantity: number | '';
  conditionAfter: string;
  remarksAfter: string;
  checkedBy: string;
}

export function ReturnChecklistForm() {
  const [formData, setFormData] = useState<ReturnFormData>({
    transactionId: '',
    returnDate: new Date().toISOString().split('T')[0],
    returnedQuantity: '',
    conditionAfter: 'good',
    remarksAfter: '',
    checkedBy: '',
  });

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const activeTransactions = useMemo(
    () => transactions.filter((transaction) => !transaction.return_date),
    [transactions],
  );

  const fetchBorrowedItems = async () => {
    setLoadingTransactions(true);
    try {
      const data = await getTransactions();
      setTransactions(data);
    } catch (error) {
      setNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to fetch borrowed items',
      });
    } finally {
      setLoadingTransactions(false);
    }
  };

  useEffect(() => {
    fetchBorrowedItems();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    const parsedValue =
      name === 'transactionId' || name === 'returnedQuantity'
        ? value
          ? parseInt(value, 10)
          : ''
        : value;

    setFormData(prev => ({
      ...prev,
      [name]: parsedValue,
    }));

    if (name === 'transactionId') {
      if (!value) {
        setSelectedTransaction(null);
        return;
      }

      const transaction = activeTransactions.find(t => t.id === parseInt(value, 10));
      if (transaction) {
        setSelectedTransaction(transaction);
        setFormData(prev => ({
          ...prev,
          returnedQuantity: transaction.quantity,
        }));
      }
    }
  };

  const calculatePenalty = () => {
    const conditionPenaltyMap: Record<string, number> = {
      new: 0,
      good: 0,
      fair: 50,
      poor: 100,
    };

    const conditionPenalty = conditionPenaltyMap[formData.conditionAfter] ?? 0;
    let latePenalty = 0;

    if (selectedTransaction?.expected_return_date && formData.returnDate) {
      const expected = new Date(selectedTransaction.expected_return_date);
      const returned = new Date(formData.returnDate);
      const daysLate = Math.floor((returned.getTime() - expected.getTime()) / (1000 * 60 * 60 * 24));

      if (daysLate > 0) {
        if (daysLate === 1) latePenalty = 20;
        else if (daysLate <= 3) latePenalty = 50;
        else latePenalty = 100;
      }
    }

    return latePenalty + conditionPenalty;
  };

  const penaltyPreview = calculatePenalty();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.transactionId || !formData.returnDate || !formData.returnedQuantity || !formData.checkedBy) {
        setNotification({ type: 'error', message: 'Please fill in all required fields' });
        setLoading(false);
        return;
      }

      if (selectedTransaction && formData.returnedQuantity > selectedTransaction.quantity) {
        setNotification({
          type: 'error',
          message: `Returned quantity cannot exceed borrowed quantity (${selectedTransaction.quantity})`,
        });
        setLoading(false);
        return;
      }

      await returnEquipment({
        transaction_id: formData.transactionId,
        return_date: formData.returnDate,
        condition_on_return: formData.conditionAfter,
      });

      setNotification({ type: 'success', message: 'Equipment return processed successfully!' });
      setSubmitted(true);

      setFormData({
        transactionId: '',
        returnDate: new Date().toISOString().split('T')[0],
        returnedQuantity: '',
        conditionAfter: 'good',
        remarksAfter: '',
        checkedBy: '',
      });
      setSelectedTransaction(null);
      fetchBorrowedItems();
    } catch (error) {
      setNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'An error occurred',
      });
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setFormData({
      transactionId: '',
      returnDate: new Date().toISOString().split('T')[0],
      returnedQuantity: '',
      conditionAfter: 'good',
      remarksAfter: '',
      checkedBy: '',
    });
    setSelectedTransaction(null);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-5xl mx-auto p-8 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Equipment Return Checklist</h1>
        <p className="text-slate-400">Process item returns and update stock safely.</p>
      </div>

      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      {submitted && (
        <div className="mb-6 p-4 bg-emerald-900/40 border border-emerald-600 rounded-lg text-emerald-300">
          Return has been recorded. You can process another item below.
        </div>
      )}

      <fieldset className="mb-8 p-5 border border-slate-600 rounded-xl bg-slate-900/50">
        <legend className="text-lg font-semibold text-blue-300 px-2">Select Borrowed Item</legend>

        <div className="mb-4 flex items-center gap-3">
          <button
            type="button"
            onClick={fetchBorrowedItems}
            disabled={loadingTransactions}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-white/80 transition"
          >
            {loadingTransactions ? 'Refreshing...' : 'Refresh Borrowed Items'}
          </button>
          <span className="text-sm text-slate-400">{activeTransactions.length} active transaction(s)</span>
        </div>

        <div>
          <label className="block font-semibold text-slate-200 mb-2">Borrowed Item *</label>
          <select
            name="transactionId"
            value={formData.transactionId}
            onChange={handleInputChange}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="">-- Select active transaction --</option>
            {activeTransactions.map(transaction => (
              <option key={transaction.id} value={transaction.id}>
                {transaction.equipment_name} (Qty: {transaction.quantity})
              </option>
            ))}
          </select>
        </div>

        {selectedTransaction && (
          <div className="mt-4 p-4 bg-blue-900/30 border border-blue-700 rounded-lg text-blue-100">
            <p><strong>Equipment:</strong> {selectedTransaction.equipment_name}</p>
            <p><strong>Quantity Borrowed:</strong> {selectedTransaction.quantity}</p>
            <p><strong>Borrow Date:</strong> {new Date(selectedTransaction.borrow_date).toLocaleDateString()}</p>
            <p><strong>Status:</strong> Active</p>
            <p className="text-xs text-blue-300 mt-2">
              Note: this stack records return date at processing time.
            </p>
          </div>
        )}
      </fieldset>

      <fieldset className="mb-8 p-5 border border-slate-600 rounded-xl bg-slate-900/50">
        <legend className="text-lg font-semibold text-emerald-300 px-2">Return Information</legend>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-200 mb-2">Return Date *</label>
            <input
              type="date"
              name="returnDate"
              value={formData.returnDate}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-200 mb-2">Quantity Returned *</label>
            <input
              type="number"
              name="returnedQuantity"
              value={formData.returnedQuantity}
              onChange={handleInputChange}
              min="1"
              placeholder="0"
              className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block font-semibold text-slate-200 mb-2">Condition After Return</label>
            <div className="flex gap-4">
              {[
                { value: 'new', label: 'New' },
                { value: 'good', label: 'Good' },
                { value: 'fair', label: 'Fair' },
                { value: 'poor', label: 'Poor' },
              ].map((condition) => (
                <label key={condition.value} className="flex items-center gap-2 text-slate-200">
                  <input
                    type="radio"
                    name="conditionAfter"
                    value={condition.value}
                    checked={formData.conditionAfter === condition.value}
                    onChange={handleInputChange}
                    className="w-4 h-4"
                  />
                  <span>{condition.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-200 mb-2">Checked by (Staff Name) *</label>
            <input
              type="text"
              name="checkedBy"
              value={formData.checkedBy}
              onChange={handleInputChange}
              placeholder="Staff name"
              className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              required
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="mb-8 p-5 border border-slate-600 rounded-xl bg-slate-900/50">
        <legend className="text-lg font-semibold text-fuchsia-300 px-2">Remarks</legend>

        <div>
          <label className="block font-semibold text-slate-200 mb-2">Remarks After Return</label>
          <textarea
            name="remarksAfter"
            value={formData.remarksAfter}
            onChange={handleInputChange}
            placeholder="Any damage, missing parts, or special notes..."
            rows={3}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
          />
        </div>
      </fieldset>

      {selectedTransaction && (
        <fieldset className="mb-8 p-5 border border-amber-600 rounded-xl bg-amber-900/20">
          <legend className="text-lg font-semibold text-amber-200 px-2">Return Summary</legend>

          <div className="space-y-2 text-amber-100">
            <p>
              <strong>Selected Item:</strong> {selectedTransaction.equipment_name}
            </p>
            <p>
              <strong>Borrowed Quantity:</strong> {selectedTransaction.quantity}
            </p>
            <p>
              <strong>Return Quantity:</strong> {formData.returnedQuantity || 0}
            </p>
            <p>
              <strong>Condition:</strong> {formData.conditionAfter.toUpperCase()}
            </p>
            {formData.conditionAfter === 'poor' && (
              <p className="text-red-300 font-semibold">Item marked POOR - review for maintenance.</p>
            )}
            {formData.conditionAfter === 'fair' && (
              <p className="text-amber-300 font-semibold">Item marked FAIR - monitor wear and tear.</p>
            )}
            {selectedTransaction?.expected_return_date && (
              <p>
                <strong>Expected Return:</strong>{' '}
                {new Date(selectedTransaction.expected_return_date).toLocaleDateString()}
              </p>
            )}
            <p className="text-emerald-200 font-semibold">
              <strong>Penalty:</strong> ₱{penaltyPreview.toFixed(2)}
            </p>
          </div>
        </fieldset>
      )}

      <div className="flex justify-center gap-4">
        <button
          type="submit"
          disabled={loading}
          className="px-8 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 disabled:bg-white/80 transition"
        >
          {loading ? 'Processing...' : 'Process Return'}
        </button>
        <button
          type="button"
          onClick={clearForm}
          className="px-8 py-3 bg-slate-600 text-slate-100 font-semibold rounded-lg hover:bg-white/80 transition"
        >
          Clear Form
        </button>
      </div>
    </form>
  );
}
