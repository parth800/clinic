import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendAppointmentConfirmation } from '@/lib/sms-service';
import { format } from 'date-fns';

export async function POST(request: Request) {
    try {
        const { appointmentId } = await request.json();

        if (!appointmentId) {
            return NextResponse.json(
                { error: 'Appointment ID required' },
                { status: 400 }
            );
        }

        // Fetch appointment with patient and clinic details
        const { data: appointment, error } = await supabase
            .from('appointments')
            .select(`
                *,
                patient:patients(full_name, phone),
                clinic:clinics(name)
            `)
            .eq('id', appointmentId)
            .single<any>();

        if (error || !appointment) {
            return NextResponse.json(
                { error: 'Appointment not found' },
                { status: 404 }
            );
        }

        // Send confirmation SMS
        const success = await sendAppointmentConfirmation(
            appointment.patient.phone,
            {
                patientName: appointment.patient.full_name,
                clinicName: appointment.clinic.name,
                appointmentDate: format(new Date(appointment.appointment_date), 'dd MMM yyyy'),
                appointmentTime: appointment.appointment_time,
                tokenNumber: appointment.token_number,
            }
        );

        if (success) {
            // Update appointment to mark confirmation SMS as sent
            await supabase
                .from('appointments')
                // @ts-ignore - Supabase type inference issue with new columns
                .update({
                    confirmation_sms_sent: true,
                    confirmation_sms_sent_at: new Date().toISOString(),
                })
                .eq('id', appointmentId);

            return NextResponse.json({
                success: true,
                message: 'Confirmation SMS sent successfully',
            });
        } else {
            return NextResponse.json(
                { error: 'Failed to send SMS' },
                { status: 500 }
            );
        }
    } catch (error: any) {
        console.error('Error sending confirmation SMS:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
