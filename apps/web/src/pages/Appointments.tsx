import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock, User } from 'lucide-react';

// Mock data for now
const appointments = [
    { id: 1, patient: 'John Doe', time: '09:00 AM', status: 'confirmed', type: 'Follow-up' },
    { id: 2, patient: 'Jane Smith', time: '09:30 AM', status: 'pending', type: 'New Visit' },
    { id: 3, patient: 'Mike Johnson', time: '10:00 AM', status: 'confirmed', type: 'Consultation' },
];

export default function Appointments() {
    const [selectedDate, setSelectedDate] = useState(new Date());

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Appointments</h1>
                <div className="flex items-center space-x-2">
                    <button className="px-4 py-2 bg-white border rounded shadow-sm hover:bg-gray-50">
                        Today
                    </button>
                    <input
                        type="date"
                        className="px-4 py-2 border rounded shadow-sm"
                        value={selectedDate.toISOString().split('T')[0]}
                        onChange={(e) => setSelectedDate(new Date(e.target.value))}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Time Slots / List */}
                <div className="lg:col-span-2 bg-white rounded-lg shadow overflow-hidden">
                    <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                        <h2 className="font-semibold text-gray-700">Schedule for {selectedDate.toDateString()}</h2>
                        <span className="text-sm text-gray-500">3 Appointments</span>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {appointments.map((apt) => (
                            <div key={apt.id} className="p-4 hover:bg-blue-50 transition-colors flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className="flex flex-col items-center justify-center w-16 h-16 bg-blue-100 text-blue-600 rounded-lg">
                                        <Clock className="w-5 h-5 mb-1" />
                                        <span className="text-xs font-bold">{apt.time}</span>
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-gray-900">{apt.patient}</h3>
                                        <p className="text-sm text-gray-500">{apt.type}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${apt.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {apt.status}
                                    </span>
                                    <button className="p-2 text-gray-400 hover:text-blue-600">
                                        <User className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {/* Empty slots visual */}
                        <div className="p-4 text-center text-gray-400 text-sm border-t border-dashed">
                            + Add Appointment to 10:30 AM
                        </div>
                    </div>
                </div>

                {/* Quick Actions / Stats */}
                <div className="space-y-6">
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="font-semibold text-gray-700 mb-4">Quick Actions</h3>
                        <button className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 mb-3">
                            New Appointment
                        </button>
                        <button className="w-full py-2 px-4 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50">
                            Block Time Slot
                        </button>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="font-semibold text-gray-700 mb-4">Stats</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Confirmed</span>
                                <span className="font-medium">12</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Pending</span>
                                <span className="font-medium">3</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Cancelled</span>
                                <span className="font-medium">1</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
