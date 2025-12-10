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

export default function NewAppointmentPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [bookedSlots, setBookedSlots] = useState<string[]>([]);

    const [formData, setFormData] = useState({
        appointment_date: getTodayDate(),
        appointment_time: '',
        booking_notes: '',
    });

    // Fetch patients
    useEffect(() => {
        async function fetchPatients() {
            try {
                const { data: userData } = await supabase
                    .from('users')
                    .select('clinic_id')
                    .eq('id', user?.id)
                    .single();

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
                const { data: userData } = await supabase
                    .from('users')
                    .select('clinic_id')
                    .eq('id', user?.id)
                    .single();

                if (!userData) return;

                // Get clinic working hours
                const { data: clinicData } = await supabase
                    .from('clinics')
                    .select('working_hours, slot_duration')
                    .eq('id', userData.clinic_id)
                    .single();

                if (!clinicData) return;

                // Get day of week
                const dayOfWeek = new Date(formData.appointment_date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
                const workingHours = clinicData.working_hours as any;
                const daySchedule = workingHours[dayOfWeek];

                if (!daySchedule || !daySchedule.open) {
                    setAvailableSlots([]);
                    return;
                }

                // Generate all possible slots
                const allSlots = generateTimeSlots(
                    daySchedule.open,
                    daySchedule.close,
                    clinicData.slot_duration || 15
                );

                // Get booked slots for this date
                const { data: appointments } = await supabase
                    .from('appointments')
                    .select('appointment_time')
                    .eq('clinic_id', userData.clinic_id)
                    .eq('appointment_date', formData.appointment_date)
                    .not('status', 'in', '(cancelled,no_show)')
                    .is('deleted_at', null);

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
    }, [user, formData.appointment_date]);

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
            const { data: userData } = await supabase
                .from('users')
                .select('clinic_id')
                .eq('id', user?.id)
                .single();

            if (!userData) {
                toast.error('User not found');
                return;
            }

            const appointmentData = {
                clinic_id: userData.clinic_id,
                patient_id: selectedPatient.id,
                doctor_id: user?.id,
                appointment_date: formData.appointment_date,
                appointment_time: formData.appointment_time,
                duration: 15,
                status: 'scheduled',
                booking_source: 'web',
                booking_notes: formData.booking_notes || null,
                created_by: user?.id,
            };

            const { error } = await supabase
                .from('appointments')
                .insert(appointmentData);

            if (error) throw error;

            toast.success('Appointment booked successfully!');
            router.push('/dashboard/appointments');
        } catch (error: any) {
            console.error('Error booking appointment:', error);
            toast.error(error.message || 'Failed to book appointment');
        } finally {
            setLoading(false);
        }
    };

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
                <h1 className="text-2xl font-bold text-gray-900">Book New Appointment</h1>
                <p className="mt-1 text-sm text-gray-600">
                    Schedule an appointment for a patient
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Patient Selection */}
                <div className="rounded-lg bg-white p-6 shadow">
                    <h2 className="mb-4 text-lg font-semibold text-gray-900">
                        Select Patient
                    </h2>

                    {!selectedPatient ? (
                        <>
                            <div className="relative mb-4">
                                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by name, phone, or patient number..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>

                            <div className="max-h-96 overflow-y-auto space-y-2">
                                {filteredPatients.length === 0 ? (
                                    <p className="text-center text-gray-500 py-8">
                                        {searchQuery ? 'No patients found' : 'No patients available'}
                                    </p>
                                ) : (
                                    filteredPatients.map((patient) => (
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
                        </>
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

                {/* Date & Time Selection */}
                {selectedPatient && (
                    <div className="rounded-lg bg-white p-6 shadow">
                        <h2 className="mb-4 text-lg font-semibold text-gray-900">
                            Select Date & Time
                        </h2>

                        <div className="space-y-6">
                            <div>
                                <label htmlFor="appointment_date" className="block text-sm font-medium text-gray-700 mb-2">
                                    <Calendar className="inline h-4 w-4 mr-2" />
                                    Appointment Date
                                </label>
                                <input
                                    type="date"
                                    id="appointment_date"
                                    required
                                    min={getTodayDate()}
                                    value={formData.appointment_date}
                                    onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value, appointment_time: '' })}
                                    className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <Clock className="inline h-4 w-4 mr-2" />
                                    Available Time Slots
                                </label>
                                {availableSlots.length === 0 ? (
                                    <p className="text-center text-gray-500 py-8 bg-gray-50 rounded-lg">
                                        No slots available for this date
                                    </p>
                                ) : (
                                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                                        {availableSlots.map((slot) => {
                                            const isBooked = bookedSlots.includes(slot);
                                            const isSelected = formData.appointment_time === slot;

                                            return (
                                                <button
                                                    key={slot}
                                                    type="button"
                                                    disabled={isBooked}
                                                    onClick={() => setFormData({ ...formData, appointment_time: slot })}
                                                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isBooked
                                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                        : isSelected
                                                            ? 'bg-blue-600 text-white'
                                                            : 'bg-white border border-gray-300 text-gray-700 hover:border-blue-500 hover:bg-blue-50'
                                                        }`}
                                                >
                                                    {slot}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label htmlFor="booking_notes" className="block text-sm font-medium text-gray-700">
                                    Reason for Visit (Optional)
                                </label>
                                <textarea
                                    id="booking_notes"
                                    rows={3}
                                    value={formData.booking_notes}
                                    onChange={(e) => setFormData({ ...formData, booking_notes: e.target.value })}
                                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Fever, headache, follow-up, etc."
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Form Actions */}
                {selectedPatient && (
                    <div className="flex items-center justify-end gap-4">
                        <Link
                            href="/dashboard/appointments"
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={loading || !formData.appointment_time}
                            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Booking...' : 'Book Appointment'}
                        </button>
                    </div>
                )}
            </form>
        </div>
    );
}
