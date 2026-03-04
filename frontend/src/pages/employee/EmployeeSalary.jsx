import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Download, IndianRupee } from 'lucide-react';

export default function EmployeeSalary() {
    const [salaries, setSalaries] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSalaries = async () => {
            try {
                const res = await api.get('/employee/dashboard/salary');
                setSalaries(res.data);
            } catch (error) {
                console.error("Error fetching salaries", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSalaries();
    }, []);

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 font-bold animate-pulse">Fetching records...</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col gap-1.5">
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Salary History</h1>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Earnings & Payment Records</p>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block rounded-2xl border border-slate-100 bg-white shadow-xl shadow-slate-200/50 overflow-hidden">
                <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50/50 text-xs uppercase text-slate-500 border-b border-slate-100">
                        <tr>
                            <th className="px-8 py-5 font-black tracking-widest">Pay Period</th>
                            <th className="px-8 py-5 font-black tracking-widest">Payment Date</th>
                            <th className="px-8 py-5 font-black tracking-widest text-right">Amount</th>
                            <th className="px-8 py-5 font-black tracking-widest text-center">Status</th>
                            <th className="px-8 py-5 font-black tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {salaries.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-8 py-16 text-center text-slate-400 font-bold italic">
                                    No salary records found.
                                </td>
                            </tr>
                        ) : (
                            salaries.map((salary) => (
                                <tr key={salary._id} className="hover:bg-blue-50/30 transition-colors group">
                                    <td className="px-8 py-6 font-bold text-slate-900">{salary.payPeriod}</td>
                                    <td className="px-8 py-6 font-medium text-slate-500">{new Date(salary.paymentDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</td>
                                    <td className="px-8 py-6 font-black text-slate-900 text-right text-lg">₹{salary.amount.toLocaleString()}</td>
                                    <td className="px-8 py-6 text-center">
                                        <span className={`inline-flex items-center rounded-xl px-3 py-1 text-xs font-black uppercase tracking-widest
                                            ${salary.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' :
                                                salary.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                                                    'bg-slate-100 text-slate-500'}`}>
                                            {salary.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        {salary.slipUrl ? (
                                            <a href={salary.slipUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-blue-600 hover:text-white hover:bg-blue-600 px-4 py-2 rounded-xl transition-all font-bold border border-blue-100 group-hover:border-blue-600">
                                                <Download size={16} /> Slip
                                            </a>
                                        ) : (
                                            <span className="text-slate-300 font-bold italic px-4">N/A</span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                {salaries.length === 0 ? (
                    <div className="py-20 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                        <IndianRupee className="mx-auto text-slate-300 mb-2" size={40} />
                        <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No records found</p>
                    </div>
                ) : (
                    salaries.map((salary) => (
                        <div key={salary._id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-lg shadow-slate-100 transition-all active:scale-[0.98]">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Pay Period</p>
                                    <h3 className="text-lg font-black text-slate-900">{salary.payPeriod}</h3>
                                </div>
                                <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest
                                    ${salary.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' :
                                        salary.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                                            'bg-slate-100 text-slate-500'}`}>
                                    {salary.status}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Amount Paid</p>
                                    <div className="text-3xl font-black text-slate-900 tracking-tight">₹{salary.amount.toLocaleString()}</div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date</p>
                                    <p className="text-sm font-bold text-slate-700">{new Date(salary.paymentDate).toLocaleDateString()}</p>
                                </div>
                            </div>

                            {salary.slipUrl && (
                                <a
                                    href={salary.slipUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 w-full py-3.5 bg-slate-50 text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all active:scale-[0.95] border border-slate-100"
                                >
                                    <Download size={18} /> Download Pay Slip
                                </a>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
