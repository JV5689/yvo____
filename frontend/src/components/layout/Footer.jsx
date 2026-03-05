import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Linkedin, Mail } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-slate-900 text-slate-300 py-12 border-t border-slate-800">
            <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-4 gap-8">
                {/* Brand */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-white font-bold text-xl">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">Y</div>
                        YVO
                    </div>
                    <p className="text-sm text-slate-400">
                        Empowering businesses with all-in-one SaaS solutions for finance, inventory, and team management.
                    </p>
                </div>

                {/* Links */}
                <div>
                    <h4 className="text-white font-semibold mb-4">Product</h4>
                    <ul className="space-y-2 text-sm">
                        <li><Link to="/#features" className="hover:text-white transition">Features</Link></li>
                        <li><Link to="/pricing" className="hover:text-white transition">Pricing</Link></li>
                        <li><Link to="/help" className="hover:text-white transition">Help Center</Link></li>
                        <li><Link to="/download" className="hover:text-white transition">Download App</Link></li>
                    </ul>
                </div>

                {/* Legal */}
                <div>
                    <h4 className="text-white font-semibold mb-4">Legal</h4>
                    <ul className="space-y-2 text-sm">
                        <li><Link to="/privacy" className="hover:text-white transition">Privacy Policy</Link></li>
                        <li><Link to="/terms" className="hover:text-white transition">Terms of Service</Link></li>
                        <li><Link to="/security" className="hover:text-white transition">Security</Link></li>
                    </ul>
                </div>

                {/* Social */}
                <div>
                    <h4 className="text-white font-semibold mb-4">Connect</h4>
                    <div className="flex gap-4">
                        <a href="#" className="hover:text-white transition"><Twitter size={20} /></a>
                        <a href="#" className="hover:text-white transition"><Facebook size={20} /></a>
                        <a href="#" className="hover:text-white transition"><Instagram size={20} /></a>
                        <a href="#" className="hover:text-white transition"><Linkedin size={20} /></a>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-sm">
                        <Mail size={16} />
                        <span>support@yvo.com</span>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 mt-12 pt-8 border-t border-slate-800 text-center text-xs text-slate-500">
                &copy; {new Date().getFullYear()} YVO Inc. All rights reserved.
            </div>
        </footer>
    );
}
