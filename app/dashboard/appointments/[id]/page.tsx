'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Appointment, Patient } from '@/types';
import { ArrowLeft, Calendar, Clock, User, Phone, FileText, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { formatDate, formatTime } from '@/lib/utils';
import { APPOINTMENT_STATUS_COLORS, APPOINTMENT_STATUS_LABELS } from '@/lib/constants';
import DeleteConfirmationModal from '@/components/ui/DeleteConfirmationModal';
import toast from 'react-hot-toast';

interface AppointmentWithPatient extends Appointment {
    patient: Patient;
}

import { use } from 'react';

export default function AppointmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { user } = useAuth();
    const [appointment, setAppointment] = useState<AppointmentWithPatient | null>(null);
    const [loading, setLoading] = useState(true);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    useEffect(() => {
        async function fetchAppointment() {
            try {
                const { data, error } = await supabase
                    .from('appointments')
                    .select(`
            *,
            patient:patients(*)
          `)
                    .eq('id', id)
                    .single();

                if (error) throw error;
                setAppointment(data as AppointmentWithPatient);
            } catch (error) {
                console.error('Error fetching appointment:', error);
            } finally {
                setLoading(false);
            }
        }

        if (user && id) {
            fetchAppointment();
        }
    }, [user, id]);

    const handleDelete = async () => {
        try {
            const { error } = await supabase
                .from('appointments')
                // @ts-ignore - Supabase type inference issue
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', id);

            if (error) throw error;

            toast.success('Appointment deleted successfully');
            router.push('/dashboard/appointments');
        } catch (error: any) {
            console.error('Error deleting appointment:', error);
            toast.error(error.message || 'Failed to delete appointment');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading appointment...</p>
                </div>
            </div>
        );
    }

    if (!appointment) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-gray-900">Appointment not found</h2>
                <Link href="/dashboard/appointments" className="mt-4 inline-block text-blue-600 hover:text-blue-700">
                    ← Back to Appointments
                </Link>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-8">
                <Link
                    href="/dashboard/appointments"
                    className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Appointments
                </Link>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Appointment Details</h1>
                        <p className="mt-1 text-sm text-gray-600">Token #{appointment.token_number}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span
                            className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${APPOINTMENT_STATUS_COLORS[appointment.status as keyof typeof APPOINTMENT_STATUS_COLORS]
                                }`}
                        >
                            {APPOINTMENT_STATUS_LABELS[appointment.status as keyof typeof APPOINTMENT_STATUS_LABELS]}
                        </span>
                        <Link
                            href={`/dashboard/appointments/${id}/edit`}
                            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            <Edit className="h-4 w-4" />
                            Edit
                        </Link>
                        <button
                            onClick={() => setShowDeleteModal(true)}
                            className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        >
                            <Trash2 className="h-4 w-4" />
                            Delete
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Patient Information */}
                <div className="rounded-lg bg-white p-6 shadow">
                    <div className="mb-4 flex items-center gap-3">
                        <User className="h-6 w-6 text-blue-600" />
                        <h2 className="text-lg font-semibold text-gray-900">Patient Information</h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Full Name</p>
                            <p className="mt-1 text-base text-gray-900">{appointment.patient.full_name}</p>
                        </div>

                        <div>
                            <p className="text-sm font-medium text-gray-500">Patient Number</p>
                            <p className="mt-1 text-base text-gray-900">{appointment.patient.patient_number}</p>
                        </div>

                        <div>
                            <p className="text-sm font-medium text-gray-500">Phone</p>
                            <p className="mt-1 text-base text-gray-900">{appointment.patient.phone}</p>
                        </div>

                        {appointment.patient.email && (
                            <div>
                                <p className="text-sm font-medium text-gray-500">Email</p>
                                <p className="mt-1 text-base text-gray-900">{appointment.patient.email}</p>
                            </div>
                        )}

                        <div>
                            <p className="text-sm font-medium text-gray-500">Age / Gender</p>
                            <p className="mt-1 text-base text-gray-900">
                                {appointment.patient.age} years / {appointment.patient.gender}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Appointment Information */}
                <div className="rounded-lg bg-white p-6 shadow">
                    <div className="mb-4 flex items-center gap-3">
                        <Calendar className="h-6 w-6 text-blue-600" />
                        <h2 className="text-lg font-semibold text-gray-900">Appointment Information</h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Date</p>
                            <p className="mt-1 text-base text-gray-900">{formatDate(appointment.appointment_date)}</p>
                        </div>

                        <div>
                            <p className="text-sm font-medium text-gray-500">Time</p>
                            <p className="mt-1 text-base text-gray-900">{formatTime(appointment.appointment_time)}</p>
                        </div>

                        <div>
                            <p className="text-sm font-medium text-gray-500">Token Number</p>
                            <p className="mt-1 text-2xl font-bold text-blue-600">#{appointment.token_number}</p>
                        </div>

                        <div>
                            <p className="text-sm font-medium text-gray-500">Status</p>
                            <p className="mt-1 text-base capitalize text-gray-900">
                                {APPOINTMENT_STATUS_LABELS[appointment.status as keyof typeof APPOINTMENT_STATUS_LABELS]}
                            </p>
                        </div>

                        {appointment.booking_notes && (
                            <div>
                                <p className="text-sm font-medium text-gray-500">Booking Notes</p>
                                <p className="mt-1 text-base text-gray-900">{appointment.booking_notes}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Additional Details */}
            <div className="mt-6 rounded-lg bg-white p-6 shadow">
                <div className="mb-4 flex items-center gap-3">
                    <FileText className="h-6 w-6 text-blue-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Additional Details</h2>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Created At</p>
                        <p className="mt-1 text-base text-gray-900">
                            {new Date(appointment.created_at).toLocaleString('en-IN')}
                        </p>
                    </div>

                    {appointment.updated_at && (
                        <div>
                            <p className="text-sm font-medium text-gray-500">Last Updated</p>
                            <p className="mt-1 text-base text-gray-900">
                                {new Date(appointment.updated_at).toLocaleString('en-IN')}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <DeleteConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                title="Delete Appointment?"
                message="Are you sure you want to delete this appointment? This action cannot be undone."
                confirmText="Delete Appointment"
            />
        </div>
    );
}
