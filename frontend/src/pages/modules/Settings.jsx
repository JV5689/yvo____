import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Save, User, Building, Mail } from 'lucide-react';
import api from '../../services/api';
import { useUI } from '../../context/UIContext';

export default function Settings() {
    const { user } = useAuth();
    const { alert, toast } = useUI();
    const [loading, setLoading] = useState(false);

    // In real app, fetch from /api/company/profile
    const [formData, setFormData] = useState({
        companyName: '',
        ownerName: '',
        email: '',
        phone: '',
        website: '',
        address: '',
        currency: 'INR',
        invoiceEditPassword: '',
        logo: ''
    });

    React.useEffect(() => {
        // Fetch real config
        const fetchSettings = async () => {
            try {
                const res = await api.get('/company/config');
                const company = res.data.company;

                if (company) {
                    setFormData({
                        companyName: company.name || '',
                        ownerName: user?.fullName || '', // Owner name usually comes from user profile, not company config, unless we added it
                        email: company.email || user?.email || '',
                        phone: company.phone || '',
                        website: company.website || '',
                        address: company.address || '',
                        currency: company.currency || 'INR',
                        invoiceEditPassword: company.invoiceEditPassword || '',
                        logo: company.logo || ''
                    });
                }
            } catch (err) {
                console.error("Failed to fetch settings", err);
            }
        };

        fetchSettings();
    }, [user]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleLogoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, logo: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const companyId = localStorage.getItem('companyId');
            if (!companyId) {
                throw new Error("Company ID not found. Please log out and log in again.");
            }

            const payload = {
                name: formData.companyName,
                email: formData.email,
                phone: formData.phone,
                website: formData.website,
                address: formData.address,
                currency: formData.currency,
                invoiceEditPassword: formData.invoiceEditPassword,
                logo: formData.logo
            };

            await api.patch(`/ company / ${companyId} `, payload);
            toast.success("Settings Saved Successfully!");
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.message || err.message || "Unknown error";
            await alert("Error", "Failed to save settings: " + msg, "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
                <p className="text-sm text-slate-500 mt-1">Manage your company profile, branding, and preferences.</p>
            </div>

            <form onSubmit={handleSave} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                    <h3 className="font-semibold text-slate-800">Company Profile</h3>
                </div>

                <div className="p-6 space-y-6">
                    {/* LOGO UPLOAD */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Company Logo</label>
                        <div className="flex items-center gap-4">
                            <div className="w-20 h-20 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden">
                                {formData.logo ? (
                                    <img src={formData.logo} alt="Logo" className="w-full h-full object-contain" />
                                ) : (
                                    <Building size={24} className="text-slate-300" />
                                )}
                            </div>
                            <div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleLogoUpload}
                                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                />
                                <p className="text-xs text-slate-500 mt-1">Recommended: 200x200px PNG or JPG.</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label>
                            <input
                                type="text"
                                name="companyName"
                                value={formData.companyName}
                                onChange={handleChange}
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Owner Name</label>
                            <input
                                type="text"
                                name="ownerName"
                                value={formData.ownerName}
                                disabled
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="+91 98765 43210"
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Website</label>
                            <input
                                type="url"
                                name="website"
                                value={formData.website}
                                onChange={handleChange}
                                placeholder="https://example.com"
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Currency</label>
                            <select
                                name="currency"
                                value={formData.currency}
                                onChange={handleChange}
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                            >
                                <option value="INR">INR (₹)</option>
                                <option value="USD">USD ($)</option>
                                <option value="EUR">EUR (€)</option>
                                <option value="GBP">GBP (£)</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Business Address</label>
                        <textarea
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            rows={3}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                    </div>
                </div>

                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 mt-6">
                    <h3 className="font-semibold text-slate-800">Invoice Security</h3>
                </div>
                <div className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Invoice Edit Password</label>
                        <p className="text-xs text-slate-500 mb-2">Required to edit existing invoices. Leave blank to disable.</p>
                        <input
                            type="password"
                            name="invoiceEditPassword"
                            value={formData.invoiceEditPassword || ''}
                            onChange={handleChange}
                            placeholder="Set a secure password..."
                            className="w-full max-w-md px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-70 transition-all"
                    >
                        <Save size={18} /> {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
}
