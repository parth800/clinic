import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Read .env.local manually
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars: Record<string, string> = {};

envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, '');
        envVars[key] = value;
    }
});

const supabase = createClient(
    envVars['NEXT_PUBLIC_SUPABASE_URL']!,
    envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
);

async function updateUserRole() {
    // Get user email from command line
    const email = process.argv[2];
    const role = process.argv[3] || 'receptionist';

    if (!email) {
        console.error('Usage: npx ts-node scripts/update-user-role.ts <email> [role]');
        console.error('Example: npx ts-node scripts/update-user-role.ts user@example.com receptionist');
        process.exit(1);
    }

    // Find user by email
    const { data: user, error: findError } = await supabase
        .from('users')
        .select('id, email, role')
        .eq('email', email)
        .single();

    if (findError || !user) {
        console.error('User not found:', email);
        process.exit(1);
    }

    console.log('Current user:', user);

    // Update role
    const { error: updateError } = await supabase
        .from('users')
        .update({ role } as any)
        .eq('id', user.id);

    if (updateError) {
        console.error('Error updating role:', updateError);
        process.exit(1);
    }

    console.log(`✅ Successfully updated ${email} to role: ${role}`);
}

updateUserRole();
