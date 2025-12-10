'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Patient, Appointment, Prescription } from '@/types';
import { ArrowLeft, User, Phone, Mail, Calendar, FileText, Pill } from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { use } from 'react';

interface PatientWithRelations extends Patient {
    appointments: Appointment[];
    prescriptions: Prescription[];
}

export default function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { user } = useAuth();
    const [patient, setPatient] = useState<PatientWithRelations | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchPatient() {
            try {
                const { data, error } = await supabase
                    .from('patients')
                    .select(`
                        *,
                        appointments(*),
                        prescriptions(*)
                    `)
                    .eq('id', id)
                    .single();

                if (error) throw error;
                setPatient(data as PatientWithRelations);
            } catch (error) {
                console.error('Error fetching patient:', error);
            } finally {
                setLoading(false);
            }
        }

        if (user && id) {
            fetchPatient();
        }
    }, [user, id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading patient details...</p>
                </div>
            </div>
        );
    }

    if (!patient) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-gray-900">Patient not found</h2>
                <Link href="/dashboard/patients" className="mt-4 inline-block text-blue-600 hover:text-blue-700">
                    ← Back to Patients
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="mb-8">
                <Link
                    href="/dashboard/patients"
                    className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Patients
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{patient.full_name}</h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Patient ID: {patient.patient_number}
                    </p>
                </div>
            </div>

            {/* Patient Information */}
            <div className="rounded-lg bg-white p-6 shadow">
                <div className="mb-4 flex items-center gap-3">
                    <User className="h-6 w-6 text-blue-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Phone</p>
                        <p className="mt-1 text-base text-gray-900">{patient.phone}</p>
                    </div>
                    {patient.email && (
                        <div>
                            <p className="text-sm font-medium text-gray-500">Email</p>
                            <p className="mt-1 text-base text-gray-900">{patient.email}</p>
                        </div>
                    )}
                    {patient.age && (
                        <div>
                            <p className="text-sm font-medium text-gray-500">Age</p>
                            <p className="mt-1 text-base text-gray-900">{patient.age} years</p>
                        </div>
                    )}
                    {patient.gender && (
                        <div>
                            <p className="text-sm font-medium text-gray-500">Gender</p>
                            <p className="mt-1 text-base text-gray-900 capitalize">{patient.gender}</p>
                        </div>
                    )}
                    {patient.blood_group && (
                        <div>
                            <p className="text-sm font-medium text-gray-500">Blood Group</p>
                            <p className="mt-1 text-base text-gray-900">{patient.blood_group}</p>
                        </div>
                    )}
                    {patient.address && (
                        <div className="sm:col-span-2">
                            <p className="text-sm font-medium text-gray-500">Address</p>
                            <p className="mt-1 text-base text-gray-900">{patient.address}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Medical Information */}
            {(patient.allergies?.length || patient.chronic_conditions?.length || patient.current_medications?.length) && (
                <div className="rounded-lg bg-white p-6 shadow">
                    <div className="mb-4 flex items-center gap-3">
                        <FileText className="h-6 w-6 text-blue-600" />
                        <h2 className="text-lg font-semibold text-gray-900">Medical Information</h2>
                    </div>

                    <div className="space-y-4">
                        {patient.allergies && patient.allergies.length > 0 && (
                            <div>
                                <p className="text-sm font-medium text-gray-500">Allergies</p>
                                <p className="mt-1 text-base text-gray-900">{patient.allergies.join(', ')}</p>
                            </div>
                        )}
                        {patient.chronic_conditions && patient.chronic_conditions.length > 0 && (
                            <div>
                                <p className="text-sm font-medium text-gray-500">Chronic Conditions</p>
                                <p className="mt-1 text-base text-gray-900">{patient.chronic_conditions.join(', ')}</p>
                            </div>
                        )}
                        {patient.current_medications && patient.current_medications.length > 0 && (
                            <div>
                                <p className="text-sm font-medium text-gray-500">Current Medications</p>
                                <p className="mt-1 text-base text-gray-900">{patient.current_medications.join(', ')}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Recent Appointments */}
            <div className="rounded-lg bg-white p-6 shadow">
                <div className="mb-4 flex items-center gap-3">
                    <Calendar className="h-6 w-6 text-blue-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Recent Appointments</h2>
                </div>

                {patient.appointments && patient.appointments.length > 0 ? (
                    <div className="space-y-3">
                        {patient.appointments.slice(0, 5).map((appointment) => (
                            <div key={appointment.id} className="rounded-md border border-gray-200 p-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">
                                            {formatDate(appointment.appointment_date)} at {appointment.appointment_time}
                                        </p>
                                        <p className="text-xs text-gray-500 capitalize">{appointment.status}</p>
                                    </div>
                                    <Link
                                        href={`/dashboard/appointments/${appointment.id}`}
                                        className="text-sm text-blue-600 hover:text-blue-700"
                                    >
                                        View →
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-gray-500">No appointments yet</p>
                )}
            </div>

            {/* Recent Prescriptions */}
            <div className="rounded-lg bg-white p-6 shadow">
                <div className="mb-4 flex items-center gap-3">
                    <Pill className="h-6 w-6 text-blue-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Recent Prescriptions</h2>
                </div>

                {patient.prescriptions && patient.prescriptions.length > 0 ? (
                    <div className="space-y-3">
                        {patient.prescriptions.slice(0, 5).map((prescription) => (
                            <div key={prescription.id} className="rounded-md border border-gray-200 p-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">
                                            {formatDate(prescription.created_at)}
                                        </p>
                                        {prescription.diagnosis && (
                                            <p className="text-xs text-gray-500">{prescription.diagnosis}</p>
                                        )}
                                    </div>
                                    <Link
                                        href={`/dashboard/prescriptions/${prescription.id}`}
                                        className="text-sm text-blue-600 hover:text-blue-700"
                                    >
                                        View →
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-gray-500">No prescriptions yet</p>
                )}
            </div>
        </div>
    );
}
