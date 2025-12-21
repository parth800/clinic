import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LayoutDashboard, Users, Calendar, Settings, LogOut } from 'lucide-react';

export default function Layout() {
    const navigate = useNavigate();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <aside className="w-64 bg-white shadow-md">
                <div className="p-6">
                    <h1 className="text-2xl font-bold text-blue-600">ClinicFlow</h1>
                </div>
                <nav className="mt-6">
                    <Link
                        to="/"
                        className="flex items-center px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                    >
                        <LayoutDashboard className="w-5 h-5 mr-3" />
                        Dashboard
                    </Link>
                    <Link
                        to="/patients"
                        className="flex items-center px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                    >
                        <Users className="w-5 h-5 mr-3" />
                        Patients
                    </Link>
                    <Link
                        to="/appointments"
                        className="flex items-center px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                    >
                        <Calendar className="w-5 h-5 mr-3" />
                        Appointments
                    </Link>
                    <Link
                        to="/settings"
                        className="flex items-center px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                    >
                        <Settings className="w-5 h-5 mr-3" />
                        Settings
                    </Link>
                </nav>
                <div className="absolute bottom-0 w-64 p-6">
                    <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-red-600 border border-red-200 rounded hover:bg-red-50"
                    >
                        <LogOut className="w-5 h-5 mr-3" />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <header className="flex items-center justify-between px-8 py-4 bg-white shadow-sm">
                    <h2 className="text-xl font-semibold text-gray-800">Clinic Admin</h2>
                    <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-500">Dr. Smith</span>
                        <div className="w-8 h-8 bg-blue-200 rounded-full"></div>
                    </div>
                </header>
                <div className="p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
