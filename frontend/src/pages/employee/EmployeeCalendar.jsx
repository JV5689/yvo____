import React, { useEffect, useState, useRef, useCallback } from 'react';
import api from '../../services/api';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, ArrowLeft, ArrowRight, X } from 'lucide-react';

export default function EmployeeCalendar() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedEvent, setSelectedEvent] = useState(null); // For modal
    const scrollRef = useRef(null);

    const fetchEvents = useCallback(async () => {
        try {
            const res = await api.get('/employee/dashboard/calendar');
            setEvents(res.data);
        } catch (error) {
            console.error("Error fetching calendar", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    // Calendar Helpers
    const getDaysInMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const renderCalendarGrid = () => {
        const daysInMonth = getDaysInMonth(currentDate);
        const firstDay = getFirstDayOfMonth(currentDate);
        const days = [];

        // Empty cells for previous month
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-32 bg-slate-50 border border-slate-100"></div>);
        }

        // Days of current month
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
            const dayEvents = events.filter(e => new Date(e.start).toDateString() === dateStr);
            const isToday = new Date().toDateString() === dateStr;

            days.push(
                <div key={day} className={`h-32 border border-slate-100 p-2 overflow-y-auto hover:bg-slate-50 transition-colors ${isToday ? 'bg-blue-50/30' : 'bg-white'}`}>
                    <div className="flex justify-between items-start mb-1">
                        <span className={`text-sm font-medium rounded-full w-7 h-7 flex items-center justify-center ${isToday ? 'bg-indigo-600 text-white' : 'text-slate-700'}`}>
                            {day}
                        </span>
                    </div>
                    <div className="space-y-1">
                        {dayEvents.map(event => (
                            <div
                                key={event._id}
                                onClick={(e) => { e.stopPropagation(); setSelectedEvent(event); }}
                                className={`text-xs p-1.5 rounded border border-l-2 mb-1 cursor-pointer truncate hover:opacity-80 transition-opacity
                                    ${event.type === 'Meeting' ? 'bg-purple-50 border-purple-100 border-l-purple-500 text-purple-700' :
                                        event.type === 'Holiday' ? 'bg-sky-50 border-sky-100 border-l-sky-500 text-sky-700' :
                                            'bg-indigo-50 border-indigo-100 border-l-indigo-500 text-indigo-700'}`}
                                title="Click to view details"
                            >
                                <div className="font-medium truncate">{event.title}</div>
                                {event.start && (
                                    <div className="text-[10px] opacity-80">
                                        {new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        return days;
    };

    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 font-medium animate-pulse">Loading calendar...</p>
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-16">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-semibold text-slate-900 flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                            <CalendarIcon size={24} />
                        </div>
                        Events & Holidays
                    </h1>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                    <div className="flex items-center bg-white border-2 border-slate-100 rounded-2xl shadow-sm w-full md:w-auto overflow-hidden">
                        <button onClick={prevMonth} className="p-3 hover:bg-slate-50 text-slate-400 hover:text-slate-900 transition-colors border-r border-slate-50">
                            <ChevronLeft size={20} strokeWidth={2} />
                        </button>
                        <span className="px-6 py-2.5 font-semibold text-slate-900 min-w-[140px] text-center flex-1 md:flex-none text-sm uppercase tracking-widest">
                            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                        </span>
                        <button onClick={nextMonth} className="p-3 hover:bg-slate-50 text-slate-400 hover:text-slate-900 transition-colors border-l border-slate-50">
                            <ChevronRight size={20} strokeWidth={2} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden flex flex-col h-full">
                <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden snap-x snap-mandatory" ref={scrollRef}>
                    <div className="min-w-[700px]">
                        {/* Days Header */}
                        <div className="grid grid-cols-7 bg-slate-50/50 border-b border-slate-100">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                <div key={day} className="py-4 text-center text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em]">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Grid */}
                        <div className="grid grid-cols-7 bg-slate-100 gap-[1px]">
                            {renderCalendarGrid()}
                        </div>
                    </div>
                </div>
            </div>

            {/* Hint for mobile */}
            <div className="md:hidden flex items-center justify-center gap-2 text-slate-400 animate-pulse">
                <ArrowLeft size={14} />
                <span className="text-[10px] font-semibold uppercase tracking-widest">Swipe for full grid</span>
                <ArrowRight size={14} />
            </div>

            {/* Event Details Modal */}
            {selectedEvent && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4 z-50 animate-in fade-in duration-300">
                    <div className="bg-white rounded-t-3xl md:rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-full md:slide-in-from-bottom-4 duration-300">
                        <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-white">
                            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                                <CalendarIcon size={18} className="text-indigo-600" />
                                Event Details
                            </h3>
                            <button
                                onClick={() => setSelectedEvent(null)}
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 md:p-8 space-y-6">
                            <div>
                                <h2 className="text-2xl font-semibold text-slate-900 mb-3 leading-tight tracking-tight">{selectedEvent.title}</h2>
                                <span className={`text-[10px] font-semibold px-3 py-1.5 rounded-lg uppercase tracking-wider
                                    ${selectedEvent.type === 'Meeting' ? 'bg-purple-50 text-purple-600 border border-purple-100' :
                                        selectedEvent.type === 'Holiday' ? 'bg-sky-50 text-sky-600 border border-sky-100' :
                                            'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                                    {selectedEvent.type}
                                </span>
                            </div>

                            <div className="flex items-center gap-4 text-slate-600 text-sm bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                                <div className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-100 text-indigo-600">
                                    <Clock size={18} strokeWidth={2} />
                                </div>
                                <div className="min-w-0">
                                    <div className="font-semibold text-slate-900 uppercase text-[10px] tracking-widest truncate mb-0.5">
                                        {new Date(selectedEvent.start).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </div>
                                    <div className="text-slate-500 font-medium text-xs">
                                        {new Date(selectedEvent.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — {new Date(selectedEvent.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>

                            {selectedEvent.description && (
                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Description</h4>
                                    <div className="text-sm font-medium text-slate-600 bg-slate-50/50 p-5 rounded-2xl border border-slate-100 leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
                                        {selectedEvent.description}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="p-6 bg-white border-t border-slate-50">
                            <button
                                onClick={() => setSelectedEvent(null)}
                                className="w-full py-3.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 uppercase tracking-widest hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-[0.98] shadow-sm"
                            >
                                Close Details
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
