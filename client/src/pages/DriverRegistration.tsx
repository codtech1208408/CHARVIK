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
    licence_verification_doc: '',

    // Step 4: Bank Details
    bank_name: '',
    bank_proof_doc: '',
    account_holder_name: '',
    account_number: '',
    ifsc_code: '',
    branch: '',

    // Step 5: Nominee Details (Insurance & Statutory Beneficiary)
    nominee_name: '',
    nominee_relationship: '',
    nominee_phone: '',
    nominee_age: '',
    nominee_aadhaar: '',

    // Step 6: Reference Details
    reference_name: '',
    reference_phone: '',
    reference_alt_phone: '',

    // Step 7: Employment Details
    employee_code: `EMP-DRV-00${Math.floor(10 + Math.random() * 90)}`,
    employment_type: 'Permanent',
    salary: '',
    joining_date: new Date().toISOString().split('T')[0],
    employment_status: 'Active',
    assigned_bus_id: '',
    internal_remarks: ''
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
    setCurrentStep((prev) => Math.min(prev + 1, 7));
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
    { number: 5, title: 'Nominee Details', icon: ShieldCheck },
    { number: 6, title: 'References', icon: Users },
    { number: 7, title: 'Employment', icon: Briefcase },
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
                Step 1: Personal Information (Biodata Driver)
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
                  <p className="text-[11px] text-slate-500 mb-2">Upload driver portrait / passport size photo</p>
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
                    placeholder="driver@charvikstaffing.com"
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
                    placeholder="e.g. 9848012345"
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
                    placeholder="e.g. 9848099999"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                  />
                </div>
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

              {/* Upload Photo Files: Aadhaar Front, Aadhaar Back, and PAN Card */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                {/* Aadhaar Card Front */}
                <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 flex flex-col items-center text-center">
                  <Upload className="w-6 h-6 text-blue-600 mb-2" />
                  <p className="text-xs font-bold text-slate-700">Aadhaar Card (Front Side) *</p>
                  <p className="text-[11px] text-slate-400 mb-2">Upload Front side photo</p>
                  <div className="space-y-1.5 w-full">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileUpload('aadhaar_front_doc', e)}
                      className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer w-full"
                    />
                    {formData.aadhaar_front_doc && (
                      <p className="text-[10px] text-emerald-600 font-bold">✓ Front side attached</p>
                    )}
                  </div>
                </div>

                {/* Aadhaar Card Back */}
                <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 flex flex-col items-center text-center">
                  <Upload className="w-6 h-6 text-blue-600 mb-2" />
                  <p className="text-xs font-bold text-slate-700">Aadhaar Card (Back Side) *</p>
                  <p className="text-[11px] text-slate-400 mb-2">Upload Back side photo</p>
                  <div className="space-y-1.5 w-full">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileUpload('aadhaar_back_doc', e)}
                      className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer w-full"
                    />
                    {formData.aadhaar_back_doc && (
                      <p className="text-[10px] text-emerald-600 font-bold">✓ Back side attached</p>
                    )}
                  </div>
                </div>

                {/* PAN Card */}
                <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 flex flex-col items-center text-center">
                  <Upload className="w-6 h-6 text-slate-400 mb-2" />
                  <p className="text-xs font-bold text-slate-700">Upload Photo File (PAN Card)</p>
                  <p className="text-[11px] text-slate-400 mb-2">Upload clear photo of PAN Card</p>
                  <div className="space-y-1.5 w-full">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileUpload('pan_doc', e)}
                      className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer w-full"
                    />
                    {formData.pan_doc && (
                      <p className="text-[10px] text-emerald-600 font-bold mt-1">✓ PAN Card file attached</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Driving Licence Details */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-in fade-in">
              <h3 className="text-sm font-bold text-[#142B4A] border-b border-slate-100 pb-2">
                Step 3: Driving Licence Details
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">Issued By State</label>
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
                    placeholder="e.g. Vijayawada (AP-16)"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Issue Date (TRANS)</label>
                  <input
                    type="date"
                    value={formData.licence_issue_date}
                    onChange={(e) => handleInputChange('licence_issue_date', e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Validity Date (TRANS)2-Day Buffer *
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
                    Total Experience as Per Licence
                  </label>
                  <input
                    type="number"
                    value={formData.licence_experience_years}
                    onChange={(e) => handleInputChange('licence_experience_years', Number(e.target.value))}
                    placeholder="e.g. 5 (Years)"
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

              {/* Licence Verification Proof / Photo Upload */}
              <div className="p-4 rounded-xl border border-dashed border-blue-200 bg-blue-50/40 flex flex-col items-center text-center">
                <Upload className="w-6 h-6 text-blue-600 mb-1.5" />
                <p className="text-xs font-bold text-slate-800">Upload Photo to Verify Licence (Sarathi Portal / Proof Photo)</p>
                <p className="text-[11px] text-slate-500 mb-2">Upload screenshot from Sarathi Parivahan portal or verification certificate</p>
                <div className="space-y-1.5 w-full max-w-md">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileUpload('licence_verification_doc', e)}
                    className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer w-full"
                  />
                  {formData.licence_verification_doc && (
                    <p className="text-[10px] text-emerald-600 font-bold">✓ Licence verification proof photo attached</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Any Criminal Background As Per Licence
                </label>
                <textarea
                  rows={2}
                  value={formData.criminal_background_details}
                  onChange={(e) => handleInputChange('criminal_background_details', e.target.value)}
                  placeholder="Record any violations, traffic challans, or write 'None / Clean Record'"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                />
              </div>

              {/* Driving Licence Photos (Front & Back) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 flex flex-col items-center text-center">
                  <Upload className="w-6 h-6 text-blue-600 mb-2" />
                  <p className="text-xs font-bold text-slate-700">Driving Licence (Front Side) *</p>
                  <p className="text-[11px] text-slate-400 mb-2">Upload clear photo of DL Front</p>
                  <div className="space-y-1.5 w-full">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileUpload('licence_front_doc', e)}
                      className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer w-full"
                    />
                    {formData.licence_front_doc && (
                      <p className="text-[10px] text-emerald-600 font-bold">✓ DL Front side attached</p>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 flex flex-col items-center text-center">
                  <Upload className="w-6 h-6 text-blue-600 mb-2" />
                  <p className="text-xs font-bold text-slate-700">Driving Licence (Back Side) *</p>
                  <p className="text-[11px] text-slate-400 mb-2">Upload clear photo of DL Back</p>
                  <div className="space-y-1.5 w-full">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileUpload('licence_back_doc', e)}
                      className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer w-full"
                    />
                    {formData.licence_back_doc && (
                      <p className="text-[10px] text-emerald-600 font-bold">✓ DL Back side attached</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Bank Name */}
          {currentStep === 4 && (
            <div className="space-y-4 animate-in fade-in">
              <h3 className="text-sm font-bold text-[#142B4A] border-b border-slate-100 pb-2">
                Step 4: Bank Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Bank Name
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
                    placeholder="Name as printed on bank passbook"
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
                <p className="text-xs font-bold text-slate-700">Upload Photo File (passbook check )</p>
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

          {/* STEP 5: Nominee Details */}
          {currentStep === 5 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="text-sm font-bold text-[#142B4A]">
                  Step 5: Nominee Details (Legal & Accidental Insurance Beneficiary)
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Record next of kin nominee information for statutory claims, accidental coverage, and emergency settlements.
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">Relationship with Driver *</label>
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
                    placeholder="e.g. 34 or YYYY-MM-DD"
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

          {/* STEP 6: Reference Details */}
          {currentStep === 6 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="text-sm font-bold text-[#142B4A]">
                  Step 6: Reference Details (Character & Background Verification)
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Previous transport employer, fleet supervisor, or acquaintance who can vouch for driver conduct.
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

          {/* STEP 7: Employment Details */}
          {currentStep === 7 && (
            <div className="space-y-4 animate-in fade-in">
              <h3 className="text-sm font-bold text-[#142B4A] border-b border-slate-100 pb-2">
                Step 7: Employment & Bus Allocation
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-blue-50/60 border border-blue-200">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Worker Type (Employment Category) *
                  </label>
                  <select
                    value={formData.employment_type || 'Permanent'}
                    onChange={(e) => handleInputChange('employment_type', e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-blue-300 bg-white font-bold text-blue-900 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="Permanent">Permanent Worker</option>
                    <option value="Temporary">Temporary Worker</option>
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Select whether the driver is a Permanent employee or Temporary staff.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    {formData.employment_type === 'Temporary' ? 'Temporary Worker Salary / Wage (₹) *' : 'Permanent Worker Salary (₹) *'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={formData.salary || ''}
                      onChange={(e) => handleInputChange('salary', e.target.value)}
                      placeholder={formData.employment_type === 'Temporary' ? 'Enter temporary wage amount (₹)' : 'Enter permanent salary amount (₹)'}
                      className="w-full text-xs pl-7 pr-3 p-2.5 rounded-xl border border-blue-300 bg-white font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Admin manual salary entry</p>
                </div>
              </div>

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

            {currentStep < 7 ? (
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

          {/* Biodata Driver Official Table Format */}
          <div className="border-2 border-black overflow-hidden font-sans">
            {/* Yellow Header */}
            <div className="bg-[#FFFF00] text-black font-black text-center py-2.5 text-sm uppercase tracking-wider border-b-2 border-black">
              Biodata Driver
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

                {/* 9. Upload Aadhaar Front & Back */}
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-bold border-r border-black bg-slate-50/50">Aadhaar Card (Front Side)</td>
                  <td className="p-2.5">
                    {formData.aadhaar_front_doc ? (
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        ✓ Front Uploaded
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Not Uploaded</span>
                    )}
                  </td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-bold border-r border-black bg-slate-50/50">Aadhaar Card (Back Side)</td>
                  <td className="p-2.5">
                    {formData.aadhaar_back_doc ? (
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        ✓ Back Uploaded
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

                {/* 12. Driving Licence Details (Header) */}
                <tr className="bg-slate-100 font-black text-slate-800">
                  <td colSpan={2} className="p-2.5 text-center uppercase tracking-wide border-y border-black font-bold">
                    Driving Licence Details
                  </td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Driving Licence (Front Side)</td>
                  <td className="p-2.5">
                    {formData.licence_front_doc ? (
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        ✓ Front Uploaded
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Not Uploaded</span>
                    )}
                  </td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Driving Licence (Back Side)</td>
                  <td className="p-2.5">
                    {formData.licence_back_doc ? (
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        ✓ Back Uploaded
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Not Uploaded</span>
                    )}
                  </td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Licence Verification Status</td>
                  <td className="p-2.5">
                    <span className="px-2 py-0.5 rounded font-bold text-xs bg-blue-50 text-blue-700 border border-blue-200">
                      {formData.licence_verification_status || 'Pending Verification'}
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Licence Verification Photo / Proof</td>
                  <td className="p-2.5">
                    {formData.licence_verification_doc ? (
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        ✓ Verification Photo Attached
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Not Uploaded</span>
                    )}
                  </td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Driving Licence Number</td>
                  <td className="p-2.5 font-mono font-bold text-blue-700 uppercase">{formData.licence_number || '-'}</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Issued By State</td>
                  <td className="p-2.5">{formData.issuing_state || '-'}</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Issued RTO Office</td>
                  <td className="p-2.5">{formData.issuing_rto_office || '-'}</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Issue Date (TRANS)</td>
                  <td className="p-2.5 font-mono">{formData.licence_issue_date || '-'}</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Validity Date (TRANS)2-Day Buffer</td>
                  <td className="p-2.5 font-mono font-bold text-blue-700">{formData.licence_validity_date || '-'}</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Total Experience as Per Licence</td>
                  <td className="p-2.5">{formData.licence_experience_years ? `${formData.licence_experience_years} Years` : '-'}</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Any Criminal Background As Per Licence</td>
                  <td className="p-2.5">{formData.criminal_background_details || 'Clean Record / None'}</td>
                </tr>

                {/* 13. Bank Name (Header) */}
                <tr className="bg-slate-100 font-black text-slate-800">
                  <td colSpan={2} className="p-2.5 text-center uppercase tracking-wide border-y border-black font-bold">
                    Bank Name
                  </td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Bank Name</td>
                  <td className="p-2.5 font-bold">{formData.bank_name || '-'}</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Upload Photo File (passbook check )</td>
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

                {/* 14. Nominee Details (Header) */}
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
                  <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Relationship with Driver</td>
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

                {/* 15. Reference Details (Header) */}
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

                {/* 16. Employment Details (Header) */}
                <tr className="bg-slate-100 font-black text-slate-800">
                  <td colSpan={2} className="p-2.5 text-center uppercase tracking-wide border-y border-black font-bold">
                    Employment & Salary Details
                  </td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Worker Type</td>
                  <td className="p-2.5">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${
                      formData.employment_type === 'Temporary'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    }`}>
                      {formData.employment_type === 'Temporary' ? 'Temporary Worker' : 'Permanent Worker'}
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">
                    {formData.employment_type === 'Temporary' ? 'Temporary Wage / Salary' : 'Permanent Monthly Salary'}
                  </td>
                  <td className="p-2.5 font-bold text-slate-900">
                    {formData.salary ? `₹${Number(formData.salary).toLocaleString('en-IN')}` : '₹0'}
                  </td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Employee Code</td>
                  <td className="p-2.5 font-mono font-bold">{formData.employee_code || '-'}</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Joining Date</td>
                  <td className="p-2.5">{formData.joining_date || '-'}</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Status</td>
                  <td className="p-2.5">{formData.employment_status || 'Active'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </Modal>
    </div>
  );
};
