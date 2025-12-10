'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Patient } from '@/types';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, X } from 'lucide-react';
import Link from 'next/link';

interface Medication {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
}

export default function NewPrescriptionPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [medications, setMedications] = useState<Medication[]>([]);

    const [formData, setFormData] = useState({
        // Vitals
        blood_pressure: '',
        pulse: '',
        temperature: '',
        weight: '',
        height: '',
        spo2: '',
        blood_sugar: '',

        // Diagnosis
        chief_complaint: '',
        diagnosis: '',
        clinical_notes: '',

        // Lab Tests
        lab_tests: '',
        lab_notes: '',

        // Follow-up
        follow_up_required: false,
        follow_up_days: '',
        follow_up_notes: '',
    });

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

    const addMedication = () => {
        setMedications([
            ...medications,
            { name: '', dosage: '', frequency: '', duration: '', instructions: '' },
        ]);
    };

    const removeMedication = (index: number) => {
        setMedications(medications.filter((_, i) => i !== index));
    };

    const updateMedication = (index: number, field: keyof Medication, value: string) => {
        const updated = [...medications];
        updated[index][field] = value;
        setMedications(updated);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedPatient) {
            toast.error('Please select a patient');
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

            const prescriptionData = {
                clinic_id: userData.clinic_id,
                patient_id: selectedPatient.id,
                doctor_id: user?.id,

                vitals: {
                    blood_pressure: formData.blood_pressure || null,
                    pulse: formData.pulse || null,
                    temperature: formData.temperature || null,
                    weight: formData.weight || null,
                    height: formData.height || null,
                    spo2: formData.spo2 || null,
                    blood_sugar: formData.blood_sugar || null,
                },

                chief_complaint: formData.chief_complaint || null,
                diagnosis: formData.diagnosis || null,
                clinical_notes: formData.clinical_notes || null,

                medications: medications.filter(m => m.name.trim() !== ''),

                lab_tests: formData.lab_tests ? formData.lab_tests.split(',').map(t => t.trim()) : null,
                lab_notes: formData.lab_notes || null,

                follow_up_required: formData.follow_up_required,
                follow_up_days: formData.follow_up_required ? parseInt(formData.follow_up_days) : null,
                follow_up_notes: formData.follow_up_required ? formData.follow_up_notes : null,
            };

            const { error } = await supabase
                .from('prescriptions')
                .insert(prescriptionData);

            if (error) throw error;

            toast.success('Prescription created successfully!');
            router.push('/dashboard/prescriptions');
        } catch (error: any) {
            console.error('Error creating prescription:', error);
            toast.error(error.message || 'Failed to create prescription');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="mb-8">
                <Link
                    href="/dashboard/prescriptions"
                    className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Prescriptions
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">New Prescription</h1>
                <p className="mt-1 text-sm text-gray-600">
                    Create a new prescription for a patient
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Patient Selection */}
                <div className="rounded-lg bg-white p-6 shadow">
                    <h2 className="mb-4 text-lg font-semibold text-gray-900">Select Patient</h2>

                    {!selectedPatient ? (
                        <div className="max-h-96 overflow-y-auto space-y-2">
                            {patients.length === 0 ? (
                                <p className="text-center text-gray-500 py-8">No patients available</p>
                            ) : (
                                patients.map((patient) => (
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

                {selectedPatient && (
                    <>
                        {/* Vitals */}
                        <div className="rounded-lg bg-white p-6 shadow">
                            <h2 className="mb-4 text-lg font-semibold text-gray-900">Vitals</h2>
                            <div className="grid gap-6 sm:grid-cols-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Blood Pressure</label>
                                    <input
                                        type="text"
                                        value={formData.blood_pressure}
                                        onChange={(e) => setFormData({ ...formData, blood_pressure: e.target.value })}
                                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="120/80"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Pulse (bpm)</label>
                                    <input
                                        type="text"
                                        value={formData.pulse}
                                        onChange={(e) => setFormData({ ...formData, pulse: e.target.value })}
                                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="72"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Temperature (°F)</label>
                                    <input
                                        type="text"
                                        value={formData.temperature}
                                        onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="98.6"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Weight (kg)</label>
                                    <input
                                        type="text"
                                        value={formData.weight}
                                        onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="70"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Height (cm)</label>
                                    <input
                                        type="text"
                                        value={formData.height}
                                        onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="170"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">SpO2 (%)</label>
                                    <input
                                        type="text"
                                        value={formData.spo2}
                                        onChange={(e) => setFormData({ ...formData, spo2: e.target.value })}
                                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="98"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Blood Sugar (mg/dL)</label>
                                    <input
                                        type="text"
                                        value={formData.blood_sugar}
                                        onChange={(e) => setFormData({ ...formData, blood_sugar: e.target.value })}
                                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="100"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Diagnosis */}
                        <div className="rounded-lg bg-white p-6 shadow">
                            <h2 className="mb-4 text-lg font-semibold text-gray-900">Diagnosis</h2>
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Chief Complaint *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.chief_complaint}
                                        onChange={(e) => setFormData({ ...formData, chief_complaint: e.target.value })}
                                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="Fever, headache, cough"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Diagnosis *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.diagnosis}
                                        onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="Viral fever, Upper respiratory tract infection"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Clinical Notes</label>
                                    <textarea
                                        rows={4}
                                        value={formData.clinical_notes}
                                        onChange={(e) => setFormData({ ...formData, clinical_notes: e.target.value })}
                                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="Additional clinical observations and notes..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Medications */}
                        <div className="rounded-lg bg-white p-6 shadow">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-gray-900">Medications</h2>
                                <button
                                    type="button"
                                    onClick={addMedication}
                                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-500"
                                >
                                    <Plus className="h-4 w-4" />
                                    Add Medication
                                </button>
                            </div>

                            {medications.length === 0 ? (
                                <p className="text-center text-gray-500 py-8">No medications added yet</p>
                            ) : (
                                <div className="space-y-4">
                                    {medications.map((med, index) => (
                                        <div key={index} className="rounded-lg border border-gray-200 p-4">
                                            <div className="mb-3 flex items-center justify-between">
                                                <span className="text-sm font-medium text-gray-700">Medication {index + 1}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => removeMedication(index)}
                                                    className="text-red-600 hover:text-red-700"
                                                >
                                                    <X className="h-5 w-5" />
                                                </button>
                                            </div>

                                            <div className="grid gap-4 sm:grid-cols-2">
                                                <div className="sm:col-span-2">
                                                    <label className="block text-sm font-medium text-gray-700">Medicine Name</label>
                                                    <input
                                                        type="text"
                                                        value={med.name}
                                                        onChange={(e) => updateMedication(index, 'name', e.target.value)}
                                                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                        placeholder="Paracetamol"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Dosage</label>
                                                    <input
                                                        type="text"
                                                        value={med.dosage}
                                                        onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                                                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                        placeholder="500mg"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Frequency</label>
                                                    <input
                                                        type="text"
                                                        value={med.frequency}
                                                        onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                                                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                        placeholder="3 times a day"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Duration</label>
                                                    <input
                                                        type="text"
                                                        value={med.duration}
                                                        onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                                                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                        placeholder="5 days"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Instructions</label>
                                                    <input
                                                        type="text"
                                                        value={med.instructions}
                                                        onChange={(e) => updateMedication(index, 'instructions', e.target.value)}
                                                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                        placeholder="After meals"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Lab Tests */}
                        <div className="rounded-lg bg-white p-6 shadow">
                            <h2 className="mb-4 text-lg font-semibold text-gray-900">Lab Tests</h2>
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Recommended Tests (comma-separated)</label>
                                    <input
                                        type="text"
                                        value={formData.lab_tests}
                                        onChange={(e) => setFormData({ ...formData, lab_tests: e.target.value })}
                                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="CBC, Blood Sugar, Urine Test"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Lab Notes</label>
                                    <textarea
                                        rows={3}
                                        value={formData.lab_notes}
                                        onChange={(e) => setFormData({ ...formData, lab_notes: e.target.value })}
                                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="Special instructions for lab tests..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Follow-up */}
                        <div className="rounded-lg bg-white p-6 shadow">
                            <h2 className="mb-4 text-lg font-semibold text-gray-900">Follow-up</h2>
                            <div className="space-y-6">
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="follow_up_required"
                                        checked={formData.follow_up_required}
                                        onChange={(e) => setFormData({ ...formData, follow_up_required: e.target.checked })}
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <label htmlFor="follow_up_required" className="ml-2 block text-sm text-gray-900">
                                        Follow-up required
                                    </label>
                                </div>

                                {formData.follow_up_required && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Follow-up After (days)</label>
                                            <input
                                                type="number"
                                                value={formData.follow_up_days}
                                                onChange={(e) => setFormData({ ...formData, follow_up_days: e.target.value })}
                                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                placeholder="7"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Follow-up Notes</label>
                                            <textarea
                                                rows={3}
                                                value={formData.follow_up_notes}
                                                onChange={(e) => setFormData({ ...formData, follow_up_notes: e.target.value })}
                                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                placeholder="Reason for follow-up..."
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Form Actions */}
                        <div className="flex items-center justify-end gap-4">
                            <Link
                                href="/dashboard/prescriptions"
                                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={loading}
                                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Creating...' : 'Create Prescription'}
                            </button>
                        </div>
                    </>
                )}
            </form>
        </div>
    );
}
