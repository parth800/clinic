'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Prescription, Patient } from '@/types';
import { ArrowLeft, User, Activity, Pill, FileText, Calendar, Printer } from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

interface PrescriptionWithPatient extends Prescription {
    patient: Patient;
}

import { use } from 'react';

export default function PrescriptionDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { user } = useAuth();
    const [prescription, setPrescription] = useState<PrescriptionWithPatient | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchPrescription() {
            try {
                const { data, error } = await supabase
                    .from('prescriptions')
                    .select(`
            *,
            patient:patients(*)
          `)
                    .eq('id', id)
                    .single();

                if (error) throw error;
                setPrescription(data as PrescriptionWithPatient);
            } catch (error) {
                console.error('Error fetching prescription:', error);
            } finally {
                setLoading(false);
            }
        }

        if (user && id) {
            fetchPrescription();
        }
    }, [user, id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading prescription...</p>
                </div>
            </div>
        );
    }

    if (!prescription) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-gray-900">Prescription not found</h2>
                <Link href="/dashboard/prescriptions" className="mt-4 inline-block text-blue-600 hover:text-blue-700">
                    ← Back to Prescriptions
                </Link>
            </div>
        );
    }

    const vitals = prescription.vitals as any || {};
    const medications = prescription.medications as any[] || [];
    const labTests = prescription.lab_tests as any || {};

    return (
        <div className="print:p-0">
            <div className="mb-8 print:hidden">
                <div className="flex items-center justify-between">
                    <Link
                        href="/dashboard/prescriptions"
                        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Prescriptions
                    </Link>
                    <button
                        onClick={() => window.print()}
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                        <Printer className="h-4 w-4" />
                        Print Prescription
                    </button>
                </div>
                <div className="mt-4">
                    <h1 className="text-2xl font-bold text-gray-900">Prescription Details</h1>
                    <p className="mt-1 text-sm text-gray-600">
                        {formatDate(prescription.created_at)}
                    </p>
                </div>
            </div>

            {/* Print Header */}
            <div className="hidden print:block mb-8 text-center border-b pb-6">
                <h1 className="text-3xl font-bold text-blue-600">ClinicFlow</h1>
                <p className="text-gray-600 mt-2">Medical Prescription</p>
                <p className="text-sm text-gray-500 mt-1">Date: {formatDate(prescription.created_at)}</p>
            </div>

            <div className="space-y-6">
                {/* Patient Information */}
                <div className="rounded-lg bg-white p-6 shadow">
                    <div className="mb-4 flex items-center gap-3">
                        <User className="h-6 w-6 text-blue-600" />
                        <h2 className="text-lg font-semibold text-gray-900">Patient Information</h2>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Name</p>
                            <p className="mt-1 text-base text-gray-900">{prescription.patient.full_name}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Age / Gender</p>
                            <p className="mt-1 text-base text-gray-900">
                                {prescription.patient.age} years / {prescription.patient.gender}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Phone</p>
                            <p className="mt-1 text-base text-gray-900">{prescription.patient.phone}</p>
                        </div>
                    </div>
                </div>

                {/* Vitals */}
                {Object.values(vitals).some(v => v) && (
                    <div className="rounded-lg bg-white p-6 shadow">
                        <div className="mb-4 flex items-center gap-3">
                            <Activity className="h-6 w-6 text-blue-600" />
                            <h2 className="text-lg font-semibold text-gray-900">Vitals</h2>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-4">
                            {vitals.blood_pressure && (
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Blood Pressure</p>
                                    <p className="mt-1 text-base text-gray-900">{vitals.blood_pressure} mmHg</p>
                                </div>
                            )}
                            {vitals.pulse && (
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Pulse</p>
                                    <p className="mt-1 text-base text-gray-900">{vitals.pulse} bpm</p>
                                </div>
                            )}
                            {vitals.temperature && (
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Temperature</p>
                                    <p className="mt-1 text-base text-gray-900">{vitals.temperature} °F</p>
                                </div>
                            )}
                            {vitals.weight && (
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Weight</p>
                                    <p className="mt-1 text-base text-gray-900">{vitals.weight} kg</p>
                                </div>
                            )}
                            {vitals.height && (
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Height</p>
                                    <p className="mt-1 text-base text-gray-900">{vitals.height} cm</p>
                                </div>
                            )}
                            {vitals.spo2 && (
                                <div>
                                    <p className="text-sm font-medium text-gray-500">SpO2</p>
                                    <p className="mt-1 text-base text-gray-900">{vitals.spo2}%</p>
                                </div>
                            )}
                            {vitals.blood_sugar && (
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Blood Sugar</p>
                                    <p className="mt-1 text-base text-gray-900">{vitals.blood_sugar} mg/dL</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Diagnosis */}
                <div className="rounded-lg bg-white p-6 shadow">
                    <div className="mb-4 flex items-center gap-3">
                        <FileText className="h-6 w-6 text-blue-600" />
                        <h2 className="text-lg font-semibold text-gray-900">Diagnosis</h2>
                    </div>

                    <div className="space-y-4">
                        {prescription.chief_complaint && (
                            <div>
                                <p className="text-sm font-medium text-gray-500">Chief Complaint</p>
                                <p className="mt-1 text-base text-gray-900">{prescription.chief_complaint}</p>
                            </div>
                        )}

                        {prescription.diagnosis && (
                            <div>
                                <p className="text-sm font-medium text-gray-500">Diagnosis</p>
                                <p className="mt-1 text-base text-gray-900">{prescription.diagnosis}</p>
                            </div>
                        )}

                        {prescription.clinical_notes && (
                            <div>
                                <p className="text-sm font-medium text-gray-500">Clinical Notes</p>
                                <p className="mt-1 text-base text-gray-900">{prescription.clinical_notes}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Medications */}
                {medications.length > 0 && (
                    <div className="rounded-lg bg-white p-6 shadow">
                        <div className="mb-4 flex items-center gap-3">
                            <Pill className="h-6 w-6 text-blue-600" />
                            <h2 className="text-lg font-semibold text-gray-900">Medications</h2>
                        </div>

                        <div className="space-y-4">
                            {medications.map((med: any, index: number) => (
                                <div key={index} className="rounded-lg border border-gray-200 p-4">
                                    <h3 className="font-semibold text-gray-900">{med.name}</h3>
                                    <div className="mt-2 grid gap-2 sm:grid-cols-3">
                                        <div>
                                            <p className="text-sm text-gray-500">Dosage</p>
                                            <p className="text-sm font-medium text-gray-900">{med.dosage}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Frequency</p>
                                            <p className="text-sm font-medium text-gray-900">{med.frequency}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Duration</p>
                                            <p className="text-sm font-medium text-gray-900">{med.duration}</p>
                                        </div>
                                    </div>
                                    {med.instructions && (
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-500">Instructions</p>
                                            <p className="text-sm text-gray-900">{med.instructions}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Lab Tests */}
                {labTests.recommended_tests && (
                    <div className="rounded-lg bg-white p-6 shadow">
                        <div className="mb-4 flex items-center gap-3">
                            <FileText className="h-6 w-6 text-blue-600" />
                            <h2 className="text-lg font-semibold text-gray-900">Lab Tests</h2>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Recommended Tests</p>
                                <p className="mt-1 text-base text-gray-900">{labTests.recommended_tests}</p>
                            </div>
                            {labTests.lab_notes && (
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Lab Notes</p>
                                    <p className="mt-1 text-base text-gray-900">{labTests.lab_notes}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Follow-up */}
                {prescription.follow_up_required && (
                    <div className="rounded-lg bg-white p-6 shadow">
                        <div className="mb-4 flex items-center gap-3">
                            <Calendar className="h-6 w-6 text-blue-600" />
                            <h2 className="text-lg font-semibold text-gray-900">Follow-up</h2>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Follow-up Required</p>
                                <p className="mt-1 text-base text-gray-900">Yes, after {prescription.follow_up_days} days</p>
                            </div>
                            {prescription.follow_up_notes && (
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Follow-up Notes</p>
                                    <p className="mt-1 text-base text-gray-900">{prescription.follow_up_notes}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
