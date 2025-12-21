import { supabase } from './supabase';
import { supabase } from './supabase';

// For now, we'll use 'any' for types until we generate Supabase types
export type Patient = {
    id: string;
    full_name: string;
    phone: string;
    age: number | null;
    gender: string | null;
    clinic_id: string;
    created_at: string;
};

export const api = {
    patients: {
        list: async () => {
            const { data, error } = await supabase
                .from('patients')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as Patient[];
        },
        create: async (patient: Omit<Patient, 'id' | 'created_at' | 'clinic_id'>) => {
            // We rely on RLS and default values for clinic_id (trigger or default? 
            // Wait, my schema doesn't default clinic_id. I need to fetch it or let RLS handle it?
            // RLS 'with check' ensures I can only insert my clinic_id.
            // But I need to provide it in the insert statement usually, unless I have a trigger.
            // For MVP, let's fetch the user's clinic_id first or store it in session.

            // Better approach: Get current user's profile to find clinic_id
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data: profile } = await supabase
                .from('profiles')
                .select('clinic_id')
                .eq('id', user.id)
                .single();

            if (!profile) throw new Error('Profile not found');

            const { data, error } = await supabase
                .from('patients')
                .insert([{ ...patient, clinic_id: profile.clinic_id }])
                .select()
                .single();

            if (error) throw error;
            return data as Patient;
        },
    },
};
