'use client';

import { useState } from 'react';
import { Send, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function WhatsAppTestPage() {
    const [loading, setLoading] = useState(false);
    const [testData, setTestData] = useState({
        patientName: 'John Doe',
        patientPhone: '9876543210',
        appointmentDate: 'Monday, 11 December 2025',
        appointmentTime: '10:00 AM',
        clinicName: 'HealthCare Clinic',
        tokenNumber: 1,
    });
    const [result, setResult] = useState<any>(null);

    const testAppointmentConfirmation = async () => {
        setLoading(true);
        setResult(null);

        try {
            const message = `
✅ *Appointment Confirmed*

Hello ${testData.patientName},

Your appointment has been confirmed:

🏥 Clinic: ${testData.clinicName}
📅 Date: ${testData.appointmentDate}
⏰ Time: ${testData.appointmentTime}
🎫 Token Number: #${testData.tokenNumber}

We look forward to seeing you!
      `.trim();

            // Try to send via MSG91
            const response = await fetch('/api/whatsapp/test-msg91', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: testData.patientPhone,
                    message,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setResult({
                    success: true,
                    message: 'WhatsApp message sent successfully via MSG91!',
                    preview: message,
                    phone: `+91${testData.patientPhone}`,
                });
                toast.success('WhatsApp message sent!');
            } else {
                setResult({
                    success: false,
                    error: data.error || 'Failed to send message',
                });
                toast.error('Failed to send message');
            }
            setLoading(false);
        } catch (error: any) {
            console.error('Error:', error);
            setResult({
                success: false,
                error: error.message,
            });
            toast.error('Error sending message');
            setLoading(false);
        }
    };

    const testAppointmentReminder = async () => {
        setLoading(true);
        setResult(null);

        try {
            const message = `
🏥 *${testData.clinicName}*

Hello ${testData.patientName},

This is a reminder for your upcoming appointment:

📅 Date: ${testData.appointmentDate}
⏰ Time: ${testData.appointmentTime}
🎫 Token Number: #${testData.tokenNumber}

Please arrive 10 minutes before your scheduled time.

If you need to reschedule, please contact us.

Thank you!
      `.trim();

            // Simulate for now
            setTimeout(() => {
                setResult({
                    success: true,
                    message: 'WhatsApp API not configured - Simulation Mode',
                    preview: message,
                    phone: `+91${testData.patientPhone}`,
                });
                toast.success('Test reminder generated! (Simulation Mode)');
                setLoading(false);
            }, 1000);
        } catch (error: any) {
            console.error('Error:', error);
            setResult({
                success: false,
                error: error.message,
            });
            toast.error('Error generating reminder');
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">WhatsApp Integration Test</h1>
                <p className="mt-1 text-sm text-gray-600">
                    Test WhatsApp notifications before going live
                </p>
            </div>

            {/* Configuration Status */}
            <div className="rounded-lg bg-white p-6 shadow">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">Configuration Status</h2>

                <div className="rounded-lg bg-green-50 p-4">
                    <div className="flex gap-3">
                        <AlertCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-green-800">✅ Simulation Mode Active</p>
                            <p className="mt-1 text-sm text-green-700">
                                WhatsApp integration is working in <strong>simulation mode</strong>. Messages are previewed but not actually sent.
                            </p>
                            <p className="mt-2 text-xs text-green-600">
                                Perfect for testing, training, and development. When ready for production, configure MSG91 credentials to send real messages.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            {/* Test Data */}
            <div className="rounded-lg bg-white p-6 shadow">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">Test Data</h2>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Patient Name</label>
                        <input
                            type="text"
                            value={testData.patientName}
                            onChange={(e) => setTestData({ ...testData, patientName: e.target.value })}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                        <input
                            type="tel"
                            value={testData.patientPhone}
                            onChange={(e) => setTestData({ ...testData, patientPhone: e.target.value })}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="9876543210"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Clinic Name</label>
                        <input
                            type="text"
                            value={testData.clinicName}
                            onChange={(e) => setTestData({ ...testData, clinicName: e.target.value })}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Token Number</label>
                        <input
                            type="number"
                            value={testData.tokenNumber}
                            onChange={(e) => setTestData({ ...testData, tokenNumber: parseInt(e.target.value) })}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Appointment Date</label>
                        <input
                            type="text"
                            value={testData.appointmentDate}
                            onChange={(e) => setTestData({ ...testData, appointmentDate: e.target.value })}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Appointment Time</label>
                        <input
                            type="text"
                            value={testData.appointmentTime}
                            onChange={(e) => setTestData({ ...testData, appointmentTime: e.target.value })}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>
                </div>
            </div>

            {/* Test Actions */}
            <div className="rounded-lg bg-white p-6 shadow">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">Test Messages</h2>

                <div className="flex flex-wrap gap-4">
                    <button
                        onClick={testAppointmentConfirmation}
                        disabled={loading}
                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
                    >
                        <Send className="h-4 w-4" />
                        Test Appointment Confirmation
                    </button>

                    <button
                        onClick={testAppointmentReminder}
                        disabled={loading}
                        className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500 disabled:opacity-50"
                    >
                        <Send className="h-4 w-4" />
                        Test Appointment Reminder
                    </button>
                </div>
            </div>

            {/* Result */}
            {result && (
                <div className="rounded-lg bg-white p-6 shadow">
                    <h2 className="mb-4 text-lg font-semibold text-gray-900">Result</h2>

                    {result.success ? (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-green-600">
                                <CheckCircle className="h-6 w-6" />
                                <span className="font-semibold">{result.message}</span>
                            </div>

                            {result.preview && (
                                <div>
                                    <p className="mb-2 text-sm font-medium text-gray-700">Message Preview:</p>
                                    <div className="rounded-lg bg-gray-50 p-4">
                                        <pre className="whitespace-pre-wrap text-sm text-gray-900">{result.preview}</pre>
                                    </div>
                                </div>
                            )}

                            {result.phone && (
                                <div>
                                    <p className="text-sm text-gray-600">
                                        Would be sent to: <span className="font-semibold">{result.phone}</span>
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 text-red-600">
                            <XCircle className="h-6 w-6" />
                            <span className="font-semibold">Error: {result.error || 'Failed to send message'}</span>
                        </div>
                    )}
                </div>
            )}

            {/* Setup Instructions */}
            <div className="rounded-lg bg-blue-50 p-6">
                <h3 className="mb-3 text-lg font-semibold text-blue-900">Setup Instructions</h3>
                <ol className="list-decimal space-y-2 pl-5 text-sm text-blue-800">
                    <li>Choose a WhatsApp provider (Twilio, MSG91, or WhatsApp Business API)</li>
                    <li>Sign up and get your API credentials</li>
                    <li>Add credentials to <code className="rounded bg-blue-100 px-1">.env.local</code></li>
                    <li>Restart the development server</li>
                    <li>Test again with real phone number</li>
                </ol>
                <p className="mt-3 text-sm text-blue-700">
                    See <code className="rounded bg-blue-100 px-1">whatsapp_setup_guide.md</code> for detailed instructions.
                </p>
            </div>
        </div>
    );
}
