'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { BLOOD_GROUPS, GENDER } from '@/lib/constants';
import { use } from 'react';

export default function EditPatientPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
        alternate_phone: '',
        email: '',
        date_of_birth: '',
        gender: '',
        blood_group: '',
        address: '',
        city: '',
        pincode: '',
        allergies: '',
        chronic_conditions: '',
        current_medications: '',
        medical_notes: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        emergency_contact_relation: '',
    });

    useEffect(() => {
        async function fetchPatient() {
            try {
                const { data, error } = await supabase
                    .from('patients')
                    .select('*')
                    .eq('id', id)
                    .single<any>();

                if (error) throw error;

                setFormData({
                    full_name: data.full_name || '',
                    phone: data.phone || '',
                    alternate_phone: data.alternate_phone || '',
                    email: data.email || '',
                    date_of_birth: data.date_of_birth || '',
                    gender: data.gender || '',
                    blood_group: data.blood_group || '',
                    address: data.address || '',
                    city: data.city || '',
                    pincode: data.pincode || '',
                    allergies: data.allergies?.join(', ') || '',
                    chronic_conditions: data.chronic_conditions?.join(', ') || '',
                    current_medications: data.current_medications?.join(', ') || '',
                    medical_notes: data.medical_notes || '',
                    emergency_contact_name: data.emergency_contact_name || '',
                    emergency_contact_phone: data.emergency_contact_phone || '',
                    emergency_contact_relation: data.emergency_contact_relation || '',
                });
            } catch (error) {
                console.error('Error fetching patient:', error);
                toast.error('Failed to load patient');
            } finally {
                setInitialLoading(false);
            }
        }

        if (user && id) {
            fetchPatient();
        }
    }, [user, id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const age = formData.date_of_birth
                ? new Date().getFullYear() - new Date(formData.date_of_birth).getFullYear()
                : null;

            const patientData = {
                full_name: formData.full_name,
                phone: formData.phone,
                alternate_phone: formData.alternate_phone || null,
                email: formData.email || null,
                date_of_birth: formData.date_of_birth || null,
                age,
                gender: formData.gender || null,
                blood_group: formData.blood_group || null,
                address: formData.address || null,
                city: formData.city || null,
                pincode: formData.pincode || null,
                allergies: formData.allergies ? formData.allergies.split(',').map(a => a.trim()) : null,
                chronic_conditions: formData.chronic_conditions ? formData.chronic_conditions.split(',').map(c => c.trim()) : null,
                current_medications: formData.current_medications ? formData.current_medications.split(',').map(m => m.trim()) : null,
                medical_notes: formData.medical_notes || null,
                emergency_contact_name: formData.emergency_contact_name || null,
                emergency_contact_phone: formData.emergency_contact_phone || null,
                emergency_contact_relation: formData.emergency_contact_relation || null,
                updated_at: new Date().toISOString(),
            };

            const { error } = await supabase
                .from('patients')
                // @ts-ignore - Supabase type inference issue
                .update(patientData)
                .eq('id', id);

            if (error) throw error;

            toast.success('Patient updated successfully!');
            router.push(`/dashboard/patients/${id}`);
        } catch (error: any) {
            console.error('Error updating patient:', error);
            toast.error(error.message || 'Failed to update patient');
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading patient...</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-8">
                <Link
                    href={`/dashboard/patients/${id}`}
                    className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Patient
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Edit Patient</h1>
                <p className="mt-1 text-sm text-gray-600">Update patient information</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Personal Information */}
                <div className="rounded-lg bg-white p-6 shadow">
                    <h2 className="mb-4 text-lg font-semibold text-gray-900">Personal Information</h2>
                    <div className="grid gap-6 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                                Full Name *
                            </label>
                            <input
                                type="text"
                                id="full_name"
                                required
                                value={formData.full_name}
                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                                Phone Number *
                            </label>
                            <input
                                type="tel"
                                id="phone"
                                required
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email
                            </label>
                            <input
                                type="email"
                                id="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700">
                                Date of Birth
                            </label>
                            <input
                                type="date"
                                id="date_of_birth"
                                value={formData.date_of_birth}
                                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                                Gender
                            </label>
                            <select
                                id="gender"
                                value={formData.gender}
                                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="">Select gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="blood_group" className="block text-sm font-medium text-gray-700">
                                Blood Group
                            </label>
                            <select
                                id="blood_group"
                                value={formData.blood_group}
                                onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="">Select blood group</option>
                                {BLOOD_GROUPS.map((bg) => (
                                    <option key={bg} value={bg}>{bg}</option>
                                ))}
                            </select>
                        </div>

                        <div className="sm:col-span-2">
                            <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                                Address
                            </label>
                            <textarea
                                id="address"
                                rows={2}
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Medical Information */}
                <div className="rounded-lg bg-white p-6 shadow">
                    <h2 className="mb-4 text-lg font-semibold text-gray-900">Medical Information</h2>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="allergies" className="block text-sm font-medium text-gray-700">
                                Allergies (comma-separated)
                            </label>
                            <input
                                type="text"
                                id="allergies"
                                value={formData.allergies}
                                onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                                placeholder="Penicillin, Peanuts"
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label htmlFor="chronic_conditions" className="block text-sm font-medium text-gray-700">
                                Chronic Conditions (comma-separated)
                            </label>
                            <input
                                type="text"
                                id="chronic_conditions"
                                value={formData.chronic_conditions}
                                onChange={(e) => setFormData({ ...formData, chronic_conditions: e.target.value })}
                                placeholder="Diabetes, Hypertension"
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label htmlFor="current_medications" className="block text-sm font-medium text-gray-700">
                                Current Medications (comma-separated)
                            </label>
                            <input
                                type="text"
                                id="current_medications"
                                value={formData.current_medications}
                                onChange={(e) => setFormData({ ...formData, current_medications: e.target.value })}
                                placeholder="Metformin, Aspirin"
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Emergency Contact */}
                <div className="rounded-lg bg-white p-6 shadow">
                    <h2 className="mb-4 text-lg font-semibold text-gray-900">Emergency Contact</h2>
                    <div className="grid gap-6 sm:grid-cols-2">
                        <div>
                            <label htmlFor="emergency_contact_name" className="block text-sm font-medium text-gray-700">
                                Contact Name
                            </label>
                            <input
                                type="text"
                                id="emergency_contact_name"
                                value={formData.emergency_contact_name}
                                onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label htmlFor="emergency_contact_phone" className="block text-sm font-medium text-gray-700">
                                Contact Phone
                            </label>
                            <input
                                type="tel"
                                id="emergency_contact_phone"
                                value={formData.emergency_contact_phone}
                                onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                        {loading ? 'Updating...' : 'Update Patient'}
                    </button>
                    <Link
                        href={`/dashboard/patients/${id}`}
                        className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-center text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        Cancel
                    </Link>
                </div>
            </form>
        </div>
    );
}
