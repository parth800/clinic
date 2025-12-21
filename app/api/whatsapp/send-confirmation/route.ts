import { NextResponse } from 'next/server';
import { sendAppointmentConfirmation } from '@/lib/whatsapp';
import { createClient } from '@supabase/supabase-js';

/**
 * API Route: Send Appointment Confirmation
 * POST /api/whatsapp/send-confirmation
 * 
 * Sends a WhatsApp confirmation message when an appointment is booked
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { appointmentId } = body;

        if (!appointmentId) {
            return NextResponse.json(
                { error: 'Appointment ID is required' },
                { status: 400 }
            );
        }

        // Initialize Supabase client
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Fetch appointment details
        const { data: appointment, error } = await supabase
            .from('appointments')
            .select(`
        *,
        patient:patients(*),
        clinic:clinics(*)
      `)
            .eq('id', appointmentId)
            .single();

        if (error || !appointment) {
            return NextResponse.json(
                { error: 'Appointment not found' },
                { status: 404 }
            );
        }

        // Send confirmation
        const success = await sendAppointmentConfirmation({
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
            return NextResponse.json({
                success: true,
                message: 'Confirmation sent successfully',
            });
        } else {
            return NextResponse.json(
                { error: 'Failed to send confirmation' },
                { status: 500 }
            );
        }
    } catch (error: any) {
        console.error('Error in send-confirmation API:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to send confirmation' },
            { status: 500 }
        );
    }
}
