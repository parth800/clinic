'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Invoice, Patient } from '@/types';
import { CreditCard, Plus, Calendar, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { formatDate, formatCurrency } from '@/lib/utils';

interface InvoiceWithPatient extends Invoice {
    patient: Patient;
}

export default function BillingPage() {
    const { user } = useAuth();
    const [invoices, setInvoices] = useState<InvoiceWithPatient[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        async function fetchInvoices() {
            try {
                const { data: userData } = await supabase
                    .from('users')
                    .select('clinic_id')
                    .eq('id', user?.id)
                    .single();

                if (!userData) return;

                let query = supabase
                    .from('invoices')
                    .select(`
            *,
            patient:patients(*)
          `)
                    .eq('clinic_id', userData.clinic_id)
                    .is('deleted_at', null)
                    .order('created_at', { ascending: false });

                if (filterStatus !== 'all') {
                    query = query.eq('payment_status', filterStatus);
                }

                const { data, error } = await query;

                if (error) throw error;
                setInvoices(data as InvoiceWithPatient[] || []);
            } catch (error) {
                console.error('Error fetching invoices:', error);
            } finally {
                setLoading(false);
            }
        }

        if (user) {
            fetchInvoices();
        }
    }, [user, filterStatus]);

    const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
    const paidAmount = invoices
        .filter(inv => inv.payment_status === 'paid')
        .reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
    const pendingAmount = invoices
        .filter(inv => inv.payment_status === 'pending' || inv.payment_status === 'partial')
        .reduce((sum, inv) => sum + (inv.total_amount || 0), 0);

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

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading invoices...</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Billing & Invoices</h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Manage invoices and track payments
                    </p>
                </div>
                <Link
                    href="/dashboard/billing/new"
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
                >
                    <Plus className="h-5 w-5" />
                    New Invoice
                </Link>
            </div>

            {/* Stats */}
            <div className="mb-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg bg-white p-4 shadow">
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
                </div>
                <div className="rounded-lg bg-white p-4 shadow">
                    <p className="text-sm font-medium text-gray-600">Paid</p>
                    <p className="mt-2 text-3xl font-bold text-green-600">{formatCurrency(paidAmount)}</p>
                </div>
                <div className="rounded-lg bg-white p-4 shadow">
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="mt-2 text-3xl font-bold text-yellow-600">{formatCurrency(pendingAmount)}</p>
                </div>
            </div>

            {/* Filter */}
            <div className="mb-6 flex items-center gap-4 rounded-lg bg-white p-4 shadow">
                <span className="text-sm font-medium text-gray-700">Filter:</span>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="rounded-md border border-gray-300 px-3 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="partial">Partial</option>
                    <option value="paid">Paid</option>
                    <option value="cancelled">Cancelled</option>
                </select>
            </div>

            {/* Invoices List */}
            {invoices.length === 0 ? (
                <div className="rounded-lg bg-white p-12 text-center shadow">
                    <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-4 text-lg font-medium text-gray-900">No invoices yet</h3>
                    <p className="mt-2 text-sm text-gray-500">
                        Get started by creating your first invoice
                    </p>
                    <Link
                        href="/dashboard/billing/new"
                        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
                    >
                        <Plus className="h-5 w-5" />
                        New Invoice
                    </Link>
                </div>
            ) : (
                <div className="overflow-hidden rounded-lg bg-white shadow">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Invoice
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Patient
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Amount
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {invoices.map((invoice) => (
                                <tr key={invoice.id} className="hover:bg-gray-50">
                                    <td className="whitespace-nowrap px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900">
                                            {invoice.invoice_number}
                                        </div>
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4">
                                        <div className="text-sm text-gray-900">{invoice.patient.full_name}</div>
                                        <div className="text-sm text-gray-500">{invoice.patient.phone}</div>
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4">
                                        <div className="flex items-center gap-2 text-sm text-gray-900">
                                            <Calendar className="h-4 w-4 text-gray-400" />
                                            {formatDate(invoice.invoice_date)}
                                        </div>
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4">
                                        <div className="text-sm font-semibold text-gray-900">
                                            {formatCurrency(invoice.total_amount)}
                                        </div>
                                        {invoice.payment_status === 'partial' && (
                                            <div className="text-xs text-gray-500">
                                                Paid: {formatCurrency(invoice.paid_amount || 0)}
                                            </div>
                                        )}
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4">
                                        <span
                                            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold capitalize ${getStatusColor(
                                                invoice.payment_status
                                            )}`}
                                        >
                                            {invoice.payment_status}
                                        </span>
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                        <Link
                                            href={`/dashboard/billing/${invoice.id}`}
                                            className="text-blue-600 hover:text-blue-900"
                                        >
                                            View Details
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
