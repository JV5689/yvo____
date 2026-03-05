
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
    Building, User, Mail, Lock, Phone, Globe, MapPin,
    CheckCircle, ArrowLeft, CreditCard
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function CreateCompany() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [plans, setPlans] = useState([]);

    const [formData, setFormData] = useState({
        name: '',
        businessType: '',
        phone: '',
        address: '',
        website: '',
        ownerName: '',
        ownerEmail: '',
        password: '',
        planId: ''
    });

    useEffect(() => {
        // Fetch plans for dropdown
        api.get('/sa/plans')
            .then(res => {
                const activePlans = (res.data || []).filter(p => !p.isArchived);
                setPlans(activePlans);
                if (activePlans.length > 0) {
                    setFormData(prev => ({ ...prev, planId: activePlans[0]._id }));
                }
            })
            .catch(() => toast.error("Failed to load plans"));
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await api.post('/sa/companies', formData);
            toast.success("Company created successfully!");
            navigate('/dashboard/companies');
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Failed to create company");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-8">
            <button
                onClick={() => navigate('/dashboard/companies')}
                className="mb-6 text-slate-500 hover:text-slate-800 flex items-center gap-2 text-sm font-medium transition-colors"
            >
                <ArrowLeft size={16} /> Back to Companies
            </button>

            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">New Company Registration</h1>
                        <p className="text-sm text-slate-500 mt-1">Create a new workspace and assign an administrator.</p>
                    </div>
                    <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                        <Building size={20} />
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-8">

                    {/* Section 1: Company Details */}
                    <div>
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Building size={16} /> Company Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="col-span-2">
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Company Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                                    placeholder="e.g. Acme Corp"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Business Type</label>
                                <input
                                    type="text"
                                    name="businessType"
                                    value={formData.businessType}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                    placeholder="e.g. Retail, SaaS, Agency"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Website</label>
                                <div className="relative">
                                    <Globe className="absolute left-3 top-3 text-slate-400" size={16} />
                                    <input
                                        type="url"
                                        name="website"
                                        value={formData.website}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Phone Number</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-3 text-slate-400" size={16} />
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                        placeholder="+1 (555) 000-0000"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Address</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-3 text-slate-400" size={16} />
                                    <input
                                        type="text"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                        placeholder="123 Main St, City"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-slate-100 my-6"></div>

                    {/* Section 2: Admin Account */}
                    <div>
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <User size={16} /> Owner Account
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100">
                            <div className="col-span-2">
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    name="ownerName"
                                    required
                                    value={formData.ownerName}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                    placeholder="Admin Name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email (Login ID) <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 text-slate-400" size={16} />
                                    <input
                                        type="email"
                                        name="ownerEmail"
                                        required
                                        value={formData.ownerEmail}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                        placeholder="admin@company.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 text-slate-400" size={16} />
                                    <input
                                        type="password"
                                        name="password"
                                        required
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                        placeholder="Min 8 characters"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-slate-100 my-6"></div>

                    {/* Section 3: Plan Selection */}
                    <div>
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <CreditCard size={16} /> Subscription Plan
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {plans.map(plan => (
                                <label
                                    key={plan._id}
                                    className={`cursor-pointer rounded-xl border-2 p-4 transition-all relative
                                   ${formData.planId === plan._id
                                            ? 'border-indigo-600 bg-indigo-50/50'
                                            : 'border-slate-200 hover:border-indigo-200 bg-slate-50'}`}
                                >
                                    <input
                                        type="radio"
                                        name="planId"
                                        value={plan._id}
                                        checked={formData.planId === plan._id}
                                        onChange={handleChange}
                                        className="hidden"
                                    />
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-bold text-slate-800">{plan.name}</span>
                                        {formData.planId === plan._id && <CheckCircle className="text-indigo-600" size={18} />}
                                    </div>
                                    <div className="text-2xl font-bold text-indigo-600 mb-1">
                                        ${plan.priceMonthly}<span className="text-sm text-slate-500 font-normal">/mo</span>
                                    </div>
                                    <div className="text-xs text-slate-500 uppercase tracking-widest">{plan.code}</div>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => navigate('/dashboard/companies')}
                            className="px-6 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center gap-2
                            ${loading ? 'opacity-70 cursor-wait' : 'active:scale-95'}`}
                        >
                            {loading ? 'Creating Account...' : 'Create Company'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}
