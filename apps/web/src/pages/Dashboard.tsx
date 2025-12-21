
export default function Dashboard() {
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium">Today's Appointments</h3>
                    <p className="text-3xl font-bold text-gray-900 mt-2">12</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium">Pending Requests</h3>
                    <p className="text-3xl font-bold text-gray-900 mt-2">4</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium">Total Patients</h3>
                    <p className="text-3xl font-bold text-gray-900 mt-2">1,234</p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="flex items-center justify-between bg-blue-50 p-4 rounded-md border border-blue-100">
                    <div>
                        <h4 className="font-medium text-blue-900">Public Booking Link</h4>
                        <p className="text-sm text-blue-700 mt-1">Share this link with patients to let them book online.</p>
                    </div>
                    <a
                        href="/book/123"
                        target="_blank"
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
                    >
                        Open Booking Page
                    </a>
                </div>
            </div>
        </div>
    );
}
