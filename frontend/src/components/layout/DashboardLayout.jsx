import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import api from '../../services/api';
import {
    LayoutDashboard, Building2, Ticket, Flag, Cloud, Database,
    BarChart3, Shield, Settings, LogOut, Users, Calendar, FileText, IndianRupee, ChevronDown, Menu, X, HelpCircle
} from 'lucide-react';

export default function DashboardLayout() {
    const { user, logout, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [config, setConfig] = useState(null);
    const [configLoading, setConfigLoading] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile sidebar state
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true); // Default to MINIMIZED for more space
    const location = useLocation();

    // Close sidebar on route change (mobile)
    useEffect(() => {
        setIsSidebarOpen(false);
    }, [location.pathname]);

    // Redirect if not authenticated
    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/login');
        }
    }, [authLoading, user, navigate]);

    // Fetch Effective Config (for Company Admins)
    useEffect(() => {
        if (authLoading || !user || user.isSuperAdmin) return;

        const fetchConfig = async () => {
            setConfigLoading(true);
            try {
                const res = await api.get('/company/config');
                setConfig(res.data);
            } catch (err) {
                console.error("Failed to load company config", err);
            } finally {
                setConfigLoading(false);
            }
        };
        fetchConfig();
    }, [user, authLoading]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (authLoading) return <div className="min-h-screen flex items-center justify-center text-slate-500">Initializing...</div>;
    if (!user) return null; // Will redirect via useEffect

    // SUPER ADMIN SIDEBAR (Updated with Premium Icons)
    if (user.isSuperAdmin) {
        return (
            <div className="flex min-h-screen bg-slate-50 text-slate-900">
                {/* Mobile Overlay */}
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-20 lg:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}

                {/* Sidebar */}
                <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out \${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
                    <div className="flex h-16 items-center justify-between px-6 border-b border-slate-100">
                        <div className="flex items-center">
                            <img src="/admin-logo.svg" alt="Admin" className="h-8 w-8 mr-3 object-contain" />
                            <span className="text-lg font-bold text-slate-800 tracking-tight">Admin</span>
                        </div>
                        <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-slate-600">
                            <X size={24} />
                        </button>
                    </div>

                    <nav className="mt-6 px-3 space-y-1">
                        <SidebarItem icon={<LayoutDashboard size={20} />} label="Overview" href="/dashboard" active={location.pathname === '/dashboard'} />
                        <SidebarItem icon={<Building2 size={20} />} label="Companies" href="/dashboard/companies" active={location.pathname === '/dashboard/companies'} />
                        <SidebarItem icon={<Users size={20} />} label="Manage Clients" href="/dashboard/clients" active={location.pathname === '/dashboard/clients'} />
                        <SidebarItem icon={<Ticket size={20} />} label="Plans & Feature Flags" href="/dashboard/plans" active={location.pathname === '/dashboard/plans'} />
                        <SidebarItem icon={<FileText size={20} />} label="Invoice Templates" href="/dashboard/templates" active={location.pathname === '/dashboard/templates'} />

                        <div className="pt-4 pb-2">
                            <div className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">System</div>
                        </div>
                        <SidebarItem icon={<Cloud size={20} />} label="Cloud & Sync Control" href="/dashboard/sync" />
                        <SidebarItem icon={<Database size={20} />} label="Backup & Reports" href="/dashboard/backup-reports" active={location.pathname === '/dashboard/backup-reports'} />
                        <SidebarItem icon={<BarChart3 size={20} />} label="Analytics (Year-wise)" href="/dashboard/analytics" />
                        <SidebarItem icon={<Shield size={20} />} label="Security & Logs" href="/dashboard/logs" />

                    </nav>

                    <div className="absolute bottom-0 w-full border-t border-slate-200 p-4">
                        <button onClick={handleLogout} className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <LogOut size={18} />
                            Logout
                        </button>
                    </div>
                </aside>

                <div className="flex-1 lg:ml-64 flex flex-col min-w-0">
                    {/* Top Header */}
                    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200 h-16 flex items-center justify-between px-4 lg:px-8">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="lg:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                            >
                                <Menu size={24} />
                            </button>
                            <div className="hidden md:flex items-center w-full max-w-md">
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    className="w-64 h-10 pl-4 pr-10 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <button className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200">
                                <span className="sr-only">Notifications</span>
                                <div className="h-2 w-2 rounded-full bg-red-500 absolute top-3 right-3 border-2 border-white"></div>
                                🔔
                            </button>
                            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 p-0.5">
                                <div className="h-full w-full rounded-full bg-white flex items-center justify-center">
                                    <img src={`https://ui-avatars.com/api/?name=${user.fullName}&background=random`} alt="Avatar" className="rounded-full" />
                                </div>
                            </div>
                        </div>
                    </header>

                    <main className="p-4 lg:p-8 overflow-x-hidden">
                        <Outlet context={{ config }} />
                    </main>
                </div>
            </div>
        );
    }

    // COMPANY ADMIN LAYOUT (Clean style)
    return (
        <div className="flex min-h-screen bg-slate-50 text-slate-900">
            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-20 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            <aside className={`fixed inset-y-0 left-0 z-30 ${isSidebarCollapsed ? 'w-20' : 'w-64'} bg-white border-r border-slate-200 overflow-y-auto transform transition-all duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 group`}>
                <div className={`flex h-16 items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between px-6'} border-b border-slate-100`}>
                    <div className={`flex items-center ${isSidebarCollapsed ? 'hidden' : 'flex'}`}>
                        <span className="text-lg font-bold text-slate-800 tracking-tight px-2">{config?.company?.name || 'YVO Admin'}</span>
                    </div>

                    <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-slate-600">
                        <X size={24} />
                    </button>

                    {!isSidebarOpen && (
                        <button
                            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                            className={`hidden lg:flex items-center justify-center w-10 h-10 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-all ${isSidebarCollapsed ? 'bg-indigo-50 text-indigo-600' : ''}`}
                            title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                        >
                            {isSidebarCollapsed ? <Menu size={20} /> : <X size={20} />}
                        </button>
                    )}
                </div>

                <nav className="mt-6 px-3 space-y-1">
                    <SidebarItem icon={<LayoutDashboard size={20} />} label="Overview" href="/dashboard" active={location.pathname === '/dashboard'} collapsed={isSidebarCollapsed} />

                    <div className="pt-4 pb-2">
                        {!isSidebarCollapsed ? (
                            <div className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Financials</div>
                        ) : (
                            <div className="h-px bg-slate-100 mx-2 my-2"></div>
                        )}
                    </div>

                    <SidebarItem
                        icon={<Users size={20} />}
                        label="Customers"
                        href="/dashboard/customers"
                        locked={!config?.modules?.invoicing}
                        collapsed={isSidebarCollapsed}
                    />

                    <SidebarItem
                        icon={<BarChart3 size={20} />}
                        label="Finance"
                        href="/dashboard/finance"
                        locked={!config?.modules?.finance}
                        collapsed={isSidebarCollapsed}
                    />
                    <SidebarItem
                        icon={<FileText size={20} />}
                        label="Invoicing"
                        href="/dashboard/invoicing"
                        locked={!config?.modules?.invoicing}
                        collapsed={isSidebarCollapsed}
                    />



                    <SidebarItem
                        icon={<Building2 size={20} />}
                        label="Inventory"
                        href="/dashboard/inventory"
                        locked={!config?.modules?.inventory}
                        collapsed={isSidebarCollapsed}
                    />

                    <SidebarItem
                        icon={<Users size={20} />}
                        label="Employees"
                        locked={!config?.modules?.employees}
                        active={location.pathname.includes('/dashboard/employees') || location.pathname.includes('/dashboard/leaves') || location.pathname.includes('/dashboard/payroll')}
                        collapsed={isSidebarCollapsed}
                        subItems={[
                            { label: 'All Employees', href: '/dashboard/employees', active: location.pathname === '/dashboard/employees' },
                            { label: 'Leaves', href: '/dashboard/leaves', active: location.pathname === '/dashboard/leaves' },
                            { label: 'Payroll', href: '/dashboard/payroll', active: location.pathname === '/dashboard/payroll' }
                        ]}
                    />

                    <SidebarItem
                        icon={<Calendar size={20} />}
                        label="Calendar"
                        href="/dashboard/calendar"
                        locked={!config?.modules?.calendar}
                        collapsed={isSidebarCollapsed}
                    />

                    <SidebarItem
                        icon={<Building2 size={20} />}
                        label="Broadcasts"
                        href="/dashboard/broadcasts"
                        locked={!config?.modules?.broadcasts}
                        collapsed={isSidebarCollapsed}
                    />

                    <div className="mt-6 border-t border-slate-100 pt-4">
                        <SidebarItem
                            icon={<BarChart3 size={20} />}
                            label="Analytics"
                            href="/dashboard/analytics"
                            locked={!config?.modules?.analytics}
                            collapsed={isSidebarCollapsed}
                        />
                        <SidebarItem
                            icon={<Database size={20} />}
                            label="Backup & Reports"
                            href="/dashboard/backup-reports"
                            active={location.pathname === '/dashboard/backup-reports'}
                            locked={!config?.modules?.backup}
                            collapsed={isSidebarCollapsed}
                        />

                        <SidebarItem icon={<Settings size={20} />} label="Settings" href="/dashboard/settings" collapsed={isSidebarCollapsed} />
                        <SidebarItem
                            icon={<HelpCircle size={20} />}
                            label="Customer Care"
                            href="mailto:yvo.company@gmail.com?subject=Support%20Request"
                            collapsed={isSidebarCollapsed}
                        />
                    </div>

                </nav>

                <div className="mt-auto border-t border-slate-200 p-4">
                    {!isSidebarCollapsed && (
                        <div className="mb-4 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
                            <div className="text-xs font-semibold text-slate-500 uppercase">Current Plan</div>
                            <div className="flex items-center justify-between mt-1">
                                <span className="text-sm font-bold text-indigo-600">{config?.company?.plan}</span>
                                <span className="h-2 w-2 rounded-full bg-green-500"></span>
                            </div>
                        </div>
                    )}
                    <button onClick={handleLogout} className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} w-full px-3 py-2 text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors`} title="Logout">
                        <LogOut size={18} />
                        {!isSidebarCollapsed && "Logout"}
                    </button>
                </div>
            </aside>

            <div className={`flex-1 ${isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'} flex flex-col min-w-0 transition-all duration-300 ease-in-out`}>
                <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200 h-16 flex items-center justify-between px-4 lg:px-8">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="lg:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                        >
                            <Menu size={24} />
                        </button>
                        <h2 className="text-lg font-semibold text-slate-800 truncate">
                            {location.pathname === '/dashboard' ? 'Overview' : location.pathname.split('/').pop().charAt(0).toUpperCase() + location.pathname.split('/').pop().slice(1)}
                        </h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-sm text-right hidden md:block">
                            <div className="font-medium text-slate-900">{user.fullName}</div>
                            <div className="text-xs text-slate-500">{user.email}</div>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-slate-200 overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
                            <img src={`https://ui-avatars.com/api/?name=\${user.fullName}`} alt="Profile" />
                        </div>
                    </div>
                </header>
                <main className="p-4 lg:p-8 overflow-x-hidden">
                    {configLoading ? <div className="animate-pulse">Loading...</div> : <Outlet context={{ config }} />}
                </main>
            </div>
        </div>
    );
}

