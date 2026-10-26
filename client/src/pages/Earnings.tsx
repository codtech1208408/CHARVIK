import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  Plus,
  Search,
  Filter,
  Calendar,
  Bus,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  CreditCard,
  Download,
  Edit,
  Trash2
} from 'lucide-react';
import { Modal } from '../components/common/Modal';
import { useToast } from '../components/common/Toast';

interface EarningRecord {
  id: number;
  date: string;
  source: string;
  bus_number: string;
  client_or_route: string;
  gross_amount: number;
  fuel_expense: number;
  maintenance_expense: number;
  net_earning: number;
  payment_mode: 'Bank Transfer' | 'Cheque' | 'UPI' | 'Cash';
  status: 'Received' | 'Pending Invoice' | 'Overdue';
}

const STORAGE_KEY = 'charvik_earnings_records_data';

export const Earnings: React.FC = () => {
  const { success, error } = useToast();

  const [records, setRecords] = useState<EarningRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<EarningRecord | null>(null);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    source: '',
    bus_number: '',
    client_or_route: '',
    gross_amount: '' as any,
    fuel_expense: '' as any,
    maintenance_expense: '' as any,
    payment_mode: 'Bank Transfer' as EarningRecord['payment_mode'],
    status: 'Received' as EarningRecord['status']
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch {}
  }, [records]);

  const handleOpenAdd = () => {
    setEditingRecord(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      source: '',
      bus_number: '',
      client_or_route: '',
      gross_amount: '' as any,
      fuel_expense: '' as any,
      maintenance_expense: '' as any,
      payment_mode: 'Bank Transfer',
      status: 'Received'
    });
    setIsAddOpen(true);
  };

  const handleOpenEdit = (r: EarningRecord) => {
    setEditingRecord(r);
    setFormData({
      date: r.date,
      source: r.source,
      bus_number: r.bus_number,
      client_or_route: r.client_or_route,
      gross_amount: r.gross_amount,
      fuel_expense: r.fuel_expense,
      maintenance_expense: r.maintenance_expense,
      payment_mode: r.payment_mode,
      status: r.status
    });
    setIsAddOpen(true);
  };

  const handleDelete = (id: number) => {
    if (!window.confirm('Are you sure you want to delete this revenue entry?')) return;
    setRecords(records.filter((r) => r.id !== id));
    success('Earnings record deleted successfully.');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const gross = Number(formData.gross_amount) || 0;
    const fuel = Number(formData.fuel_expense) || 0;
    const maint = Number(formData.maintenance_expense) || 0;
    const net = gross - fuel - maint;

    if (editingRecord) {
      const updated: EarningRecord = {
        ...editingRecord,
        date: formData.date,
        source: formData.source,
        bus_number: formData.bus_number,
        client_or_route: formData.client_or_route,
        gross_amount: gross,
        fuel_expense: fuel,
        maintenance_expense: maint,
        net_earning: net,
        payment_mode: formData.payment_mode,
        status: formData.status
      };
      setRecords(records.map((r) => (r.id === editingRecord.id ? updated : r)));
      success('Earnings entry updated.');
    } else {
      const newRecord: EarningRecord = {
        id: Date.now(),
        date: formData.date,
        source: formData.source,
        bus_number: formData.bus_number,
        client_or_route: formData.client_or_route,
        gross_amount: gross,
        fuel_expense: fuel,
        maintenance_expense: maint,
        net_earning: net,
        payment_mode: formData.payment_mode,
        status: formData.status
      };
      setRecords([newRecord, ...records]);
      success('Earnings entry recorded.');
    }

    setIsAddOpen(false);
    setEditingRecord(null);
  };

  const filtered = records.filter((r) => {
    const matchesSearch =
      r.client_or_route.toLowerCase().includes(search.toLowerCase()) ||
      r.bus_number.toLowerCase().includes(search.toLowerCase()) ||
      r.source.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalGross = records.reduce((acc, r) => acc + r.gross_amount, 0);
  const totalExpenses = records.reduce((acc, r) => acc + r.fuel_expense + r.maintenance_expense, 0);
  const totalNet = totalGross - totalExpenses;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <span>Earnings & Financial Overview</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Fleet revenues, client billing collections, operational expense deductions, and net margins.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#142B4A] hover:bg-[#1E3A5F] text-white text-xs font-bold rounded-xl transition-all shadow-sm hover:shadow cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Record New Revenue</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Gross Revenue</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">₹{totalGross.toLocaleString()}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Total trip & contract revenue</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Total Operating Costs</p>
            <h3 className="text-2xl font-black text-rose-600 mt-1">₹{totalExpenses.toLocaleString()}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Fuel & maintenance deductions</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <ArrowDownRight className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Net Fleet Earnings</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">₹{totalNet.toLocaleString()}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Retained operating margin</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Strip */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by client, route, bus number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
          />
        </div>

        <div className="w-full md:w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 outline-none font-medium"
          >
            <option value="All">All Invoices</option>
            <option value="Received">Received / Cleared</option>
            <option value="Pending Invoice">Pending Invoice</option>
            <option value="Overdue">Overdue</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-700 uppercase font-bold tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-14 text-center">S.NO</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Client / Route</th>
                <th className="py-3 px-4">Bus</th>
                <th className="py-3 px-4">Gross Revenue</th>
                <th className="py-3 px-4">Fuel & Maint Cost</th>
                <th className="py-3 px-4">Net Profit</th>
                <th className="py-3 px-4">Payment Mode</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    No earnings entries recorded yet. Click &quot;Record New Revenue&quot; to log fleet income.
                  </td>
                </tr>
              ) : (
                filtered.map((r, index) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-500 text-center">{index + 1}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{r.date}</td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{r.client_or_route}</p>
                      <p className="text-[11px] text-slate-400">{r.source}</p>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">{r.bus_number}</td>
                    <td className="py-3 px-4 font-bold text-blue-600">₹{r.gross_amount.toLocaleString()}</td>
                    <td className="py-3 px-4 text-rose-600 font-medium">
                      -₹{(r.fuel_expense + r.maintenance_expense).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-black text-emerald-600">₹{r.net_earning.toLocaleString()}</td>
                    <td className="py-3 px-4 text-slate-600">{r.payment_mode}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          r.status === 'Received'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(r)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                          title="Edit Revenue Entry"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(r.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete Revenue Entry"
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
        onClose={() => {
          setIsAddOpen(false);
          setEditingRecord(null);
        }}
        title={editingRecord ? "Edit Fleet Earnings & Revenue" : "Record Fleet Earnings & Revenue"}
        subtitle={editingRecord ? "Modify revenue, expenses, or client billing details" : "Log income from contracted routes, charters, and client billing"}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Billing Date *</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Bus Number</label>
              <input
                type="text"
                value={formData.bus_number}
                onChange={(e) => setFormData({ ...formData, bus_number: e.target.value })}
                placeholder="e.g. Bus #101"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Client / Contract / Route *</label>
            <input
              type="text"
              required
              value={formData.client_or_route}
              onChange={(e) => setFormData({ ...formData, client_or_route: e.target.value })}
              placeholder="e.g. Oakridge School Route or IT Park Shuttle"
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Gross Bill (₹) *</label>
              <input
                type="number"
                required
                min="0"
                value={formData.gross_amount}
                onChange={(e) => setFormData({ ...formData, gross_amount: Number(e.target.value) })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Fuel Exp (₹)</label>
              <input
                type="number"
                min="0"
                value={formData.fuel_expense}
                onChange={(e) => setFormData({ ...formData, fuel_expense: Number(e.target.value) })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Maint Exp (₹)</label>
              <input
                type="number"
                min="0"
                value={formData.maintenance_expense}
                onChange={(e) => setFormData({ ...formData, maintenance_expense: Number(e.target.value) })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Payment Mode</label>
              <select
                value={formData.payment_mode}
                onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value as any })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              >
                <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                <option value="UPI">UPI / Net Banking</option>
                <option value="Cheque">Corporate Cheque</option>
                <option value="Cash">Cash</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Payment Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              >
                <option value="Received">Payment Received</option>
                <option value="Pending Invoice">Pending Invoice</option>
                <option value="Overdue">Overdue</option>
              </select>
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
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#142B4A] hover:bg-[#1E3A5F] transition-colors shadow-sm cursor-pointer"
            >
              Save Earnings Entry
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
