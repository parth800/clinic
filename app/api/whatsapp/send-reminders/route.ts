import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendAppointmentReminder } from '@/lib/whatsapp';

/**
 * API Route: Send Appointment Reminders
 * POST /api/whatsapp/send-reminders
 * 
 * This endpoint sends WhatsApp reminders for appointments scheduled for tomorrow
 * Can be called manually or via a cron job
 */
export async function POST(request: Request) {
    try {
        // Verify authorization (optional: add API key check)
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Initialize Supabase client with service role key
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Get tomorrow's date
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowDate = tomorrow.toISOString().split('T')[0];

        // Fetch appointments for tomorrow
        const { data: appointments, error } = await supabase
            .from('appointments')
            .select(`
        *,
        patient:patients(*),
        clinic:clinics(*)
      `)
            .eq('appointment_date', tomorrowDate)
            .in('status', ['scheduled', 'confirmed'])
            .is('deleted_at', null);

        if (error) {
            throw error;
        }

        if (!appointments || appointments.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No appointments found for tomorrow',
                sent: 0,
            });
        }

        // Send reminders
        let sent = 0;
        let failed = 0;

        for (const appointment of appointments) {
            try {
                const success = await sendAppointmentReminder({
                    patientName: appointment.patient.full_name,
                    patientPhone: appointment.patient.phone,
                    appointmentDate: new Date(appointment.appointment_date).toLocaleDateString('en-IN', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                    }),
                    appointmentTime: appointment.appointment_time,
                    clinicName: appointment.clinic.name,
                    tokenNumber: appointment.token_number,
                });

                if (success) {
                    sent++;

                    // Update appointment to mark reminder sent
                    await supabase
                        .from('appointments')
                        .update({ reminder_sent: true })
                        .eq('id', appointment.id);
                } else {
                    failed++;
                }

                // Add delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
                console.error('Error sending reminder for appointment:', appointment.id, error);
                failed++;
            }
        }

        return NextResponse.json({
            success: true,
            message: `Sent ${sent} reminders, ${failed} failed`,
            sent,
            failed,
            total: appointments.length,
        });
    } catch (error: any) {
        console.error('Error in send-reminders API:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to send reminders' },
            { status: 500 }
        );
    }
}