import toast from 'react-hot-toast';
import { Lock } from 'lucide-react';

const SidebarItem = ({ icon, label, href, active, subItems, locked, collapsed }) => {
    const [isOpen, setIsOpen] = useState(active);

    useEffect(() => {
        if (active) setIsOpen(true);
    }, [active]);

    const handleLockedClick = (e) => {
        if (locked) {
            e.preventDefault();
            toast.error("This feature is disabled by your company admin.");
        }
    };

    if (subItems && !collapsed) {
        return (
            <div className="space-y-1">
                <button
                    onClick={(e) => {
                        if (locked) {
                            handleLockedClick(e);
                            return;
                        }
                        setIsOpen(!isOpen);
                    }}
                    className={`flex items-center justify-between w-full px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 
            ${active
                            ? 'bg-blue-50 text-blue-700 shadow-sm'
                            : locked
                                ? 'text-slate-400 cursor-not-allowed hover:bg-slate-50'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                >
                    <div className="flex items-center gap-3">
                        <span className={active ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}>
                            {icon}
                        </span>
                        {label}
                        {locked && <Lock size={14} className="ml-2 text-slate-400" />}
                    </div>
                    {!locked && <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} />}
                </button>
                {isOpen && !locked && (
                    <div className="pl-10 space-y-1">
                        {subItems.map((item, index) => (
                            <Link
                                key={index}
                                to={item.href}
                                className={`block px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 
                  ${item.active
                                        ? 'text-blue-600 bg-blue-50/50'
                                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                                    }`}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    const isExternal = href?.startsWith('mailto:') || href?.startsWith('http');
    const targetHref = href || (collapsed && subItems?.length > 0 ? subItems[0].href : "#");

    const sharedProps = {
        onClick: handleLockedClick,
        title: collapsed ? label : "",
        className: `flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 
      ${active
                ? 'bg-blue-50 text-blue-700 shadow-sm'
                : locked
                    ? 'text-slate-400 cursor-not-allowed hover:bg-slate-50'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`
    };

    const content = (
        <>
            <span className={active ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}>
                {icon}
            </span>
            {!collapsed && label}
            {locked && !collapsed && <Lock size={14} className="ml-auto text-slate-400" />}
        </>
    );

    if (isExternal) {
        return (
            <a href={targetHref} {...sharedProps}>
                {content}
            </a>
        );
    }

    return (
        <Link to={targetHref} {...sharedProps}>
            {content}
        </Link>
    );
};
