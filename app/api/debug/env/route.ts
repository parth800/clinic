import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        hasTwilioSid: !!process.env.TWILIO_ACCOUNT_SID,
        hasAuthToken: !!process.env.TWILIO_AUTH_TOKEN,
        hasNumber: !!process.env.TWILIO_WHATSAPP_NUMBER,
        sidPrefix: process.env.TWILIO_ACCOUNT_SID?.substring(0, 5),
    });
}
