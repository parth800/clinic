/**
 * Twilio WhatsApp Integration (FREE Sandbox)
 * Simple implementation for testing WhatsApp notifications
 */

interface TwilioMessage {
    to: string;
    message: string;
}

/**
 * Send WhatsApp message using Twilio Sandbox (FREE)
 */
export async function sendTwilioWhatsApp({ to, message }: TwilioMessage): Promise<boolean> {
    try {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const twilioNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';

        console.log('Twilio Config Check:', {
            hasSid: !!accountSid,
            hasToken: !!authToken,
            hasNumber: !!twilioNumber,
            sidPrefix: accountSid?.substring(0, 5),
        });

        if (!accountSid || !authToken) {
            console.error('Twilio credentials not configured');
            return false;
        }

        // Format phone number for WhatsApp
        const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:+91${to.replace(/\D/g, '')}`;

        console.log('Sending WhatsApp:', {
            from: twilioNumber,
            to: formattedTo,
            messageLength: message.length,
        });

        // Twilio API endpoint
        const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

        // Create form data
        const params = new URLSearchParams();
        params.append('From', twilioNumber);
        params.append('To', formattedTo);
        params.append('Body', message);

        // Send request
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params,
        });

        const responseText = await response.text();
        console.log('Twilio Response Status:', response.status);
        console.log('Twilio Response:', responseText);

        if (!response.ok) {
            try {
                const error = JSON.parse(responseText);
                console.error('Twilio API error:', error);
            } catch (e) {
                console.error('Twilio API error (raw):', responseText);
            }
            return false;
        }

        const data = JSON.parse(responseText);
        console.log('✅ WhatsApp message sent successfully:', data.sid);
        return true;
    } catch (error) {
        console.error('❌ Error sending Twilio WhatsApp:', error);
        return false;
    }
}
