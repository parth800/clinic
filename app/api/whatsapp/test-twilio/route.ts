import { NextResponse } from 'next/server';
import { sendTwilioWhatsApp } from '@/lib/twilio-whatsapp';

/**
 * API Route: Test Twilio WhatsApp
 * POST /api/whatsapp/test-twilio
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

        const success = await sendTwilioWhatsApp({ to, message });

        if (success) {
            return NextResponse.json({
                success: true,
                message: 'WhatsApp message sent successfully via Twilio!',
            });
        } else {
            return NextResponse.json(
                { error: 'Failed to send WhatsApp message' },
                { status: 500 }
            );
        }
    } catch (error: any) {
        console.error('Error in test-twilio API:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to send message' },
            { status: 500 }
        );
    }
}
