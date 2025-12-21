import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Read .env.local manually since dotenv is not installed
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars: Record<string, string> = {};

envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, ''); // Remove quotes
        envVars[key] = value;
    }
});

const supabase = createClient(
    envVars['NEXT_PUBLIC_SUPABASE_URL']!,
    envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
);

async function checkData() {
    // Check Clinics
    const { data: clinics } = await supabase
        .from('clinics')
        .select('id, name, slug');

    console.log('\nClinics:');
    clinics?.forEach(c => console.log(`- ${c.name} (${c.slug}): ${c.id}`));

    // Check Users
    const { data: users } = await supabase
        .from('users')
        .select('id, full_name, email, clinic_id');

    console.log('\nUsers:');
    users?.forEach(u => console.log(`- ${u.full_name} (${u.email}): Clinic ${u.clinic_id}`));

    // Check Appointments again with clinic name
    const { data: appointments } = await supabase
        .from('appointments')
        .select(`
            *,
            patient:patients(full_name),
            clinic:clinics(name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

    console.log('\nLatest 5 Appointments:');
    appointments?.forEach(apt => {
        console.log(`- Patient: ${apt.patient?.full_name}`);
        console.log(`  Clinic: ${apt.clinic?.name} (${apt.clinic_id})`);
        console.log(`  Date: ${apt.appointment_date}`);
        console.log('---');
    });
}

checkData();
