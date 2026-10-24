import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Layers,
  ArrowUpDown
} from 'lucide-react';
import { Modal } from '../components/common/Modal';
import { useToast } from '../components/common/Toast';

interface ProductItem {
  id: number;
  name: string;
  category: 'Lubricants' | 'Filters' | 'Tyres' | 'Electrical' | 'AC Parts' | 'Brake & Mechanical' | 'Other';
  sku: string;
  stock_quantity: number;
  min_stock_level: number;
  unit_price: number;
  supplier: string;
  unit: string;
  location: string;
  last_restocked?: string;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
}

const STORAGE_KEY = 'charvik_products_inventory';

export const ProductManagement: React.FC = () => {
  const { success, error } = useToast();

  const [products, setProducts] = useState<ProductItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);

  const [formData, setFormData] = useState<Partial<ProductItem>>({
    name: '',
    category: 'Lubricants',
    sku: '',
    stock_quantity: 0,
    min_stock_level: 5,
    unit_price: 0,
    supplier: '',
    unit: 'Units',
    location: 'Main Garage Shelf A'
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    } catch {}
  }, [products]);

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.supplier.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      category: 'Lubricants',
      sku: `PRD-${Date.now().toString().slice(-4)}`,
      stock_quantity: 10,
      min_stock_level: 5,
      unit_price: 1500,
      supplier: 'Fleet Spares Hub',
      unit: 'Units',
      location: 'Central Depot Shelf 1'
    });
    setIsAddOpen(true);
  };

  const handleOpenEdit = (prod: ProductItem) => {
    setEditingProduct(prod);
    setFormData({ ...prod });
    setIsAddOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.sku) {
      error('Please enter product name and SKU code.');
      return;
    }

    const qty = Number(formData.stock_quantity) || 0;
    const minLvl = Number(formData.min_stock_level) || 0;
    const computedStatus: 'In Stock' | 'Low Stock' | 'Out of Stock' =
      qty === 0 ? 'Out of Stock' : qty <= minLvl ? 'Low Stock' : 'In Stock';

    if (editingProduct) {
      const updated = products.map((p) =>
        p.id === editingProduct.id
          ? ({
              ...p,
              ...formData,
              stock_quantity: qty,
              min_stock_level: minLvl,
              unit_price: Number(formData.unit_price) || 0,
              status: computedStatus,
              last_restocked: new Date().toISOString().split('T')[0]
            } as ProductItem)
          : p
      );
      setProducts(updated);
      success('Product item updated successfully.');
    } else {
      const newItem: ProductItem = {
        id: Date.now(),
        name: formData.name!,
        category: (formData.category as any) || 'Other',
        sku: formData.sku!,
        stock_quantity: qty,
        min_stock_level: minLvl,
        unit_price: Number(formData.unit_price) || 0,
        supplier: formData.supplier || 'Standard Fleet Spares',
        unit: formData.unit || 'Units',
        location: formData.location || 'Depot Rack 1',
        last_restocked: new Date().toISOString().split('T')[0],
        status: computedStatus
      };
      setProducts([newItem, ...products]);
      success('New product added to inventory.');
    }
    setIsAddOpen(false);
  };

  const handleDelete = (id: number) => {
    if (!confirm('Are you sure you want to delete this inventory item?')) return;
    setProducts(products.filter((p) => p.id !== id));
    success('Product deleted.');
  };

  const totalValue = products.reduce((acc, p) => acc + p.stock_quantity * p.unit_price, 0);
  const lowStockCount = products.filter((p) => p.status === 'Low Stock' || p.status === 'Out of Stock').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-500" />
            <span>Product & Spare Parts Management</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track fleet components, spare parts, oils, filters, consumables, and inventory levels.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Total Inventory Items</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{products.length} Products</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Spares & consumables catalog</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Total Stock Value</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">₹{totalValue.toLocaleString()}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Combined warehouse valuation</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Low Stock Alerts</p>
            <h3 className="text-2xl font-black text-rose-600 mt-1">{lowStockCount} Items</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Require replenishment</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search & Filter Strip */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by product name, SKU, or supplier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
          />
        </div>

        <div className="w-full md:w-48">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 outline-none font-medium"
          >
            <option value="All">All Categories</option>
            <option value="Lubricants">Lubricants & Oils</option>
            <option value="Filters">Filters & DPF</option>
            <option value="Tyres">Tyres & Tubes</option>
            <option value="Electrical">Electrical & Battery</option>
            <option value="AC Parts">AC Components</option>
            <option value="Brake & Mechanical">Brake & Mechanical</option>
            <option value="Other">Other Parts</option>
          </select>
        </div>

        <div className="w-full md:w-40">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 outline-none font-medium"
          >
            <option value="All">All Status</option>
            <option value="In Stock">In Stock</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Out of Stock">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-700 uppercase font-bold tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Product Details</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">SKU / Code</th>
                <th className="py-3 px-4">Stock Qty</th>
                <th className="py-3 px-4">Unit Price</th>
                <th className="py-3 px-4">Total Value</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No product inventory records found. Click &quot;Add New Product&quot; to begin.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{p.name}</p>
                      <p className="text-[11px] text-slate-400">{p.location}</p>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-600">{p.category}</td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-700">{p.sku}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {p.stock_quantity} {p.unit}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">₹{p.unit_price.toLocaleString()}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      ₹{(p.stock_quantity * p.unit_price).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{p.supplier}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.status === 'In Stock'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : p.status === 'Low Stock'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                          title="Edit Product"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title={editingProduct ? 'Edit Inventory Product' : 'Add New Inventory Product'}
        subtitle="Manage fleet spares, consumables, oils, and replacement parts"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Product / Part Name *</label>
            <input
              type="text"
              required
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Engine Oil 15W-40 20L Drum"
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
              <select
                value={formData.category || 'Lubricants'}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              >
                <option value="Lubricants">Lubricants & Oils</option>
                <option value="Filters">Filters & DPF</option>
                <option value="Tyres">Tyres & Tubes</option>
                <option value="Electrical">Electrical & Battery</option>
                <option value="AC Parts">AC Components</option>
                <option value="Brake & Mechanical">Brake & Mechanical</option>
                <option value="Other">Other Parts</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">SKU / Part Code *</label>
              <input
                type="text"
                required
                value={formData.sku || ''}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Stock Qty *</label>
              <input
                type="number"
                min="0"
                required
                value={formData.stock_quantity ?? ''}
                onChange={(e) => setFormData({ ...formData, stock_quantity: Number(e.target.value) })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Min Reorder Lvl</label>
              <input
                type="number"
                min="0"
                value={formData.min_stock_level ?? ''}
                onChange={(e) => setFormData({ ...formData, min_stock_level: Number(e.target.value) })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Unit Price (₹)</label>
              <input
                type="number"
                min="0"
                value={formData.unit_price ?? ''}
                onChange={(e) => setFormData({ ...formData, unit_price: Number(e.target.value) })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Supplier / Vendor</label>
              <input
                type="text"
                value={formData.supplier || ''}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                placeholder="e.g. Bosch Authorized Dealer"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Storage Location</label>
              <input
                type="text"
                value={formData.location || ''}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. Rack B, Shelf 2"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 transition-colors shadow-xs cursor-pointer"
            >
              {editingProduct ? 'Update Product' : 'Add to Inventory'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
