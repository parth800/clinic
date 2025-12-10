'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { User as UserType, Clinic } from '@/types';
import toast from 'react-hot-toast';
import { Save, Building2, Clock, User } from 'lucide-react';

interface WorkingHours {
    [key: string]: {
        open: string;
        close: string;
        closed: boolean;
    };
}

export default function SettingsPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [clinicData, setClinicData] = useState({
        name: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        pincode: '',
        specialization: '',
        slot_duration: 15,
        slug: '',
    });

    const [workingHours, setWorkingHours] = useState<WorkingHours>({
        monday: { open: '09:00', close: '18:00', closed: false },
        tuesday: { open: '09:00', close: '18:00', closed: false },
        wednesday: { open: '09:00', close: '18:00', closed: false },
        thursday: { open: '09:00', close: '18:00', closed: false },
        friday: { open: '09:00', close: '18:00', closed: false },
        saturday: { open: '09:00', close: '14:00', closed: false },
        sunday: { open: '09:00', close: '18:00', closed: true },
    });

    const [userData, setUserData] = useState({
        full_name: '',
        phone: '',
        specialization: '',
    });

    useEffect(() => {
        async function fetchSettings() {
            try {
                if (!user?.id) return;

                // Get user's clinic_id
                const { data: userRecord } = await supabase
                    .from('users')
                    .select('*, clinic:clinics(*)')
                    .eq('id', user.id)
                    .single<UserType & { clinic: Clinic }>();

                if (!userRecord) return;

                // Set clinic data
                if (userRecord.clinic) {
                    setClinicData({
                        name: userRecord.clinic.name || '',
                        phone: userRecord.clinic.phone || '',
                        email: userRecord.clinic.email || '',
                        address: userRecord.clinic.address || '',
                        city: userRecord.clinic.city || '',
                        pincode: userRecord.clinic.pincode || '',
                        specialization: userRecord.clinic.specialization || '',
                        slot_duration: userRecord.clinic.slot_duration || 15,
                        slug: userRecord.clinic.slug || '',
                    });

                    // Set working hours if available, merge with defaults
                    if (userRecord.clinic.working_hours) {
                        const dbHours = userRecord.clinic.working_hours as any;
                        const defaultHours = {
                            monday: { open: '09:00', close: '18:00', closed: false },
                            tuesday: { open: '09:00', close: '18:00', closed: false },
                            wednesday: { open: '09:00', close: '18:00', closed: false },
                            thursday: { open: '09:00', close: '18:00', closed: false },
                            friday: { open: '09:00', close: '18:00', closed: false },
                            saturday: { open: '09:00', close: '14:00', closed: false },
                            sunday: { open: '09:00', close: '18:00', closed: true },
                        };

                        // Merge database hours with defaults to ensure no null values
                        const mergedHours: WorkingHours = {};
                        Object.keys(defaultHours).forEach(day => {
                            mergedHours[day] = {
                                open: dbHours[day]?.open || defaultHours[day as keyof typeof defaultHours].open,
                                close: dbHours[day]?.close || defaultHours[day as keyof typeof defaultHours].close,
                                closed: dbHours[day]?.closed ?? defaultHours[day as keyof typeof defaultHours].closed,
                            };
                        });

                        setWorkingHours(mergedHours);
                    }
                }

                // Set user data
                setUserData({
                    full_name: userRecord.full_name || '',
                    phone: userRecord.phone || '',
                    specialization: userRecord.specialization || '',
                });
            } catch (error) {
                console.error('Error fetching settings:', error);
                toast.error('Failed to load settings');
            }
        }

        if (user) {
            fetchSettings();
        }
    }, [user]);

    const handleClinicUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (!user?.id) {
                toast.error('User not authenticated');
                return;
            }

            const { data: userRecord } = await supabase
                .from('users')
                .select('clinic_id')
                .eq('id', user.id)
                .single<{ clinic_id: string }>();

            if (!userRecord) {
                toast.error('User not found');
                return;
            }

            const { error } = await supabase
                .from('clinics')
                // @ts-ignore
                .update({
                    name: clinicData.name,
                    phone: clinicData.phone,
                    email: clinicData.email,
                    address: clinicData.address,
                    city: clinicData.city,
                    pincode: clinicData.pincode,
                    specialization: clinicData.specialization,
                    slot_duration: clinicData.slot_duration,
                    working_hours: workingHours,
                } as any)
                .eq('id', userRecord.clinic_id);

            if (error) throw error;

            toast.success('Clinic settings updated successfully!');
        } catch (error: any) {
            console.error('Error updating clinic:', error);
            toast.error(error.message || 'Failed to update clinic settings');
        } finally {
            setLoading(false);
        }
    };

    const handleUserUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (!user?.id) {
                toast.error('User not authenticated');
                return;
            }

            const { error } = await supabase
                .from('users')
                // @ts-ignore
                .update({
                    full_name: userData.full_name,
                    phone: userData.phone,
                    specialization: userData.specialization,
                } as any)
                .eq('id', user.id);

            if (error) throw error;

            toast.success('Profile updated successfully!');
        } catch (error: any) {
            console.error('Error updating profile:', error);
            toast.error(error.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const updateWorkingHours = (day: string, field: 'open' | 'close' | 'closed', value: string | boolean) => {
        setWorkingHours({
            ...workingHours,
            [day]: {
                ...workingHours[day],
                [field]: value,
            },
        });
    };

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                <p className="mt-1 text-sm text-gray-600">
                    Manage your clinic profile and preferences
                </p>
            </div>

            {/* Booking Link */}
            <div className="rounded-lg bg-white p-6 shadow">
                <div className="mb-4 flex items-center gap-3">
                    <Building2 className="h-6 w-6 text-blue-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Patient Booking Link</h2>
                </div>
                <p className="mb-4 text-sm text-gray-600">
                    Share this link with your patients to let them book appointments online.
                </p>
                <div className="flex items-center gap-2">
                    <code className="flex-1 rounded bg-gray-100 p-3 text-sm text-gray-800">
                        {typeof window !== 'undefined' ? `${window.location.origin}/book/${clinicData.slug}` : `/book/${clinicData.slug}`}
                    </code>
                    <button
                        onClick={() => {
                            const url = `${window.location.origin}/book/${clinicData.slug}`;
                            navigator.clipboard.writeText(url);
                            toast.success('Link copied to clipboard!');
                        }}
                        className="rounded-lg bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-200"
                    >
                        Copy
                    </button>
                    <a
                        href={`/book/${clinicData.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Open
                    </a>
                </div>
            </div>

            {/* Clinic Information */}
            <form onSubmit={handleClinicUpdate} className="rounded-lg bg-white p-6 shadow">
                <div className="mb-6 flex items-center gap-3">
                    <Building2 className="h-6 w-6 text-blue-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Clinic Information</h2>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Clinic Name *</label>
                        <input
                            type="text"
                            required
                            value={clinicData.name}
                            onChange={(e) => setClinicData({ ...clinicData, name: e.target.value })}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Phone Number *</label>
                        <input
                            type="tel"
                            required
                            value={clinicData.phone}
                            onChange={(e) => setClinicData({ ...clinicData, phone: e.target.value })}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                            type="email"
                            value={clinicData.email}
                            onChange={(e) => setClinicData({ ...clinicData, email: e.target.value })}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Address</label>
                        <textarea
                            rows={2}
                            value={clinicData.address}
                            onChange={(e) => setClinicData({ ...clinicData, address: e.target.value })}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">City</label>
                        <input
                            type="text"
                            value={clinicData.city}
                            onChange={(e) => setClinicData({ ...clinicData, city: e.target.value })}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Pincode</label>
                        <input
                            type="text"
                            value={clinicData.pincode}
                            onChange={(e) => setClinicData({ ...clinicData, pincode: e.target.value })}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Specialization</label>
                        <input
                            type="text"
                            value={clinicData.specialization}
                            onChange={(e) => setClinicData({ ...clinicData, specialization: e.target.value })}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="General Physician"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Appointment Slot Duration (minutes)</label>
                        <select
                            value={clinicData.slot_duration}
                            onChange={(e) => setClinicData({ ...clinicData, slot_duration: parseInt(e.target.value) })}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <option value={10}>10 minutes</option>
                            <option value={15}>15 minutes</option>
                            <option value={20}>20 minutes</option>
                            <option value={30}>30 minutes</option>
                            <option value={45}>45 minutes</option>
                            <option value={60}>60 minutes</option>
                        </select>
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
                    >
                        <Save className="h-4 w-4" />
                        Save Clinic Settings
                    </button>
                </div>
            </form>

            {/* Working Hours */}
            <div className="rounded-lg bg-white p-6 shadow">
                <div className="mb-6 flex items-center gap-3">
                    <Clock className="h-6 w-6 text-blue-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Working Hours</h2>
                </div>

                <div className="space-y-4">
                    {days.map((day) => (
                        <div key={day} className="flex items-center gap-4">
                            <div className="w-32">
                                <span className="text-sm font-medium capitalize text-gray-700">{day}</span>
                            </div>

                            <div className="flex items-center gap-4">
                                <input
                                    type="checkbox"
                                    checked={!workingHours[day].closed}
                                    onChange={(e) => updateWorkingHours(day, 'closed', !e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-600">Open</span>
                            </div>

                            {!workingHours[day].closed && (
                                <>
                                    <input
                                        type="time"
                                        value={workingHours[day].open}
                                        onChange={(e) => updateWorkingHours(day, 'open', e.target.value)}
                                        className="rounded-md border border-gray-300 px-3 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-600">to</span>
                                    <input
                                        type="time"
                                        value={workingHours[day].close}
                                        onChange={(e) => updateWorkingHours(day, 'close', e.target.value)}
                                        className="rounded-md border border-gray-300 px-3 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </>
                            )}

                            {workingHours[day].closed && (
                                <span className="text-sm text-gray-500">Closed</span>
                            )}
                        </div>
                    ))}
                </div>

                <div className="mt-6 flex justify-end">
                    <button
                        onClick={handleClinicUpdate}
                        disabled={loading}
                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
                    >
                        <Save className="h-4 w-4" />
                        Save Working Hours
                    </button>
                </div>
            </div>

            {/* User Profile */}
            <form onSubmit={handleUserUpdate} className="rounded-lg bg-white p-6 shadow">
                <div className="mb-6 flex items-center gap-3">
                    <User className="h-6 w-6 text-blue-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Your Profile</h2>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Full Name *</label>
                        <input
                            type="text"
                            required
                            value={userData.full_name}
                            onChange={(e) => setUserData({ ...userData, full_name: e.target.value })}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Phone Number *</label>
                        <input
                            type="tel"
                            required
                            value={userData.phone}
                            onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Specialization</label>
                        <input
                            type="text"
                            value={userData.specialization}
                            onChange={(e) => setUserData({ ...userData, specialization: e.target.value })}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="General Physician, Cardiologist, etc."
                        />
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
                    >
                        <Save className="h-4 w-4" />
                        Save Profile
                    </button>
                </div>
            </form>
        </div>
    );
}
