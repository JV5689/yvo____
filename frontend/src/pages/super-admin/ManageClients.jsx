import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Trash2, Upload, Plus, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

export default function ManageClients() {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);

    const [newName, setNewName] = useState('');
    const [newLogo, setNewLogo] = useState(''); // Base64 string

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        try {
            const res = await api.get('/public/clients');
            setClients(res.data);
        } catch (error) {
            console.error('Error fetching clients:', error);
            toast.error('Failed to load clients');
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 500 * 1024) { // 500KB limit
                toast.error('Image size too large. Please use an image under 500KB.');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewLogo(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAddClient = async (e) => {
        e.preventDefault();
        if (!newName || !newLogo) {
            toast.error('Please provide both name and logo.');
            return;
        }

        setAdding(true);
        try {
            const res = await api.post('/sa/clients', { name: newName, logoUrl: newLogo });
            setClients([res.data, ...clients]);
            setNewName('');
            setNewLogo('');
            toast.success('Client added successfully!');
        } catch (error) {
            console.error('Error adding client:', error);
            toast.error('Failed to add client.');
        } finally {
            setAdding(false);
        }
    };

    const handleDeleteClient = async (id) => {
        const result = await Swal.fire({
            title: 'Delete Client?',
            text: 'Are you sure you want to delete this client?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Delete',
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            reverseButtons: true,
        });
        if (!result.isConfirmed) return;

        try {
            await api.delete(`/sa/clients/${id}`);
            setClients(clients.filter(c => c._id !== id));
            toast.success('Client deleted.');
        } catch (error) {
            console.error('Error deleting client:', error);
            toast.error('Failed to delete client.');
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Manage Clients</h1>
                <p className="text-slate-500">Add and remove client logos displayed on the homepage.</p>
            </div>

            {/* Add New Client Form */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Add New Client</h3>
                <form onSubmit={handleAddClient} className="flex flex-col md:flex-row gap-4 items-start md:items-end">
                    <div className="flex-1 w-full">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Client Name</label>
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="e.g. Acme Corp"
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        />
                    </div>

                    <div className="w-full md:w-auto">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Logo (Max 500KB)</label>
                        <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 transition-colors">
                            <Upload size={18} className="text-slate-500" />
                            <span className="text-sm text-slate-600 truncate max-w-[150px]">
                                {newLogo ? 'Image Selected' : 'Upload Logo'}
                            </span>
                            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={adding || !newName || !newLogo}
                        className="w-full md:w-auto px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                        {adding ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                        Add Client
                    </button>
                </form>
                {/* Preview */}
                {newLogo && (
                    <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300 inline-block">
                        <p className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wider">Preview</p>
                        <img src={newLogo} alt="Preview" className="h-12 object-contain" />
                    </div>
                )}
            </div>

            {/* Clients List */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-900">Existing Clients</h3>
                    <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded-full">{clients.length} Clients</span>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-slate-500 animate-pulse">Loading clients...</div>
                ) : clients.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                        No clients added yet. Add one above!
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 p-6">
                        {clients.map((client) => (
                            <div key={client._id} className="group relative bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col items-center justify-center gap-3 hover:shadow-md transition-all">
                                <div className="h-16 w-full flex items-center justify-center p-2 bg-white rounded-lg">
                                    <img src={client.logoUrl} alt={client.name} className="max-h-full max-w-full object-contain grayscale group-hover:grayscale-0 transition-all duration-300" />
                                </div>
                                <span className="text-sm font-medium text-slate-700">{client.name}</span>
                                <button
                                    onClick={() => handleDeleteClient(client._id)}
                                    className="absolute -top-2 -right-2 bg-red-100 text-red-600 p-1.5 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                    title="Delete Client"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
