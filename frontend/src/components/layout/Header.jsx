import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Rocket, LogIn, Bell } from 'lucide-react';

const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'Features', to: '/#features' },
  { label: 'Pricing', to: '/pricing' },
  { label: 'About Us', to: '/about' },
  { label: 'Help', to: '/help' },
];

export default function Header() {
  const [profile, setProfile] = useState({ name: '', role: '' });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const location = useLocation();

  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        // Scrolling DOWN -> Hide
        setIsVisible(false);
      } else {
        // Scrolling UP -> Show
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    const loadProfile = () => {
      const name = localStorage.getItem('userProfileName') || '';
      const role = localStorage.getItem('userRole') || '';
      const hasToken = Boolean(localStorage.getItem('userToken'));
      setProfile(hasToken ? { name: name || 'Account', role } : { name: '', role: '' });
    };

    loadProfile();
    window.addEventListener('storage', loadProfile);
    return () => window.removeEventListener('storage', loadProfile);
  }, []);

  // Close menu when route changes
  const [prevLocation, setPrevLocation] = useState(location.pathname);
  if (location.pathname !== prevLocation) {
    setPrevLocation(location.pathname);
    if (isMenuOpen) setIsMenuOpen(false);
  }

  const initials = useMemo(() => {
    if (!profile.name) return 'U';
    return profile.name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((item) => item[0]?.toUpperCase())
      .join('');
  }, [profile.name]);

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userProfileName');
    localStorage.removeItem('userRole');
    setProfile({ name: '', role: '' });
  };

  return (
    <header
      className={`fixed top-0 w-full bg-white/80 backdrop-blur-xl border-b border-slate-100 z-[100] transition-transform duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}
    >
      <nav className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center shadow-lg shadow-purple-900/20 group-hover:rotate-6 transition-transform">
            <Rocket className="text-white w-6 h-6" />
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-8 text-sm font-bold text-slate-500">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`hover:text-brand transition ${location.pathname === link.to ? 'text-brand' : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Actions */}
        <div className="hidden lg:flex items-center gap-4">
          {profile.name ? (
            <div className="flex items-center gap-4">
              {/* Notifications */}
              <div className="relative">
                <button
                  className="p-2 text-slate-400 hover:text-brand transition relative"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                </button>

                {showNotifications && (
                  <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-4 border-b border-slate-50 flex justify-between items-center">
                      <h3 className="font-bold text-slate-800">Notifications</h3>
                      <button className="text-xs text-brand font-medium">Mark all read</button>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                      {[1, 2, 3].map((_, i) => (
                        <div key={i} className="p-4 border-b border-slate-50 hover:bg-slate-50 transition cursor-pointer">
                          <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                              <Bell className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-sm text-slate-600 leading-snug">
                                <span className="font-bold text-slate-900">System Update</span>: New payroll features are now live.
                              </p>
                              <p className="text-xs text-slate-400 mt-1">2 hours ago</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 text-center border-t border-slate-50">
                      <button className="text-xs font-bold text-brand hover:underline">View All Notifications</button>
                    </div>
                  </div>
                )}
              </div>

              <Link to="/dashboard" className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-full pl-1 pr-4 py-1 hover:bg-white transition">
                <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center text-xs font-black">
                  {initials}
                </div>
                <div>
                  <div className="text-xs font-black text-slate-900 leading-none">{profile.name}</div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">{profile.role || 'User'}</div>
                </div>
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm font-bold text-slate-400 hover:text-brand transition"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link to="/admin-login" className="text-sm font-bold text-slate-600 hover:text-brand transition">
                Company Login
              </Link>
              <Link
                to="/login"
                className="bg-brand text-white px-6 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-purple-900/10 hover:scale-105 transition-transform flex items-center gap-2"
              >
                <LogIn className="w-4 h-4" /> Employee Login
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          className="lg:hidden p-2 text-slate-600 border border-slate-100 rounded-xl hover:bg-slate-50 transition"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 w-full bg-white border-b border-slate-100 p-6 flex flex-col gap-6 shadow-2xl animate-in slide-in-from-top duration-300">
          <div className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`text-lg font-bold ${location.pathname === link.to ? 'text-brand' : 'text-slate-600'}`}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <hr className="border-slate-100" />
          <div className="flex flex-col gap-4">
            {profile.name ? (
              <>
                <Link to="/dashboard" className="text-lg font-bold text-slate-900">Dashboard</Link>
                <button onClick={handleLogout} className="text-lg font-bold text-brand text-left">Logout</button>
              </>
            ) : (
              <>
                <Link to="/admin-login" className="text-lg font-bold text-slate-600">Company Login</Link>
                <Link to="/login" className="bg-brand text-white p-4 rounded-2xl text-center font-bold shadow-lg shadow-purple-900/10">
                  Employee Login
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
