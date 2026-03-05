import React, { useState, useEffect } from 'react';
import { Plus, Package, AlertTriangle, Search, Filter, X, Edit, Trash2, LayoutGrid, List, RotateCcw, Trash } from 'lucide-react';
import api from '../../services/api';
import { useUI } from '../../context/UIContext';

export default function Inventory() {
    const { confirm, alert, toast } = useUI();
    const [searchTerm, setSearchTerm] = useState('');
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
    const [showTrash, setShowTrash] = useState(false);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentId, setCurrentId] = useState(null);
    const [formData, setFormData] = useState({
        sku: '',
        name: '',
        category: '',
        quantityOnHand: 0,
        reorderLevel: 5,
        sellingPrice: 0,
        description: '',
        image: ''
    });

    useEffect(() => {
        fetchInventory();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showTrash]);

    const fetchInventory = async () => {
        setLoading(true);
        try {
            const companyId = localStorage.getItem('companyId');
            const response = await api.get('/inventory', {
                params: {
                    companyId,
                    showDeleted: showTrash
                }
            });
            setInventory(response.data);
        } catch (err) {
            console.error("Failed to fetch inventory", err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (item = null) => {
        if (item) {
            setCurrentId(item._id || item.id);
            setFormData({
                sku: item.sku,
                name: item.name,
                category: item.category || '',
                quantityOnHand: item.quantityOnHand,
                reorderLevel: item.reorderLevel,
                sellingPrice: item.sellingPrice || 0,
                description: item.description || '',
                image: item.image || ''
            });
        } else {
            setCurrentId(null);
            setFormData({
                sku: '',
                name: '',
                category: '',
                quantityOnHand: 0,
                reorderLevel: 5,
                sellingPrice: 0,
                description: '',
                image: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentId(null);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'quantityOnHand' || name === 'reorderLevel' || name === 'sellingPrice'
                ? parseFloat(value) || 0
                : value
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, image: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const companyId = localStorage.getItem('companyId');
            const data = { ...formData, companyId };

            if (currentId) {
                await api.patch(`/inventory/${currentId}`, data);
                toast.success('Item updated successfully');
            } else {
                await api.post('/inventory', data);
                toast.success('Item created successfully');
            }
            fetchInventory();
            handleCloseModal();
        } catch (err) {
            console.error("Failed to save item", err);
            alert("Error", "Failed to save item: " + (err.response?.data?.message || err.message), "error");
        }
    };

    const handleDelete = async (id) => {
        const ok = await confirm('Move to Trash?', "Are you sure you want to move this item to Trash?", 'Move to Trash');
        if (!ok) return;
        try {
            await api.delete(`/inventory/${id}`);
            fetchInventory();
            toast.success('Item moved to trash');
        } catch (err) {
            console.error("Failed to delete item", err);
            alert("Error", "Failed to delete item", "error");
        }
    };

    const handleRestore = async (id) => {
        try {
            await api.patch(`/inventory/${id}/restore`);
            fetchInventory();
            toast.success('Item restored');
        } catch (err) {
            console.error("Failed to restore item", err);
            alert("Error", "Failed to restore item", "error");
        }
    };

    const handlePermanentDelete = async (id) => {
        const ok = await confirm('Permanent Delete?', "Are you sure? This action cannot be undone.", 'Delete Forever');
        if (!ok) return;
        try {
            await api.delete(`/inventory/${id}/permanent`);
            fetchInventory();
            toast.success('Item deleted permanently');
        } catch (err) {
            console.error("Failed to permanently delete item", err);
            alert("Error", "Failed to permanently delete item", "error");
        }
    };

    // Helper to determine status based on quantity
    const getStatus = (item) => {
        if (item.quantityOnHand <= 0) return 'Out of Stock';
        if (item.quantityOnHand <= item.reorderLevel) return 'Low Stock';
        return 'In Stock';
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'In Stock': return 'bg-green-100 text-green-800';
            case 'Low Stock': return 'bg-amber-100 text-amber-800';
            case 'Out of Stock': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading && !inventory.length) return <div className="p-10 text-center text-slate-500">Loading inventory...</div>;

    const filteredInventory = inventory.filter(i =>
        (i.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (i.sku?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (i.category?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">
                        {showTrash ? 'Inventory Trash' : 'Inventory Management'}
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        {showTrash ? 'View and restore deleted products.' : 'Track stock levels, manage products, and restock.'}
                    </p>
                </div>
                {!showTrash && (
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm transition-all active:scale-95"
                    >
                        <Plus size={18} /> Add Item
                    </button>
                )}
            </div>

            {/* ALERTS (Only show in main view) */}
            {!showTrash && inventory.some(i => i.quantityOnHand <= i.reorderLevel) && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                    <AlertTriangle className="text-amber-600 shrink-0" />
                    <div>
                        <h4 className="font-semibold text-amber-800 text-sm">Low Stock Alert</h4>
                        <p className="text-xs text-amber-700 mt-1">
                            {inventory.filter(i => i.quantityOnHand <= i.reorderLevel).length} items are running low on stock.
                        </p>
                    </div>
                </div>
            )}

            {/* PRODUCT LIST SECTION */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2">
                        {showTrash ? <Trash2 size={20} className="text-red-400" /> : <Package size={20} className="text-slate-400" />}
                        <h3 className="text-lg font-semibold text-slate-800">
                            {showTrash ? 'Deleted Items' : 'Product List'}
                        </h3>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search items..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                            />
                        </div>

                        {/* Trash Toggle Toggle Button */}
                        <button
                            onClick={() => {
                                setShowTrash(!showTrash);
                                setSearchTerm('');
                            }}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${showTrash ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
                            title={showTrash ? "Back to Inventory" : "View Trash"}
                        >
                            {showTrash ? <RotateCcw size={18} /> : <Trash size={18} />}
                            <span className="hidden sm:inline">{showTrash ? 'Inventory' : 'Trash'}</span>
                        </button>

                        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 shrink-0">
                            <button
                                onClick={() => setViewMode('table')}
                                className={`p-1.5 rounded-md transition-all ${viewMode === 'table' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                title="Table View"
                            >
                                <List size={20} />
                            </button>
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                title="Grid View"
                            >
                                <LayoutGrid size={20} />
                            </button>
                        </div>
                    </div>
                </div>

                {viewMode === 'table' ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500">
                                <tr>
                                    <th className="px-6 py-4 text-left tracking-wider">SKU</th>
                                    <th className="px-6 py-4 text-left tracking-wider">Image</th>
                                    <th className="px-6 py-4 text-left tracking-wider">Product Name</th>
                                    <th className="px-6 py-4 text-left tracking-wider">Category</th>
                                    <th className="px-6 py-4 text-left tracking-wider">Stock</th>
                                    <th className="px-6 py-4 text-left tracking-wider">Price</th>
                                    <th className="px-6 py-4 text-left tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-right tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {filteredInventory.map((item) => {
                                    const status = getStatus(item);
                                    return (
                                        <tr key={item._id || item.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-slate-500">{item.sku}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {item.image ? (
                                                    <img src={item.image} alt={item.name} className="h-10 w-10 object-cover rounded-lg border border-slate-200" />
                                                ) : (
                                                    <div className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                                                        <Package size={16} />
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{item.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{item.category || '-'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-800">{item.quantityOnHand}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">₹{item.sellingPrice}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(status)}`}>
                                                    {status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                {showTrash ? (
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => handleRestore(item._id || item.id)}
                                                            className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-600 border border-green-200 rounded-md hover:bg-green-100 transition-colors"
                                                            title="Restore Item"
                                                        >
                                                            <RotateCcw size={16} /> <span className="text-xs font-semibold">Restore</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handlePermanentDelete(item._id || item.id)}
                                                            className="p-1 px-2 text-red-500 hover:text-red-700 bg-red-50 border border-red-100 rounded-md hover:bg-red-100"
                                                            title="Delete Permanently"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <button onClick={() => handleOpenModal(item)} className="text-indigo-600 hover:text-indigo-900 mr-3">
                                                            <Edit size={18} />
                                                        </button>
                                                        <button onClick={() => handleDelete(item._id || item.id)} className="text-red-500 hover:text-red-700">
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredInventory.map((item) => {
                            const status = getStatus(item);
                            return (
                                <div key={item._id || item.id} className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col">
                                    {/* Image Section */}
                                    <div className="aspect-square relative overflow-hidden bg-slate-50 border-b border-slate-100">
                                        {item.image ? (
                                            <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-2">
                                                <Package size={48} strokeWidth={1.5} />
                                                <span className="text-xs font-medium">No Image</span>
                                            </div>
                                        )}
                                        {/* Status Badge */}
                                        <div className="absolute top-3 right-3">
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm ${getStatusStyle(status)}`}>
                                                {status}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Content Section */}
                                    <div className="p-4 flex-1 flex flex-col">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-slate-900 text-lg leading-tight truncate">{item.name}</h4>
                                                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-1">{item.category || 'General'}</p>
                                            </div>
                                            <span className="font-bold text-indigo-600 text-lg ml-2">₹{item.sellingPrice}</span>
                                        </div>

                                        <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Stock Level</span>
                                                <span className="text-sm font-bold text-slate-800">{item.quantityOnHand} Units</span>
                                            </div>
                                            <div className="flex gap-1">
                                                {showTrash ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleRestore(item._id || item.id)}
                                                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors border border-transparent hover:border-green-100"
                                                            title="Restore"
                                                        >
                                                            <RotateCcw size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handlePermanentDelete(item._id || item.id)}
                                                            className="p-2 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Delete Permanently"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => handleOpenModal(item)}
                                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                            title="Edit Item"
                                                        >
                                                            <Edit size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(item._id || item.id)}
                                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Move to Trash"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {filteredInventory.length === 0 && !loading && (
                    <div className="p-20 text-center flex flex-col items-center gap-3">
                        <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-2">
                            {showTrash ? <Trash2 size={32} /> : <Package size={32} />}
                        </div>
                        <h3 className="font-bold text-slate-800">
                            {showTrash ? 'Trash is Empty' : 'No Inventory Items'}
                        </h3>
                        <p className="text-sm text-slate-500 max-w-xs mx-auto">
                            {searchTerm
                                ? `No results found for "${searchTerm}"`
                                : showTrash
                                    ? "Items you delete will appear here for 30 days before being automatically removed."
                                    : "You haven't added any products to your inventory yet. Click the 'Add Item' button above to get started."}
                        </p>
                    </div>
                )}
            </div>

            {/* MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="text-lg font-semibold text-slate-800">
                                {currentId ? 'Edit Product' : 'Add New Product'}
                            </h3>
                            <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="flex gap-6">
                                {/* Left Side: Basic Info */}
                                <div className="flex-1 space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">SKU</label>
                                            <input
                                                name="sku"
                                                value={formData.sku}
                                                onChange={handleChange}
                                                disabled={!!currentId}
                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:bg-slate-50 disabled:text-slate-500"
                                                required
                                                placeholder="PROD-001"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                                            <input
                                                name="category"
                                                value={formData.category}
                                                onChange={handleChange}
                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                                placeholder="Electronics"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Product Name</label>
                                        <input
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                            required
                                            placeholder="Wireless Headphones"
                                        />
                                    </div>
                                </div>

                                {/* Right Side: Image Upload */}
                                <div className="shrink-0">
                                    <label className="block text-sm font-medium text-slate-700 mb-2 text-center">Product Image</label>
                                    <div className="flex flex-col items-center gap-3">
                                        {formData.image ? (
                                            <img src={formData.image} alt="Preview" className="h-24 w-24 object-cover rounded-xl border-2 border-slate-100 shadow-sm" />
                                        ) : (
                                            <div className="h-24 w-24 bg-slate-50 border-2 border-slate-200 border-dashed rounded-xl flex items-center justify-center text-slate-400">
                                                <Package size={32} />
                                            </div>
                                        )}
                                        <label className="cursor-pointer bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 shadow-sm transition-colors ring-1 ring-slate-100">
                                            {formData.image ? 'Change' : 'Upload'}
                                            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Selling Price (₹)</label>
                                    <input
                                        name="sellingPrice"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={formData.sellingPrice}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Stock</label>
                                    <input
                                        name="quantityOnHand"
                                        type="number"
                                        min="0"
                                        value={formData.quantityOnHand}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Reorder Level</label>
                                    <input
                                        name="reorderLevel"
                                        type="number"
                                        min="0"
                                        value={formData.reorderLevel}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                    rows="3"
                                    placeholder="Product details..."
                                />
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm"
                                >
                                    {currentId ? 'Save Changes' : 'Create Product'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
