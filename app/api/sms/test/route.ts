import { NextResponse } from 'next/server';
import { sendSMS, isValidPhoneNumber } from '@/lib/sms-service';

export async function POST(request: Request) {
    try {
        const { phone, message } = await request.json();

        if (!phone) {
            return NextResponse.json(
                { error: 'Phone number required' },
                { status: 400 }
            );
        }

        if (!isValidPhoneNumber(phone)) {
            return NextResponse.json(
                { error: 'Invalid phone number format' },
                { status: 400 }
            );
        }

        const testMessage = message || `Test SMS from ClinicFlow

This is a test message to verify SMS functionality.

If you received this, SMS integration is working correctly!

- ClinicFlow`;

        const success = await sendSMS({ phone, message: testMessage });

        if (success) {
            return NextResponse.json({
                success: true,
                message: 'Test SMS sent successfully',
                phone,
            });
        } else {
            return NextResponse.json(
                { error: 'Failed to send test SMS' },
                { status: 500 }
            );
        }
    } catch (error: any) {
        console.error('Error sending test SMS:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
