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
import { printSheet } from '../utils/printSheet';
import { exportTableToExcel } from '../utils/exportToExcel';

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
    exportExcel();
  };

  const exportExcel = () => {
    if (!reportData.results || reportData.results.length === 0) {
      error('No data available to export');
      return;
    }
    const rawHeaders = Object.keys(reportData.results[0]);
    const formattedHeaders = rawHeaders.map((h) =>
      h.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    );
    const rows = reportData.results.map((row: any) =>
      rawHeaders.map((h) => {
        const val = row[h];
        if (val === null || val === undefined) return '—';
        if (typeof val === 'boolean') return val ? 'Yes' : 'No';
        return val;
      })
    );

    const reportMeta = reportCategories.find((r) => r.id === activeReport);
    exportTableToExcel({
      title: `CHARVIK - ${reportMeta?.label?.toUpperCase() || 'ANALYTICS & AUDIT REPORT'}`,
      subtitle: `Report ID: ${activeReport} | Total Records: ${reportData.results.length} | Generated: ${new Date().toLocaleDateString('en-IN')}`,
      filename: `Charvik_${activeReport}`,
      headers: formattedHeaders,
      rows
    });
    success('Report exported to Excel (.xlsx) successfully!');
  };

  const currentReportMeta = reportCategories.find((r) => r.id === activeReport);

  return (
    <div className="space-y-6">
      {/* Header with Bus Coach Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0747A6] via-[#0D6EFD] to-[#0099FF] p-6 text-white shadow-lg shadow-blue-500/20 flex flex-col md:flex-row md:items-center justify-between gap-5 no-print">
        <div className="flex items-center space-x-4 relative z-10 max-w-xl">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 shadow-inner shrink-0">
            <FileBarChart className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-xs">
                Fleet &amp; Operational Reports
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-400/25 text-emerald-100 border border-emerald-300/40 shadow-xs flex items-center gap-1.5 backdrop-blur-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
                Official Audits
              </span>
            </div>
            <p className="text-xs sm:text-sm text-blue-100/90 font-medium mt-1">
              Generate verifiable operational, kilometre, repair cost, and safety roadworthiness reports.
            </p>
          </div>
        </div>

        {/* Real Bus Coach Photo Preview & Buttons */}
        <div className="flex items-center gap-3.5 relative z-10 self-start md:self-auto flex-wrap sm:flex-nowrap">
          <div className="hidden sm:block relative shrink-0">
            <div className="w-44 sm:w-52 h-20 sm:h-24 rounded-2xl overflow-hidden shadow-xl border-2 border-white/40 ring-4 ring-white/10 group">
              <img
                src="/assets/fleet1.jpg"
                alt="Reports Fleet Coach"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-2">
                <span className="text-[10px] font-black text-white tracking-wider uppercase drop-shadow-xs">Executive Audit</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={exportCSV}
              className="inline-flex items-center px-3.5 py-2.5 rounded-xl text-xs font-bold bg-white/20 hover:bg-white/30 border border-white/30 text-white backdrop-blur-md transition-colors gap-1.5 cursor-pointer shadow-xs whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5 text-white" />
              <span>CSV</span>
            </button>
            <button
              onClick={exportExcel}
              className="inline-flex items-center px-3.5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors gap-1.5 cursor-pointer shadow-xs border border-emerald-500 whitespace-nowrap"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-white" />
              <span>Excel</span>
            </button>
            <button
              onClick={() =>
                printSheet({
                  title: currentReportMeta?.label || 'OFFICIAL REPORT',
                  subtitle: `Generated on ${new Date().toLocaleDateString('en-IN')}`,
                  elementId: 'reports-data-table-wrap',
                  orientation: 'landscape'
                })
              }
              className="inline-flex items-center px-4 py-2.5 rounded-xl text-xs font-black text-blue-900 bg-white hover:bg-blue-50 transition-colors gap-1.5 cursor-pointer shadow-md whitespace-nowrap"
            >
              <Printer className="w-3.5 h-3.5 text-blue-800" />
              <span>Print Report</span>
            </button>
          </div>
        </div>

        {/* Decorative soft glow */}
        <div className="absolute -right-8 -top-8 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />
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
        {/* Official Charvik Letterhead Header */}
        <div className="border-2 border-[#0056b3] rounded-xl p-2.5 sm:p-3 bg-white text-center mb-3">
          <div className="flex justify-center items-center mb-1">
            <img
              src="/charvik-print-logo.png?v=20261120_print"
              alt="CHARVIK STAFFING CONSULTANCY"
              className="h-14 max-h-[58px] w-auto max-w-[320px] object-contain block mx-auto"
              onError={(e) => { (e.target as HTMLImageElement).src = '/logo-brand.png'; }}
            />
          </div>
          <div className="text-[11px] font-extrabold text-[#00448a] tracking-widest uppercase my-1 text-center">
            Manpower Solutions &nbsp;•&nbsp; Recruitment &nbsp;•&nbsp; Payroll Support
          </div>
          <div className="flex flex-wrap justify-center items-center gap-3 text-xs font-bold text-black mb-1.5 leading-tight">
            <span className="inline-flex items-center gap-1">
              <span className="text-[#0056b3] font-extrabold">Phone:</span>
              <span className="text-black">9505151527</span>
            </span>
            <span className="text-[#0056b3] font-black">•</span>
            <span className="inline-flex items-center gap-1">
              <span className="text-[#0056b3] font-extrabold">Email:</span>
              <span className="text-black">charvikstaffingconsultancy@gmail.com</span>
            </span>
            <span className="text-[#0056b3] font-black">•</span>
            <span className="inline-flex items-center gap-1">
              <span className="text-[#0056b3] font-extrabold">Web:</span>
              <span className="text-black">www.charvikstaffing.com</span>
            </span>
          </div>
          <div className="inline-block border border-[#0056b3] rounded-md px-3 py-1 text-[11px] font-semibold text-black bg-slate-50 max-w-[98%] leading-snug">
            <span className="text-[#0056b3] font-extrabold mr-1">Office:</span>
            <span>NH65, opp. Bajaj Electronic, beside Kakinada Subbayya Gari Hotel, Agamaiah Nagar Colony, Bank Colony, L. B. Nagar, Vanasthalipuram, Hyderabad, Telangana</span>
          </div>
        </div>

        {/* Formal Report Header Strip */}
        <div className="flex items-center justify-between border-b pb-3 border-slate-200">
          <div>
            <h3 className="text-base sm:text-lg font-black text-[#142B4A] uppercase tracking-wide">
              {currentReportMeta?.label || 'OFFICIAL REPORT'}
            </h3>
            <p className="text-xs font-bold text-slate-500">Charvik Fleet Operations &amp; Staffing Management System</p>
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
        <div id="reports-data-table-wrap" className="overflow-x-auto">
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
              <thead className="bg-gradient-to-r from-[#0B3A79] via-[#0E52A5] to-[#1E70EB] text-white uppercase font-bold tracking-wider text-[11px] border-b border-blue-900/30">
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
