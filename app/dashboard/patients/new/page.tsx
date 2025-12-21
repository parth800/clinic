'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { BLOOD_GROUPS, GENDER } from '@/lib/constants';

export default function NewPatientPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Get user's clinic_id
            if (!user?.id) {
                toast.error('User not authenticated');
                return;
            }

            const { data: userData } = await supabase
                .from('users')
                .select('clinic_id')
                .eq('id', user.id)
                .single<{ clinic_id: string }>();

            if (!userData) {
                toast.error('User not found');
                return;
            }

            // Calculate age from date of birth
            const age = formData.date_of_birth
                ? new Date().getFullYear() - new Date(formData.date_of_birth).getFullYear()
                : null;

            // Prepare patient data
            const patientData = {
                clinic_id: userData.clinic_id,
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
                registered_by: user?.id,
            };

            const { error } = await supabase
                .from('patients')
                .insert(patientData as any);

            if (error) throw error;

            toast.success('Patient added successfully!');
            router.push('/dashboard/patients');
        } catch (error: any) {
            console.error('Error adding patient:', error);
            toast.error(error.message || 'Failed to add patient');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="mb-8">
                <Link
                    href="/dashboard/patients"
                    className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Patients
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Add New Patient</h1>
                <p className="mt-1 text-sm text-gray-600">
                    Register a new patient in the system
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Personal Information */}
                <div className="rounded-lg bg-white p-6 shadow">
                    <h2 className="mb-4 text-lg font-semibold text-gray-900">
                        Personal Information
                    </h2>
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
                                placeholder="Amit Kumar Patel"
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
                                placeholder="9876543210"
                            />
                        </div>

                        <div>
                            <label htmlFor="alternate_phone" className="block text-sm font-medium text-gray-700">
                                Alternate Phone
                            </label>
                            <input
                                type="tel"
                                id="alternate_phone"
                                value={formData.alternate_phone}
                                onChange={(e) => setFormData({ ...formData, alternate_phone: e.target.value })}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="9876543211"
                            />
                        </div>

                        <div className="sm:col-span-2">
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email
                            </label>
                            <input
                                type="email"
                                id="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="amit@example.com"
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
                                {BLOOD_GROUPS.map((group) => (
                                    <option key={group} value={group}>
                                        {group}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Address */}
                <div className="rounded-lg bg-white p-6 shadow">
                    <h2 className="mb-4 text-lg font-semibold text-gray-900">Address</h2>
                    <div className="grid gap-6 sm:grid-cols-3">
                        <div className="sm:col-span-3">
                            <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                                Street Address
                            </label>
                            <textarea
                                id="address"
                                rows={2}
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="123, Main Street, Satellite"
                            />
                        </div>

                        <div className="sm:col-span-2">
                            <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                                City
                            </label>
                            <input
                                type="text"
                                id="city"
                                value={formData.city}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Ahmedabad"
                            />
                        </div>

                        <div>
                            <label htmlFor="pincode" className="block text-sm font-medium text-gray-700">
                                Pincode
                            </label>
                            <input
                                type="text"
                                id="pincode"
                                value={formData.pincode}
                                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="380015"
                            />
                        </div>
                    </div>
                </div>

                {/* Medical Information */}
                <div className="rounded-lg bg-white p-6 shadow">
                    <h2 className="mb-4 text-lg font-semibold text-gray-900">
                        Medical Information
                    </h2>
                    <div className="space-y-6">
                        <div>
                            <label htmlFor="allergies" className="block text-sm font-medium text-gray-700">
                                Allergies (comma-separated)
                            </label>
                            <input
                                type="text"
                                id="allergies"
                                value={formData.allergies}
                                onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Penicillin, Peanuts"
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
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Diabetes, Hypertension"
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
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Metformin 500mg, Aspirin 75mg"
                            />
                        </div>

                        <div>
                            <label htmlFor="medical_notes" className="block text-sm font-medium text-gray-700">
                                Medical Notes
                            </label>
                            <textarea
                                id="medical_notes"
                                rows={3}
                                value={formData.medical_notes}
                                onChange={(e) => setFormData({ ...formData, medical_notes: e.target.value })}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Any additional medical information..."
                            />
                        </div>
                    </div>
                </div>

                {/* Emergency Contact */}
                <div className="rounded-lg bg-white p-6 shadow">
                    <h2 className="mb-4 text-lg font-semibold text-gray-900">
                        Emergency Contact
                    </h2>
                    <div className="grid gap-6 sm:grid-cols-3">
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
                                placeholder="Rajesh Patel"
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
                                placeholder="9876543210"
                            />
                        </div>

                        <div>
                            <label htmlFor="emergency_contact_relation" className="block text-sm font-medium text-gray-700">
                                Relation
                            </label>
                            <input
                                type="text"
                                id="emergency_contact_relation"
                                value={formData.emergency_contact_relation}
                                onChange={(e) => setFormData({ ...formData, emergency_contact_relation: e.target.value })}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Father, Mother, Spouse"
                            />
                        </div>
                    </div>
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-end gap-4">
                    <Link
                        href="/dashboard/patients"
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={loading}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Adding Patient...' : 'Add Patient'}
                    </button>
                </div>
            </form>
        </div>
    );
}
