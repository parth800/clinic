import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar, Clock, CheckCircle } from 'lucide-react';

export default function PublicBooking() {
    const { clinicId } = useParams();
    const [step, setStep] = useState(1); // 1: Date/Slot, 2: Details, 3: Success
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [formData, setFormData] = useState({ name: '', phone: '', reason: '' });

    // Mock slots
    const slots = ['09:00 AM', '09:15 AM', '09:30 AM', '10:00 AM', '10:15 AM'];

    const [otp, setOtp] = useState('');
    const [showOtp, setShowOtp] = useState(false);

    const handleSendOtp = (e: React.FormEvent) => {
        e.preventDefault();
        // Simulate sending OTP
        alert(`Mock OTP sent to ${formData.phone}: 123456`);
        setShowOtp(true);
    };

    const handleVerifyAndBook = (e: React.FormEvent) => {
        e.preventDefault();
        if (otp === '123456') {
            setStep(3);
        } else {
            alert('Invalid OTP. Please try again (use 123456).');
        }
    };

    if (step === 3) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
                    <p className="text-gray-600 mb-6">
                        Your appointment has been scheduled for {selectedDate.toDateString()} at {selectedSlot}.
                    </p>
                    <p className="text-sm text-gray-500">You will receive an SMS confirmation shortly.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md mx-auto bg-white rounded-lg shadow overflow-hidden">
                <div className="bg-blue-600 px-6 py-4">
                    <h1 className="text-xl font-bold text-white">Dr. Smith's Clinic</h1>
                    <p className="text-blue-100 text-sm">Book your appointment online (Clinic ID: {clinicId})</p>
                </div>

                <div className="p-6">
                    {step === 1 && (
                        <div>
                            <h2 className="text-lg font-semibold mb-4 flex items-center">
                                <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                                Select Date & Time
                            </h2>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                                <input
                                    type="date"
                                    className="w-full p-2 border rounded-md"
                                    value={selectedDate.toISOString().split('T')[0]}
                                    onChange={(e) => setSelectedDate(new Date(e.target.value))}
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Available Slots</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {slots.map((slot) => (
                                        <button
                                            key={slot}
                                            onClick={() => setSelectedSlot(slot)}
                                            className={`p-2 text-sm rounded border ${selectedSlot === slot
                                                ? 'bg-blue-600 text-white border-blue-600'
                                                : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
                                                }`}
                                        >
                                            {slot}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={() => setStep(2)}
                                disabled={!selectedSlot}
                                className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Continue
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <form onSubmit={showOtp ? handleVerifyAndBook : handleSendOtp}>
                            <h2 className="text-lg font-semibold mb-4">Your Details</h2>

                            <div className="bg-blue-50 p-3 rounded mb-6 text-sm text-blue-800 flex items-center">
                                <Clock className="w-4 h-4 mr-2" />
                                {selectedDate.toDateString()} at {selectedSlot}
                            </div>

                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        disabled={showOtp}
                                        className="mt-1 block w-full border rounded-md p-2 disabled:bg-gray-100"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                                    <input
                                        type="tel"
                                        required
                                        disabled={showOtp}
                                        className="mt-1 block w-full border rounded-md p-2 disabled:bg-gray-100"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                                {!showOtp && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Reason for Visit (Optional)</label>
                                        <textarea
                                            className="mt-1 block w-full border rounded-md p-2"
                                            rows={2}
                                            value={formData.reason}
                                            onChange={e => setFormData({ ...formData, reason: e.target.value })}
                                        />
                                    </div>
                                )}

                                {showOtp && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Enter OTP (123456)</label>
                                        <input
                                            type="text"
                                            required
                                            className="mt-1 block w-full border rounded-md p-2 border-blue-500 ring-1 ring-blue-500"
                                            value={otp}
                                            onChange={e => setOtp(e.target.value)}
                                            placeholder="6-digit code"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="flex space-x-3">
                                {!showOtp && (
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                                    >
                                        Back
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    className="flex-1 py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                    {showOtp ? 'Verify & Book' : 'Send OTP'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
