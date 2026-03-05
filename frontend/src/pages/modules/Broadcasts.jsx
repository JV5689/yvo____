import React, { useState, useEffect } from 'react';
import { MessageSquare, Users, Send, Trash2, UserPlus, X } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { useUI } from '../../context/UIContext';

export default function Broadcasts() {
    const { confirm } = useUI();
    const [subTab, setSubTab] = useState('compose');
    const [allEmployees, setAllEmployees] = useState([]);
    const companyId = localStorage.getItem('companyId');

    // Modal & Selection States
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [groups, setGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [newGroupName, setNewGroupName] = useState('');
    const [selectedEmployeeId, setSelectedEmployeeId] = useState('');

    // Message Composition State
    const [messageContent, setMessageContent] = useState('');
    const [recipientId, setRecipientId] = useState('all'); // 'all' or groupId

    const fetchGroups = async () => {
        try {
            const { data } = await api.get(`/employees/groups?companyId=${companyId}`);
            setGroups(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to fetch groups", error);
            toast.error('Failed to load groups');
        }
    };

    const fetchEmployees = async () => {
        try {
            const { data } = await api.get(`/employees?companyId=${companyId}`);
            if (Array.isArray(data)) {
                setAllEmployees(data.map(e => ({
                    id: e._id,
                    name: `${e.firstName} ${e.lastName}`,
                    firstName: e.firstName,
                    lastName: e.lastName,
                })));
            }
        } catch (error) {
            console.error("Failed to fetch employees", error);
        }
    };

    useEffect(() => {
        if (companyId) {
            fetchGroups();
            fetchEmployees();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [companyId]);

    const handleCreateGroup = async (e) => {
        e.preventDefault();
        if (!newGroupName.trim()) return;

        try {
            const { data } = await api.post('/employees/groups', {
                companyId,
                name: newGroupName,
                members: []
            });
            setGroups(prev => [data, ...prev]);
            setNewGroupName('');
            setShowCreateGroup(false);
            toast.success('Group created successfully');
        } catch (error) {
            console.error(error);
            toast.error('Failed to create group');
        }
    };

    const handleDeleteGroup = async (groupId) => {
        const ok = await confirm('Delete Group', 'Are you sure you want to delete this group? This action cannot be undone.', 'Delete');
        if (!ok) return;

        try {
            await api.delete(`/employees/groups/${groupId}`);
            setGroups(prev => prev.filter(g => g._id !== groupId));
            if (selectedGroup?._id === groupId) setSelectedGroup(null);
            toast.success('Group deleted');
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete group');
        }
    };

    const handleAddMember = async () => {
        if (!selectedEmployeeId || !selectedGroup) return;

        const currentMembers = selectedGroup.members || [];
        if (currentMembers.some(m => m._id === selectedEmployeeId)) {
            toast.error('Member already in group');
            return;
        }

        const employee = allEmployees.find(e => e.id === selectedEmployeeId);
        if (!employee) return;

        // Optimistic update for UI responsiveness
        const newMember = { _id: employee.id, firstName: employee.firstName, lastName: employee.lastName };
        const updatedGroupOptimistic = {
            ...selectedGroup,
            members: [...currentMembers, newMember]
        };
        setSelectedGroup(updatedGroupOptimistic);

        try {
            const updatedMemberIds = updatedGroupOptimistic.members.map(m => m._id);
            const { data } = await api.put(`/employees/groups/${selectedGroup._id}`, {
                name: selectedGroup.name,
                members: updatedMemberIds
            });

            // Sync with server response
            setGroups(prev => prev.map(g => g._id === selectedGroup._id ? data : g));
            setSelectedGroup(data);
            setSelectedEmployeeId('');
            toast.success('Member added');
        } catch (error) {
            console.error(error);
            toast.error('Failed to add member');
            // Revert on failure
            fetchGroups();
            if (selectedGroup) {
                const originalGroup = groups.find(g => g._id === selectedGroup._id);
                if (originalGroup) setSelectedGroup(originalGroup);
            }
        }
    };

    const handleRemoveMember = async (memberId) => {
        if (!selectedGroup) return;

        const ok = await confirm('Remove Member', 'Remove this member?', 'Remove');
        if (!ok) return;

        const currentMembers = selectedGroup.members || [];
        const updatedMembers = currentMembers.filter(m => m._id !== memberId);

        // Optimistic update
        const updatedGroupOptimistic = { ...selectedGroup, members: updatedMembers };
        setSelectedGroup(updatedGroupOptimistic);

        try {
            const updatedMemberIds = updatedMembers.map(m => m._id);
            const { data } = await api.put(`/employees/groups/${selectedGroup._id}`, {
                name: selectedGroup.name,
                members: updatedMemberIds
            });

            setGroups(prev => prev.map(g => g._id === selectedGroup._id ? data : g));
            setSelectedGroup(data);
            toast.success('Member removed');
        } catch (error) {
            console.error(error);
            toast.error('Failed to remove member');
            fetchGroups(); // Revert
        }
    };

    const handleSendMessage = async () => {
        if (!messageContent.trim()) {
            toast.error('Please enter a message');
            return;
        }

        const storedUser = localStorage.getItem('user');
        const user = storedUser ? JSON.parse(storedUser) : null;
        const senderId = user?._id || user?.id;

        if (!senderId) {
            toast.error('User not authenticated properly');
            return;
        }

        try {
            await api.post('/employees/send-message', {
                companyId,
                senderId,
                groupId: recipientId === 'all' ? null : recipientId,
                targetAll: recipientId === 'all',
                content: messageContent,
                attachments: []
            });
            setMessageContent('');
            setRecipientId('all');
            toast.success('Broadcast sent successfully');
        } catch (error) {
            console.error('Failed to send message:', error);
            toast.error('Failed to send broadcast');
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-800">Broadcast Center</h1>

            {/* Navigation Tabs */}
            <div className="flex gap-6 border-b border-slate-200">
                <button
                    onClick={() => setSubTab('compose')}
                    className={`pb-3 text-sm font-medium transition-colors ${subTab === 'compose' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Compose Message
                </button>
                <button
                    onClick={() => setSubTab('groups')}
                    className={`pb-3 text-sm font-medium transition-colors ${subTab === 'groups' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Manage Groups
                </button>
            </div>

            {/* Compose Message Tab */}
            {subTab === 'compose' && (
                <div className="max-w-3xl bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
                        <MessageSquare size={20} className="text-blue-600" />
                        Send Broadcast
                    </h3>
                    <form className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Recipient Group</label>
                            <select
                                value={recipientId}
                                onChange={(e) => setRecipientId(e.target.value)}
                                className="w-full rounded-lg border border-slate-300 p-3 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            >
                                <option value="all">All Employees</option>
                                {groups.map(g => (
                                    <option key={g._id} value={g._id}>{g.name} ({g.members?.length || 0} members)</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Message Content</label>
                            <textarea
                                value={messageContent}
                                onChange={(e) => setMessageContent(e.target.value)}
                                className="w-full rounded-lg border border-slate-300 p-4 h-40 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                                placeholder="Type your message here..."
                            ></textarea>
                        </div>
                        <div className="flex justify-end pt-2">
                            <button
                                type="button"
                                onClick={handleSendMessage}
                                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
                            >
                                <Send size={18} /> Send Broadcast
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Manage Groups Tab */}
            {subTab === 'groups' && (
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm min-h-[500px]">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                            <Users size={20} className="text-blue-600" />
                            Employee Groups
                        </h3>
                        <button
                            onClick={() => setShowCreateGroup(true)}
                            className="text-sm bg-blue-50 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors font-medium flex items-center gap-2"
                        >
                            + Create New Group
                        </button>
                    </div>

                    {/* Inline Create Group Form */}
                    {showCreateGroup && (
                        <div className="mb-6 p-5 bg-slate-50 rounded-xl border border-slate-200 animate-in fade-in slide-in-from-top-2">
                            <h4 className="text-sm font-semibold text-slate-700 mb-3">Create New Group</h4>
                            <form onSubmit={handleCreateGroup} className="flex gap-3">
                                <input
                                    type="text"
                                    value={newGroupName}
                                    onChange={(e) => setNewGroupName(e.target.value)}
                                    placeholder="Enter group name (e.g. Marketing Team)"
                                    className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    autoFocus
                                />
                                <button
                                    type="submit"
                                    className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                                >
                                    Create
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowCreateGroup(false)}
                                    className="bg-white text-slate-600 px-5 py-2.5 rounded-lg text-sm font-medium border border-slate-300 hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Groups Grid */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {groups.map(g => (
                            <div
                                key={g._id}
                                onClick={() => setSelectedGroup(g)}
                                className="group relative p-5 border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all cursor-pointer bg-white"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-semibold text-slate-800 text-lg">{g.name}</h4>
                                    <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-full font-medium">
                                        {g.members?.length || 0}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-500 line-clamp-1">
                                    {(g.members && g.members.length > 0)
                                        ? g.members.map(m => m.firstName).join(', ')
                                        : "No members yet"}
                                </p>
                            </div>
                        ))}
                        {groups.length === 0 && (
                            <div className="col-span-full py-12 text-center text-slate-400">
                                <Users size={48} className="mx-auto mb-3 opacity-20" />
                                <p>No groups found. Create one to get started.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Manage Members Modal */}
            {selectedGroup && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
                        {/* Modal Header */}
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div>
                                <h3 className="font-bold text-lg text-slate-800">{selectedGroup.name}</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Manage group members</p>
                            </div>
                            <button
                                onClick={() => setSelectedGroup(null)}
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 flex-1 overflow-y-auto">
                            {/* Add Member Section */}
                            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 mb-6">
                                <label className="block text-xs font-bold text-blue-800 uppercase tracking-wide mb-2">Add New Member</label>
                                <div className="flex gap-2">
                                    <select
                                        value={selectedEmployeeId}
                                        onChange={(e) => setSelectedEmployeeId(e.target.value)}
                                        className="flex-1 rounded-lg border border-slate-300 text-sm p-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                    >
                                        <option value="">Select Employee...</option>
                                        {allEmployees
                                            .filter(e => !selectedGroup.members?.some(m => m._id === e.id))
                                            .map(e => (
                                                <option key={e.id} value={e.id}>{e.name}</option>
                                            ))
                                        }
                                    </select>
                                    <button
                                        onClick={handleAddMember}
                                        disabled={!selectedEmployeeId}
                                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>

                            {/* Members List */}
                            <div>
                                <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center justify-between">
                                    Current Members
                                    <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                        {selectedGroup.members?.length || 0}
                                    </span>
                                </h4>
                                <div className="space-y-2">
                                    {(!selectedGroup.members || selectedGroup.members.length === 0) ? (
                                        <div className="text-sm text-slate-400 italic py-8 text-center border-2 border-dashed border-slate-100 rounded-xl">
                                            No members in this group yet.
                                        </div>
                                    ) : (
                                        selectedGroup.members.map(m => (
                                            <div key={m._id} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-100 transition-colors group">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-xs font-bold">
                                                        {m.firstName?.[0]}{m.lastName?.[0]}
                                                    </div>
                                                    <span className="text-sm font-medium text-slate-700">{m.firstName} {m.lastName}</span>
                                                </div>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleRemoveMember(m._id); }}
                                                    className="text-red-500 opacity-0 group-hover:opacity-100 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-all"
                                                    title="Remove Member"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
                            <button
                                onClick={() => handleDeleteGroup(selectedGroup._id)}
                                className="text-red-600 text-sm hover:text-red-700 font-medium hover:underline px-2"
                            >
                                Delete Group
                            </button>
                            <button
                                onClick={() => setSelectedGroup(null)}
                                className="bg-white border border-slate-300 text-slate-700 px-5 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
