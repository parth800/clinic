'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import {
    TrendingUp,
    Users,
    Calendar,
    DollarSign,
    FileText,
    Activity
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Stats {
    totalPatients: number;
    newPatientsThisMonth: number;
    totalAppointments: number;
    appointmentsThisMonth: number;
    totalRevenue: number;
    revenueThisMonth: number;
    totalPrescriptions: number;
    prescriptionsThisMonth: number;
}

export default function AnalyticsPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<Stats>({
        totalPatients: 0,
        newPatientsThisMonth: 0,
        totalAppointments: 0,
        appointmentsThisMonth: 0,
        totalRevenue: 0,
        revenueThisMonth: 0,
        totalPrescriptions: 0,
        prescriptionsThisMonth: 0,
    });

    const [revenueByMonth, setRevenueByMonth] = useState<{ month: string; amount: number }[]>([]);
    const [appointmentsByStatus, setAppointmentsByStatus] = useState<{ status: string; count: number }[]>([]);

    useEffect(() => {
        async function fetchAnalytics() {
            try {
                if (!user?.id) return;

                const { data: userData } = await supabase
                    .from('users')
                    .select('clinic_id')
                    .eq('id', user.id)
                    .single<{ clinic_id: string }>();

                if (!userData) return;

                const now = new Date();
                const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

                // Fetch patients
                const { data: patients } = await supabase
                    .from('patients')
                    .select('created_at')
                    .eq('clinic_id', userData.clinic_id)
                    .is('deleted_at', null)
                    .returns<{ created_at: string }[]>();

                const totalPatients = patients?.length || 0;
                const newPatientsThisMonth = patients?.filter(
                    p => new Date(p.created_at) >= new Date(firstDayOfMonth)
                ).length || 0;

                // Fetch appointments
                const { data: allAppointments } = await supabase
                    .from('appointments')
                    .select('created_at, status')
                    .eq('clinic_id', userData.clinic_id)
                    .is('deleted_at', null)
                    .returns<{ created_at: string; status: string }[]>();

                const totalAppointments = allAppointments?.length || 0;
                const appointmentsThisMonth = allAppointments?.filter(
                    a => new Date(a.created_at) >= new Date(firstDayOfMonth)
                ).length || 0;

                // Count by status
                const statusCounts = allAppointments?.reduce((acc, apt) => {
                    acc[apt.status] = (acc[apt.status] || 0) + 1;
                    return acc;
                }, {} as Record<string, number>) || {};

                setAppointmentsByStatus(
                    Object.entries(statusCounts).map(([status, count]) => ({ status, count }))
                );

                // Fetch invoices
                const { data: invoices } = await supabase
                    .from('invoices')
                    .select('total_amount, created_at')
                    .eq('clinic_id', userData.clinic_id)
                    .is('deleted_at', null)
                    .returns<{ total_amount: number; created_at: string }[]>();

                const totalRevenue = invoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;
                const revenueThisMonth = invoices
                    ?.filter(inv => new Date(inv.created_at) >= new Date(firstDayOfMonth))
                    .reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;

                // Revenue by month (last 6 months)
                const monthlyRevenue: Record<string, number> = {};
                for (let i = 5; i >= 0; i--) {
                    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
                    const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                    monthlyRevenue[monthKey] = 0;
                }

                invoices?.forEach(inv => {
                    const invDate = new Date(inv.created_at);
                    const monthKey = invDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                    if (monthlyRevenue.hasOwnProperty(monthKey)) {
                        monthlyRevenue[monthKey] += inv.total_amount || 0;
                    }
                });

                setRevenueByMonth(
                    Object.entries(monthlyRevenue).map(([month, amount]) => ({ month, amount }))
                );

                // Fetch prescriptions
                const { data: prescriptions } = await supabase
                    .from('prescriptions')
                    .select('created_at')
                    .eq('clinic_id', userData.clinic_id)
                    .is('deleted_at', null)
                    .returns<{ created_at: string }[]>();

                const totalPrescriptions = prescriptions?.length || 0;
                const prescriptionsThisMonth = prescriptions?.filter(
                    p => new Date(p.created_at) >= new Date(firstDayOfMonth)
                ).length || 0;

                setStats({
                    totalPatients,
                    newPatientsThisMonth,
                    totalAppointments,
                    appointmentsThisMonth,
                    totalRevenue,
                    revenueThisMonth,
                    totalPrescriptions,
                    prescriptionsThisMonth,
                });
            } catch (error: any) {
                console.error('Error fetching analytics:', error);
                console.error('Error message:', error?.message);
                console.error('Error details:', JSON.stringify(error, null, 2));
            } finally {
                setLoading(false);
            }
        }

        if (user) {
            fetchAnalytics();
        }
    }, [user]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading analytics...</p>
                </div>
            </div>
        );
    }

    const maxRevenue = Math.max(...revenueByMonth.map(r => r.amount), 1);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
                <p className="mt-1 text-sm text-gray-600">
                    Track your clinic's performance and insights
                </p>
            </div>

            {/* Key Metrics */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg bg-white p-6 shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Patients</p>
                            <p className="mt-2 text-3xl font-bold text-gray-900">{stats.totalPatients}</p>
                            <p className="mt-1 text-sm text-green-600">
                                +{stats.newPatientsThisMonth} this month
                            </p>
                        </div>
                        <div className="rounded-full bg-blue-100 p-3">
                            <Users className="h-6 w-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="rounded-lg bg-white p-6 shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Appointments</p>
                            <p className="mt-2 text-3xl font-bold text-gray-900">{stats.totalAppointments}</p>
                            <p className="mt-1 text-sm text-green-600">
                                +{stats.appointmentsThisMonth} this month
                            </p>
                        </div>
                        <div className="rounded-full bg-purple-100 p-3">
                            <Calendar className="h-6 w-6 text-purple-600" />
                        </div>
                    </div>
                </div>

                <div className="rounded-lg bg-white p-6 shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                            <p className="mt-2 text-3xl font-bold text-gray-900">
                                {formatCurrency(stats.totalRevenue)}
                            </p>
                            <p className="mt-1 text-sm text-green-600">
                                +{formatCurrency(stats.revenueThisMonth)} this month
                            </p>
                        </div>
                        <div className="rounded-full bg-green-100 p-3">
                            <DollarSign className="h-6 w-6 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="rounded-lg bg-white p-6 shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Prescriptions</p>
                            <p className="mt-2 text-3xl font-bold text-gray-900">{stats.totalPrescriptions}</p>
                            <p className="mt-1 text-sm text-green-600">
                                +{stats.prescriptionsThisMonth} this month
                            </p>
                        </div>
                        <div className="rounded-full bg-orange-100 p-3">
                            <FileText className="h-6 w-6 text-orange-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Revenue Chart */}
                <div className="rounded-lg bg-white p-6 shadow">
                    <div className="mb-6 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900">Revenue Trend</h2>
                        <TrendingUp className="h-5 w-5 text-green-600" />
                    </div>

                    <div className="space-y-4">
                        {revenueByMonth.map((item, index) => (
                            <div key={index}>
                                <div className="mb-2 flex items-center justify-between text-sm">
                                    <span className="font-medium text-gray-700">{item.month}</span>
                                    <span className="font-semibold text-gray-900">
                                        {formatCurrency(item.amount)}
                                    </span>
                                </div>
                                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                                    <div
                                        className="h-full rounded-full bg-green-600 transition-all"
                                        style={{ width: `${(item.amount / maxRevenue) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Appointments by Status */}
                <div className="rounded-lg bg-white p-6 shadow">
                    <div className="mb-6 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900">Appointments by Status</h2>
                        <Activity className="h-5 w-5 text-blue-600" />
                    </div>

                    <div className="space-y-4">
                        {appointmentsByStatus.length === 0 ? (
                            <p className="text-center text-gray-500 py-8">No appointment data yet</p>
                        ) : (
                            appointmentsByStatus.map((item, index) => {
                                const total = appointmentsByStatus.reduce((sum, s) => sum + s.count, 0);
                                const percentage = ((item.count / total) * 100).toFixed(1);

                                const colors: Record<string, string> = {
                                    scheduled: 'bg-blue-600',
                                    confirmed: 'bg-green-600',
                                    checked_in: 'bg-purple-600',
                                    in_progress: 'bg-yellow-600',
                                    completed: 'bg-green-600',
                                    cancelled: 'bg-red-600',
                                    no_show: 'bg-gray-600',
                                };

                                return (
                                    <div key={index}>
                                        <div className="mb-2 flex items-center justify-between text-sm">
                                            <span className="font-medium capitalize text-gray-700">
                                                {item.status.replace('_', ' ')}
                                            </span>
                                            <span className="font-semibold text-gray-900">
                                                {item.count} ({percentage}%)
                                            </span>
                                        </div>
                                        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                                            <div
                                                className={`h-full rounded-full transition-all ${colors[item.status] || 'bg-gray-600'}`}
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Insights */}
            <div className="rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 p-6 shadow text-white">
                <h2 className="mb-4 text-lg font-semibold">Quick Insights</h2>
                <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                        <p className="text-sm opacity-90">Average Revenue per Patient</p>
                        <p className="mt-1 text-2xl font-bold">
                            {formatCurrency(stats.totalPatients > 0 ? stats.totalRevenue / stats.totalPatients : 0)}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm opacity-90">Appointments per Patient</p>
                        <p className="mt-1 text-2xl font-bold">
                            {stats.totalPatients > 0 ? (stats.totalAppointments / stats.totalPatients).toFixed(1) : '0'}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm opacity-90">Prescriptions per Appointment</p>
                        <p className="mt-1 text-2xl font-bold">
                            {stats.totalAppointments > 0 ? (stats.totalPrescriptions / stats.totalAppointments).toFixed(1) : '0'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
