import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  HeartHandshake,
  Plus,
  Search,
  Calendar,
  IndianRupee,
  User,
  Users,
  Image as ImageIcon,
  Trash2,
  Edit2,
  Eye,
  Printer,
  X,
  Upload,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  Download,
  Filter,
  FileText,
  BadgeCheck,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../components/common/Toast';
import { printSheet } from '../utils/printSheet';

export interface DonationRecord {
  id: string | number;
  donor_name: string;
  amount: number;
  donation_date: string;
  received_by_employee_id?: number | string | null;
  received_by_employee_name: string;
  received_by_employee_code?: string;
  received_by_employee_role?: string;
  payment_mode?: 'Cash' | 'Online / Bank Transfer' | 'UPI';
  notes?: string;
  proof_images?: string[];
  created_at?: string;
}

export const DonationManagement: React.FC = () => {
  const { success, error: toastError } = useToast();

  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [dateRangeFilter, setDateRangeFilter] = useState('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | number | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    donor_name: '',
    amount: '',
    donation_date: new Date().toISOString().split('T')[0],
    received_by_employee_id: '',
    received_by_employee_name: '',
    received_by_employee_code: '',
    received_by_employee_role: '',
    payment_mode: 'Cash' as 'Cash' | 'Online / Bank Transfer' | 'UPI',
    notes: '',
    proof_images: [] as string[]
  });

  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | number | null>(null);

  // Image Lightbox Modal State
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Details Modal State
  const [viewingDonation, setViewingDonation] = useState<DonationRecord | null>(null);

  // Fetch initial data
  const loadData = async () => {
    try {
      setLoading(true);
      const [donationsRes, empRes] = await Promise.all([
        api.getDonations(),
        api.getEmployees()
      ]);

      const formattedDonations = (donationsRes || []).map((d: any) => ({
        ...d,
        amount: Number(d.amount) || 0,
        proof_images: Array.isArray(d.proof_images)
          ? d.proof_images
          : (typeof d.proof_images === 'string' ? JSON.parse(d.proof_images || '[]') : [])
      }));

      setDonations(formattedDonations);
      setEmployees(empRes || []);
    } catch (err: any) {
      toastError(err.message || 'Failed to load donations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered donations
  const filteredDonations = useMemo(() => {
    return donations.filter((item) => {
      const matchesSearch =
        item.donor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.received_by_employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.received_by_employee_code && item.received_by_employee_code.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.notes && item.notes.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesPayment =
        paymentFilter === 'All' || item.payment_mode === paymentFilter;

      let matchesDate = true;
      if (dateRangeFilter === 'Month') {
        const itemDate = new Date(item.donation_date);
        const now = new Date();
        matchesDate =
          itemDate.getMonth() === now.getMonth() &&
          itemDate.getFullYear() === now.getFullYear();
      } else if (dateRangeFilter === 'Year') {
        const itemDate = new Date(item.donation_date);
        const now = new Date();
        matchesDate = itemDate.getFullYear() === now.getFullYear();
      }

      return matchesSearch && matchesPayment && matchesDate;
    });
  }, [donations, searchTerm, paymentFilter, dateRangeFilter]);

  // Statistics
  const stats = useMemo(() => {
    const totalAmount = donations.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const totalCount = donations.length;
    const now = new Date();
    const thisMonthAmount = donations
      .filter((item) => {
        const d = new Date(item.donation_date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

    const verifiedStaffCount = donations.filter((item) => item.received_by_employee_id).length;

    return {
      totalAmount,
      totalCount,
      thisMonthAmount,
      verifiedStaffCount
    };
  }, [donations]);

  // Handle employee selection: automatically fills employee details
  const handleEmployeeChange = (employeeIdStr: string) => {
    if (!employeeIdStr) {
      setFormData((prev) => ({
        ...prev,
        received_by_employee_id: '',
        received_by_employee_name: '',
        received_by_employee_code: '',
        received_by_employee_role: ''
      }));
      return;
    }

    const selected = employees.find((emp) => String(emp.id) === String(employeeIdStr));
    if (selected) {
      setFormData((prev) => ({
        ...prev,
        received_by_employee_id: String(selected.id),
        received_by_employee_name: selected.full_name,
        received_by_employee_code: selected.employee_code || '',
        received_by_employee_role: selected.role || 'Staff'
      }));
    }
  };

  // Handle uploading proof images (up to 4 images)
  const handleProofImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (formData.proof_images.length + files.length > 4) {
      toastError('You can upload a maximum of 4 proof images.');
      return;
    }

    setUploadingFiles(true);
    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const res = await api.uploadFile(file);
        if (res && res.fileUrl) {
          uploadedUrls.push(res.fileUrl);
        }
      }

      setFormData((prev) => ({
        ...prev,
        proof_images: [...prev.proof_images, ...uploadedUrls].slice(0, 4)
      }));
      success(`${uploadedUrls.length} proof image(s) uploaded successfully!`);
    } catch (err: any) {
      toastError(err.message || 'Failed to upload proof images');
    } finally {
      setUploadingFiles(false);
      e.target.value = '';
    }
  };

  const removeProofImage = (indexToRemove: number) => {
    setFormData((prev) => ({
      ...prev,
      proof_images: prev.proof_images.filter((_, idx) => idx !== indexToRemove)
    }));
  };

  // Open modal for new donation
  const handleOpenAddModal = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({
      donor_name: '',
      amount: '',
      donation_date: new Date().toISOString().split('T')[0],
      received_by_employee_id: employees.length > 0 ? String(employees[0].id) : '',
      received_by_employee_name: employees.length > 0 ? employees[0].full_name : '',
      received_by_employee_code: employees.length > 0 ? (employees[0].employee_code || '') : '',
      received_by_employee_role: employees.length > 0 ? (employees[0].role || 'Staff') : '',
      payment_mode: 'Cash',
      notes: '',
      proof_images: []
    });
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEditModal = (donation: DonationRecord) => {
    setIsEditing(true);
    setEditingId(donation.id);
    setFormData({
      donor_name: donation.donor_name,
      amount: String(donation.amount),
      donation_date: donation.donation_date,
      received_by_employee_id: donation.received_by_employee_id ? String(donation.received_by_employee_id) : '',
      received_by_employee_name: donation.received_by_employee_name,
      received_by_employee_code: donation.received_by_employee_code || '',
      received_by_employee_role: donation.received_by_employee_role || '',
      payment_mode: donation.payment_mode || 'Cash',
      notes: donation.notes || '',
      proof_images: donation.proof_images || []
    });
    setIsModalOpen(true);
  };

  // Save donation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.donor_name.trim()) {
      toastError('Please enter the donator name.');
      return;
    }
    const numAmount = parseFloat(formData.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toastError('Please enter a valid donation amount.');
      return;
    }
    if (!formData.received_by_employee_name.trim()) {
      toastError('Please select or specify the receiving employee.');
      return;
    }

    const payload = {
      donor_name: formData.donor_name.trim(),
      amount: numAmount,
      donation_date: formData.donation_date,
      received_by_employee_id: formData.received_by_employee_id ? Number(formData.received_by_employee_id) : null,
      received_by_employee_name: formData.received_by_employee_name.trim(),
      received_by_employee_code: formData.received_by_employee_code.trim(),
      received_by_employee_role: formData.received_by_employee_role.trim(),
      payment_mode: formData.payment_mode,
      notes: formData.notes.trim(),
      proof_images: formData.proof_images
    };

    try {
      if (isEditing && editingId) {
        await api.updateDonation(editingId, payload);
        success('Donation record updated successfully!');
      } else {
        await api.createDonation(payload);
        success('New donation recorded successfully!');
      }

      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      toastError(err.message || 'Failed to save donation record');
    }
  };

  // Delete donation
  const handleDelete = async (id: string | number) => {
    try {
      await api.deleteDonation(id);
      success('Donation record archived successfully.');
      setDeleteConfirmId(null);
      await loadData();
    } catch (err: any) {
      toastError(err.message || 'Failed to delete donation');
    }
  };

  // Open Lightbox
  const openLightbox = (images: string[], index = 0) => {
    setLightboxImages(images);
    setLightboxIndex(index);
    setIsLightboxOpen(true);
  };

  // Print official donation receipt slip
  const handlePrintSlip = (donation: DonationRecord) => {
    const formattedDate = new Date(donation.donation_date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

    const slipHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 750px; margin: 0 auto; padding: 24px; border: 2px solid #142B4A; border-radius: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #142B4A; padding-bottom: 16px; margin-bottom: 20px;">
          <div>
            <h1 style="color: #142B4A; margin: 0 0 4px 0; font-size: 24px; text-transform: uppercase;">Charvik Staffing Consultancy</h1>
            <p style="margin: 0; font-size: 13px; color: #555;">Official Staff & Fleet Welfare Fund • Registration & Compliance</p>
            <p style="margin: 2px 0 0 0; font-size: 11px; color: #777;">Vijayawada, Andhra Pradesh • Phone: +91 98765 43210</p>
          </div>
          <div style="text-align: right;">
            <div style="background: #142B4A; color: #fff; padding: 6px 14px; font-weight: bold; font-size: 14px; border-radius: 4px; display: inline-block;">
              DONATION RECEIPT
            </div>
            <div style="font-size: 12px; margin-top: 6px; color: #333;">Receipt #: <strong>#DON-${String(donation.id).padStart(5, '0')}</strong></div>
            <div style="font-size: 12px; color: #555;">Date: ${formattedDate}</div>
          </div>
        </div>

        <div style="margin-bottom: 20px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tbody>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 8px 0; font-weight: bold; color: #555; width: 35%;">Donor / Benefactor Name:</td>
                <td style="padding: 8px 0; font-weight: bold; color: #111; font-size: 15px;">${donation.donor_name}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 8px 0; font-weight: bold; color: #555;">Amount Donated:</td>
                <td style="padding: 8px 0; font-weight: bold; color: #16a34a; font-size: 18px;">₹${Number(donation.amount).toLocaleString('en-IN')}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 8px 0; font-weight: bold; color: #555;">Payment Mode:</td>
                <td style="padding: 8px 0; color: #333;">${donation.payment_mode || 'Cash'}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 8px 0; font-weight: bold; color: #555;">Received By Employee:</td>
                <td style="padding: 8px 0; color: #111; font-weight: bold;">
                  ${donation.received_by_employee_name} 
                  ${donation.received_by_employee_code ? `(${donation.received_by_employee_code})` : ''} 
                  ${donation.received_by_employee_role ? `• ${donation.received_by_employee_role}` : ''}
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #555;">Purpose / Remarks:</td>
                <td style="padding: 8px 0; color: #444;">${donation.notes || 'Voluntary contribution for staff welfare and passenger transit services'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; margin-bottom: 30px; font-size: 11px; color: #64748b;">
          <strong>Official Acknowledgment:</strong> We gratefully acknowledge receipt of the generous donation mentioned above. All donations are utilized in accordance with established trust and welfare governance policies.
        </div>

        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 40px; padding-top: 20px;">
          <div style="text-align: center; width: 220px;">
            <div style="border-bottom: 1px dashed #666; height: 35px; margin-bottom: 6px;"></div>
            <div style="font-size: 11px; font-weight: bold; color: #444;">Receiving Employee Signature</div>
            <div style="font-size: 10px; color: #777;">${donation.received_by_employee_name}</div>
          </div>
          <div style="text-align: center; width: 220px;">
            <div style="border-bottom: 1px dashed #666; height: 35px; margin-bottom: 6px;"></div>
            <div style="font-size: 11px; font-weight: bold; color: #142B4A;">Authorized Signatory</div>
            <div style="font-size: 10px; color: #777;">Charvik Staffing Consultancy</div>
          </div>
        </div>
      </div>
    `;

    printSheet(slipHtml, {
      title: `Donation_Receipt_${donation.id}`,
      hideHeader: true,
      hideMetaBar: true
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header with Title and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white shadow-md shadow-rose-100">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                Donation Management
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-rose-50 text-rose-600 border border-rose-200/60">
                  {donations.length} Records
                </span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Record and manage donations received by staff members with photo proofs. Publicly mirrored on the public website.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/donations"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors shadow-xs"
            title="Open the Public Donations view"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            <span>Public Website View</span>
          </Link>

          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Donation</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Funds */}
        <div className="bg-gradient-to-br from-white to-emerald-50/40 p-5 rounded-2xl border border-emerald-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Total Donated Funds</span>
            <span className="p-2 rounded-xl bg-emerald-100/80 text-emerald-700">
              <IndianRupee className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              ₹{stats.totalAmount.toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] font-semibold text-emerald-700 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> All time recorded funds
            </p>
          </div>
        </div>

        {/* Total Donors */}
        <div className="bg-gradient-to-br from-white to-blue-50/40 p-5 rounded-2xl border border-blue-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">Total Benefactors</span>
            <span className="p-2 rounded-xl bg-blue-100/80 text-blue-700">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {stats.totalCount} Donors
            </div>
            <p className="text-[11px] font-semibold text-blue-700 mt-1 flex items-center gap-1">
              <BadgeCheck className="w-3.5 h-3.5" /> Verified donor contributions
            </p>
          </div>
        </div>

        {/* This Month's Collection */}
        <div className="bg-gradient-to-br from-white to-purple-50/40 p-5 rounded-2xl border border-purple-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-800 uppercase tracking-wider">This Month</span>
            <span className="p-2 rounded-xl bg-purple-100/80 text-purple-700">
              <Calendar className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              ₹{stats.thisMonthAmount.toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] font-semibold text-purple-700 mt-1">
              Active calendar month intake
            </p>
          </div>
        </div>

        {/* Staff Accountability */}
        <div className="bg-gradient-to-br from-white to-amber-50/40 p-5 rounded-2xl border border-amber-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Staff Accountability</span>
            <span className="p-2 rounded-xl bg-amber-100/80 text-amber-700">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {stats.verifiedStaffCount} Assigned
            </div>
            <p className="text-[11px] font-semibold text-amber-700 mt-1">
              Matched with registered crew
            </p>
          </div>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search donor, staff, receipt..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Payment Mode Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-semibold text-[11px]">Mode:</span>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer text-xs"
            >
              <option value="All">All Modes</option>
              <option value="Cash">Cash</option>
              <option value="Online / Bank Transfer">Online / Bank Transfer</option>
              <option value="UPI">UPI</option>
            </select>
          </div>

          {/* Date Period Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-semibold text-[11px]">Period:</span>
            <select
              value={dateRangeFilter}
              onChange={(e) => setDateRangeFilter(e.target.value)}
              className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer text-xs"
            >
              <option value="All">All Time</option>
              <option value="Month">This Month</option>
              <option value="Year">This Year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Donations Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-semibold">Loading donation records...</p>
          </div>
        ) : filteredDonations.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No Donations Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchTerm || paymentFilter !== 'All'
                ? 'No donation records match your filter criteria. Try resetting the filters.'
                : 'No donations recorded yet. Click the "+ Add Donation" button to record your first donation.'}
            </p>
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setPaymentFilter('All');
                  setDateRangeFilter('All');
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Receipt / ID</th>
                  <th className="py-3.5 px-4">Donator Name</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Received By Staff</th>
                  <th className="py-3.5 px-4">Payment Mode</th>
                  <th className="py-3.5 px-4">Proof Documents</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredDonations.map((donation) => {
                  const proofCount = donation.proof_images?.length || 0;
                  return (
                    <tr
                      key={donation.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* ID / Receipt */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-mono text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                          #DON-{String(donation.id).padStart(5, '0')}
                        </span>
                      </td>

                      {/* Donator Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                            {donation.donor_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                              {donation.donor_name}
                            </div>
                            {donation.notes && (
                              <div className="text-[11px] text-slate-400 truncate max-w-xs" title={donation.notes}>
                                {donation.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="text-sm font-black text-emerald-600 tracking-tight">
                          ₹{Number(donation.amount).toLocaleString('en-IN')}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                        {new Date(donation.donation_date).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>

                      {/* Received By Employee */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-[11px] shrink-0">
                            <User className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-800">
                              {donation.received_by_employee_name}
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                              {donation.received_by_employee_code && (
                                <span className="font-mono bg-slate-100 px-1 rounded">
                                  {donation.received_by_employee_code}
                                </span>
                              )}
                              {donation.received_by_employee_role && (
                                <span className="text-blue-600 font-semibold">
                                  • {donation.received_by_employee_role}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Payment Mode */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          donation.payment_mode === 'Cash'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                            : donation.payment_mode === 'UPI'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200/60'
                            : 'bg-blue-50 text-blue-700 border border-blue-200/60'
                        }`}>
                          {donation.payment_mode || 'Cash'}
                        </span>
                      </td>

                      {/* Proof Images Gallery */}
                      <td className="py-3.5 px-4">
                        {proofCount > 0 ? (
                          <div className="flex items-center gap-1.5">
                            {donation.proof_images!.slice(0, 3).map((imgUrl, imgIdx) => (
                              <button
                                key={imgIdx}
                                type="button"
                                onClick={() => openLightbox(donation.proof_images!, imgIdx)}
                                className="w-8 h-8 rounded-lg overflow-hidden border border-slate-200 hover:border-blue-500 transition-colors shadow-2xs shrink-0 cursor-pointer relative group/thumb"
                                title="Click to view full image"
                              >
                                <img
                                  src={imgUrl}
                                  alt={`Proof ${imgIdx + 1}`}
                                  className="w-full h-full object-cover group-hover/thumb:scale-110 transition-transform"
                                />
                              </button>
                            ))}
                            {proofCount > 3 && (
                              <button
                                type="button"
                                onClick={() => openLightbox(donation.proof_images!, 3)}
                                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center border border-slate-200 transition-colors shrink-0 cursor-pointer"
                              >
                                +{proofCount - 3}
                              </button>
                            )}
                            <span className="text-[10px] font-bold text-slate-400 ml-1">
                              ({proofCount})
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">No proofs</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View details */}
                          <button
                            type="button"
                            onClick={() => setViewingDonation(donation)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="View Full Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Print Receipt Slip */}
                          <button
                            type="button"
                            onClick={() => handlePrintSlip(donation)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                            title="Print Official Donation Slip"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(donation)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                            title="Edit Record"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(donation.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Donation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-[#142B4A] to-[#1E3A5F] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-rose-300">
                  <HeartHandshake className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight">
                    {isEditing ? 'Edit Donation Record' : 'Record New Donation'}
                  </h3>
                  <p className="text-[11px] text-blue-200">
                    Enter donor particulars, select receiving staff, and upload 3-4 proof photos.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Donator Name */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Donator Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Srikanth Reddy / Vyshnavi Trust"
                      value={formData.donor_name}
                      onChange={(e) => setFormData({ ...formData, donor_name: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs font-semibold text-slate-800"
                    />
                  </div>
                </div>

                {/* Donator Given Amount */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Donated Amount (₹) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-500">₹</span>
                    <input
                      type="number"
                      required
                      min="1"
                      step="any"
                      placeholder="e.g. 15000"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs font-black text-emerald-600"
                    />
                  </div>
                </div>

                {/* Date */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Donation Date <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="date"
                      required
                      value={formData.donation_date}
                      onChange={(e) => setFormData({ ...formData, donation_date: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs font-semibold text-slate-800"
                    />
                  </div>
                </div>

                {/* Which employee took the donated money */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Which Employee Took Donated Money? <span className="text-rose-500">*</span>
                  </label>
                  <p className="text-[10px] text-slate-500 mb-1.5">
                    Select a registered employee — their verified Name, Code, and Role will automatically populate.
                  </p>
                  <div className="relative">
                    <select
                      value={formData.received_by_employee_id}
                      onChange={(e) => handleEmployeeChange(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs font-bold text-slate-800 bg-white"
                    >
                      <option value="">-- Choose Registered Staff Member --</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.full_name} — {emp.employee_code || 'EMP'} ({emp.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Registered Employee Auto-filled Badge Preview */}
                  {formData.received_by_employee_name && (
                    <div className="mt-2 p-2.5 rounded-xl bg-blue-50/70 border border-blue-200/80 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                          {formData.received_by_employee_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 text-xs">
                            {formData.received_by_employee_name}
                          </span>
                          <span className="text-[10px] text-slate-600 ml-1.5 font-medium">
                            {formData.received_by_employee_code ? `(${formData.received_by_employee_code})` : ''} • {formData.received_by_employee_role}
                          </span>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> Registered Staff
                      </span>
                    </div>
                  )}
                </div>

                {/* Payment Mode */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Payment Mode
                  </label>
                  <select
                    value={formData.payment_mode}
                    onChange={(e: any) => setFormData({ ...formData, payment_mode: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs font-bold text-slate-800 bg-white"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Online / Bank Transfer">Online / Bank Transfer</option>
                    <option value="UPI">UPI</option>
                  </select>
                </div>

                {/* Notes / Purpose */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Purpose / Notes / Event Details
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Pilgrimage charter trip staff appreciation, road safety welfare fund..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs font-medium text-slate-800"
                  />
                </div>

                {/* Proof Option: Upload 3-4 Images */}
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Proof Option: Upload 3-4 Images
                    </label>
                    <span className="text-[11px] font-bold text-blue-600">
                      {formData.proof_images.length} / 4 Images Uploaded
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mb-2">
                    Upload photos of receipts, bank transfers, or donation handover photos for official verification.
                  </p>

                  {/* Thumbnail Grid */}
                  <div className="grid grid-cols-4 gap-2.5 mb-2.5">
                    {formData.proof_images.map((imgUrl, idx) => (
                      <div
                        key={idx}
                        className="relative rounded-xl overflow-hidden border border-slate-200 aspect-square group bg-slate-50 shadow-xs"
                      >
                        <img
                          src={imgUrl}
                          alt={`Proof ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => openLightbox(formData.proof_images, idx)}
                            className="p-1 rounded bg-white text-slate-800 hover:bg-slate-100"
                            title="View"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeProofImage(idx)}
                            className="p-1 rounded bg-rose-600 text-white hover:bg-rose-700"
                            title="Remove"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="absolute bottom-1 left-1 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                          Proof {idx + 1}
                        </div>
                      </div>
                    ))}

                    {/* Upload Slot if < 4 */}
                    {formData.proof_images.length < 4 && (
                      <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl aspect-square flex flex-col items-center justify-center cursor-pointer bg-slate-50/60 hover:bg-blue-50/40 transition-colors">
                        <Upload className="w-5 h-5 text-slate-400 mb-1" />
                        <span className="text-[10px] font-bold text-slate-600 text-center px-1">
                          {uploadingFiles ? 'Uploading...' : '+ Add Image'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleProofImageUpload}
                          disabled={uploadingFiles}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingFiles}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black shadow-md hover:shadow-lg transition-all"
                >
                  {isEditing ? 'Save Changes' : 'Record Donation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white max-w-sm w-full rounded-2xl p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Archive Donation Record?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to remove this donation record? It will no longer appear on the public website.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md"
              >
                Yes, Archive
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details View Modal */}
      {viewingDonation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-[#142B4A] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HeartHandshake className="w-5 h-5 text-rose-400" />
                <h3 className="text-base font-black">Donation Details</h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingDonation(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase">Donation Amount</div>
                  <div className="text-2xl font-black text-emerald-600 mt-0.5">
                    ₹{Number(viewingDonation.amount).toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] font-bold text-slate-500 uppercase">Receipt #</div>
                  <div className="font-mono font-bold text-slate-800 text-sm mt-0.5">
                    #DON-{String(viewingDonation.id).padStart(5, '0')}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Donator</div>
                  <div className="font-bold text-slate-900 text-xs mt-0.5">{viewingDonation.donor_name}</div>
                </div>

                <div className="p-3 rounded-xl border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Date</div>
                  <div className="font-bold text-slate-900 text-xs mt-0.5">
                    {new Date(viewingDonation.donation_date).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Received By Staff</div>
                  <div className="font-bold text-slate-900 text-xs mt-0.5">
                    {viewingDonation.received_by_employee_name}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {viewingDonation.received_by_employee_code} • {viewingDonation.received_by_employee_role}
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Payment Mode</div>
                  <div className="font-bold text-slate-900 text-xs mt-0.5">{viewingDonation.payment_mode || 'Cash'}</div>
                </div>
              </div>

              {viewingDonation.notes && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Notes / Purpose</div>
                  <p className="text-slate-700 text-xs mt-1 leading-relaxed">{viewingDonation.notes}</p>
                </div>
              )}

              {/* Proof Photos */}
              {viewingDonation.proof_images && viewingDonation.proof_images.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Verified Proof Images ({viewingDonation.proof_images.length})
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {viewingDonation.proof_images.map((imgUrl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => openLightbox(viewingDonation.proof_images!, idx)}
                        className="rounded-xl overflow-hidden border border-slate-200 aspect-square group shadow-xs cursor-pointer"
                      >
                        <img
                          src={imgUrl}
                          alt={`Proof ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handlePrintSlip(viewingDonation)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Official Slip
                </button>
                <button
                  type="button"
                  onClick={() => setViewingDonation(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-50 text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Carousel Modal */}
      {isLightboxOpen && lightboxImages.length > 0 && (
        <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <span className="text-xs text-white/80 font-bold">
              {lightboxIndex + 1} / {lightboxImages.length}
            </span>
            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="max-w-4xl max-h-[80vh] w-full flex items-center justify-center relative">
            <img
              src={lightboxImages[lightboxIndex]}
              alt={`Proof Document ${lightboxIndex + 1}`}
              className="max-h-[75vh] max-w-full object-contain rounded-lg shadow-2xl"
            />
          </div>

          {lightboxImages.length > 1 && (
            <div className="flex items-center gap-3 mt-4">
              <button
                type="button"
                onClick={() => setLightboxIndex((prev) => (prev > 0 ? prev - 1 : lightboxImages.length - 1))}
                className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setLightboxIndex((prev) => (prev < lightboxImages.length - 1 ? prev + 1 : 0))}
                className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default DonationManagement;
