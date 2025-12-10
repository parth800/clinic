'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Appointment, Patient } from '@/types';
import { Calendar, Clock, Plus, Filter } from 'lucide-react';
import Link from 'next/link';
import { formatTime, getTodayDate } from '@/lib/utils';
import { APPOINTMENT_STATUS_COLORS, APPOINTMENT_STATUS_LABELS } from '@/lib/constants';

interface AppointmentWithPatient extends Appointment {
    patient: Patient;
}

export default function AppointmentsPage() {
    const { user } = useAuth();
    const [appointments, setAppointments] = useState<AppointmentWithPatient[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterDate, setFilterDate] = useState(getTodayDate());
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        async function fetchAppointments() {
            try {
                if (!user?.id) return;

                const { data: userData } = await supabase
                    .from('users')
                    .select('clinic_id')
                    .eq('id', user.id)
                    .single<{ clinic_id: string }>();

                if (!userData) return;

                let query = supabase
                    .from('appointments')
                    .select(`
            *,
            patient:patients(*)
          `)
                    .eq('clinic_id', userData.clinic_id)
                    .is('deleted_at', null)
                    .order('appointment_time', { ascending: true });

                if (filterDate) {
                    query = query.eq('appointment_date', filterDate);
                }

                if (filterStatus !== 'all') {
                    query = query.eq('status', filterStatus);
                }

                const { data, error } = await query;

                if (error) throw error;
                setAppointments(data as AppointmentWithPatient[] || []);
            } catch (error) {
                console.error('Error fetching appointments:', error);
            } finally {
                setLoading(false);
            }
        }

        if (user) {
            fetchAppointments();
        }
    }, [user, filterDate, filterStatus]);

    const todayAppointments = appointments.filter(
        (apt) => apt.appointment_date === getTodayDate()
    );

    const upcomingCount = appointments.filter(
        (apt) => apt.status === 'scheduled' || apt.status === 'confirmed'
    ).length;

    const completedToday = todayAppointments.filter(
        (apt) => apt.status === 'completed'
    ).length;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading appointments...</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Manage patient appointments and schedules
                    </p>
                </div>
                <Link
                    href="/dashboard/appointments/new"
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
                >
                    <Plus className="h-5 w-5" />
                    Book Appointment
                </Link>
            </div>

            {/* Stats */}
            <div className="mb-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg bg-white p-4 shadow">
                    <p className="text-sm font-medium text-gray-600">Today's Appointments</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">{todayAppointments.length}</p>
                </div>
                <div className="rounded-lg bg-white p-4 shadow">
                    <p className="text-sm font-medium text-gray-600">Completed Today</p>
                    <p className="mt-2 text-3xl font-bold text-green-600">{completedToday}</p>
                </div>
                <div className="rounded-lg bg-white p-4 shadow">
                    <p className="text-sm font-medium text-gray-600">Upcoming</p>
                    <p className="mt-2 text-3xl font-bold text-blue-600">{upcomingCount}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="mb-6 flex flex-wrap items-center gap-4 rounded-lg bg-white p-4 shadow">
                <div className="flex items-center gap-2">
                    <Filter className="h-5 w-5 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">Filters:</span>
                </div>

                <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <input
                        type="date"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="rounded-md border border-gray-300 px-3 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                </div>

                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="rounded-md border border-gray-300 px-3 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                    <option value="all">All Status</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="checked_in">Checked In</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                </select>

                <button
                    onClick={() => {
                        setFilterDate(getTodayDate());
                        setFilterStatus('all');
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700"
                >
                    Reset Filters
                </button>
            </div>

            {/* Appointments List */}
            {appointments.length === 0 ? (
                <div className="rounded-lg bg-white p-12 text-center shadow">
                    <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-4 text-lg font-medium text-gray-900">No appointments found</h3>
                    <p className="mt-2 text-sm text-gray-500">
                        {filterDate !== getTodayDate() || filterStatus !== 'all'
                            ? 'Try adjusting your filters'
                            : 'Get started by booking your first appointment'}
                    </p>
                    <Link
                        href="/dashboard/appointments/new"
                        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
                    >
                        <Plus className="h-5 w-5" />
                        Book Appointment
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {appointments.map((appointment) => (
                        <div
                            key={appointment.id}
                            className="rounded-lg bg-white p-6 shadow hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold text-lg">
                                            #{appointment.token_number}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                {appointment.patient.full_name}
                                            </h3>
                                            <p className="text-sm text-gray-500">
                                                Patient ID: {appointment.patient.patient_number}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Calendar className="h-4 w-4" />
                                            {new Date(appointment.appointment_date).toLocaleDateString('en-IN', {
                                                weekday: 'long',
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                            })}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Clock className="h-4 w-4" />
                                            {formatTime(appointment.appointment_time)}
                                        </div>
                                    </div>

                                    {appointment.booking_notes && (
                                        <div className="mt-3 rounded-md bg-gray-50 p-3">
                                            <p className="text-sm text-gray-700">
                                                <span className="font-medium">Notes:</span> {appointment.booking_notes}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="ml-4 flex flex-col items-end gap-3">
                                    <span
                                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${APPOINTMENT_STATUS_COLORS[appointment.status as keyof typeof APPOINTMENT_STATUS_COLORS]
                                            }`}
                                    >
                                        {APPOINTMENT_STATUS_LABELS[appointment.status as keyof typeof APPOINTMENT_STATUS_LABELS]}
                                    </span>

                                    <Link
                                        href={`/dashboard/appointments/${appointment.id}`}
                                        className="text-sm font-medium text-blue-600 hover:text-blue-700"
                                    >
                                        View Details →
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
