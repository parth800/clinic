'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Patient } from '@/types';
import toast from 'react-hot-toast';
import { ArrowLeft, Search, Calendar, Clock } from 'lucide-react';
import Link from 'next/link';
import { getTodayDate, generateTimeSlots } from '@/lib/utils';
import { use } from 'react';

export default function EditAppointmentPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [bookedSlots, setBookedSlots] = useState<string[]>([]);

    const [formData, setFormData] = useState({
        appointment_date: getTodayDate(),
        appointment_time: '',
        booking_notes: '',
        status: 'scheduled',
    });

    // Fetch existing appointment data
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
                    .single<any>();

                if (error) throw error;

                setFormData({
                    appointment_date: data.appointment_date,
                    appointment_time: data.appointment_time,
                    booking_notes: data.booking_notes || '',
                    status: data.status,
                });
                setSelectedPatient(data.patient);
            } catch (error) {
                console.error('Error fetching appointment:', error);
                toast.error('Failed to load appointment');
            } finally {
                setInitialLoading(false);
            }
        }

        if (user && id) {
            fetchAppointment();
        }
    }, [user, id]);

    // Fetch patients
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

    // Fetch available time slots
    useEffect(() => {
        async function fetchAvailableSlots() {
            try {
                if (!user?.id) return;

                const { data: userData } = await supabase
                    .from('users')
                    .select('clinic_id')
                    .eq('id', user.id)
                    .single<{ clinic_id: string }>();

                if (!userData) return;

                const { data: clinicData } = await supabase
                    .from('clinics')
                    .select('working_hours, slot_duration')
                    .eq('id', userData.clinic_id)
                    .single<{ working_hours: any; slot_duration: number }>();

                if (!clinicData) return;

                const dayOfWeek = new Date(formData.appointment_date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
                const workingHours = clinicData.working_hours as any;
                const daySchedule = workingHours[dayOfWeek];

                if (!daySchedule || !daySchedule.open) {
                    setAvailableSlots([]);
                    return;
                }

                const allSlots = generateTimeSlots(
                    daySchedule.open,
                    daySchedule.close,
                    clinicData.slot_duration || 15
                );

                const { data: appointments } = await supabase
                    .from('appointments')
                    .select('appointment_time')
                    .eq('clinic_id', userData.clinic_id)
                    .eq('appointment_date', formData.appointment_date)
                    .not('status', 'in', '(cancelled,no_show)')
                    .neq('id', id) // Exclude current appointment
                    .is('deleted_at', null)
                    .returns<{ appointment_time: string }[]>();

                const booked = appointments?.map(apt => apt.appointment_time) || [];
                setBookedSlots(booked);
                setAvailableSlots(allSlots);
            } catch (error) {
                console.error('Error fetching slots:', error);
            }
        }

        if (user && formData.appointment_date) {
            fetchAvailableSlots();
        }
    }, [user, formData.appointment_date, id]);

    const filteredPatients = patients.filter(
        (patient) =>
            patient.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            patient.phone.includes(searchQuery) ||
            patient.patient_number?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedPatient) {
            toast.error('Please select a patient');
            return;
        }

        if (!formData.appointment_time) {
            toast.error('Please select a time slot');
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase
                .from('appointments')
                // @ts-ignore - Supabase type inference issue
                .update({
                    patient_id: selectedPatient.id,
                    appointment_date: formData.appointment_date,
                    appointment_time: formData.appointment_time,
                    booking_notes: formData.booking_notes,
                    status: formData.status,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', id);

            if (error) throw error;

            toast.success('Appointment updated successfully!');
            router.push(`/dashboard/appointments/${id}`);
        } catch (error: any) {
            console.error('Error updating appointment:', error);
            toast.error(error.message || 'Failed to update appointment');
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading appointment...</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-8">
                <Link
                    href={`/dashboard/appointments/${id}`}
                    className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Appointment
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Edit Appointment</h1>
                <p className="mt-1 text-sm text-gray-600">Update appointment details</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Patient Selection */}
                <div className="rounded-lg bg-white p-6 shadow">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Patient Information</h2>

                    {selectedPatient ? (
                        <div className="rounded-lg border border-gray-200 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-gray-900">{selectedPatient.full_name}</p>
                                    <p className="text-sm text-gray-600">{selectedPatient.phone}</p>
                                    <p className="text-xs text-gray-500">Patient ID: {selectedPatient.patient_number}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setSelectedPatient(null)}
                                    className="text-sm text-blue-600 hover:text-blue-700"
                                >
                                    Change Patient
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <div className="relative mb-4">
                                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by name, phone, or patient ID..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full rounded-md border border-gray-300 pl-10 pr-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>

                            <div className="max-h-60 overflow-y-auto space-y-2">
                                {filteredPatients.map((patient) => (
                                    <button
                                        key={patient.id}
                                        type="button"
                                        onClick={() => setSelectedPatient(patient)}
                                        className="w-full text-left rounded-lg border border-gray-200 p-3 hover:border-blue-500 hover:bg-blue-50 transition-colors"
                                    >
                                        <p className="font-medium text-gray-900">{patient.full_name}</p>
                                        <p className="text-sm text-gray-600">{patient.phone}</p>
                                        <p className="text-xs text-gray-500">ID: {patient.patient_number}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Date and Time Selection */}
                <div className="rounded-lg bg-white p-6 shadow">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Appointment Schedule</h2>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Calendar className="inline h-4 w-4 mr-1" />
                                Date
                            </label>
                            <input
                                type="date"
                                value={formData.appointment_date}
                                onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
                                min={getTodayDate()}
                                required
                                className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Clock className="inline h-4 w-4 mr-1" />
                                Time Slot
                            </label>
                            <select
                                value={formData.appointment_time}
                                onChange={(e) => setFormData({ ...formData, appointment_time: e.target.value })}
                                required
                                className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="">Select time</option>
                                {availableSlots.map((slot) => (
                                    <option
                                        key={slot}
                                        value={slot}
                                        disabled={bookedSlots.includes(slot)}
                                    >
                                        {slot} {bookedSlots.includes(slot) ? '(Booked)' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Status */}
                <div className="rounded-lg bg-white p-6 shadow">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Status</h2>
                    <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                        <option value="scheduled">Scheduled</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="checked_in">Checked In</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="no_show">No Show</option>
                    </select>
                </div>

                {/* Notes */}
                <div className="rounded-lg bg-white p-6 shadow">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Notes</h2>
                    <textarea
                        value={formData.booking_notes}
                        onChange={(e) => setFormData({ ...formData, booking_notes: e.target.value })}
                        rows={3}
                        placeholder="Add any notes or special instructions..."
                        className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                </div>

                {/* Actions */}
                <div className="flex gap-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                        {loading ? 'Updating...' : 'Update Appointment'}
                    </button>
                    <Link
                        href={`/dashboard/appointments/${id}`}
                        className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-center text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        Cancel
                    </Link>
                </div>
            </form>
        </div>
    );
}
