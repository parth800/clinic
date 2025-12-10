'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Prescription, Patient } from '@/types';
import { FileText, Plus, Calendar, User } from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

interface PrescriptionWithPatient extends Prescription {
    patient: Patient;
}

export default function PrescriptionsPage() {
    const { user } = useAuth();
    const [prescriptions, setPrescriptions] = useState<PrescriptionWithPatient[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchPrescriptions() {
            try {
                const { data: userData } = await supabase
                    .from('users')
                    .select('clinic_id')
                    .eq('id', user?.id)
                    .single();

                if (!userData) return;

                const { data, error } = await supabase
                    .from('prescriptions')
                    .select(`
            *,
            patient:patients(*)
          `)
                    .eq('clinic_id', userData.clinic_id)
                    .is('deleted_at', null)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setPrescriptions(data as PrescriptionWithPatient[] || []);
            } catch (error) {
                console.error('Error fetching prescriptions:', error);
            } finally {
                setLoading(false);
            }
        }

        if (user) {
            fetchPrescriptions();
        }
    }, [user]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading prescriptions...</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Prescriptions</h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Manage patient prescriptions and medical records
                    </p>
                </div>
                <Link
                    href="/dashboard/prescriptions/new"
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
                >
                    <Plus className="h-5 w-5" />
                    New Prescription
                </Link>
            </div>

            {/* Stats */}
            <div className="mb-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg bg-white p-4 shadow">
                    <p className="text-sm font-medium text-gray-600">Total Prescriptions</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">{prescriptions.length}</p>
                </div>
                <div className="rounded-lg bg-white p-4 shadow">
                    <p className="text-sm font-medium text-gray-600">This Month</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">
                        {prescriptions.filter(p => {
                            const created = new Date(p.created_at);
                            const now = new Date();
                            return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
                        }).length}
                    </p>
                </div>
                <div className="rounded-lg bg-white p-4 shadow">
                    <p className="text-sm font-medium text-gray-600">With Follow-up</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">
                        {prescriptions.filter(p => p.follow_up_required).length}
                    </p>
                </div>
            </div>

            {/* Prescriptions List */}
            {prescriptions.length === 0 ? (
                <div className="rounded-lg bg-white p-12 text-center shadow">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-4 text-lg font-medium text-gray-900">No prescriptions yet</h3>
                    <p className="mt-2 text-sm text-gray-500">
                        Get started by creating your first prescription
                    </p>
                    <Link
                        href="/dashboard/prescriptions/new"
                        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
                    >
                        <Plus className="h-5 w-5" />
                        New Prescription
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {prescriptions.map((prescription) => (
                        <div
                            key={prescription.id}
                            className="rounded-lg bg-white p-6 shadow hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                                            <FileText className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                {prescription.patient.full_name}
                                            </h3>
                                            <p className="text-sm text-gray-500">
                                                Patient ID: {prescription.patient.patient_number}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">Chief Complaint</p>
                                            <p className="text-sm text-gray-600">
                                                {prescription.chief_complaint || 'Not specified'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">Diagnosis</p>
                                            <p className="text-sm text-gray-600">
                                                {prescription.diagnosis || 'Not specified'}
                                            </p>
                                        </div>
                                    </div>

                                    {prescription.medications && (prescription.medications as any[]).length > 0 && (
                                        <div className="mt-3 rounded-md bg-blue-50 p-3">
                                            <p className="text-sm font-medium text-blue-900">
                                                Medications: {(prescription.medications as any[]).length} prescribed
                                            </p>
                                        </div>
                                    )}

                                    {prescription.follow_up_required && (
                                        <div className="mt-3 rounded-md bg-orange-50 p-3">
                                            <p className="text-sm font-medium text-orange-900">
                                                Follow-up required in {prescription.follow_up_days} days
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="ml-4 flex flex-col items-end gap-3">
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-gray-900">
                                            {formatDate(prescription.created_at)}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {new Date(prescription.created_at).toLocaleTimeString('en-IN', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </p>
                                    </div>

                                    <Link
                                        href={`/dashboard/prescriptions/${prescription.id}`}
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
