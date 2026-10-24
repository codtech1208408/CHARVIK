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
  ArrowLeft,
  ShieldCheck
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

    // Nominee Details (Statutory & Accidental Insurance Beneficiary)
    nominee_name: '',
    nominee_relationship: '',
    nominee_phone: '',
    nominee_age: '',
    nominee_aadhaar: '',

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
    { number: 4, title: 'Nominee Details', icon: ShieldCheck },
    { number: 5, title: 'References', icon: Users },
    { number: 6, title: 'Employment', icon: Briefcase },
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
            onClick={() => navigate('/admin/employee-registration')}
            className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors gap-1.5 cursor-pointer border border-slate-200"
          >
            <ArrowLeft className="w-4 h-4 text-blue-600" />
            <span>Back to Employees</span>
          </button>
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
                Step 1: Personal Information (Biodata {formData.role === 'Captain' ? 'Captains' : 'Helper'})
              </h3>

              {/* 1. Profile Photo */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-slate-200 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden shrink-0">
                  {formData.profile_photo ? (
                    <img src={formData.profile_photo} alt="Profile Photo" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-7 h-7 text-slate-400" />
                  )}
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-800 mb-0.5">Profile Photo</label>
                  <p className="text-[11px] text-slate-500 mb-2">Upload staff portrait / passport photo</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload('profile_photo', e)}
                    className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 2. Gender */}
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

                {/* 3. Name (As per Aadhaar) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Name (As per Aadhaar) *
                  </label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                    placeholder="Enter full name as printed on Aadhaar"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 4. DOB */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">DOB (Date of Birth) *</label>
                  <input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                    required
                  />
                </div>

                {/* 5. E MAIL */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">E MAIL</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="staff@charvikstaffing.com"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 6. Phone Number * */}
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

                {/* 7. Alternative Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Alternative Number</label>
                  <input
                    type="tel"
                    value={formData.alternative_phone_number}
                    onChange={(e) => handleInputChange('alternative_phone_number', e.target.value)}
                    placeholder="Alternative contact"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Identity Docs */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in">
              <h3 className="text-sm font-bold text-[#142B4A] border-b border-slate-100 pb-2">
                Step 2: Identity Documents (Aadhaar & PAN)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 8. Aadhaar Number */}
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

                {/* 10. PAN Card Number */}
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

              {/* 9. Upload Photo File (Aadhaar front back ) & 11. Upload Photo File (PAN Card) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 flex flex-col items-center text-center">
                  <Upload className="w-6 h-6 text-slate-400 mb-2" />
                  <p className="text-xs font-bold text-slate-700">Upload Photo File (Aadhaar front back )</p>
                  <p className="text-[11px] text-slate-400 mb-2">Upload Front and/or Back side</p>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileUpload('aadhaar_front_doc', e)}
                    className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  />
                  {formData.aadhaar_front_doc && (
                    <p className="text-[10px] text-emerald-600 font-bold mt-1">✓ Aadhaar file attached</p>
                  )}
                </div>

                <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 flex flex-col items-center text-center">
                  <Upload className="w-6 h-6 text-slate-400 mb-2" />
                  <p className="text-xs font-bold text-slate-700">Upload Photo File (PAN Card)</p>
                  <p className="text-[11px] text-slate-400 mb-2">Upload clear photo of PAN Card</p>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileUpload('pan_doc', e)}
                    className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  />
                  {formData.pan_doc && (
                    <p className="text-[10px] text-emerald-600 font-bold mt-1">✓ PAN Card file attached</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Bank Name ( passbook cheque ) */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-in fade-in">
              <h3 className="text-sm font-bold text-[#142B4A] border-b border-slate-100 pb-2">
                Step 3: Bank Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Bank Name ( passbook cheque )
                  </label>
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
                    placeholder="Name as printed on passbook"
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
                <p className="text-xs font-bold text-slate-700">Upload Photo File (passbook / cheque)</p>
                <p className="text-[11px] text-slate-400 mb-2">Upload photo of passbook front page or cancelled cheque</p>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileUpload('bank_proof_doc', e)}
                  className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
                {formData.bank_proof_doc && (
                  <p className="text-[10px] text-emerald-600 font-bold mt-1">✓ Bank passbook / cheque attached</p>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: Nominee Details */}
          {currentStep === 4 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="text-sm font-bold text-[#142B4A]">
                  Step 4: Nominee Details (Legal & Accidental Beneficiary)
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Record next of kin nominee information for {formData.role} statutory claims, accidental coverage, and emergency settlements.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nominee Full Name *</label>
                  <input
                    type="text"
                    value={formData.nominee_name}
                    onChange={(e) => handleInputChange('nominee_name', e.target.value)}
                    placeholder="e.g. Smt. Lakshmi"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Relationship with {formData.role} *</label>
                  <select
                    value={formData.nominee_relationship}
                    onChange={(e) => handleInputChange('nominee_relationship', e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-semibold text-slate-800"
                  >
                    <option value="">Select Option</option>
                    <option value="Spouse">Spouse (Wife / Husband)</option>
                    <option value="Mother">Mother</option>
                    <option value="Father">Father</option>
                    <option value="Son">Son</option>
                    <option value="Daughter">Daughter</option>
                    <option value="Brother">Brother</option>
                    <option value="Sister">Sister</option>
                    <option value="Other">Other Relative</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nominee Contact Number *</label>
                  <input
                    type="tel"
                    value={formData.nominee_phone}
                    onChange={(e) => handleInputChange('nominee_phone', e.target.value)}
                    placeholder="10-digit mobile number"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nominee Age / Date of Birth</label>
                  <input
                    type="text"
                    value={formData.nominee_age}
                    onChange={(e) => handleInputChange('nominee_age', e.target.value)}
                    placeholder="e.g. 30 or YYYY-MM-DD"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nominee Aadhaar Number (Optional)</label>
                  <input
                    type="text"
                    value={formData.nominee_aadhaar}
                    onChange={(e) => handleInputChange('nominee_aadhaar', e.target.value)}
                    placeholder="12-digit Aadhaar number"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Reference Details */}
          {currentStep === 5 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="text-sm font-bold text-[#142B4A]">
                  Step 5: Reference Details (Verification)
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Previous transport employer or acquaintance who can verify conduct.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.reference_name}
                    onChange={(e) => handleInputChange('reference_name', e.target.value)}
                    placeholder="Reference person name"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.reference_phone}
                    onChange={(e) => handleInputChange('reference_phone', e.target.value)}
                    placeholder="Primary reference phone"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Alternative Number</label>
                  <input
                    type="tel"
                    value={formData.reference_alt_phone}
                    onChange={(e) => handleInputChange('reference_alt_phone', e.target.value)}
                    placeholder="Secondary reference phone"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Employment */}
          {currentStep === 6 && (
            <div className="space-y-4 animate-in fade-in">
              <h3 className="text-sm font-bold text-[#142B4A] border-b border-slate-100 pb-2">
                Step 6: Employment & Allocation
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
            ) : (
              <button
                type="button"
                onClick={() => navigate('/admin/employee-registration')}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
                <span>Cancel & Back</span>
              </button>
            )}

            {currentStep < 6 ? (
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
              className="p-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 flex items-center gap-1.5 font-bold cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
          </div>

          {/* Biodata helper & Captains Official Table Format */}
          <div className="border-2 border-black overflow-hidden font-sans">
            {/* Yellow Header */}
            <div className="bg-[#FFFF00] text-black font-black text-center py-2.5 text-sm uppercase tracking-wider border-b-2 border-black">
              Biodata helper &amp; Captains
            </div>

            <table className="w-full text-xs border-collapse">
              <tbody className="divide-y divide-black">
                {/* 1. Profile Photo */}
                <tr className="hover:bg-slate-50">
                  <td className="w-1/2 p-2.5 font-bold border-r border-black bg-slate-50/50">Profile Photo</td>
                  <td className="w-1/2 p-2.5">
                    {formData.profile_photo ? (
                      <img src={formData.profile_photo} alt="Profile" className="w-16 h-16 object-cover rounded-lg border border-slate-300" />
                    ) : (
                      <span className="text-slate-400 italic">No Photo Uploaded</span>
                    )}
                  </td>
                </tr>

                {/* 2. Gender */}
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-bold border-r border-black bg-slate-50/50">Gender</td>
                  <td className="p-2.5">{formData.gender || 'Male'}</td>
                </tr>

                {/* 3. Name (As per Aadhaar) */}
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-bold border-r border-black bg-slate-50/50">Name (As per Aadhaar)</td>
                  <td className="p-2.5 font-bold text-slate-900">{formData.full_name || '-'}</td>
                </tr>

                {/* 4. DOB */}
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-bold border-r border-black bg-slate-50/50">DOB</td>
                  <td className="p-2.5 font-mono">{formData.date_of_birth || '-'}</td>
                </tr>

                {/* 5. E MAIL */}
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-bold border-r border-black bg-slate-50/50">E MAIL</td>
                  <td className="p-2.5">{formData.email || '-'}</td>
                </tr>

                {/* 6. Phone Number * */}
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-bold border-r border-black bg-slate-50/50">Phone Number *</td>
                  <td className="p-2.5 font-mono font-bold text-blue-700">{formData.phone_number || '-'}</td>
                </tr>

                {/* 7. Alternative Number */}
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-bold border-r border-black bg-slate-50/50">Alternative Number</td>
                  <td className="p-2.5 font-mono">{formData.alternative_phone_number || '-'}</td>
                </tr>

                {/* 8. Aadhaar Number */}
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-bold border-r border-black bg-slate-50/50">Aadhaar Number</td>
                  <td className="p-2.5 font-mono">{formData.aadhaar_number || '-'}</td>
                </tr>

                {/* 9. Upload Photo File (Aadhaar front back ) */}
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-bold border-r border-black bg-slate-50/50">Upload Photo File (Aadhaar front back )</td>
                  <td className="p-2.5">
                    {formData.aadhaar_front_doc ? (
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        ✓ Aadhaar File Uploaded
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Not Uploaded</span>
                    )}
                  </td>
                </tr>

                {/* 10. PAN Card Number */}
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-bold border-r border-black bg-slate-50/50">PAN Card Number</td>
                  <td className="p-2.5 font-mono uppercase">{formData.pan_number || '-'}</td>
                </tr>

                {/* 11. Upload Photo File (PAN Card) */}
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-bold border-r border-black bg-slate-50/50">Upload Photo File (PAN Card)</td>
                  <td className="p-2.5">
                    {formData.pan_doc ? (
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        ✓ PAN Card File Uploaded
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Not Uploaded</span>
                    )}
                  </td>
                </tr>

                {/* 12. Bank Name ( passbook cheque ) */}
                <tr className="bg-slate-100 font-black text-slate-800">
                  <td colSpan={2} className="p-2.5 text-center uppercase tracking-wide border-y border-black font-bold">
                    Bank Name ( passbook cheque )
                  </td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Bank Name</td>
                  <td className="p-2.5 font-bold">{formData.bank_name || '-'}</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Upload Photo File</td>
                  <td className="p-2.5">
                    {formData.bank_proof_doc ? (
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        ✓ Passbook / Cheque File Uploaded
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Not Uploaded</span>
                    )}
                  </td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Account Holder Name</td>
                  <td className="p-2.5">{formData.account_holder_name || formData.full_name || '-'}</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Account Number</td>
                  <td className="p-2.5 font-mono">{formData.account_number || '-'}</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">IFSC Code</td>
                  <td className="p-2.5 font-mono uppercase">{formData.ifsc_code || '-'}</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Branch</td>
                  <td className="p-2.5">{formData.branch || '-'}</td>
                </tr>

                {/* 13. Nominee Details (Beneficiary) */}
                <tr className="bg-slate-100 font-black text-slate-800">
                  <td colSpan={2} className="p-2.5 text-center uppercase tracking-wide border-y border-black font-bold">
                    Nominee Details (Beneficiary)
                  </td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Nominee Name</td>
                  <td className="p-2.5 font-bold">{formData.nominee_name || '-'}</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Relationship with {formData.role}</td>
                  <td className="p-2.5 font-semibold text-blue-700">{formData.nominee_relationship || '-'}</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Nominee Phone Number</td>
                  <td className="p-2.5 font-mono">{formData.nominee_phone || '-'}</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Nominee Age</td>
                  <td className="p-2.5">{formData.nominee_age ? `${formData.nominee_age} Years` : '-'}</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Nominee Aadhaar Number</td>
                  <td className="p-2.5 font-mono">{formData.nominee_aadhaar || '-'}</td>
                </tr>

                {/* 14. Reference Details */}
                <tr className="bg-slate-100 font-black text-slate-800">
                  <td colSpan={2} className="p-2.5 text-center uppercase tracking-wide border-y border-black font-bold">
                    Reference Details (Verification)
                  </td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Name</td>
                  <td className="p-2.5">{formData.reference_name || '-'}</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Phone Number</td>
                  <td className="p-2.5 font-mono">{formData.reference_phone || '-'}</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Alternative Number</td>
                  <td className="p-2.5 font-mono">{formData.reference_alt_phone || '-'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </Modal>
    </div>
  );
};
