'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Users, Calendar, FileText, TrendingUp } from 'lucide-react';
import DoctorView from '@/components/dashboard/DoctorView';
import ReceptionistView from '@/components/dashboard/ReceptionistView';

interface Stats {
    todayAppointments: number;
    totalPatients: number;
    todayRevenue: number;
    completedToday: number;
}

export default function DashboardPage() {
    const { user } = useAuth();
    const [userRole, setUserRole] = useState<string | null>(null);
    const [stats, setStats] = useState<Stats>({
        todayAppointments: 0,
        totalPatients: 0,
        todayRevenue: 0,
        completedToday: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                if (!user?.id) return;

                // Get user's role and clinic_id
                const { data: userData } = await supabase
                    .from('users')
                    .select('clinic_id, role')
                    .eq('id', user.id)
                    .single<{ clinic_id: string; role: string }>();

                if (!userData) return;

                setUserRole(userData.role);

                const today = new Date().toISOString().split('T')[0];

                // Fetch today's appointments
                const { count: appointmentsCount } = await supabase
                    .from('appointments')
                    .select('*', { count: 'exact', head: true })
                    .eq('clinic_id', userData.clinic_id)
                    .eq('appointment_date', today);

                // Fetch completed appointments today
                const { count: completedCount } = await supabase
                    .from('appointments')
                    .select('*', { count: 'exact', head: true })
                    .eq('clinic_id', userData.clinic_id)
                    .eq('appointment_date', today)
                    .eq('status', 'completed');

                // Fetch total patients
                const { count: patientsCount } = await supabase
                    .from('patients')
                    .select('*', { count: 'exact', head: true })
                    .eq('clinic_id', userData.clinic_id)
                    .is('deleted_at', null);

                // Fetch today's revenue
                const { data: todayInvoices } = await supabase
                    .from('invoices')
                    .select('paid_amount')
                    .eq('clinic_id', userData.clinic_id)
                    .eq('invoice_date', today)
                    .neq('payment_status', 'cancelled')
                    .returns<{ paid_amount: number }[]>();

                const todayRevenue = todayInvoices?.reduce((sum, invoice) => sum + (invoice.paid_amount || 0), 0) || 0;

                setStats({
                    todayAppointments: appointmentsCount || 0,
                    totalPatients: patientsCount || 0,
                    todayRevenue,
                    completedToday: completedCount || 0,
                });
            } catch (error) {
                console.error('Error fetching stats:', error);
            } finally {
                setLoading(false);
            }
        }

        if (user) {
            fetchData();
        }
    }, [user]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    // Render role-specific views
    if (userRole === 'doctor') {
        return <DoctorView />;
    }

    if (userRole === 'receptionist') {
        return <ReceptionistView />;
    }

    // Default admin view
    const statCards = [
        {
            name: "Today's Appointments",
            value: stats.todayAppointments,
            icon: Calendar,
            color: 'bg-blue-500',
        },
        {
            name: 'Total Patients',
            value: stats.totalPatients,
            icon: Users,
            color: 'bg-green-500',
        },
        {
            name: 'Completed Today',
            value: stats.completedToday,
            icon: FileText,
            color: 'bg-purple-500',
        },
        {
            name: "Today's Revenue",
            value: `₹${stats.todayRevenue}`,
            icon: TrendingUp,
            color: 'bg-orange-500',
        },
    ];

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="mt-1 text-sm text-gray-600">
                    Welcome back! Here's what's happening today.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                {statCards.map((stat) => (
                    <div
                        key={stat.name}
                        className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                                <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
                            </div>
                            <div className={`${stat.color} p-3 rounded-lg`}>
                                <stat.icon className="h-6 w-6 text-white" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <a href="/dashboard/appointments/new" className="flex items-center gap-3 rounded-lg border-2 border-dashed border-gray-300 p-4 text-left hover:border-blue-500 hover:bg-blue-50 transition-colors">
                        <Calendar className="h-8 w-8 text-blue-600" />
                        <div>
                            <p className="font-medium text-gray-900">New Appointment</p>
                            <p className="text-sm text-gray-500">Book a patient</p>
                        </div>
                    </a>

                    <a href="/dashboard/patients/new" className="flex items-center gap-3 rounded-lg border-2 border-dashed border-gray-300 p-4 text-left hover:border-green-500 hover:bg-green-50 transition-colors">
                        <Users className="h-8 w-8 text-green-600" />
                        <div>
                            <p className="font-medium text-gray-900">Add Patient</p>
                            <p className="text-sm text-gray-500">Register new patient</p>
                        </div>
                    </a>

                    <a href="/dashboard/prescriptions/new" className="flex items-center gap-3 rounded-lg border-2 border-dashed border-gray-300 p-4 text-left hover:border-purple-500 hover:bg-purple-50 transition-colors">
                        <FileText className="h-8 w-8 text-purple-600" />
                        <div>
                            <p className="font-medium text-gray-900">New Prescription</p>
                            <p className="text-sm text-gray-500">Create prescription</p>
                        </div>
                    </a>

                    <a href="/dashboard/analytics" className="flex items-center gap-3 rounded-lg border-2 border-dashed border-gray-300 p-4 text-left hover:border-orange-500 hover:bg-orange-50 transition-colors">
                        <TrendingUp className="h-8 w-8 text-orange-600" />
                        <div>
                            <p className="font-medium text-gray-900">View Reports</p>
                            <p className="text-sm text-gray-500">Analytics & insights</p>
                        </div>
                    </a>
                </div>
            </div>

            {/* Today's Appointments Preview */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Today's Appointments</h2>
                    <a href="/dashboard/appointments" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                        View all →
                    </a>
                </div>

                {stats.todayAppointments === 0 ? (
                    <div className="text-center py-12">
                        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No appointments scheduled for today</p>
                        <a href="/dashboard/appointments/new" className="mt-4 inline-block text-sm font-medium text-blue-600 hover:text-blue-500">
                            Book an appointment
                        </a>
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <p className="text-gray-500">
                            You have {stats.todayAppointments} appointment{stats.todayAppointments !== 1 ? 's' : ''} today
                        </p>
                        <a href="/dashboard/appointments" className="mt-4 inline-block text-sm font-medium text-blue-600 hover:text-blue-500">
                            View appointments →
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}
