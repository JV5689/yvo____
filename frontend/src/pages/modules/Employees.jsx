import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Mail, Phone, MoreVertical, Briefcase, UserCheck, Trash2, Edit2, X, Eye } from 'lucide-react';
import api from '../../services/api';
import EmployeeDetailsModal from '../../components/employee/EmployeeDetailsModal';
import { useUI } from '../../context/UIContext';

export default function Employees() {
    const { confirm, alert, toast } = useUI();
    const [searchTerm, setSearchTerm] = useState('');
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentEmployeeId, setCurrentEmployeeId] = useState(null);
    const [userToView, setUserToView] = useState(null);
    const [isViewDeleted, setIsViewDeleted] = useState(false);

    const [employeeForm, setEmployeeForm] = useState({
        firstName: '', lastName: '', email: '', phone: '', password: '',
        position: '', department: '', salary: '', status: 'Active', category: 'General',
        freeLeavesPerMonth: 1, workingDaysPerWeek: 6
    });

    useEffect(() => {
        fetchEmployees();
    }, [isViewDeleted]);

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            const companyId = localStorage.getItem('companyId');
            const response = await api.get('/employees', { params: { companyId, isDeleted: isViewDeleted } });
            setEmployees(response.data);
        } catch (err) {
            console.error("Failed to fetch employees", err);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setEmployeeForm({
            firstName: '', lastName: '', email: '', phone: '', password: '',
            position: '', department: '', salary: '', status: 'Active', category: 'General',
            freeLeavesPerMonth: 1, workingDaysPerWeek: 6
        });
        setIsEditing(false);
        setCurrentEmployeeId(null);
    };

    const handleOpenCreateModal = () => {
        resetForm();
        setShowModal(true);
    };

    const handleOpenEditModal = (emp) => {
        setEmployeeForm({
            firstName: emp.firstName,
            lastName: emp.lastName,
            email: emp.email,
            phone: emp.phone,
            password: '',
            position: emp.position,
            department: emp.department || '',
            salary: emp.salary,
            status: emp.status,
            category: emp.category || 'General',
            freeLeavesPerMonth: emp.freeLeavesPerMonth !== undefined ? emp.freeLeavesPerMonth : 1,
            workingDaysPerWeek: emp.workingDaysPerWeek || 6
        });
        setIsEditing(true);
        setCurrentEmployeeId(emp._id || emp.id);
        setShowModal(true);
    };

    const handleSaveEmployee = async (e) => {
        e.preventDefault();
        try {
            const companyId = localStorage.getItem('companyId');

            if (isEditing) {
                const updates = { ...employeeForm };
                if (!updates.password) delete updates.password;
                await api.put(`/employees/${currentEmployeeId}`, updates);
            } else {
                await api.post('/employees', { ...employeeForm, companyId });
            }

            setShowModal(false);
            resetForm();
            fetchEmployees();
        } catch (err) {
            console.error(err);
            alert('Error', err.response?.data?.message || 'Failed to save employee', 'error');
        }
    };

    const handleDeleteEmployee = async (id) => {
        const ok = await confirm('Delete Employee', "Are you sure you want to delete this employee?", 'Delete');
        if (!ok) return;
        try {
            await api.delete(`/employees/${id}`);
            setEmployees(employees.filter(emp => (emp._id || emp.id) !== id));
        } catch (err) {
            console.error("Failed to delete employee", err);
            alert("Error", "Failed to delete employee", "error");
        }
    };

    const handleRestoreEmployee = async (id) => {
        const ok = await confirm('Restore Employee', "Restore this employee?", 'Restore', 'primary');
        if (!ok) return;
        try {
            await api.patch(`/employees/${id}/restore`);
            fetchEmployees();
        } catch (err) {
            console.error("Failed to restore", err);
            alert("Error", err.response?.data?.message || "Failed to restore employee", "error");
        }
    };

    if (loading) return <div className="p-10 text-center">Loading employees...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Employee Management</h1>
                    <p className="text-sm text-slate-500 mt-1">Manage your team, roles, and payroll information.</p>
                </div>
                <button
                    onClick={handleOpenCreateModal}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm transition-all active:scale-95"
                >
                    <Plus size={18} /> Add Employee
                </button>
            </div>

            {/* FILTERS & SEARCH */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col md:flex-row gap-4 justify-between">
                <div className="relative flex-1 md:max-w-md">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by name, email, or role..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsViewDeleted(!isViewDeleted)}
                        className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm font-medium transition ${isViewDeleted ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                    >
                        <Trash2 size={16} /> {isViewDeleted ? 'Show Active' : 'Trash'}
                    </button>
                    <button className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm font-medium text-slate-600 hover:bg-slate-50">
                        <Filter size={16} /> Filter
                    </button>
                </div>
            </div>

            {/* EMPLOYEE GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {employees.filter(emp =>
                    emp.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    emp.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    emp.position.toLowerCase().includes(searchTerm.toLowerCase())
                ).map((employee) => (
                    <div key={employee._id || employee.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg">
                                    {employee.firstName[0]}{employee.lastName[0]}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-900">{employee.firstName} {employee.lastName}</h3>
                                    <p className="text-xs text-slate-500">{employee.position}</p>
                                </div>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${employee.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                {employee.status}
                            </span>
                        </div>

                        <div className="mt-6 space-y-3">
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Mail size={16} className="text-slate-400" />
                                {employee.email}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Briefcase size={16} className="text-slate-400" />
                                {employee.department || 'No Department'}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                <UserCheck size={16} className="text-slate-400" />
                                Hired: {new Date(employee.dateHired).toLocaleDateString()}
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
                            <span className="text-sm font-semibold text-slate-900">₹{employee.salary?.toLocaleString()}/yr</span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setUserToView(employee)}
                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                    title="View Details"
                                >
                                    <Eye size={18} />
                                </button>

                                {!isViewDeleted ? (
                                    <>
                                        <button
                                            onClick={() => handleDeleteEmployee(employee._id || employee.id)}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                            title="Delete Employee"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleOpenEditModal(employee)}
                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                                            title="Edit Employee"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => handleRestoreEmployee(employee._id || employee.id)}
                                        className="text-xs font-bold text-indigo-600 px-3 py-1 bg-indigo-50 rounded-lg hover:bg-indigo-100"
                                    >
                                        Restore
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* CREATE/EDIT MODAL */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50/50">
                            <h2 className="text-xl font-bold text-slate-800">
                                {isEditing ? 'Edit Employee' : 'Add New Employee'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveEmployee} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 mb-1 block">First Name</label>
                                    <input required className="w-full border border-slate-200 p-2 rounded-lg" value={employeeForm.firstName} onChange={e => setEmployeeForm({ ...employeeForm, firstName: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 mb-1 block">Last Name</label>
                                    <input required className="w-full border border-slate-200 p-2 rounded-lg" value={employeeForm.lastName} onChange={e => setEmployeeForm({ ...employeeForm, lastName: e.target.value })} />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-slate-500 mb-1 block">Email</label>
                                <input required type="email" className="w-full border border-slate-200 p-2 rounded-lg" value={employeeForm.email} onChange={e => setEmployeeForm({ ...employeeForm, email: e.target.value })} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 mb-1 block">Phone (Login ID)</label>
                                    <input required className="w-full border border-slate-200 p-2 rounded-lg" value={employeeForm.phone} onChange={e => setEmployeeForm({ ...employeeForm, phone: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 mb-1 block">Password {isEditing && '(Leave blank to keep)'}</label>
                                    <input type="password" className="w-full border border-slate-200 p-2 rounded-lg" value={employeeForm.password} onChange={e => setEmployeeForm({ ...employeeForm, password: e.target.value })} required={!isEditing} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 mb-1 block">Category</label>
                                    <select className="w-full border border-slate-200 p-2 rounded-lg bg-white" value={employeeForm.category} onChange={e => setEmployeeForm({ ...employeeForm, category: e.target.value })}>
                                        <option value="General">General</option>
                                        <option value="Sales">Sales</option>
                                        <option value="Dev">Dev</option>
                                        <option value="Management">Management</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 mb-1 block">Status</label>
                                    <select className="w-full border border-slate-200 p-2 rounded-lg bg-white" value={employeeForm.status} onChange={e => setEmployeeForm({ ...employeeForm, status: e.target.value })}>
                                        <option value="Active">Active</option>
                                        <option value="On Leave">On Leave</option>
                                        <option value="Terminated">Terminated</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 mb-1 block">Position</label>
                                    <input required className="w-full border border-slate-200 p-2 rounded-lg" value={employeeForm.position} onChange={e => setEmployeeForm({ ...employeeForm, position: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 mb-1 block">Department</label>
                                    <input className="w-full border border-slate-200 p-2 rounded-lg" value={employeeForm.department} onChange={e => setEmployeeForm({ ...employeeForm, department: e.target.value })} />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-slate-500 mb-1 block">Annual Salary (₹)</label>
                                <input required type="number" className="w-full border border-slate-200 p-2 rounded-lg" value={employeeForm.salary} onChange={e => setEmployeeForm({ ...employeeForm, salary: e.target.value })} />
                                {isEditing && <p className="text-xs text-slate-400 mt-1">Changes to salary will be recorded in history.</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 mb-1 block">Monthly Free Leaves</label>
                                    <input required type="number" min="0" className="w-full border border-slate-200 p-2 rounded-lg" value={employeeForm.freeLeavesPerMonth} onChange={e => setEmployeeForm({ ...employeeForm, freeLeavesPerMonth: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 mb-1 block">Working Days / Week</label>
                                    <select className="w-full border border-slate-200 p-2 rounded-lg bg-white" value={employeeForm.workingDaysPerWeek} onChange={e => setEmployeeForm({ ...employeeForm, workingDaysPerWeek: Number(e.target.value) })}>
                                        <option value={4}>4 Days</option>
                                        <option value={5}>5 Days</option>
                                        <option value={6}>6 Days</option>
                                        <option value={7}>7 Days</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-100">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium">Cancel</button>
                                <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium shadow-sm transition-all active:scale-95">
                                    {isEditing ? 'Update Employee' : 'Create Employee'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* DETAILS MODAL */}
            {userToView && (
                <EmployeeDetailsModal
                    employee={userToView}
                    onClose={() => setUserToView(null)}
                />
            )}
        </div>
    );
}
