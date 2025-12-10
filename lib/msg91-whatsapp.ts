/**
 * MSG91 WhatsApp Integration
 * Production-ready WhatsApp API for India
 * No sandbox required - works with any phone number!
 */

interface MSG91Message {
    to: string;
    message: string;
}

/**
 * Send WhatsApp message using MSG91
 * Cost: ~₹0.10-0.25 per message
 */
export async function sendMSG91WhatsApp({ to, message }: MSG91Message): Promise<boolean> {
    try {
        const authKey = process.env.MSG91_AUTH_KEY;
        const senderId = process.env.MSG91_SENDER_ID || 'MSGIND';

        console.log('MSG91 Config Check:', {
            hasAuthKey: !!authKey,
            hasSenderId: !!senderId,
        });

        if (!authKey) {
            console.error('MSG91 Auth Key not configured');
            return false;
        }

        // Format phone number (remove +91 if present, MSG91 adds it)
        const formattedPhone = to.replace(/\D/g, '').replace(/^91/, '');

        console.log('Sending WhatsApp via MSG91:', {
            to: formattedPhone,
            messageLength: message.length,
        });

        // MSG91 WhatsApp API endpoint
        const url = 'https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/';

        const payload = {
            integrated_number: senderId,
            content_type: 'text',
            payload: {
                messaging_product: 'whatsapp',
                type: 'text',
                text: {
                    body: message,
                },
            },
            recipient_whatsapp: formattedPhone,
        };

        console.log('MSG91 Request:', { url, to: formattedPhone });

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'authkey': authKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const responseText = await response.text();
        console.log('MSG91 Response Status:', response.status);
        console.log('MSG91 Response:', responseText);

        if (!response.ok) {
            try {
                const error = JSON.parse(responseText);
                console.error('MSG91 API error:', error);
            } catch (e) {
                console.error('MSG91 API error (raw):', responseText);
            }
            return false;
        }

        const data = JSON.parse(responseText);
        console.log('✅ WhatsApp message sent successfully via MSG91');
        return true;
    } catch (error) {
        console.error('❌ Error sending MSG91 WhatsApp:', error);
        return false;
    }
}
