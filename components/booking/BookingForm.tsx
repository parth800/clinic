'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { format, addDays, isSameDay, parseISO } from 'date-fns';
import { Calendar, Clock, User, Phone, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface BookingFormProps {
    clinic: {
        id: string;
        name: string;
        working_hours: any;
        slot_duration: number;
        consultation_fee: number;
    };
}

export default function BookingForm({ clinic }: BookingFormProps) {
    const [step, setStep] = useState(1);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
        reason: '',
    });
    const [bookingSuccess, setBookingSuccess] = useState(false);

    // Generate dates for the next 7 days
    const dates = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));

    useEffect(() => {
        fetchAvailableSlots(selectedDate);
    }, [selectedDate]);

    const fetchAvailableSlots = async (date: Date) => {
        try {
            setLoading(true);
            const dayName = format(date, 'EEEE').toLowerCase();
            const schedule = clinic.working_hours[dayName];

            if (!schedule || !schedule.open || !schedule.close) {
                setAvailableSlots([]);
                return;
            }

            // Generate all possible slots
            const slots: string[] = [];
            let currentTime = parseISO(`2000-01-01T${schedule.open}`);
            const closeTime = parseISO(`2000-01-01T${schedule.close}`);
            const duration = clinic.slot_duration;

            while (currentTime < closeTime) {
                slots.push(format(currentTime, 'HH:mm'));
                currentTime = new Date(currentTime.getTime() + duration * 60000);
            }

            // Fetch booked appointments for this date
            const dateStr = format(date, 'yyyy-MM-dd');
            const { data: bookedAppointments } = await supabase
                .from('appointments')
                .select('appointment_time')
                .eq('clinic_id', clinic.id)
                .eq('appointment_date', dateStr)
                .neq('status', 'cancelled')
                .returns<{ appointment_time: string }[]>();

            const bookedTimes = new Set(bookedAppointments?.map(a => a.appointment_time.slice(0, 5)));

            // Filter out booked slots
            const available = slots.filter(slot => !bookedTimes.has(slot));
            setAvailableSlots(available);
        } catch (error) {
            console.error('Error fetching slots:', error);
            toast.error('Failed to load available slots');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSlot) return;

        try {
            setLoading(true);

            // 1. Check if patient exists, if not create one
            let patientId;
            const { data: existingPatient } = await supabase
                .from('patients')
                .select('id')
                .eq('clinic_id', clinic.id)
                .eq('phone', formData.phone)
                .single<{ id: string }>();

            if (existingPatient) {
                patientId = existingPatient.id;
            } else {
                // Create new patient
                const { data: newPatient, error: createError } = await supabase
                    .from('patients')
                    .insert({
                        clinic_id: clinic.id,
                        full_name: formData.full_name,
                        phone: formData.phone,
                        patient_number: `P${Date.now().toString().slice(-6)}`, // Temporary generation
                    } as any)
                    .select()
                    .single<{ id: string }>();

                if (createError) throw createError;
                patientId = newPatient.id;
            }

            // 2. Create appointment
            const { error: appointmentError } = await supabase
                .from('appointments')
                .insert({
                    clinic_id: clinic.id,
                    patient_id: patientId,
                    appointment_date: format(selectedDate, 'yyyy-MM-dd'),
                    appointment_time: selectedSlot,
                    duration: clinic.slot_duration,
                    status: 'scheduled',
                    booking_source: 'web',
                    booking_notes: formData.reason,
                    token_number: Math.floor(Math.random() * 1000) + 1, // Temporary generation
                } as any);

            if (appointmentError) throw appointmentError;

            setBookingSuccess(true);
            toast.success('Appointment booked successfully!');
        } catch (error: any) {
            console.error('Booking error:', error);
            toast.error(error.message || 'Failed to book appointment');
        } finally {
            setLoading(false);
        }
    };

    if (bookingSuccess) {
        return (
            <div className="text-center py-12">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="mt-2 text-lg font-medium text-gray-900">Booking Confirmed!</h3>
                <p className="mt-1 text-sm text-gray-500">
                    Your appointment has been scheduled for {format(selectedDate, 'MMMM d, yyyy')} at {selectedSlot}.
                </p>
                <div className="mt-6">
                    <button
                        onClick={() => {
                            setBookingSuccess(false);
                            setStep(1);
                            setFormData({ full_name: '', phone: '', reason: '' });
                            setSelectedSlot(null);
                        }}
                        className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        Book Another Appointment
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
                {/* Steps Indicator */}
                <div className="mb-8">
                    <div className="flex items-center justify-center">
                        <div className={`flex items-center ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                            <span className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${step >= 1 ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}>1</span>
                            <span className="ml-2 text-sm font-medium">Select Slot</span>
                        </div>
                        <div className={`mx-4 h-0.5 w-12 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`} />
                        <div className={`flex items-center ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                            <span className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${step >= 2 ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}>2</span>
                            <span className="ml-2 text-sm font-medium">Your Details</span>
                        </div>
                    </div>
                </div>

                {step === 1 ? (
                    <div className="space-y-6">
                        {/* Date Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {dates.map((date) => {
                                    const isSelected = isSameDay(date, selectedDate);
                                    return (
                                        <button
                                            key={date.toISOString()}
                                            onClick={() => setSelectedDate(date)}
                                            className={`flex flex-col items-center min-w-[80px] rounded-lg border p-3 text-sm transition-colors ${isSelected
                                                ? 'border-blue-600 bg-blue-50 text-blue-700'
                                                : 'border-gray-200 hover:border-blue-300'
                                                }`}
                                        >
                                            <span className="font-medium">{format(date, 'EEE')}</span>
                                            <span className="text-lg font-bold">{format(date, 'd')}</span>
                                            <span className="text-xs">{format(date, 'MMM')}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Slot Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Available Slots</label>
                            {loading ? (
                                <div className="flex justify-center py-8">
                                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
                                </div>
                            ) : availableSlots.length > 0 ? (
                                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
                                    {availableSlots.map((slot) => (
                                        <button
                                            key={slot}
                                            onClick={() => setSelectedSlot(slot)}
                                            className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${selectedSlot === slot
                                                ? 'border-blue-600 bg-blue-600 text-white'
                                                : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                                                }`}
                                        >
                                            {slot}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="rounded-md bg-yellow-50 p-4 text-center text-sm text-yellow-700">
                                    <AlertCircle className="mx-auto mb-2 h-6 w-6" />
                                    No slots available for this date
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end pt-4">
                            <button
                                onClick={() => setStep(2)}
                                disabled={!selectedSlot}
                                className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="rounded-md bg-blue-50 p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <Clock className="h-5 w-5 text-blue-400" aria-hidden="true" />
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-blue-800">Selected Appointment</h3>
                                    <div className="mt-2 text-sm text-blue-700">
                                        <p>
                                            {format(selectedDate, 'EEEE, MMMM d, yyyy')} at {selectedSlot}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                                Full Name
                            </label>
                            <div className="relative mt-1 rounded-md shadow-sm">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <User className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                </div>
                                <input
                                    type="text"
                                    name="full_name"
                                    id="full_name"
                                    required
                                    className="block w-full rounded-md border-gray-300 pl-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    placeholder="John Doe"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                                Phone Number
                            </label>
                            <div className="relative mt-1 rounded-md shadow-sm">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <Phone className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                </div>
                                <input
                                    type="tel"
                                    name="phone"
                                    id="phone"
                                    required
                                    className="block w-full rounded-md border-gray-300 pl-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    placeholder="9876543210"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
                                Reason for Visit
                            </label>
                            <div className="relative mt-1 rounded-md shadow-sm">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <FileText className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                </div>
                                <textarea
                                    name="reason"
                                    id="reason"
                                    rows={3}
                                    className="block w-full rounded-md border-gray-300 pl-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    placeholder="Briefly describe your symptoms"
                                    value={formData.reason}
                                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="flex justify-between pt-4">
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            >
                                Back
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {loading ? 'Booking...' : 'Confirm Booking'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
