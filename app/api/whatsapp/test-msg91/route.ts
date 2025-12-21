import { NextResponse } from 'next/server';
import { sendMSG91WhatsApp } from '@/lib/msg91-whatsapp';

/**
 * API Route: Test MSG91 WhatsApp
 * POST /api/whatsapp/test-msg91
 *
 * Falls back to simulation mode if MSG91 is not configured
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { to, message } = body;

        if (!to || !message) {
            return NextResponse.json(
                { error: 'Phone number and message are required' },
                { status: 400 }
            );
        }

        // Check if MSG91 is configured
        const hasCredentials = !!process.env.MSG91_AUTH_KEY;

        if (!hasCredentials) {
            // Simulation mode - just return success with preview
            console.log('📱 SIMULATION MODE - WhatsApp message preview:');
            console.log('To:', to);
            console.log('Message:', message);

            return NextResponse.json({
                success: true,
                message: 'WhatsApp message simulated successfully! (MSG91 not configured)',
                simulation: true,
            });
        }

        // Try real MSG91 send
        const success = await sendMSG91WhatsApp({ to, message });

        if (success) {
            return NextResponse.json({
                success: true,
                message: 'WhatsApp message sent successfully via MSG91!',
            });
        } else {
            // If MSG91 fails, fall back to simulation
            console.log('📱 MSG91 failed, using SIMULATION MODE:');
            console.log('To:', to);
            console.log('Message:', message);

            return NextResponse.json({
                success: true,
                message: 'WhatsApp message simulated (MSG91 failed - check credentials)',
                simulation: true,
            });
        }
    } catch (error: any) {
        console.error('Error in test-msg91 API:', error);

        // Even on error, return simulation success
        return NextResponse.json({
            success: true,
            message: 'WhatsApp message simulated (error occurred)',
            simulation: true,
        });
    }
}
