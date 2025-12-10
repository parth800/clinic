'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { generateSlug } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function RegisterPage() {
    const router = useRouter();
    const { signUp } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        clinicName: '',
        doctorName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        city: 'Ahmedabad',
        specialization: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Validation
            if (formData.password !== formData.confirmPassword) {
                toast.error('Passwords do not match');
                setLoading(false);
                return;
            }

            if (formData.password.length < 6) {
                toast.error('Password must be at least 6 characters');
                setLoading(false);
                return;
            }

            console.log('Starting registration for:', formData.email);

            // Create user account with email confirmation disabled
            const { data: authData, error: signUpError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.doctorName,
                        phone: formData.phone,
                    },
                    emailRedirectTo: undefined, // Disable email confirmation
                },
            });

            if (signUpError) {
                console.error('SignUp error:', signUpError);
                toast.error(signUpError.message || 'Failed to create account');
                setLoading(false);
                return;
            }

            console.log('Auth user created:', authData.user?.id);

            if (!authData.user) {
                toast.error('Failed to create user account');
                setLoading(false);
                return;
            }

            // Create clinic record
            const slug = generateSlug(formData.clinicName);
            console.log('Creating clinic with slug:', slug);

            const { data: clinic, error: clinicError } = await supabase
                .from('clinics')
                .insert({
                    name: formData.clinicName,
                    slug,
                    phone: formData.phone,
                    email: formData.email,
                    city: formData.city,
                    specialization: formData.specialization,
                    subscription_plan: 'trial',
                    subscription_status: 'active',
                    subscription_start_date: new Date().toISOString(),
                })
                .select()
                .single();

            if (clinicError) {
                console.error('Clinic creation error:', clinicError);
                toast.error('Failed to create clinic: ' + clinicError.message);
                setLoading(false);
                return;
            }

            console.log('Clinic created:', clinic.id);

            // Create user record linked to clinic
            const { error: userError } = await supabase
                .from('users')
                .insert({
                    id: authData.user.id,
                    clinic_id: clinic.id,
                    full_name: formData.doctorName,
                    email: formData.email,
                    phone: formData.phone,
                    role: 'admin',
                    specialization: formData.specialization,
                    permissions: {
                        manage_appointments: true,
                        manage_patients: true,
                        manage_prescriptions: true,
                        manage_billing: true,
                        manage_settings: true,
                    },
                });

            if (userError) {
                console.error('User profile creation error:', userError);
                toast.error('Failed to create user profile: ' + userError.message);
                setLoading(false);
                return;
            }

            console.log('User profile created successfully');
            toast.success('Account created successfully! You can now login.');

            // Redirect to login page
            router.push('/login');
        } catch (error: any) {
            console.error('Unexpected error during registration:', error);
            toast.error(error.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
                        Register Your Clinic
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Start managing your clinic digitally
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4 rounded-md shadow-sm">
                        <div>
                            <label htmlFor="clinicName" className="block text-sm font-medium text-gray-700">
                                Clinic Name *
                            </label>
                            <input
                                id="clinicName"
                                name="clinicName"
                                type="text"
                                required
                                value={formData.clinicName}
                                onChange={(e) => setFormData({ ...formData, clinicName: e.target.value })}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                                placeholder="Dr. Sharma Clinic"
                            />
                        </div>

                        <div>
                            <label htmlFor="doctorName" className="block text-sm font-medium text-gray-700">
                                Doctor Name *
                            </label>
                            <input
                                id="doctorName"
                                name="doctorName"
                                type="text"
                                required
                                value={formData.doctorName}
                                onChange={(e) => setFormData({ ...formData, doctorName: e.target.value })}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                                placeholder="Dr. Rajesh Sharma"
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email Address *
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                                placeholder="doctor@example.com"
                            />
                        </div>

                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                                Phone Number *
                            </label>
                            <input
                                id="phone"
                                name="phone"
                                type="tel"
                                required
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                                placeholder="9876543210"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                                    City
                                </label>
                                <input
                                    id="city"
                                    name="city"
                                    type="text"
                                    value={formData.city}
                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                                />
                            </div>

                            <div>
                                <label htmlFor="specialization" className="block text-sm font-medium text-gray-700">
                                    Specialization
                                </label>
                                <input
                                    id="specialization"
                                    name="specialization"
                                    type="text"
                                    value={formData.specialization}
                                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                                    placeholder="General Physician"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Password *
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="new-password"
                                required
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                                placeholder="••••••••"
                            />
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                                Confirm Password *
                            </label>
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                autoComplete="new-password"
                                required
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Creating account...
                                </span>
                            ) : (
                                'Create Account'
                            )}
                        </button>
                    </div>

                    <div className="text-center text-sm">
                        <span className="text-gray-600">Already have an account? </span>
                        <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                            Sign in
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
