import React, { useState, useEffect } from 'react';
import { Cloud, RotateCw, AlertTriangle, CheckCircle, Clock, Server, Database, HardDrive } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function SyncControl() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        storage: { usedGB: 0, limitTB: 10, percent: 0 },
        syncHealth: { active: 0, total: 0 },
        settings: { mandatoryCloudBackup: true, autoYearlyArchive: false }
    });
    const [logs, setLogs] = useState([]);
    const [syncing, setSyncing] = useState(false);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000); // Auto refresh every 30s
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        try {
            const [statsRes, logsRes] = await Promise.all([
                api.get('/sa/sync/stats'),
                api.get('/sa/sync/logs')
            ]);
            setStats(statsRes.data);
            setLogs(logsRes.data);
            setLoading(false);
        } catch {
            toast.error("Failed to load system status");
            setLoading(false);
        }
    };

    const handleManualSync = async () => {
        setSyncing(true);
        try {
            await api.post('/sa/sync/manual-backup');
            toast.success("System backup triggered successfully!");
            setTimeout(fetchData, 2000); // Refresh shortly after
        } catch {
            toast.error("Backup trigger failed");
        } finally {
            setSyncing(false);
        }
    };

    const toggleSetting = async (key) => {
        const newSettings = { ...stats.settings, [key]: !stats.settings[key] };
        // Optimistic update
        setStats(prev => ({ ...prev, settings: newSettings }));

        try {
            await api.patch('/sa/sync/config', newSettings);
            toast.success("Configuration updated");
        } catch {
            toast.error("Failed to update settings");
            // Revert
            setStats(prev => ({ ...prev, settings: { ...prev.settings, [key]: !newSettings[key] } }));
        }
    };

    if (loading) return <div className="p-10 text-center animate-pulse text-slate-500">Loading Cloud Status...</div>;

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Cloud & Sync Control</h1>
                    <p className="text-sm text-slate-500 mt-1">Monitor global synchronization status, storage limits, and backups.</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    System Operational
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* LEFT COL: CONTROLS */}
                <div className="space-y-8">

                    {/* USAGE CARD */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 relative overflow-hidden">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                                    <Database size={18} className="text-blue-600" />
                                    Global Data Usage
                                </h3>
                                <p className="text-xs text-slate-500 mt-1">Total database and file storage across all tenants.</p>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-bold text-slate-900">{stats.storage.usedGB} <span className="text-sm font-normal text-slate-500">GB</span></div>
                                <div className="text-xs text-slate-400">of {stats.storage.limitTB} TB Allocated</div>
                            </div>
                        </div>

                        <div className="w-full bg-slate-100 rounded-full h-3 mb-2 overflow-hidden">
                            <div
                                className={`h-3 rounded-full transition-all duration-1000 ${Number(stats.storage.percent) > 80 ? 'bg-red-500' : 'bg-blue-600'}`}
                                style={{ width: `${Math.max(Number(stats.storage.percent), 1)}%` }}
                            ></div>
                        </div>
                        <div className="flex justify-between text-xs font-medium text-slate-600">
                            <span>0 GB</span>
                            <span>{stats.storage.percent}% Used</span>
                            <span>{stats.storage.limitTB * 1024} GB</span>
                        </div>
                    </div>

                    {/* SETTINGS CARD */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <h3 className="font-semibold text-slate-800 mb-6 flex items-center gap-2">
                            <Server size={18} className="text-slate-600" />
                            System Policies
                        </h3>

                        <div className="flex items-center justify-between py-4 border-b border-slate-100">
                            <div>
                                <div className="font-medium text-slate-900">Mandatory Cloud Backup</div>
                                <div className="text-xs text-slate-500">Enforce daily cloud backups for all companies</div>
                            </div>
                            <button
                                onClick={() => toggleSetting('mandatoryCloudBackup')}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${stats.settings.mandatoryCloudBackup ? 'bg-blue-600' : 'bg-slate-300'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${stats.settings.mandatoryCloudBackup ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>

                        <div className="flex items-center justify-between py-4">
                            <div>
                                <div className="font-medium text-slate-900">Auto Yearly Archive</div>
                                <div className="text-xs text-slate-500">Archive inactive data annually to cold storage</div>
                            </div>
                            <button
                                onClick={() => toggleSetting('autoYearlyArchive')}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${stats.settings.autoYearlyArchive ? 'bg-blue-600' : 'bg-slate-300'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${stats.settings.autoYearlyArchive ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                    </div>

                    {/* MANUAL SYNC */}
                    <div className="bg-gradient-to-br from-indigo-50 to-white rounded-xl border border-indigo-100 p-6">
                        <h3 className="font-semibold text-indigo-900 mb-2">System Backup & Sync</h3>
                        <p className="text-sm text-indigo-700/80 mb-4">Trigger an immediate system-wide backup and status check.</p>
                        <button
                            onClick={handleManualSync}
                            disabled={syncing}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2"
                        >
                            <RotateCw size={18} className={syncing ? "animate-spin" : ""} />
                            {syncing ? 'Backing Up System...' : 'Trigger System Backup'}
                        </button>
                    </div>
                </div>

                {/* RIGHT COL: ACTIVITY & ALERTS */}
                <div className="space-y-6">
                    {/* STATS ROW */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl">
                            <div className="text-emerald-800 text-xs font-bold uppercase tracking-wider mb-1">Active Sync</div>
                            <div className="text-2xl font-bold text-emerald-900">{stats.syncHealth.active}</div>
                            <div className="text-xs text-emerald-600 mt-1">Companies Online (24h)</div>
                        </div>
                        <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
                            <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Total Companies</div>
                            <div className="text-2xl font-bold text-slate-700">{stats.syncHealth.total}</div>
                            <div className="text-xs text-slate-400 mt-1">Registered Tenants</div>
                        </div>
                    </div>

                    {/* LOGS */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 h-[500px] flex flex-col">
                        <h3 className="font-semibold text-slate-800 mb-6 flex items-center gap-2">
                            <Clock size={18} className="text-slate-400" />
                            System Audit & Sync Logs
                        </h3>

                        <div className="overflow-y-auto pr-2 space-y-6 custom-scrollbar flex-1">
                            {logs.length > 0 ? logs.map((log, idx) => (
                                <div key={log._id || idx} className="relative flex gap-4 group">
                                    {/* Timeline Line */}
                                    {idx !== logs.length - 1 && (
                                        <div className="absolute left-[11px] top-8 bottom-[-24px] w-px bg-slate-200"></div>
                                    )}

                                    <div className="relative z-10 flex-shrink-0 mt-1">
                                        {log.action?.includes('ERROR') || log.action?.includes('FAIL') ? (
                                            <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center border border-white shadow-sm">
                                                <AlertTriangle size={12} className="text-red-600" />
                                            </div>
                                        ) : (
                                            <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center border border-white shadow-sm">
                                                <CheckCircle size={12} className="text-emerald-600" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 pb-1">
                                        <div className="flex justify-between items-start">
                                            <div className="text-sm font-medium text-slate-900">{log.action.replace(/_/g, ' ')}</div>
                                            <div className="text-[10px] font-mono text-slate-400 whitespace-nowrap">
                                                {new Date(log.timestamp).toLocaleString()}
                                            </div>
                                        </div>
                                        <div className="text-xs text-slate-500 mt-0.5">
                                            {log.actorId?.fullName || 'System'} • {log.targetModel || 'Global'}
                                        </div>
                                        {log.details && (
                                            <div className="mt-2 bg-slate-50 p-2 rounded border border-slate-100 text-[10px] font-mono text-slate-600">
                                                {JSON.stringify(log.details)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-10 text-slate-400 text-sm">
                                    No recent logs found.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
