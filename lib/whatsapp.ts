/**
 * WhatsApp Integration Utility
 * Handles sending WhatsApp messages for appointment reminders
 */

interface WhatsAppMessage {
    to: string;
    message: string;
}

interface AppointmentReminder {
    patientName: string;
    patientPhone: string;
    appointmentDate: string;
    appointmentTime: string;
    clinicName: string;
    tokenNumber: number;
}

/**
 * Send WhatsApp message using WhatsApp Business API
 * Note: You need to configure WhatsApp Business API credentials in .env.local
 */
export async function sendWhatsAppMessage({ to, message }: WhatsAppMessage): Promise<boolean> {
    try {
        // Format phone number (remove spaces, add country code if needed)
        const formattedPhone = formatPhoneNumber(to);

        // Using WhatsApp Business API (you'll need to set up credentials)
        const apiUrl = process.env.WHATSAPP_API_URL;
        const apiKey = process.env.WHATSAPP_API_KEY;

        if (!apiUrl || !apiKey) {
            console.warn('WhatsApp API credentials not configured');
            return false;
        }

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                to: formattedPhone,
                message: message,
            }),
        });

        if (!response.ok) {
            throw new Error(`WhatsApp API error: ${response.statusText}`);
        }

        console.log('WhatsApp message sent successfully to:', formattedPhone);
        return true;
    } catch (error) {
        console.error('Error sending WhatsApp message:', error);
        return false;
    }
}

/**
 * Send appointment reminder via WhatsApp
 */
export async function sendAppointmentReminder(reminder: AppointmentReminder): Promise<boolean> {
    const message = `
🏥 *${reminder.clinicName}*

Hello ${reminder.patientName},

This is a reminder for your upcoming appointment:

📅 Date: ${reminder.appointmentDate}
⏰ Time: ${reminder.appointmentTime}
🎫 Token Number: #${reminder.tokenNumber}

Please arrive 10 minutes before your scheduled time.

If you need to reschedule, please contact us.

Thank you!
  `.trim();

    return sendWhatsAppMessage({
        to: reminder.patientPhone,
        message,
    });
}

/**
 * Send appointment confirmation via WhatsApp
 */
export async function sendAppointmentConfirmation(reminder: AppointmentReminder): Promise<boolean> {
    const message = `
✅ *Appointment Confirmed*

Hello ${reminder.patientName},

Your appointment has been confirmed:

🏥 Clinic: ${reminder.clinicName}
📅 Date: ${reminder.appointmentDate}
⏰ Time: ${reminder.appointmentTime}
🎫 Token Number: #${reminder.tokenNumber}

We look forward to seeing you!
  `.trim();

    return sendWhatsAppMessage({
        to: reminder.patientPhone,
        message,
    });
}

/**
 * Format phone number for WhatsApp API
 * Adds country code if not present
 */
function formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');

    // Add India country code if not present
    if (!cleaned.startsWith('91') && cleaned.length === 10) {
        cleaned = '91' + cleaned;
    }

    return cleaned;
}

/**
 * Send bulk appointment reminders
 * Useful for daily reminder cron job
 */
export async function sendBulkReminders(reminders: AppointmentReminder[]): Promise<{
    sent: number;
    failed: number;
}> {
    let sent = 0;
    let failed = 0;

    for (const reminder of reminders) {
        const success = await sendAppointmentReminder(reminder);
        if (success) {
            sent++;
        } else {
            failed++;
        }

        // Add delay between messages to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return { sent, failed };
}
