import axios from 'axios';

const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY;
const MSG91_SENDER_ID = process.env.MSG91_SENDER_ID || 'CLINIC';

interface SMSParams {
    phone: string;
    message: string;
}

interface AppointmentDetails {
    patientName: string;
    clinicName: string;
    appointmentDate: string;
    appointmentTime: string;
    tokenNumber?: number;
}

/**
 * Send SMS using MSG91
 */
export async function sendSMS({ phone, message }: SMSParams): Promise<boolean> {
    if (!MSG91_AUTH_KEY) {
        console.error('MSG91_AUTH_KEY not configured');
        return false;
    }

    try {
        // Format phone number (remove +91 if present, MSG91 adds it)
        const formattedPhone = phone.replace(/^\+91/, '').replace(/\s/g, '');

        const response = await axios.post(
            'https://api.msg91.com/api/v5/flow/',
            {
                sender: MSG91_SENDER_ID,
                route: '4', // Transactional route
                country: '91',
                sms: [
                    {
                        message,
                        to: [formattedPhone]
                    }
                ]
            },
            {
                headers: {
                    'authkey': MSG91_AUTH_KEY,
                    'content-type': 'application/json'
                }
            }
        );

        console.log('SMS sent successfully:', response.data);
        return true;
    } catch (error: any) {
        console.error('Error sending SMS:', error.response?.data || error.message);
        return false;
    }
}

/**
 * Send appointment confirmation SMS
 */
export async function sendAppointmentConfirmation(
    phone: string,
    details: AppointmentDetails
): Promise<boolean> {
    const message = `Dear ${details.patientName},

Your appointment at ${details.clinicName} is confirmed!

Date: ${details.appointmentDate}
Time: ${details.appointmentTime}
${details.tokenNumber ? `Token: ${details.tokenNumber}` : ''}

Please arrive 10 minutes early.

- ClinicFlow`;

    return sendSMS({ phone, message });
}

/**
 * Send 24-hour reminder SMS
 */
export async function send24HourReminder(
    phone: string,
    details: AppointmentDetails
): Promise<boolean> {
    const message = `Reminder: ${details.patientName}

Your appointment at ${details.clinicName} is tomorrow!

Date: ${details.appointmentDate}
Time: ${details.appointmentTime}
${details.tokenNumber ? `Token: ${details.tokenNumber}` : ''}

See you soon!

- ClinicFlow`;

    return sendSMS({ phone, message });
}

/**
 * Send 1-hour reminder SMS
 */
export async function send1HourReminder(
    phone: string,
    details: AppointmentDetails
): Promise<boolean> {
    const message = `Reminder: ${details.patientName}

Your appointment at ${details.clinicName} is in 1 hour!

Time: ${details.appointmentTime}
${details.tokenNumber ? `Token: ${details.tokenNumber}` : ''}

Please arrive on time.

- ClinicFlow`;

    return sendSMS({ phone, message });
}

/**
 * Send cancellation notification SMS
 */
export async function sendCancellationNotification(
    phone: string,
    details: AppointmentDetails
): Promise<boolean> {
    const message = `Dear ${details.patientName},

Your appointment at ${details.clinicName} on ${details.appointmentDate} at ${details.appointmentTime} has been cancelled.

Please contact us to reschedule.

- ClinicFlow`;

    return sendSMS({ phone, message });
}

/**
 * Send rescheduling notification SMS
 */
export async function sendRescheduleNotification(
    phone: string,
    details: AppointmentDetails,
    oldDate: string,
    oldTime: string
): Promise<boolean> {
    const message = `Dear ${details.patientName},

Your appointment at ${details.clinicName} has been rescheduled.

Old: ${oldDate} at ${oldTime}
New: ${details.appointmentDate} at ${details.appointmentTime}

See you then!

- ClinicFlow`;

    return sendSMS({ phone, message });
}

/**
 * Validate phone number format
 */
export function isValidPhoneNumber(phone: string): boolean {
    // Indian phone number: 10 digits, optionally starting with +91
    const phoneRegex = /^(\+91)?[6-9]\d{9}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
        return `+91 ${cleaned}`;
    }
    return phone;
}
