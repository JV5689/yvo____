import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Clock, Video, List, Trash2, X, Check } from 'lucide-react';
import { useUI } from '../../context/UIContext';

export default function CalendarModule() {
    const { alert, confirm, toast } = useUI();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // State for creating/editing
    const [isEditing, setIsEditing] = useState(false);
    const [currentEventId, setCurrentEventId] = useState(null);

    const [eventForm, setEventForm] = useState({
        title: '',
        description: '',
        start: '',
        end: '',
        type: 'Meeting',
        visibility: 'public', // public, category
        targetCategories: []
    });

    const CATEGORIES = ['General', 'Sales', 'Dev', 'Management'];

    useEffect(() => {
        fetchEvents();
    }, [currentDate]);

    const fetchEvents = async () => {
        try {
            const companyId = localStorage.getItem('companyId');
            const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

            const response = await api.get('/calendar', {
                params: {
                    companyId,
                    start: startOfMonth.toISOString(),
                    end: endOfMonth.toISOString()
                }
            });
            setEvents(response.data);
        } catch (err) {
            console.error("Failed to fetch events", err);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setEventForm({
            title: '',
            description: '',
            start: '',
            end: '',
            type: 'Meeting',
            visibility: 'public',
            targetCategories: []
        });
        setIsEditing(false);
        setCurrentEventId(null);
    };

    const handleOpenCreateModal = (dateStr) => {
        resetForm();
        if (dateStr) {
            // If checking from specific day click
            const d = new Date(dateStr);
            const startStr = new Date(d.setHours(9, 0, 0)).toISOString().slice(0, 16);
            const endStr = new Date(d.setHours(10, 0, 0)).toISOString().slice(0, 16);
            setEventForm({ ...eventForm, start: startStr, end: endStr });
        } else {
            // Default to now/next hour if general button clicked
            const now = new Date();
            const startStr = new Date(now.setMinutes(0, 0, 0)).toISOString().slice(0, 16);
            const endStr = new Date(now.getTime() + 60 * 60 * 1000).toISOString().slice(0, 16);
            setEventForm({ ...eventForm, start: startStr, end: endStr });
        }
        setShowModal(true);
    };

    const handleOpenEditModal = (event) => {
        setEventForm({
            title: event.title,
            description: event.description || '',
            start: event.start.slice(0, 16), // Assuming ISO string format from DB
            end: event.end.slice(0, 16),
            type: event.type,
            visibility: event.visibility || 'public',
            targetCategories: event.targetCategories || []
        });
        setIsEditing(true);
        setCurrentEventId(event._id || event.id);
        setShowModal(true);
    };

    const handleSaveEvent = async (e) => {
        e.preventDefault();
        try {
            const companyId = localStorage.getItem('companyId');
            const payload = { ...eventForm, companyId };

            if (isEditing) {
                await api.put(`/calendar/${currentEventId}`, payload);
            } else {
                await api.post('/calendar', payload);
            }

            toast.success(isEditing ? 'Event updated successfully' : 'Event created successfully');
            fetchEvents();
            handleCloseModal();
        } catch (err) {
            console.error(err);
            alert('Error', 'Failed to save event', 'error');
        }
    };

    const handleDeleteEvent = async () => {
        const ok = await confirm('Delete Event', "Are you sure you want to delete this event?", 'Delete');
        if (!ok) return;
        try {
            await api.delete(`/calendar/${currentEventId}`);
            toast.success('Event deleted successfully');
            fetchEvents();
            handleCloseModal();
        } catch (err) {
            console.error(err);
            alert('Error', 'Failed to delete event', 'error');
        }
    };

    const toggleCategory = (cat) => {
        setEventForm(prev => {
            const cats = prev.targetCategories.includes(cat)
                ? prev.targetCategories.filter(c => c !== cat)
                : [...prev.targetCategories, cat];
            return { ...prev, targetCategories: cats };
        });
    };

    // --- Calendar Render Logic ---
    const daysInMonth = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        return new Date(year, month + 1, 0).getDate();
    };

    const startDayOfMonth = () => {
        return new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    };

    const renderCalendarDays = () => {
        const totalDays = daysInMonth();
        const startDay = startDayOfMonth();
        const daysArray = [];

        // Empty cells
        for (let i = 0; i < startDay; i++) {
            daysArray.push(<div key={`empty-${i}`} className="h-32 bg-slate-50/50 border-b border-r border-slate-100" />);
        }

        // Days
        for (let day = 1; day <= totalDays; day++) {
            const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const dateStr = dateObj.toDateString();
            const dayEvents = events.filter(e => new Date(e.start).toDateString() === dateStr);

            daysArray.push(
                <div key={day} className="h-32 bg-white border-b border-r border-slate-100 p-2 hover:bg-slate-50 transition relative group">
                    <span className={`text-sm font-medium ${new Date().toDateString() === dateStr ? 'bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center' : 'text-slate-700'}`}>
                        {day}
                    </span>
                    <div className="mt-1 space-y-1 overflow-y-auto max-h-20 custom-scrollbar">
                        {dayEvents.map(ev => (
                            <button
                                key={ev._id || ev.id}
                                onClick={(e) => { e.stopPropagation(); handleOpenEditModal(ev); }}
                                className={`w-full text-left text-xs p-1 rounded border overflow-hidden truncate transition-all hover:scale-[1.02] ${ev.type === 'Meeting' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                    ev.type === 'Task' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-amber-100 text-amber-800 border-amber-200'
                                    }`}
                            >
                                {ev.title}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => handleOpenCreateModal(dateObj)}
                        className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 bg-indigo-50 text-indigo-600 rounded p-1 hover:bg-indigo-100 transition shadow-sm"
                    >
                        <Plus size={14} />
                    </button>
                </div>
            );
        }
        return daysArray;
    };

    const changeMonth = (offset) => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
    };

    return (
        <div className="h-full flex flex-col space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Calendar & Reminders</h1>
                    <p className="text-sm text-slate-500">Schedule meetings, tasks, and deadlines.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
                        <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-slate-100 rounded"><ChevronLeft size={20} /></button>
                        <span className="w-32 text-center font-semibold text-slate-700">
                            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </span>
                        <button onClick={() => changeMonth(1)} className="p-1 hover:bg-slate-100 rounded"><ChevronRight size={20} /></button>
                    </div>
                    <button
                        onClick={() => handleOpenCreateModal()}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm transition-all active:scale-95"
                    >
                        <Plus size={18} /> New Event
                    </button>
                </div>
            </div>

            <div className="flex-grow bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
                <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="py-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
                            {day}
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-7 flex-grow overflow-auto">
                    {renderCalendarDays()}
                </div>
            </div>

            {/* MODAL */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50/50">
                            <h2 className="text-xl font-bold text-slate-800">
                                {isEditing ? 'Edit Event' : 'New Event'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveEvent} className="p-6 space-y-4">
                            <input
                                required
                                placeholder="Event Title"
                                className="w-full border border-slate-200 p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={eventForm.title}
                                onChange={e => setEventForm({ ...eventForm, title: e.target.value })}
                            />

                            <textarea
                                placeholder="Description (Optional)"
                                className="w-full border border-slate-200 p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none"
                                value={eventForm.description}
                                onChange={e => setEventForm({ ...eventForm, description: e.target.value })}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 mb-1 block">Start</label>
                                    <input
                                        required
                                        type="datetime-local"
                                        className="w-full border border-slate-200 p-2 rounded-lg"
                                        value={eventForm.start}
                                        onChange={e => setEventForm({ ...eventForm, start: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 mb-1 block">End</label>
                                    <input
                                        required
                                        type="datetime-local"
                                        className="w-full border border-slate-200 p-2 rounded-lg"
                                        value={eventForm.end}
                                        onChange={e => setEventForm({ ...eventForm, end: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 mb-1 block">Type</label>
                                    <select
                                        className="w-full border border-slate-200 p-2 rounded-lg bg-white"
                                        value={eventForm.type}
                                        onChange={e => setEventForm({ ...eventForm, type: e.target.value })}
                                    >
                                        <option value="Meeting">Meeting</option>
                                        <option value="Task">Task</option>
                                        <option value="Reminder">Reminder</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 mb-1 block">Visibility</label>
                                    <select
                                        className="w-full border border-slate-200 p-2 rounded-lg bg-white"
                                        value={eventForm.visibility}
                                        onChange={e => setEventForm({ ...eventForm, visibility: e.target.value })}
                                    >
                                        <option value="public">All Employees</option>
                                        <option value="category">Specific Teams</option>
                                    </select>
                                </div>
                            </div>

                            {/* Category Selector */}
                            {eventForm.visibility === 'category' && (
                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    <label className="text-xs font-semibold text-slate-500 mb-2 block">Select Teams</label>
                                    <div className="flex flex-wrap gap-2">
                                        {CATEGORIES.map(cat => (
                                            <button
                                                key={cat}
                                                type="button"
                                                onClick={() => toggleCategory(cat)}
                                                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${eventForm.targetCategories.includes(cat)
                                                    ? 'bg-indigo-100 text-indigo-700 border-indigo-200'
                                                    : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                                                    }`}
                                            >
                                                {eventForm.targetCategories.includes(cat) && <Check size={12} className="inline mr-1" />}
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                    {eventForm.targetCategories.length === 0 && (
                                        <p className="text-xs text-red-500 mt-2">Please select at least one team.</p>
                                    )}
                                </div>
                            )}

                            <div className="flex justify-between items-center pt-4 border-t border-slate-100 mt-4">
                                {isEditing ? (
                                    <button
                                        type="button"
                                        onClick={handleDeleteEvent}
                                        className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium text-sm"
                                    >
                                        <Trash2 size={16} /> Delete
                                    </button>
                                ) : (
                                    <div></div> // Spacer
                                )}

                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium text-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm shadow-sm transition-all active:scale-95"
                                    >
                                        {isEditing ? 'Update Event' : 'Add Event'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
