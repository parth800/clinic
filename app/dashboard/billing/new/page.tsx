'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Patient } from '@/types';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, X } from 'lucide-react';
import Link from 'next/link';
import { getTodayDate } from '@/lib/utils';

interface LineItem {
    description: string;
    quantity: number;
    rate: number;
    amount: number;
}

export default function NewInvoicePage() {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [lineItems, setLineItems] = useState<LineItem[]>([
        { description: '', quantity: 1, rate: 0, amount: 0 },
    ]);

    const [formData, setFormData] = useState({
        invoice_date: getTodayDate(),
        payment_method: 'cash',
        payment_status: 'pending',
        paid_amount: 0,
        discount: 0,
        notes: '',
    });

    useEffect(() => {
        async function fetchPatients() {
            try {
                if (!user?.id) return;

                const { data: userData } = await supabase
                    .from('users')
                    .select('clinic_id')
                    .eq('id', user.id)
                    .single<{ clinic_id: string }>();

                if (!userData) return;

                const { data, error } = await supabase
                    .from('patients')
                    .select('*')
                    .eq('clinic_id', userData.clinic_id)
                    .is('deleted_at', null)
                    .order('full_name');

                if (error) throw error;
                setPatients(data || []);
            } catch (error) {
                console.error('Error fetching patients:', error);
            }
        }

        if (user) {
            fetchPatients();
        }
    }, [user]);

    const addLineItem = () => {
        setLineItems([...lineItems, { description: '', quantity: 1, rate: 0, amount: 0 }]);
    };

    const removeLineItem = (index: number) => {
        if (lineItems.length > 1) {
            setLineItems(lineItems.filter((_, i) => i !== index));
        }
    };

    const updateLineItem = (index: number, field: keyof LineItem, value: string | number) => {
        const updated = [...lineItems];
        updated[index] = { ...updated[index], [field]: value };

        // Calculate amount
        if (field === 'quantity' || field === 'rate') {
            updated[index].amount = updated[index].quantity * updated[index].rate;
        }

        setLineItems(updated);
    };

    const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
    const discountAmount = (subtotal * formData.discount) / 100;
    const totalAmount = subtotal - discountAmount;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedPatient) {
            toast.error('Please select a patient');
            return;
        }

        if (lineItems.every(item => !item.description)) {
            toast.error('Please add at least one line item');
            return;
        }

        setLoading(true);

        try {
            if (!user?.id) {
                toast.error('User not authenticated');
                return;
            }

            const { data: userData } = await supabase
                .from('users')
                .select('clinic_id')
                .eq('id', user.id)
                .single<{ clinic_id: string }>();

            if (!userData) {
                toast.error('User not found');
                return;
            }

            // Generate invoice number
            const invoiceNumber = `INV-${Date.now()}`;

            const invoiceData = {
                clinic_id: userData.clinic_id,
                patient_id: selectedPatient.id,
                invoice_number: invoiceNumber,
                invoice_date: formData.invoice_date,

                items: lineItems.filter(item => item.description.trim() !== ''),

                subtotal,
                discount: formData.discount,
                tax: 0, // Required by schema
                total_amount: totalAmount,

                payment_method: formData.payment_method,
                payment_status: formData.payment_status,
                paid_amount: formData.payment_status === 'paid' ? totalAmount : formData.paid_amount,
                payment_date: formData.payment_status !== 'pending' ? new Date().toISOString() : null,

                notes: formData.notes || null,
                created_by: user?.id,
            };

            const { error } = await supabase
                .from('invoices')
                .insert(invoiceData as any);

            if (error) throw error;

            toast.success('Invoice created successfully!');
            router.push('/dashboard/billing');
        } catch (error: any) {
            console.error('Error creating invoice:', error);
            toast.error(error.message || 'Failed to create invoice');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="mb-8">
                <Link
                    href="/dashboard/billing"
                    className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Billing
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">New Invoice</h1>
                <p className="mt-1 text-sm text-gray-600">
                    Create a new invoice for a patient
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Patient Selection */}
                <div className="rounded-lg bg-white p-6 shadow">
                    <h2 className="mb-4 text-lg font-semibold text-gray-900">Select Patient</h2>

                    {!selectedPatient ? (
                        <div className="max-h-96 overflow-y-auto space-y-2">
                            {patients.length === 0 ? (
                                <p className="text-center text-gray-500 py-8">No patients available</p>
                            ) : (
                                patients.map((patient) => (
                                    <button
                                        key={patient.id}
                                        type="button"
                                        onClick={() => setSelectedPatient(patient)}
                                        className="w-full flex items-center gap-4 rounded-lg border border-gray-200 p-4 text-left hover:border-blue-500 hover:bg-blue-50 transition-colors"
                                    >
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-semibold">
                                            {patient.full_name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900">{patient.full_name}</p>
                                            <p className="text-sm text-gray-500">
                                                {patient.phone} • {patient.patient_number}
                                            </p>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center justify-between rounded-lg border-2 border-blue-500 bg-blue-50 p-4">
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white font-semibold">
                                    {selectedPatient.full_name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">{selectedPatient.full_name}</p>
                                    <p className="text-sm text-gray-600">
                                        {selectedPatient.phone} • {selectedPatient.patient_number}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedPatient(null)}
                                className="text-sm text-blue-600 hover:text-blue-700"
                            >
                                Change Patient
                            </button>
                        </div>
                    )}
                </div>

                {selectedPatient && (
                    <>
                        {/* Invoice Details */}
                        <div className="rounded-lg bg-white p-6 shadow">
                            <h2 className="mb-4 text-lg font-semibold text-gray-900">Invoice Details</h2>
                            <div className="grid gap-6 sm:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Invoice Date *</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.invoice_date}
                                        onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                                    <select
                                        value={formData.payment_method}
                                        onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    >
                                        <option value="cash">Cash</option>
                                        <option value="card">Card</option>
                                        <option value="upi">UPI</option>
                                        <option value="bank_transfer">Bank Transfer</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Line Items */}
                        <div className="rounded-lg bg-white p-6 shadow">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-gray-900">Items</h2>
                                <button
                                    type="button"
                                    onClick={addLineItem}
                                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-500"
                                >
                                    <Plus className="h-4 w-4" />
                                    Add Item
                                </button>
                            </div>

                            <div className="space-y-4">
                                {lineItems.map((item, index) => (
                                    <div key={index} className="rounded-lg border border-gray-200 p-4">
                                        <div className="mb-3 flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-700">Item {index + 1}</span>
                                            {lineItems.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeLineItem(index)}
                                                    className="text-red-600 hover:text-red-700"
                                                >
                                                    <X className="h-5 w-5" />
                                                </button>
                                            )}
                                        </div>

                                        <div className="grid gap-4 sm:grid-cols-4">
                                            <div className="sm:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700">Description</label>
                                                <input
                                                    type="text"
                                                    value={item.description}
                                                    onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                                                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                    placeholder="Consultation, Medicine, etc."
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Quantity</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={item.quantity}
                                                    onChange={(e) => updateLineItem(index, 'quantity', parseInt(e.target.value) || 1)}
                                                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Rate (₹)</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={item.rate}
                                                    onChange={(e) => updateLineItem(index, 'rate', parseFloat(e.target.value) || 0)}
                                                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-3 text-right">
                                            <span className="text-sm font-medium text-gray-700">
                                                Amount: ₹{item.amount.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Totals */}
                            <div className="mt-6 border-t pt-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Subtotal:</span>
                                        <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                                    </div>

                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600">Discount (%):</span>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={formData.discount}
                                            onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                                            className="w-24 rounded-md border border-gray-300 px-3 py-1 text-right focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        />
                                    </div>

                                    {formData.discount > 0 && (
                                        <div className="flex justify-between text-sm text-green-600">
                                            <span>Discount Amount:</span>
                                            <span>-₹{discountAmount.toFixed(2)}</span>
                                        </div>
                                    )}

                                    <div className="flex justify-between border-t pt-2 text-lg font-bold">
                                        <span>Total:</span>
                                        <span className="text-blue-600">₹{totalAmount.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Payment */}
                        <div className="rounded-lg bg-white p-6 shadow">
                            <h2 className="mb-4 text-lg font-semibold text-gray-900">Payment</h2>
                            <div className="grid gap-6 sm:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Payment Status</label>
                                    <select
                                        value={formData.payment_status}
                                        onChange={(e) => setFormData({ ...formData, payment_status: e.target.value })}
                                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="partial">Partial</option>
                                        <option value="paid">Paid</option>
                                    </select>
                                </div>

                                {formData.payment_status === 'partial' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Paid Amount (₹)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max={totalAmount}
                                            step="0.01"
                                            value={formData.paid_amount}
                                            onChange={(e) => setFormData({ ...formData, paid_amount: parseFloat(e.target.value) || 0 })}
                                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        />
                                    </div>
                                )}

                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                                    <textarea
                                        rows={3}
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="Additional notes..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Form Actions */}
                        <div className="flex items-center justify-end gap-4">
                            <Link
                                href="/dashboard/billing"
                                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={loading}
                                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Creating...' : 'Create Invoice'}
                            </button>
                        </div>
                    </>
                )}
            </form>
        </div>
    );
}
