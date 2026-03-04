import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, IndianRupee, Calendar, MessageSquare, LogOut, FileText, Menu, X, Users
} from 'lucide-react';

export default function EmployeeLayout() {
    const { user, logout, loading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        if (!loading && (!user || user.role !== 'employee')) {
            navigate('/login');
        }
    }, [loading, user, navigate]);

    // Close sidebar on route change (mobile)
    useEffect(() => {
        setIsSidebarOpen(false);
    }, [location.pathname]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500">Loading...</div>;
    if (!user) return null;

    return (
        <div className="flex min-h-screen bg-white md:bg-slate-50 text-slate-900 pb-16 md:pb-0">
            {/* MOBILE OVERLAY */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-300"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* SIDEBAR (Drawer on mobile) */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 shadow-2xl md:shadow-none`}>
                <div className="flex h-20 items-center justify-between px-6 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                        <div className="bg-blue-600 p-1.5 rounded-lg">
                            <Users className="text-white" size={22} strokeWidth={2.5} />
                        </div>
                        <span className="text-xl font-black text-slate-900 tracking-tight uppercase">
                            {user.company?.name || 'PORTAL'}
                        </span>
                    </div>
                    <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <nav className="mt-8 px-4 space-y-2 overflow-y-auto max-h-[calc(100vh-220px)]">
                    <SidebarItem
                        icon={<LayoutDashboard size={20} />}
                        label="Dashboard"
                        href="/employee-dashboard"
                        active={location.pathname === '/employee-dashboard'}
                    />
                    <SidebarItem
                        icon={<IndianRupee size={20} />}
                        label="My Salary"
                        href="/employee-dashboard/salary"
                        active={location.pathname === '/employee-dashboard/salary'}
                    />
                    <SidebarItem
                        icon={<FileText size={20} />}
                        label="Leaves"
                        href="/employee-dashboard/leaves"
                        active={location.pathname === '/employee-dashboard/leaves'}
                    />
                    <SidebarItem
                        icon={<Calendar size={20} />}
                        label="Calendar"
                        href="/employee-dashboard/calendar"
                        active={location.pathname === '/employee-dashboard/calendar'}
                    />
                    <SidebarItem
                        icon={<MessageSquare size={20} />}
                        label="Broadcasts"
                        href="/employee-dashboard/broadcasts"
                        active={location.pathname === '/employee-dashboard/broadcasts'}
                    />
                </nav>

                <div className="absolute bottom-0 w-full border-t border-slate-100 p-6 bg-slate-50/50 backdrop-blur-sm">
                    <div className="mb-6 flex items-center gap-3.5 px-1">
                        <img
                            src={user.avatar || `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=6366f1&color=fff&bold=true`}
                            alt="Avatar"
                            className="h-10 w-10 rounded-xl border-2 border-white shadow-sm ring-1 ring-slate-100"
                        />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-900 truncate">{user.firstName} {user.lastName}</p>
                            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">{user.position || 'Employee'}</p>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="flex items-center justify-center gap-2.5 w-full px-4 py-2.5 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all duration-200 active:scale-[0.98]">
                        <LogOut size={18} />
                        Logout
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <div className="flex-1 md:ml-64 flex flex-col min-w-0 bg-white md:bg-slate-50">
                <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-100 h-16 md:h-20 flex items-center justify-between px-4 md:px-10">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 -ml-2 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors md:hidden"
                        >
                            <Menu size={24} />
                        </button>
                        <div>
                            <h2 className="text-lg md:text-xl font-bold text-slate-900 truncate leading-tight">
                                {location.pathname === '/employee-dashboard' ? 'Overview' :
                                    location.pathname.split('/').pop().charAt(0).toUpperCase() + location.pathname.split('/').pop().slice(1).replace(/-/g, ' ')}
                            </h2>
                            <p className="text-[11px] md:hidden font-semibold text-blue-600 uppercase tracking-widest opacity-80">
                                {user.company?.name || user.companyId?.name || 'Portal'}
                            </p>
                        </div>
                    </div>
                    <div className="hidden md:flex items-center gap-4">
                        <div className="text-sm font-semibold text-blue-700 bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 shadow-sm">
                            {(typeof user.company === 'object' ? user.company?.name : null) || user.companyId?.name || 'Portal'}
                        </div>
                    </div>
                </header>

                <main className="p-4 md:p-10 flex-1 overflow-x-hidden max-w-7xl mx-auto w-full">
                    <Outlet />
                </main>
            </div>

            {/* MOBILE BOTTOM NAVIGATION */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-xl border-t border-slate-100 px-2 py-1.5 flex justify-around shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
                <BottomNavItem
                    icon={<LayoutDashboard size={20} />}
                    label="Home"
                    href="/employee-dashboard"
                    active={location.pathname === '/employee-dashboard'}
                />
                <BottomNavItem
                    icon={<IndianRupee size={20} />}
                    label="Salary"
                    href="/employee-dashboard/salary"
                    active={location.pathname === '/employee-dashboard/salary'}
                />
                <BottomNavItem
                    icon={<FileText size={20} />}
                    label="Leaves"
                    href="/employee-dashboard/leaves"
                    active={location.pathname === '/employee-dashboard/leaves'}
                />
                <BottomNavItem
                    icon={<MessageSquare size={20} />}
                    label="Messages"
                    href="/employee-dashboard/broadcasts"
                    active={location.pathname === '/employee-dashboard/broadcasts'}
                />
                <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="flex flex-col items-center justify-center p-2 rounded-xl text-slate-400"
                >
                    <Menu size={20} />
                    <span className="text-[10px] font-semibold mt-1 uppercase">More</span>
                </button>
            </div>
        </div>
    );
}

const SidebarItem = ({ icon, label, href, active }) => (
    <Link
        to={href}
        className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group
      ${active
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
    >
        <span className={`${active ? 'text-white' : 'text-slate-400 group-hover:text-blue-500'} transition-colors`}>
            {icon}
        </span>
        {label}
    </Link>
);

const BottomNavItem = ({ icon, label, href, active }) => (
    <Link
        to={href}
        className={`flex flex-col items-center justify-center p-2 rounded-2xl min-w-[64px] transition-all duration-200
      ${active ? 'text-blue-600 scale-105' : 'text-slate-400'}`}
    >
        <div className={`p-1 rounded-xl ${active ? 'bg-blue-50' : ''}`}>
            {React.cloneElement(icon, { size: 22, strokeWidth: active ? 2.5 : 2 })}
        </div>
        <span className={`text-[10px] font-semibold mt-0.5 uppercase tracking-tighter ${active ? 'opacity-100' : 'opacity-70'}`}>
            {label}
        </span>
    </Link>
);
