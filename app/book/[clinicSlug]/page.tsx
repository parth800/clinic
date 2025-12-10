import { supabase } from '@/lib/supabase';
import BookingForm from '@/components/booking/BookingForm';
import { notFound } from 'next/navigation';
import { MapPin, Phone, Clock } from 'lucide-react';

export const revalidate = 0; // Disable static caching for real-time availability

export default async function BookingPage({ params }: { params: Promise<{ clinicSlug: string }> }) {
    const { clinicSlug } = await params;

    const { data: clinic } = await supabase
        .from('clinics')
        .select('id, name, address, city, state, phone, working_hours, slot_duration, consultation_fee')
        .eq('slug', clinicSlug)
        .single<any>();

    if (!clinic) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm">
                <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-blue-600">ClinicFlow</h1>
                        <div className="text-sm text-gray-500">Patient Booking Portal</div>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Clinic Info Card */}
                <div className="mb-8 overflow-hidden rounded-lg bg-white shadow">
                    <div className="bg-blue-600 px-6 py-4">
                        <h2 className="text-xl font-bold text-white">{clinic.name}</h2>
                        <p className="text-blue-100">{clinic.city}, {clinic.state}</p>
                    </div>
                    <div className="px-6 py-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="flex items-start gap-3">
                                <MapPin className="mt-1 h-5 w-5 text-gray-400" />
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Address</p>
                                    <p className="text-sm text-gray-500">{clinic.address}</p>
                                    <p className="text-sm text-gray-500">{clinic.city}, {clinic.state}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Phone className="mt-1 h-5 w-5 text-gray-400" />
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Contact</p>
                                    <p className="text-sm text-gray-500">{clinic.phone}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Clock className="mt-1 h-5 w-5 text-gray-400" />
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Consultation Fee</p>
                                    <p className="text-sm text-gray-500">₹{clinic.consultation_fee}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Booking Form */}
                <BookingForm clinic={clinic} />
            </main>

            {/* Footer */}
            <footer className="mt-auto bg-white border-t">
                <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                    <p className="text-center text-sm text-gray-500">
                        Powered by ClinicFlow
                    </p>
                </div>
            </footer>
        </div>
    );
}
