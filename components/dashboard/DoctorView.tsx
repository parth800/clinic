'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Calendar, FileText, Stethoscope, Clock } from 'lucide-react';
import Link from 'next/link';
import { formatTime } from '@/lib/utils';

interface Appointment {
    id: string;
    token_number: number;
    appointment_time: string;
    status: string;
    patient: {
        full_name: string;
        phone: string;
    };
}

export default function DoctorView() {
    const { user } = useAuth();
    const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
    const [stats, setStats] = useState({
        total: 0,
        inProgress: 0,
        completed: 0,
        pending: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                if (!user?.id) return;

                const { data: userData } = await supabase
                    .from('users')
                    .select('clinic_id')
                    .eq('id', user.id)
                    .single<{ clinic_id: string }>();

                if (!userData) return;

                const today = new Date().toISOString().split('T')[0];

                // Fetch today's appointments
                const { data: appointments } = await supabase
                    .from('appointments')
                    .select(`
                        id,
                        token_number,
                        appointment_time,
                        status,
                        patient:patients(full_name, phone)
                    `)
                    .eq('clinic_id', userData.clinic_id)
                    .eq('appointment_date', today)
                    .order('appointment_time', { ascending: true });

                const aptList = (appointments || []) as any[];
                setTodayAppointments(aptList);

                // Calculate stats
                setStats({
                    total: aptList.length,
                    inProgress: aptList.filter(a => a.status === 'in_progress').length,
                    completed: aptList.filter(a => a.status === 'completed').length,
                    pending: aptList.filter(a => a.status === 'checked_in' || a.status === 'scheduled').length,
                });
            } catch (error) {
                console.error('Error fetching data:', error);
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
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Doctor Dashboard</h1>
                <p className="mt-1 text-sm text-gray-600">
                    Today's appointments and quick actions
                </p>
            </div>

            {/* Quick Actions */}
            <div className="grid gap-4 sm:grid-cols-2">
                <Link
                    href="/dashboard/prescriptions/new"
                    className="flex items-center gap-3 rounded-lg bg-blue-600 p-4 text-white hover:bg-blue-700 transition-colors"
                >
                    <FileText className="h-6 w-6" />
                    <div>
                        <p className="font-semibold">New Prescription</p>
                        <p className="text-sm text-blue-100">Create prescription</p>
                    </div>
                </Link>
                <Link
                    href="/dashboard/patients"
                    className="flex items-center gap-3 rounded-lg bg-green-600 p-4 text-white hover:bg-green-700 transition-colors"
                >
                    <Stethoscope className="h-6 w-6" />
                    <div>
                        <p className="font-semibold">View Patients</p>
                        <p className="text-sm text-green-100">Patient records</p>
                    </div>
                </Link>
            </div>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-4">
                <div className="rounded-lg bg-white p-4 shadow">
                    <div className="flex items-center gap-3">
                        <Calendar className="h-8 w-8 text-blue-600" />
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Today</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                        </div>
                    </div>
                </div>
                <div className="rounded-lg bg-white p-4 shadow">
                    <div className="flex items-center gap-3">
                        <Clock className="h-8 w-8 text-yellow-600" />
                        <div>
                            <p className="text-sm font-medium text-gray-600">Pending</p>
                            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                        </div>
                    </div>
                </div>
                <div className="rounded-lg bg-white p-4 shadow">
                    <div className="flex items-center gap-3">
                        <Stethoscope className="h-8 w-8 text-purple-600" />
                        <div>
                            <p className="text-sm font-medium text-gray-600">In Progress</p>
                            <p className="text-2xl font-bold text-purple-600">{stats.inProgress}</p>
                        </div>
                    </div>
                </div>
                <div className="rounded-lg bg-white p-4 shadow">
                    <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-green-600" />
                        <div>
                            <p className="text-sm font-medium text-gray-600">Completed</p>
                            <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Today's Appointments */}
            <div className="rounded-lg bg-white p-6 shadow">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">Today's Appointments</h2>

                {todayAppointments.length === 0 ? (
                    <div className="text-center py-8">
                        <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-500">No appointments scheduled for today</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {todayAppointments.map((appointment) => (
                            <div
                                key={appointment.id}
                                className={`rounded-lg border p-4 transition-colors ${appointment.status === 'completed'
                                        ? 'border-green-200 bg-green-50'
                                        : appointment.status === 'in_progress'
                                            ? 'border-purple-200 bg-purple-50'
                                            : 'border-gray-200 bg-white hover:bg-gray-50'
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold">
                                            #{appointment.token_number}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900">
                                                {appointment.patient.full_name}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {formatTime(appointment.appointment_time)} • {appointment.patient.phone}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${appointment.status === 'completed'
                                                    ? 'bg-green-100 text-green-700'
                                                    : appointment.status === 'in_progress'
                                                        ? 'bg-purple-100 text-purple-700'
                                                        : 'bg-yellow-100 text-yellow-700'
                                                }`}
                                        >
                                            {appointment.status === 'completed'
                                                ? 'Completed'
                                                : appointment.status === 'in_progress'
                                                    ? 'In Progress'
                                                    : 'Pending'}
                                        </span>
                                        <Link
                                            href={`/dashboard/appointments/${appointment.id}`}
                                            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                                        >
                                            View Details
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
