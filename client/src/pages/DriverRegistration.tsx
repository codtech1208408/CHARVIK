import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserPlus,
  User,
  CreditCard,
  FileText,
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

export const DriverRegistration: React.FC = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [buses, setBuses] = useState<BusType[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State matching the spreadsheet reference image 4
  const [formData, setFormData] = useState<any>({
    // Step 1: Personal Information
    profile_photo: '',
    gender: 'Male',
    full_name: '',
    date_of_birth: '',
    email: '',
    phone_number: '',
    alternative_phone_number: '',

    // Step 2: Identity Documents
    aadhaar_number: '',
    aadhaar_front_doc: '',
    aadhaar_back_doc: '',
    pan_number: '',
    pan_doc: '',

    // Step 3: Driving Licence Details
    licence_number: '',
    licence_front_doc: '',
    licence_back_doc: '',
    issuing_state: '',
    issuing_rto_office: '',
    licence_issue_date: '',
    licence_validity_date: '',
    licence_experience_years: '',
    criminal_background_details: '',
    licence_verification_status: 'Pending Verification',

    // Step 4: Bank Details
    bank_name: '',
    bank_proof_doc: '',
    account_holder_name: '',
    account_number: '',
    ifsc_code: '',
    branch: '',

    // Step 5: Reference Details
    reference_name: '',
    reference_phone: '',
    reference_alt_phone: '',

    // Step 6: Employment Details
    employee_code: `EMP-DRV-00${Math.floor(10 + Math.random() * 90)}`,
    joining_date: new Date().toISOString().split('T')[0],
    employment_status: 'Active',
    assigned_bus_id: '',
    internal_remarks: 'Enrolled as commercial heavy passenger vehicle driver.'
  });

  useEffect(() => {
    api.getBuses().then(setBuses).catch(console.error);
  }, []);

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
    if (currentStep === 3) {
      if (!formData.licence_number || !formData.licence_validity_date) {
        error('Please enter Driving Licence Number and Validity Date');
        return;
      }
    }
    setCurrentStep((prev) => Math.min(prev + 1, 6));
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name || !formData.phone_number || !formData.employee_code) {
      error('Please complete required driver personal and employment details.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createEmployee({
        ...formData,
        role: 'Driver'
      });
      success(`Driver ${formData.full_name} (${formData.employee_code}) registered successfully!`);
      navigate('/admin/employees');
    } catch (err: any) {
      error(err.message || 'Driver registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { number: 1, title: 'Personal Info', icon: User },
    { number: 2, title: 'Identity Docs', icon: CreditCard },
    { number: 3, title: 'Driving Licence', icon: FileText },
    { number: 4, title: 'Bank Details', icon: Building },
    { number: 5, title: 'References', icon: Users },
    { number: 6, title: 'Employment', icon: Briefcase },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-[#142B4A] flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-600" />
            <span>Driver Biodata Registration</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Step-by-step biodata wizard with Aadhaar, PAN, commercial driving licence, and bank verification.
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

      {/* Wizard Progress Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm overflow-x-auto">
        <div className="flex items-center justify-between min-w-[550px] relative">
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

      {/* Main Form Container */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* STEP 1: Personal Information */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in">
              <h3 className="text-sm font-bold text-[#142B4A] border-b border-slate-100 pb-2">
                Step 1: Personal Information
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
                    placeholder="Enter full name as printed on Aadhaar"
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
                    placeholder="9848012345"
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
                    placeholder="Alternative contact"
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
                  placeholder="driver@charvikstaffing.com"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                />
              </div>
            </div>
          )}

          {/* STEP 2: Identity Documents */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in">
              <h3 className="text-sm font-bold text-[#142B4A] border-b border-slate-100 pb-2">
                Step 2: Identity Documents (Aadhaar & PAN)
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
                    placeholder="ABCDE1234F"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 flex flex-col items-center text-center">
                  <Upload className="w-6 h-6 text-slate-400 mb-2" />
                  <p className="text-xs font-bold text-slate-700">Upload Aadhaar Front & Back</p>
                  <p className="text-[11px] text-slate-400 mb-3">PDF or JPEG file</p>
                  <input
                    type="file"
                    onChange={(e) => handleFileUpload('aadhaar_front_doc', e)}
                    className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>

                <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 flex flex-col items-center text-center">
                  <Upload className="w-6 h-6 text-slate-400 mb-2" />
                  <p className="text-xs font-bold text-slate-700">Upload PAN Card File</p>
                  <p className="text-[11px] text-slate-400 mb-3">PDF or JPEG file</p>
                  <input
                    type="file"
                    onChange={(e) => handleFileUpload('pan_doc', e)}
                    className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Driving Licence Details */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-in fade-in">
              <h3 className="text-sm font-bold text-[#142B4A] border-b border-slate-100 pb-2">
                Step 3: Commercial Driving Licence Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Driving Licence (DL) Number *
                  </label>
                  <input
                    type="text"
                    value={formData.licence_number}
                    onChange={(e) => handleInputChange('licence_number', e.target.value.toUpperCase())}
                    placeholder="AP1620100012345"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-mono uppercase"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Issuing State</label>
                  <select
                    value={formData.issuing_state}
                    onChange={(e) => handleInputChange('issuing_state', e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                  >
                    <option value="Andhra Pradesh">Andhra Pradesh</option>
                    <option value="Telangana">Telangana</option>
                    <option value="Karnataka">Karnataka</option>
                    <option value="Tamil Nadu">Tamil Nadu</option>
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Issued RTO Office</label>
                  <input
                    type="text"
                    value={formData.issuing_rto_office}
                    onChange={(e) => handleInputChange('issuing_rto_office', e.target.value)}
                    placeholder="Vijayawada (AP-16)"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Licence Issue Date (TRANS)</label>
                  <input
                    type="date"
                    value={formData.licence_issue_date}
                    onChange={(e) => handleInputChange('licence_issue_date', e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Validity Date (TRANS) [2-Day Buffer] *
                  </label>
                  <input
                    type="date"
                    value={formData.licence_validity_date}
                    onChange={(e) => handleInputChange('licence_validity_date', e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-bold text-blue-700"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Total Experience as per Licence (Years)
                  </label>
                  <input
                    type="number"
                    value={formData.licence_experience_years}
                    onChange={(e) => handleInputChange('licence_experience_years', Number(e.target.value))}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Licence Verification Status
                  </label>
                  <select
                    value={formData.licence_verification_status}
                    onChange={(e) => handleInputChange('licence_verification_status', e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                  >
                    <option value="Verified">Verified (Official Sarathi Portal)</option>
                    <option value="Pending Verification">Pending Verification</option>
                    <option value="Not Verified">Not Verified</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Any Criminal Background as per Licence or Authorized Verification
                </label>
                <textarea
                  rows={2}
                  value={formData.criminal_background_details}
                  onChange={(e) => handleInputChange('criminal_background_details', e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                />
              </div>

              <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 flex flex-col items-center text-center">
                <Upload className="w-6 h-6 text-slate-400 mb-2" />
                <p className="text-xs font-bold text-slate-700">Upload Photo File (DL Front & Back)</p>
                <input
                  type="file"
                  onChange={(e) => handleFileUpload('licence_front_doc', e)}
                  className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
            </div>
          )}

          {/* STEP 4: Bank Details */}
          {currentStep === 4 && (
            <div className="space-y-4 animate-in fade-in">
              <h3 className="text-sm font-bold text-[#142B4A] border-b border-slate-100 pb-2">
                Step 4: Bank Account Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Bank Name (passbook / cheque)
                  </label>
                  <input
                    type="text"
                    value={formData.bank_name}
                    onChange={(e) => handleInputChange('bank_name', e.target.value)}
                    placeholder="State Bank of India / HDFC"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Account Holder Name</label>
                  <input
                    type="text"
                    value={formData.account_holder_name || formData.full_name}
                    onChange={(e) => handleInputChange('account_holder_name', e.target.value)}
                    placeholder="Name on bank account"
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
                    placeholder="309876543210"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">IFSC Code</label>
                  <input
                    type="text"
                    value={formData.ifsc_code}
                    onChange={(e) => handleInputChange('ifsc_code', e.target.value.toUpperCase())}
                    placeholder="SBIN0001234"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Branch</label>
                  <input
                    type="text"
                    value={formData.branch}
                    onChange={(e) => handleInputChange('branch', e.target.value)}
                    placeholder="MG Road Branch"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 flex flex-col items-center text-center">
                <Upload className="w-6 h-6 text-slate-400 mb-2" />
                <p className="text-xs font-bold text-slate-700">Upload Photo File (Passbook / Cancelled Cheque)</p>
                <input
                  type="file"
                  onChange={(e) => handleFileUpload('bank_proof_doc', e)}
                  className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
            </div>
          )}

          {/* STEP 5: Reference Details */}
          {currentStep === 5 && (
            <div className="space-y-4 animate-in fade-in">
              <h3 className="text-sm font-bold text-[#142B4A] border-b border-slate-100 pb-2">
                Step 5: Reference Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Reference Person Name</label>
                  <input
                    type="text"
                    value={formData.reference_name}
                    onChange={(e) => handleInputChange('reference_name', e.target.value)}
                    placeholder="Reference Contact Person"
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
                    placeholder="Alt reference phone"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Employment Details */}
          {currentStep === 6 && (
            <div className="space-y-4 animate-in fade-in">
              <h3 className="text-sm font-bold text-[#142B4A] border-b border-slate-100 pb-2">
                Step 6: Employment & Bus Allocation
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">Employment Status</label>
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
                <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Fleet Bus</label>
                <select
                  value={formData.assigned_bus_id}
                  onChange={(e) => handleInputChange('assigned_bus_id', e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                >
                  <option value="">-- No Bus Assigned Initially --</option>
                  {buses.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bus_number} ({b.registration_number}) - {b.make} {b.model}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Internal HR Remarks</label>
                <textarea
                  rows={2}
                  value={formData.internal_remarks}
                  onChange={(e) => handleInputChange('internal_remarks', e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                />
              </div>
            </div>
          )}

          {/* Wizard Controls */}
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
                <span>{isSubmitting ? 'Submitting Registration...' : 'Submit Driver Registration'}</span>
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Preview Biodata Modal */}
      <Modal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title="Driver Biodata Sheet Preview"
        subtitle="Charvik Staffing Consultancy • Employee Verification Sheet"
        maxWidth="max-w-2xl"
      >
        <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-4 text-xs">
          <div className="flex items-center justify-between border-b pb-3 border-slate-200">
            <div className="flex items-center space-x-3">
              <img src="/logo.jpg" alt="Logo" className="w-10 h-10 object-contain" />
              <div>
                <h3 className="font-extrabold text-sm text-[#142B4A]">CHARVIK STAFFING CONSULTANCY</h3>
                <p className="text-[10px] text-slate-500 uppercase font-bold">Driver Master Biodata</p>
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
            <div><strong>Full Name:</strong> {formData.full_name || 'Not filled'}</div>
            <div><strong>Employee Code:</strong> {formData.employee_code}</div>
            <div><strong>DOB:</strong> {formData.date_of_birth}</div>
            <div><strong>Phone:</strong> {formData.phone_number}</div>
            <div><strong>Aadhaar:</strong> {formData.aadhaar_number || 'XXXX-XXXX-XXXX'}</div>
            <div><strong>PAN:</strong> {formData.pan_number || 'N/A'}</div>
            <div><strong>Licence Number:</strong> {formData.licence_number || 'N/A'}</div>
            <div><strong>Licence Validity:</strong> {formData.licence_validity_date}</div>
            <div><strong>Experience:</strong> {formData.licence_experience_years} Years</div>
            <div><strong>Bank Name:</strong> {formData.bank_name}</div>
            <div><strong>Account Number:</strong> {formData.account_number || 'N/A'}</div>
            <div><strong>IFSC:</strong> {formData.ifsc_code}</div>
            <div><strong>Reference Contact:</strong> {formData.reference_name} ({formData.reference_phone})</div>
            <div><strong>Status:</strong> {formData.employment_status}</div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
