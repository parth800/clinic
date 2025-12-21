import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { send24HourReminder, send1HourReminder } from '@/lib/sms-service';
import { format, addHours, addDays, isWithinInterval, subMinutes } from 'date-fns';

export async function GET() {
    try {
        const now = new Date();

        // Calculate time windows
        const twentyFourHoursFromNow = addDays(now, 1);
        const oneHourFromNow = addHours(now, 1);

        // Fetch appointments for 24-hour reminders
        const { data: appointments24h } = await supabase
            .from('appointments')
            .select(`
                *,
                patient:patients(full_name, phone),
                clinic:clinics(name)
            `)
            .eq('reminder_24h_sent', false)
            .gte('appointment_date', format(twentyFourHoursFromNow, 'yyyy-MM-dd'))
            .lte('appointment_date', format(addDays(twentyFourHoursFromNow, 1), 'yyyy-MM-dd'))
            .in('status', ['scheduled', 'confirmed'])
            .is('deleted_at', null)
            .returns<any[]>();

        // Fetch appointments for 1-hour reminders
        const { data: appointments1h } = await supabase
            .from('appointments')
            .select(`
                *,
                patient:patients(full_name, phone),
                clinic:clinics(name)
            `)
            .eq('reminder_1h_sent', false)
            .eq('appointment_date', format(now, 'yyyy-MM-dd'))
            .in('status', ['scheduled', 'confirmed', 'checked_in'])
            .is('deleted_at', null)
            .returns<any[]>();

        let sent24h = 0;
        let sent1h = 0;
        const errors: string[] = [];

        // Send 24-hour reminders
        if (appointments24h && appointments24h.length > 0) {
            for (const appointment of appointments24h) {
                try {
                    const appointmentDateTime = new Date(
                        `${appointment.appointment_date}T${appointment.appointment_time}`
                    );

                    // Check if appointment is approximately 24 hours away (±1 hour window)
                    const isIn24HourWindow = isWithinInterval(appointmentDateTime, {
                        start: subMinutes(twentyFourHoursFromNow, 60),
                        end: addHours(twentyFourHoursFromNow, 1),
                    });

                    if (isIn24HourWindow) {
                        const success = await send24HourReminder(
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
                            await supabase
                                .from('appointments')
                                // @ts-ignore - Supabase type inference issue
                                .update({
                                    reminder_24h_sent: true,
                                    reminder_24h_sent_at: new Date().toISOString(),
                                })
                                .eq('id', appointment.id);
                            sent24h++;
                        }
                    }
                } catch (error: any) {
                    errors.push(`24h reminder failed for appointment ${appointment.id}: ${error.message}`);
                }
            }
        }

        // Send 1-hour reminders
        if (appointments1h && appointments1h.length > 0) {
            for (const appointment of appointments1h) {
                try {
                    const appointmentDateTime = new Date(
                        `${appointment.appointment_date}T${appointment.appointment_time}`
                    );

                    // Check if appointment is approximately 1 hour away (±15 min window)
                    const isIn1HourWindow = isWithinInterval(appointmentDateTime, {
                        start: subMinutes(oneHourFromNow, 15),
                        end: addHours(oneHourFromNow, 0.25), // 15 minutes after
                    });

                    if (isIn1HourWindow) {
                        const success = await send1HourReminder(
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
                            await supabase
                                .from('appointments')
                                // @ts-ignore - Supabase type inference issue
                                .update({
                                    reminder_1h_sent: true,
                                    reminder_1h_sent_at: new Date().toISOString(),
                                })
                                .eq('id', appointment.id);
                            sent1h++;
                        }
                    }
                } catch (error: any) {
                    errors.push(`1h reminder failed for appointment ${appointment.id}: ${error.message}`);
                }
            }
        }

        return NextResponse.json({
            success: true,
            sent24h,
            sent1h,
            errors: errors.length > 0 ? errors : undefined,
            timestamp: new Date().toISOString(),
        });
    } catch (error: any) {
        console.error('Error in reminder cron job:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
