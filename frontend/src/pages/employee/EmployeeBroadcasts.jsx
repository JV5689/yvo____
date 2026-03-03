import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Megaphone, MessageSquare } from 'lucide-react';

export default function EmployeeBroadcasts() {
    const [broadcasts, setBroadcasts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBroadcasts = async () => {
            try {
                const res = await api.get('/employee/dashboard/broadcasts');
                setBroadcasts(res.data);
            } catch (error) {
                console.error("Error fetching broadcasts", error);
            } finally {
                setLoading(false);
            }
        };

        fetchBroadcasts();
    }, []);

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 font-semibold animate-pulse">Loading broadcasts...</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col gap-1.5">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight text-center md:text-left">Broadcasts</h1>
                <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest text-center md:text-left flex items-center justify-center md:justify-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    Live Announcements
                </p>
            </div>

            <div className="grid gap-6">
                {broadcasts.length === 0 ? (
                    <div className="py-20 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                        <Megaphone className="mx-auto text-slate-300 mb-2" size={40} />
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No active broadcasts</p>
                    </div>
                ) : (
                    broadcasts.map((broadcast) => (
                        <div key={broadcast._id} className="group bg-white p-6 rounded-3xl border border-slate-100 shadow-lg shadow-slate-100/50 transition-all hover:border-blue-100 hover:shadow-xl active:scale-[0.99]">
                            <div className="flex flex-col gap-4">
                                <div className="flex justify-between items-start">
                                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{broadcast.title}</h3>
                                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full whitespace-nowrap">
                                        {new Date(broadcast.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <p className="text-slate-600 font-semibold leading-relaxed text-sm md:text-base">
                                    {broadcast.message}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
