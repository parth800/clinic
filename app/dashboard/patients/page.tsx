'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Patient } from '@/types';
import { Search, Plus, Phone, Mail, User } from 'lucide-react';
import Link from 'next/link';
import { formatPhoneDisplay, calculateAge } from '@/lib/utils';

export default function PatientsPage() {
    const { user } = useAuth();
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);

    useEffect(() => {
        async function fetchPatients() {
            try {
                if (!user?.id) return;

                // Get user's clinic_id
                const { data: userData } = await supabase
                    .from('users')
                    .select('clinic_id')
                    .eq('id', user.id)
                    .single<{ clinic_id: string }>();

                if (!userData) return;

                // Fetch all patients for this clinic
                const { data, error } = await supabase
                    .from('patients')
                    .select('*')
                    .eq('clinic_id', userData.clinic_id)
                    .is('deleted_at', null)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setPatients(data || []);
                setFilteredPatients(data || []);
            } catch (error) {
                console.error('Error fetching patients:', error);
            } finally {
                setLoading(false);
            }
        }

        if (user) {
            fetchPatients();
        }
    }, [user]);

    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredPatients(patients);
        } else {
            const query = searchQuery.toLowerCase();
            const filtered = patients.filter(
                (patient) =>
                    patient.full_name.toLowerCase().includes(query) ||
                    patient.phone.includes(query) ||
                    patient.patient_number?.toLowerCase().includes(query)
            );
            setFilteredPatients(filtered);
        }
    }, [searchQuery, patients]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading patients...</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Patients</h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Manage your patient records
                    </p>
                </div>
                <Link
                    href="/dashboard/patients/new"
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
                >
                    <Plus className="h-5 w-5" />
                    Add Patient
                </Link>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name, phone, or patient number..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Stats */}
            <div className="mb-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg bg-white p-4 shadow">
                    <p className="text-sm font-medium text-gray-600">Total Patients</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">{patients.length}</p>
                </div>
                <div className="rounded-lg bg-white p-4 shadow">
                    <p className="text-sm font-medium text-gray-600">New This Month</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">
                        {patients.filter(p => {
                            const created = new Date(p.created_at);
                            const now = new Date();
                            return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
                        }).length}
                    </p>
                </div>
                <div className="rounded-lg bg-white p-4 shadow">
                    <p className="text-sm font-medium text-gray-600">Search Results</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">{filteredPatients.length}</p>
                </div>
            </div>

            {/* Patient List */}
            {filteredPatients.length === 0 ? (
                <div className="rounded-lg bg-white p-12 text-center shadow">
                    <User className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-4 text-lg font-medium text-gray-900">
                        {searchQuery ? 'No patients found' : 'No patients yet'}
                    </h3>
                    <p className="mt-2 text-sm text-gray-500">
                        {searchQuery
                            ? 'Try adjusting your search query'
                            : 'Get started by adding your first patient'}
                    </p>
                    {!searchQuery && (
                        <Link
                            href="/dashboard/patients/new"
                            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
                        >
                            <Plus className="h-5 w-5" />
                            Add Patient
                        </Link>
                    )}
                </div>
            ) : (
                <div className="overflow-hidden rounded-lg bg-white shadow">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Patient
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Contact
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Age/Gender
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Patient ID
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {filteredPatients.map((patient) => (
                                <tr key={patient.id} className="hover:bg-gray-50">
                                    <td className="whitespace-nowrap px-6 py-4">
                                        <div className="flex items-center">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-semibold">
                                                {patient.full_name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {patient.full_name}
                                                </div>
                                                {patient.blood_group && (
                                                    <div className="text-sm text-gray-500">
                                                        Blood: {patient.blood_group}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2 text-sm text-gray-900">
                                                <Phone className="h-4 w-4 text-gray-400" />
                                                {formatPhoneDisplay(patient.phone)}
                                            </div>
                                            {patient.email && (
                                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                                    <Mail className="h-4 w-4 text-gray-400" />
                                                    {patient.email}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                                        {patient.date_of_birth ? (
                                            <div>
                                                {calculateAge(patient.date_of_birth)} years
                                                {patient.gender && (
                                                    <span className="ml-2 text-gray-500">
                                                        • {patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-gray-400">-</span>
                                        )}
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4">
                                        <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-800">
                                            {patient.patient_number || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                        <Link
                                            href={`/dashboard/patients/${patient.id}`}
                                            className="text-blue-600 hover:text-blue-900"
                                        >
                                            View Details
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
