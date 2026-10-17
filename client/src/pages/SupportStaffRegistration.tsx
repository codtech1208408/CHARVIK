import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserCheck,
  User,
  CreditCard,
  Building,
  Users,
  Briefcase,
  Upload,
  CheckCircle2,
  Printer,
  Eye,
  Save,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { api } from '../services/api';
import type { Bus as BusType } from '../types';
import { Modal } from '../components/common/Modal';
import { useToast } from '../components/common/Toast';

export const SupportStaffRegistration: React.FC = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [buses, setBuses] = useState<BusType[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State for Helper / Captain matching Reference Image 4
  const [formData, setFormData] = useState<any>({
    role: 'Helper' as 'Helper' | 'Captain',
    profile_photo: '',
    gender: 'Male',
    full_name: '',
    date_of_birth: '',
    email: '',
    phone_number: '',
    alternative_phone_number: '',

    // Identity Documents
    aadhaar_number: '',
    aadhaar_front_doc: '',
    aadhaar_back_doc: '',
    pan_number: '',
    pan_doc: '',

    // Bank Details
    bank_name: '',
    bank_proof_doc: '',
    account_holder_name: '',
    account_number: '',
    ifsc_code: '',
    branch: '',

    // References
    reference_name: '',
    reference_phone: '',
    reference_alt_phone: '',

    // Employment
    employee_code: `EMP-HLP-00${Math.floor(10 + Math.random() * 90)}`,
    joining_date: new Date().toISOString().split('T')[0],
    employment_status: 'Active',
    assigned_bus_id: '',
    internal_remarks: ''
  });

  useEffect(() => {
    api.getBuses().then(setBuses).catch(console.error);
  }, []);

  const handleRoleChange = (newRole: 'Helper' | 'Captain') => {
    const prefix = newRole === 'Helper' ? 'EMP-HLP-' : 'EMP-CPT-';
    setFormData((prev) => ({
      ...prev,
      role: newRole,
      employee_code: `${prefix}00${Math.floor(10 + Math.random() * 90)}`
    }));
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (field: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await api.uploadFile(file);
      handleInputChange(field, res.fileUrl);
      success(`${file.name} uploaded successfully!`);
    } catch (err: any) {
      error(err.message || 'File upload failed');
    }
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!formData.full_name || !formData.phone_number) {
        error('Please enter Full Name as per Aadhaar and Phone Number');
        return;
      }
    }
    if (currentStep === 2) {
      if (!formData.aadhaar_number) {
        error('Please enter Aadhaar Number');
        return;
      }
    }
    setCurrentStep((prev) => Math.min(prev + 1, 5));
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name || !formData.phone_number || !formData.employee_code) {
      error('Please complete required personal and employment fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createEmployee(formData);
      success(`${formData.role} ${formData.full_name} (${formData.employee_code}) registered successfully!`);
      navigate('/admin/employees');
    } catch (err: any) {
      error(err.message || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { number: 1, title: 'Personal Info', icon: User },
    { number: 2, title: 'Identity Docs', icon: CreditCard },
    { number: 3, title: 'Bank Details', icon: Building },
    { number: 4, title: 'References', icon: Users },
    { number: 5, title: 'Employment', icon: Briefcase },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-[#142B4A] flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-blue-600" />
            <span>Helper and Captain Registration</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Register transport helpers and bus captains with full identity, bank, reference, and deployment records.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors gap-1.5 cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            <span>Preview Biodata</span>
          </button>
        </div>
      </div>

      {/* Role Selection Toggle */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Target Role</span>
          <p className="text-xs text-slate-700 font-medium">Select whether registering a Bus Helper or Captain</p>
        </div>

        <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
          <button
            type="button"
            onClick={() => handleRoleChange('Helper')}
            className={`px-5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              formData.role === 'Helper' ? 'bg-[#142B4A] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Bus Helper
          </button>
          <button
            type="button"
            onClick={() => handleRoleChange('Captain')}
            className={`px-5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              formData.role === 'Captain' ? 'bg-[#142B4A] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Bus Captain
          </button>
        </div>
      </div>

      {/* Progress Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm overflow-x-auto">
        <div className="flex items-center justify-between min-w-[500px] relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200 w-full -z-0"></div>
          {steps.map((st) => {
            const Icon = st.icon;
            const isDone = st.number < currentStep;
            const isCurrent = st.number === currentStep;
            return (
              <div
                key={st.number}
                onClick={() => setCurrentStep(st.number)}
                className="flex flex-col items-center relative z-10 cursor-pointer group"
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all shadow-sm ${
                    isCurrent
                      ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                      : isDone
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white text-slate-400 border border-slate-300'
                  }`}
                >
                  {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <span
                  className={`text-[11px] font-bold mt-1.5 whitespace-nowrap ${
                    isCurrent ? 'text-blue-700' : isDone ? 'text-slate-800' : 'text-slate-400'
                  }`}
                >
                  {st.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Form */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* STEP 1: Personal Info */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in">
              <h3 className="text-sm font-bold text-[#142B4A] border-b border-slate-100 pb-2">
                Step 1: Personal Information ({formData.role})
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Full Name (As per Aadhaar) *
                  </label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                    placeholder="Enter full name"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date of Birth (DOB) *</label>
                  <input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    value={formData.phone_number}
                    onChange={(e) => handleInputChange('phone_number', e.target.value)}
                    placeholder="9701011111"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Alternative Phone Number</label>
                  <input
                    type="tel"
                    value={formData.alternative_phone_number}
                    onChange={(e) => handleInputChange('alternative_phone_number', e.target.value)}
                    placeholder="Alt number"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="staff@charvikstaffing.com"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                />
              </div>
            </div>
          )}

          {/* STEP 2: Identity Docs */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in">
              <h3 className="text-sm font-bold text-[#142B4A] border-b border-slate-100 pb-2">
                Step 2: Identity Documents
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Aadhaar Number *</label>
                  <input
                    type="text"
                    value={formData.aadhaar_number}
                    onChange={(e) => handleInputChange('aadhaar_number', e.target.value)}
                    placeholder="XXXX-XXXX-1234"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">PAN Card Number</label>
                  <input
                    type="text"
                    value={formData.pan_number}
                    onChange={(e) => handleInputChange('pan_number', e.target.value.toUpperCase())}
                    placeholder="PQRST5678K"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 flex flex-col items-center text-center">
                  <Upload className="w-6 h-6 text-slate-400 mb-2" />
                  <p className="text-xs font-bold text-slate-700">Upload Aadhaar Front & Back</p>
                  <input
                    type="file"
                    onChange={(e) => handleFileUpload('aadhaar_front_doc', e)}
                    className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700"
                  />
                </div>

                <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 flex flex-col items-center text-center">
                  <Upload className="w-6 h-6 text-slate-400 mb-2" />
                  <p className="text-xs font-bold text-slate-700">Upload PAN Card File</p>
                  <input
                    type="file"
                    onChange={(e) => handleFileUpload('pan_doc', e)}
                    className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Bank Details */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-in fade-in">
              <h3 className="text-sm font-bold text-[#142B4A] border-b border-slate-100 pb-2">
                Step 3: Bank Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={formData.bank_name}
                    onChange={(e) => handleInputChange('bank_name', e.target.value)}
                    placeholder="Union Bank / SBI"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Account Holder Name</label>
                  <input
                    type="text"
                    value={formData.account_holder_name || formData.full_name}
                    onChange={(e) => handleInputChange('account_holder_name', e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Account Number</label>
                  <input
                    type="text"
                    value={formData.account_number}
                    onChange={(e) => handleInputChange('account_number', e.target.value)}
                    placeholder="123456789012"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">IFSC Code</label>
                  <input
                    type="text"
                    value={formData.ifsc_code}
                    onChange={(e) => handleInputChange('ifsc_code', e.target.value.toUpperCase())}
                    placeholder="UBIN0543210"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Branch</label>
                  <input
                    type="text"
                    value={formData.branch}
                    onChange={(e) => handleInputChange('branch', e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 flex flex-col items-center text-center">
                <Upload className="w-6 h-6 text-slate-400 mb-2" />
                <p className="text-xs font-bold text-slate-700">Upload Bank Proof Document</p>
                <input
                  type="file"
                  onChange={(e) => handleFileUpload('bank_proof_doc', e)}
                  className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700"
                />
              </div>
            </div>
          )}

          {/* STEP 4: References */}
          {currentStep === 4 && (
            <div className="space-y-4 animate-in fade-in">
              <h3 className="text-sm font-bold text-[#142B4A] border-b border-slate-100 pb-2">
                Step 4: Reference Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Reference Person Name</label>
                  <input
                    type="text"
                    value={formData.reference_name}
                    onChange={(e) => handleInputChange('reference_name', e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.reference_phone}
                    onChange={(e) => handleInputChange('reference_phone', e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Alternative Number</label>
                  <input
                    type="tel"
                    value={formData.reference_alt_phone}
                    onChange={(e) => handleInputChange('reference_alt_phone', e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Employment */}
          {currentStep === 5 && (
            <div className="space-y-4 animate-in fade-in">
              <h3 className="text-sm font-bold text-[#142B4A] border-b border-slate-100 pb-2">
                Step 5: Employment & Allocation
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Employee Code *</label>
                  <input
                    type="text"
                    value={formData.employee_code}
                    onChange={(e) => handleInputChange('employee_code', e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-bold text-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Joining Date</label>
                  <input
                    type="date"
                    value={formData.joining_date}
                    onChange={(e) => handleInputChange('joining_date', e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={formData.employment_status}
                    onChange={(e) => handleInputChange('employment_status', e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Bus</label>
                <select
                  value={formData.assigned_bus_id}
                  onChange={(e) => handleInputChange('assigned_bus_id', e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                >
                  <option value="">-- No Bus Assigned --</option>
                  {buses.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bus_number} ({b.registration_number})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Remarks</label>
                <textarea
                  rows={2}
                  value={formData.internal_remarks}
                  onChange={(e) => handleInputChange('internal_remarks', e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                />
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handlePrev}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous Step</span>
              </button>
            ) : <div></div>}

            {currentStep < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <span>Next Step</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-[#142B4A] hover:bg-[#1E3A5F] text-white text-xs font-bold flex items-center gap-2 shadow-md transition-colors cursor-pointer disabled:opacity-60"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{isSubmitting ? 'Registering...' : `Submit ${formData.role} Registration`}</span>
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Preview Modal */}
      <Modal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title={`${formData.role} Biodata Sheet Preview`}
        subtitle="Charvik Staffing Consultancy • Employee Verification Sheet"
        maxWidth="max-w-2xl"
      >
        <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-4 text-xs">
          <div className="flex items-center justify-between border-b pb-3 border-slate-200">
            <div className="flex items-center space-x-3">
              <img src="/logo.jpg" alt="Logo" className="w-10 h-10 object-contain" />
              <div>
                <h3 className="font-extrabold text-sm text-[#142B4A]">CHARVIK STAFFING CONSULTANCY</h3>
                <p className="text-[10px] text-slate-500 uppercase font-bold">{formData.role} Biodata Record</p>
              </div>
            </div>
            <button
              onClick={() => window.print()}
              className="p-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 flex items-center gap-1.5 font-bold"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div><strong>Role:</strong> {formData.role}</div>
            <div><strong>Employee Code:</strong> {formData.employee_code}</div>
            <div><strong>Full Name:</strong> {formData.full_name || 'Not filled'}</div>
            <div><strong>DOB:</strong> {formData.date_of_birth}</div>
            <div><strong>Phone:</strong> {formData.phone_number}</div>
            <div><strong>Aadhaar:</strong> {formData.aadhaar_number || 'XXXX-XXXX-XXXX'}</div>
            <div><strong>PAN:</strong> {formData.pan_number || 'N/A'}</div>
            <div><strong>Bank:</strong> {formData.bank_name}</div>
            <div><strong>Account Number:</strong> {formData.account_number || 'N/A'}</div>
            <div><strong>IFSC:</strong> {formData.ifsc_code}</div>
            <div><strong>Status:</strong> {formData.employment_status}</div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
