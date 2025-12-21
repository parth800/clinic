'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Invoice, Patient } from '@/types';
import { ArrowLeft, User, FileText, DollarSign, Calendar } from 'lucide-react';
import Link from 'next/link';
import { formatDate, formatCurrency } from '@/lib/utils';

interface InvoiceWithPatient extends Invoice {
    patient: Patient;
}

import { use } from 'react';

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { user } = useAuth();
    const [invoice, setInvoice] = useState<InvoiceWithPatient | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchInvoice() {
            try {
                const { data, error } = await supabase
                    .from('invoices')
                    .select(`
            *,
            patient:patients(*)
          `)
                    .eq('id', id)
                    .single();

                if (error) throw error;
                setInvoice(data as InvoiceWithPatient);
            } catch (error) {
                console.error('Error fetching invoice:', error);
            } finally {
                setLoading(false);
            }
        }

        if (user && id) {
            fetchInvoice();
        }
    }, [user, id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading invoice...</p>
                </div>
            </div>
        );
    }

    if (!invoice) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-gray-900">Invoice not found</h2>
                <Link href="/dashboard/billing" className="mt-4 inline-block text-blue-600 hover:text-blue-700">
                    ← Back to Billing
                </Link>
            </div>
        );
    }

    const items = invoice.items as any[] || [];
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'paid':
                return 'bg-green-100 text-green-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'partial':
                return 'bg-blue-100 text-blue-800';
            case 'cancelled':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
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
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Invoice Details</h1>
                        <p className="mt-1 text-sm text-gray-600">{invoice.invoice_number}</p>
                    </div>
                    <span
                        className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold capitalize ${getStatusColor(
                            invoice.payment_status
                        )}`}
                    >
                        {invoice.payment_status}
                    </span>
                </div>
            </div>

            <div className="space-y-6">
                {/* Patient & Invoice Info */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Patient Information */}
                    <div className="rounded-lg bg-white p-6 shadow">
                        <div className="mb-4 flex items-center gap-3">
                            <User className="h-6 w-6 text-blue-600" />
                            <h2 className="text-lg font-semibold text-gray-900">Patient Information</h2>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Name</p>
                                <p className="mt-1 text-base text-gray-900">{invoice.patient.full_name}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Phone</p>
                                <p className="mt-1 text-base text-gray-900">{invoice.patient.phone}</p>
                            </div>
                            {invoice.patient.email && (
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Email</p>
                                    <p className="mt-1 text-base text-gray-900">{invoice.patient.email}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Invoice Information */}
                    <div className="rounded-lg bg-white p-6 shadow">
                        <div className="mb-4 flex items-center gap-3">
                            <Calendar className="h-6 w-6 text-blue-600" />
                            <h2 className="text-lg font-semibold text-gray-900">Invoice Information</h2>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Invoice Number</p>
                                <p className="mt-1 text-base font-semibold text-gray-900">{invoice.invoice_number}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Invoice Date</p>
                                <p className="mt-1 text-base text-gray-900">{formatDate(invoice.invoice_date)}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Payment Method</p>
                                <p className="mt-1 text-base capitalize text-gray-900">{invoice.payment_method?.replace('_', ' ')}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Line Items */}
                <div className="rounded-lg bg-white p-6 shadow">
                    <div className="mb-4 flex items-center gap-3">
                        <FileText className="h-6 w-6 text-blue-600" />
                        <h2 className="text-lg font-semibold text-gray-900">Items</h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Description
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Quantity
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Rate
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Amount
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {items.map((item: any, index: number) => (
                                    <tr key={index}>
                                        <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-900">
                                            {item.description}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-4 text-right text-sm text-gray-900">
                                            {item.quantity}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-4 text-right text-sm text-gray-900">
                                            {formatCurrency(item.rate)}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-4 text-right text-sm font-medium text-gray-900">
                                            {formatCurrency(item.amount)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Payment Summary */}
                <div className="rounded-lg bg-white p-6 shadow">
                    <div className="mb-4 flex items-center gap-3">
                        <DollarSign className="h-6 w-6 text-blue-600" />
                        <h2 className="text-lg font-semibold text-gray-900">Payment Summary</h2>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Subtotal:</span>
                            <span className="font-medium text-gray-900">{formatCurrency(invoice.subtotal)}</span>
                        </div>

                        {invoice.discount > 0 && (
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Discount ({invoice.discount}%):</span>
                                <span className="font-medium text-green-600">
                                    -{formatCurrency(invoice.discount_amount || (invoice.subtotal * invoice.discount / 100))}
                                </span>
                            </div>
                        )}

                        <div className="flex justify-between border-t pt-3 text-lg font-bold">
                            <span className="text-gray-900">Total:</span>
                            <span className="text-blue-600">{formatCurrency(invoice.total_amount)}</span>
                        </div>

                        {invoice.payment_status === 'partial' && (
                            <>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Paid Amount:</span>
                                    <span className="font-medium text-green-600">
                                        {formatCurrency(invoice.paid_amount || 0)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Balance Due:</span>
                                    <span className="font-medium text-red-600">
                                        {formatCurrency(invoice.total_amount - (invoice.paid_amount || 0))}
                                    </span>
                                </div>
                            </>
                        )}

                        {invoice.payment_status === 'paid' && (
                            <div className="rounded-lg bg-green-50 p-3 text-center">
                                <p className="text-sm font-semibold text-green-800">✓ Fully Paid</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Notes */}
                {invoice.notes && (
                    <div className="rounded-lg bg-white p-6 shadow">
                        <h2 className="mb-3 text-lg font-semibold text-gray-900">Notes</h2>
                        <p className="text-sm text-gray-700">{invoice.notes}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
