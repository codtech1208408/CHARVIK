import React, { useState, useEffect } from 'react';
import {
  FileBarChart,
  Download,
  Printer,
  Search,
  Filter,
  Calendar,
  Bus,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';
import { api } from '../services/api';
import type { Bus as BusType } from '../types';
import { Badge } from '../components/common/Badge';
import { useToast } from '../components/common/Toast';

export const Reports: React.FC = () => {
  const { success, error } = useToast();

  const [activeReport, setActiveReport] = useState('bus-list');
  const [buses, setBuses] = useState<BusType[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<any>({ summary: {}, results: [] });

  // Filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedBus, setSelectedBus] = useState('');

  const reportCategories = [
    { id: 'bus-list', label: 'Complete Bus Master List', category: 'Bus Reports' },
    { id: 'daily-km', label: 'Daily Kilometer & Distance Log', category: 'Kilometer Reports' },
    { id: 'maintenance-summary', label: 'Preventive Maintenance Due & Cost', category: 'Maintenance Reports' },
    { id: 'complaints-report', label: 'Complaint Resolution & Status', category: 'Complaint Reports' },
    { id: 'repairs-report', label: 'Repair Work Orders & Expense', category: 'Repair Reports' },
    { id: 'bus-condition-report', label: 'Bus Safety & Roadworthiness Fitness', category: 'Condition Reports' },
    { id: 'employee-report', label: 'Driver & Employee Roster', category: 'Employee Reports' },
  ];

  useEffect(() => {
    api.getBuses().then(setBuses).catch(console.error);
  }, []);

  useEffect(() => {
    loadReport();
  }, [activeReport, dateFrom, dateTo, selectedBus]);

  const loadReport = async () => {
    try {
      setLoading(true);
      const res = await api.getReport(activeReport, {
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        bus_id: selectedBus || undefined
      });
      setReportData(res);
    } catch (err: any) {
      error(err.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (!reportData.results || reportData.results.length === 0) {
      error('No data available to export');
      return;
    }
    const headers = Object.keys(reportData.results[0]);
    const csvRows = [
      headers.join(','),
      ...reportData.results.map((row: any) =>
        headers.map((h) => `"${String(row[h] || '').replace(/"/g, '""')}"`).join(',')
      )
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Charvik_${activeReport}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('Report exported to CSV successfully!');
  };

  const exportExcel = () => {
    // Export CSV with Excel BOM for seamless native spreadsheet viewing
    if (!reportData.results || reportData.results.length === 0) {
      error('No data available to export');
      return;
    }
    const headers = Object.keys(reportData.results[0]);
    const csvContent = '\uFEFF' + [
      headers.join(','),
      ...reportData.results.map((row: any) =>
        headers.map((h) => `"${String(row[h] || '').replace(/"/g, '""')}"`).join(',')
      )
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Charvik_${activeReport}_${new Date().toISOString().split('T')[0]}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('Report exported to Excel spreadsheet!');
  };

  const currentReportMeta = reportCategories.find((r) => r.id === activeReport);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm no-print">
        <div>
          <h2 className="text-xl font-bold text-[#142B4A] flex items-center gap-2">
            <FileBarChart className="w-5 h-5 text-blue-600" />
            <span>Fleet & Operational Reports</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Generate verifiable operational, kilometre, repair cost, and safety roadworthiness reports.
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <button
            onClick={exportCSV}
            className="inline-flex items-center px-3 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors gap-1.5 cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
          <button
            onClick={exportExcel}
            className="inline-flex items-center px-3 py-2 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors gap-1.5 cursor-pointer shadow-xs border border-emerald-200"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel</span>
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center px-3 py-2 rounded-xl text-xs font-bold text-white bg-[#142B4A] hover:bg-[#1E3A5F] transition-colors gap-1.5 cursor-pointer shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Report Categories Nav Strip */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm flex items-center space-x-2 overflow-x-auto text-xs no-print">
        {reportCategories.map((r) => (
          <button
            key={r.id}
            onClick={() => setActiveReport(r.id)}
            className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeReport === r.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Filters Strip */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center gap-3 no-print">
        <div className="w-full md:w-56">
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Filter Bus</label>
          <select
            value={selectedBus}
            onChange={(e) => setSelectedBus(e.target.value)}
            className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 outline-none"
          >
            <option value="">All Fleet Buses</option>
            {buses.map((b) => (
              <option key={b.id} value={b.id}>
                {b.bus_number} ({b.registration_number})
              </option>
            ))}
          </select>
        </div>

        <div className="w-full md:w-44">
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Date From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 outline-none"
          />
        </div>

        <div className="w-full md:w-44">
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Date To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 outline-none"
          />
        </div>

        {(selectedBus || dateFrom || dateTo) && (
          <button
            onClick={() => {
              setSelectedBus('');
              setDateFrom('');
              setDateTo('');
            }}
            className="self-end text-xs font-semibold text-rose-600 hover:text-rose-700 py-2 cursor-pointer"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Printable Report Canvas */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
        {/* Formal Report Header with Charvik Logo */}
        <div className="flex items-center justify-between border-b pb-4 border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-white p-1 border border-slate-200 flex items-center justify-center shrink-0">
              <img src="/logo.jpg" alt="Charvik Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-[#142B4A] uppercase tracking-wide">
                CHARVIK STAFFING CONSULTANCY
              </h3>
              <p className="text-xs font-bold text-blue-700">{currentReportMeta?.label}</p>
            </div>
          </div>

          <div className="text-right text-[11px] text-slate-500">
            <p><strong>Generated On:</strong> {new Date().toLocaleDateString('en-IN')}</p>
            <p><strong>Official System Audit Log</strong></p>
          </div>
        </div>

        {/* Dynamic Summary Stats Strip */}
        <div className="flex flex-wrap gap-4 py-2 border-b border-slate-100 text-xs">
          {Object.entries(reportData.summary || {}).map(([k, v]) => (
            <div key={k} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">
                {k.replace(/([A-Z])/g, ' $1')}
              </span>
              <span className="font-extrabold text-sm text-[#142B4A]">
                {typeof v === 'number' && k.toLowerCase().includes('cost') ? `₹${v.toLocaleString()}` : String(v)}
              </span>
            </div>
          ))}
        </div>

        {/* Dynamic Data Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-12 text-center text-slate-400">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              Compiling real-time report records...
            </div>
          ) : !reportData.results || reportData.results.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No matching records found for the selected filter parameters.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-[#142B4A]/5 text-[#142B4A] uppercase font-bold tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 whitespace-nowrap w-14 text-center">S.NO</th>
                  {Object.keys(reportData.results[0]).map((col) => (
                    <th key={col} className="py-2.5 px-3 whitespace-nowrap">
                      {col.replace(/_/g, ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {reportData.results.map((row: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 whitespace-nowrap font-bold text-slate-500 text-center">{idx + 1}</td>
                    {Object.keys(row).map((col) => {
                      const val = row[col];
                      const isCost = col.toLowerCase().includes('cost') || col.toLowerCase().includes('expense');
                      const isStatus = col.toLowerCase().includes('status');

                      return (
                        <td key={col} className="py-2.5 px-3 whitespace-nowrap">
                          {isStatus ? (
                            <Badge status={String(val)} />
                          ) : isCost ? (
                            <span className="font-mono font-bold text-slate-900">
                              ₹{Number(val || 0).toLocaleString()}
                            </span>
                          ) : (
                            String(val ?? '-')
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
