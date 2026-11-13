import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  ShieldCheck,
  AlertCircle,
  Calendar,
  Mail,
  Phone,
  FileText,
  MapPin,
  Clock,
  Sparkles,
  Award,
  Bus,
  Check
} from 'lucide-react';
import luxuryCoachHeader from '../assets/luxury-coach-header.png';
import { api } from '../services/api';
import type { Bus as BusType } from '../types';
import { Modal } from '../components/common/Modal';
import { StatusToggle } from '../components/common/StatusToggle';
import { useToast } from '../components/common/Toast';
import { getNextEmployeeCode } from '../utils/employeeCode';
import { BASE_FLEET_EMPLOYEES } from '../services/seedData';
import { useAuth } from '../context/AuthContext';

export const SupportStaffRegistration: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { success, error } = useToast();

  const [buses, setBuses] = useState<BusType[]>([]);
  const [existingEmployees, setExistingEmployees] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);

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

    // Driving Licence Details & Verification Photo (Required for Captain, optional for Helper)
    licence_number: '',
    licence_front_doc: '',
    licence_back_doc: '',
    licence_verification_status: 'Pending Verification',
    licence_verification_doc: '',
    issuing_state: '',
    issuing_rto_office: '',
    licence_issue_date: '',
    licence_validity_date: '',
    licence_experience_years: 0,
    criminal_background_details: '',

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
    employee_code: 'HLP-1001',
    employment_type: 'Permanent',
    salary: '',
    joining_date: new Date().toISOString().split('T')[0],
    employment_status: 'Active',
    assigned_bus_id: '',
    internal_remarks: ''
  });

  useEffect(() => {
    api.getBuses().then(setBuses).catch(console.error);
    api.getEmployees().then((empList) => {
      setExistingEmployees(Array.isArray(empList) ? empList : []);
    }).catch(() => {
      setExistingEmployees([]);
    });

    api.getNextEmployeeCode('Helper')
      .then((res) => {
        if (res?.nextCode) {
          setFormData((prev: any) => ({
            ...prev,
            employee_code: res.nextCode
          }));
        }
      })
      .catch(() => {
        const nextCode = getNextEmployeeCode('Helper', existingEmployees);
        setFormData((prev: any) => ({
          ...prev,
          employee_code: nextCode
        }));
      });
  }, []);

  const handleRoleChange = (newRole: 'Helper' | 'Captain') => {
    api.getNextEmployeeCode(newRole)
      .then((res) => {
        if (res?.nextCode) {
          setFormData((prev: any) => ({
            ...prev,
            role: newRole,
            employee_code: res.nextCode
          }));
        }
      })
      .catch(() => {
        const nextCode = getNextEmployeeCode(newRole, existingEmployees);
        setFormData((prev: any) => ({
          ...prev,
          role: newRole,
          employee_code: nextCode
        }));
      });
  };

  const handleInputChange = (field: string, value: any) => {
    setStepError(null);
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (field: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await api.uploadFile(file);
      handleInputChange(field, res.fileUrl);
      setStepError(null);
      success(`${file.name} uploaded successfully!`);
    } catch (err: any) {
      error(err.message || 'File upload failed');
    }
  };

  const validateStep = (stepNumber: number): string | null => {
    const isUserAdmin = user?.role?.toLowerCase().includes('admin') || location.pathname.startsWith('/admin');
    if (isUserAdmin) return null;

    if (stepNumber === 1) {
      if (!formData.employee_code?.trim()) return 'Please enter Employee ID';
      if (!formData.full_name?.trim()) return 'Please enter Full Name as per Aadhaar';
      if (!formData.date_of_birth) return 'Please select Date of Birth (DOB)';
      if (!formData.phone_number?.trim()) return 'Please enter 10-digit Phone Number';
      if (formData.phone_number.trim().length < 10) return 'Please enter a valid 10-digit Phone Number';
    } else if (stepNumber === 2) {
      if (!formData.aadhaar_number?.trim()) return 'Please enter Aadhaar Number';
      if (formData.aadhaar_number.replace(/\D/g, '').length < 12) return 'Please enter a valid 12-digit Aadhaar Number';
      if (!formData.aadhaar_front_doc) return 'Please upload Aadhaar Card (Front Side) photo';
      if (!formData.aadhaar_back_doc) return 'Please upload Aadhaar Card (Back Side) photo';
    } else if (stepNumber === 3) {
      if (!formData.bank_name?.trim()) return 'Please enter Bank Name';
      if (!formData.account_number?.trim()) return 'Please enter Bank Account Number';
      if (!formData.ifsc_code?.trim()) return 'Please enter Bank IFSC Code';
      if (!formData.bank_proof_doc) return 'Please upload Bank Passbook / Cheque photo';
    } else if (stepNumber === 4) {
      if (!formData.nominee_name?.trim()) return 'Please enter Nominee Full Name';
      if (!formData.nominee_relationship?.trim()) return 'Please select Relationship with Nominee';
      if (!formData.nominee_phone?.trim()) return 'Please enter Nominee Contact Number';
    } else if (stepNumber === 5) {
      if (!formData.reference_name?.trim()) return 'Please enter Reference Person Name';
      if (!formData.reference_phone?.trim()) return 'Please enter Reference Contact Number';
    } else if (stepNumber === 6) {
      if (!formData.employment_type?.trim()) return 'Please select Worker Type';
      if (!formData.salary || Number(formData.salary) <= 0) return 'Please enter Worker Salary / Wage amount';
    }
    return null;
  };

  const handleNext = () => {
    setStepError(null);
    setCurrentStep((prev) => Math.min(prev + 1, 6));
  };

  const handleStepClick = (targetStep: number) => {
    setStepError(null);
    setCurrentStep(targetStep);
  };

  const handlePrev = () => {
    setStepError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name?.trim()) {
      error('Please enter at least Name as per Aadhaar');
      setCurrentStep(1);
      return;
    }

    setIsSubmitting(true);
    try {
      const isUserAdmin = user?.role?.toLowerCase().includes('admin') || location.pathname.startsWith('/admin');
      const submissionData = {
        ...formData,
        employee_code: formData.employee_code?.trim() || `EMP-${Date.now().toString().slice(-4)}`,
        full_name: formData.full_name?.trim() || 'Support Staff',
        phone_number: formData.phone_number?.trim() || '9999999999',
        role: formData.role || 'Captain'
      };
      await api.createEmployee(submissionData);
      success(`${submissionData.role} ${submissionData.full_name} (${submissionData.employee_code}) registered successfully!`);
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
      {/* Header with 3D Luxury Coach Bus */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#00367A] via-[#004B9E] to-[#0056B3] p-5 shadow-lg border-b-4 border-[#F59E0B]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3 max-w-sm lg:max-w-md">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-inner shrink-0">
              <UserCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-wide">
                Helper & Captain Biodata Registration
              </h2>
              <p className="text-xs text-blue-100 font-medium mt-0.5 leading-snug">
                Step-by-step biodata wizard with Aadhaar, PAN, bank verification, and deployment allocation.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0 z-20">
            <button
              type="button"
              onClick={() => navigate('/admin/employee-registration')}
              className="inline-flex items-center px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-800 bg-white hover:bg-slate-50 transition-colors gap-1.5 cursor-pointer shadow-sm border border-slate-200"
            >
              <ArrowLeft className="w-4 h-4 text-blue-600" />
              <span>Back to Employees</span>
            </button>
            <button
              type="button"
              onClick={() => setIsPreviewOpen(true)}
              className="inline-flex items-center px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-800 bg-white hover:bg-slate-50 transition-colors gap-1.5 cursor-pointer shadow-sm border border-slate-200"
            >
              <Eye className="w-4 h-4 text-blue-600" />
              <span>Preview Biodata</span>
            </button>
          </div>
        </div>

        {/* Real 3D Luxury Coach Bus Graphic - Positioned in center/right gap so it NEVER collides with buttons */}
        <div className="absolute right-[280px] top-0 bottom-0 w-64 pointer-events-none opacity-95 hidden lg:block">
          <img
            src={luxuryCoachHeader}
            alt="Luxury Coach Bus"
            className="h-full w-full object-contain object-center"
          />
        </div>
      </div>

      {/* Role Selection Toggle */}
      <div className="bg-white p-4 rounded-3xl border border-blue-100 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs font-black text-blue-900 uppercase tracking-wider block">TARGET ROLE</span>
          <p className="text-xs text-slate-600 font-medium mt-0.5">Select whether registering a Bus Helper or Captain</p>
        </div>

        <div className="flex rounded-2xl bg-blue-50/60 p-1.5 border border-blue-100">
          <button
            type="button"
            onClick={() => handleRoleChange('Helper')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              formData.role === 'Helper' ? 'bg-[#004B9E] text-white shadow-md' : 'text-slate-600 hover:text-blue-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Bus Helper</span>
          </button>
          <button
            type="button"
            onClick={() => handleRoleChange('Captain')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              formData.role === 'Captain' ? 'bg-[#004B9E] text-white shadow-md' : 'text-slate-600 hover:text-blue-900'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Bus Captain</span>
          </button>
        </div>
      </div>

      {/* Progress Tabs */}
      <div className="bg-white p-4 rounded-3xl border border-blue-100 shadow-sm overflow-x-auto">
        <div className="flex items-center justify-between min-w-[550px] relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200 w-full -z-0"></div>
          {steps.map((st) => {
            const Icon = st.icon;
            const isDone = st.number < currentStep;
            const isCurrent = st.number === currentStep;
            return (
              <div
                key={st.number}
                onClick={() => handleStepClick(st.number)}
                className="flex flex-col items-center relative z-10 cursor-pointer group"
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all shadow-sm ${
                    isCurrent
                      ? 'bg-[#004B9E] text-white ring-4 ring-blue-100'
                      : isDone
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white text-slate-400 border border-slate-300'
                  }`}
                >
                  {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <span
                  className={`text-[11px] font-bold mt-1.5 whitespace-nowrap ${
                    isCurrent ? 'text-blue-700 font-extrabold' : isDone ? 'text-slate-800' : 'text-slate-400'
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
      <div className="bg-white p-6 rounded-3xl border border-blue-100 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* STEP 1: Personal Info */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#004B9E] text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-xs mb-1">
                <User className="w-4 h-4 text-white" />
                <span>Step 1: Personal Information (Biodata {formData.role === 'Captain' ? 'Captain' : 'Helper'})</span>
              </div>

              {/* 1. Profile Photo */}
              <div className="p-4 bg-blue-50/20 border border-blue-100 rounded-2xl flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white border-2 border-dashed border-blue-300 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                  {formData.profile_photo ? (
                    <img src={formData.profile_photo} alt="Profile Photo" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-7 h-7 text-blue-400" />
                  )}
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-800 mb-0.5">Profile Photo</label>
                  <p className="text-[11px] text-slate-500 mb-2">Upload staff portrait / passport photo</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload('profile_photo', e)}
                    className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#004B9E] file:text-white hover:file:bg-[#00367A] cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Employee ID */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-1">
                    <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                    <span>Employee ID <span className="text-rose-500">*</span></span>
                  </label>
                  <input
                    type="text"
                    value={formData.employee_code}
                    onChange={(e) => handleInputChange('employee_code', e.target.value)}
                    placeholder="e.g. HLP-1001 or CPT-1001"
                    className="w-full text-xs px-3.5 py-2.5 rounded-2xl border border-blue-200 bg-white focus:bg-white outline-none font-mono font-bold text-blue-700 shadow-2xs"
                    required
                  />
                </div>

                {/* 2. Gender */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-1">
                    <Users className="w-3.5 h-3.5 text-blue-600" />
                    <span>Gender</span>
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-2xl border border-blue-200 bg-white focus:bg-white outline-none font-semibold text-slate-800 shadow-2xs cursor-pointer"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* 3. Name (As per Aadhaar) */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-1">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    <span>Name (As per Aadhaar) <span className="text-rose-500">*</span></span>
                  </label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                    placeholder="Enter full name as printed on Aadhaar"
                    className="w-full text-xs px-3.5 py-2.5 rounded-2xl border border-blue-200 bg-white focus:bg-white outline-none font-semibold text-slate-800 shadow-2xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 4. DOB */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span>DOB (Date of Birth) <span className="text-rose-500">*</span></span>
                  </label>
                  <input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-2xl border border-blue-200 bg-white focus:bg-white outline-none font-semibold text-slate-800 shadow-2xs"
                    required
                  />
                </div>

                {/* 5. E MAIL */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-1">
                    <Mail className="w-3.5 h-3.5 text-blue-600" />
                    <span>E MAIL</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="staff@charvikstaffing.com"
                    className="w-full text-xs px-3.5 py-2.5 rounded-2xl border border-blue-200 bg-white focus:bg-white outline-none font-semibold text-slate-800 shadow-2xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 6. Phone Number * */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-1">
                    <Phone className="w-3.5 h-3.5 text-blue-600" />
                    <span>Phone Number <span className="text-rose-500">*</span></span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phone_number}
                    onChange={(e) => handleInputChange('phone_number', e.target.value)}
                    placeholder="e.g. 9701011111"
                    className="w-full text-xs px-3.5 py-2.5 rounded-2xl border border-blue-200 bg-white focus:bg-white outline-none font-semibold text-slate-800 shadow-2xs"
                    required
                  />
                </div>

                {/* 7. Alternative Number */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-1">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>Alternative Number</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.alternative_phone_number}
                    onChange={(e) => handleInputChange('alternative_phone_number', e.target.value)}
                    placeholder="Alternative contact"
                    className="w-full text-xs px-3.5 py-2.5 rounded-2xl border border-blue-200 bg-white focus:bg-white outline-none font-semibold text-slate-800 shadow-2xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Identity Docs */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#004B9E] text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-xs mb-1">
                <CreditCard className="w-4 h-4 text-white" />
                <span>Step 2: Identity Documents (Aadhaar & PAN)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 8. Aadhaar Number */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-1">
                    <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                    <span>Aadhaar Number <span className="text-rose-500">*</span></span>
                  </label>
                  <input
                    type="text"
                    value={formData.aadhaar_number}
                    onChange={(e) => handleInputChange('aadhaar_number', e.target.value)}
                    placeholder="XXXX-XXXX-1234"
                    className="w-full text-xs px-3.5 py-2.5 rounded-2xl border border-blue-200 bg-white focus:bg-white outline-none font-mono font-bold text-slate-800 shadow-2xs"
                    required
                  />
                </div>

                {/* 10. PAN Card Number */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-1">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>PAN Card Number</span>
                  </label>
                  <input
                    type="text"
                    value={formData.pan_number}
                    onChange={(e) => handleInputChange('pan_number', e.target.value.toUpperCase())}
                    placeholder="PQRST5678K"
                    className="w-full text-xs px-3.5 py-2.5 rounded-2xl border border-blue-200 bg-white focus:bg-white outline-none font-mono font-bold uppercase text-slate-800 shadow-2xs"
                  />
                </div>
              </div>

              {/* Identity Documents Upload (Aadhaar Front, Aadhaar Back, PAN Card) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                {/* Aadhaar Front */}
                <div className="p-4 rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/20 flex flex-col items-center text-center">
                  <Upload className="w-6 h-6 text-blue-500 mb-1" />
                  <p className="text-xs font-bold text-slate-800">Aadhaar Card (Front Side)</p>
                  <p className="text-[11px] text-slate-500 mb-2">Upload Front photo</p>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileUpload('aadhaar_front_doc', e)}
                    className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-xl file:border-0 file:text-[11px] file:font-bold file:bg-[#004B9E] file:text-white hover:file:bg-[#00367A] cursor-pointer w-full"
                  />
                  {formData.aadhaar_front_doc && (
                    <p className="text-[10px] text-emerald-600 font-bold mt-1.5">✓ Front side attached</p>
                  )}
                </div>

                {/* Aadhaar Back */}
                <div className="p-4 rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/20 flex flex-col items-center text-center">
                  <Upload className="w-6 h-6 text-blue-500 mb-1" />
                  <p className="text-xs font-bold text-slate-800">Aadhaar Card (Back Side)</p>
                  <p className="text-[11px] text-slate-500 mb-2">Upload Back photo</p>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileUpload('aadhaar_back_doc', e)}
                    className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-xl file:border-0 file:text-[11px] file:font-bold file:bg-[#004B9E] file:text-white hover:file:bg-[#00367A] cursor-pointer w-full"
                  />
                  {formData.aadhaar_back_doc && (
                    <p className="text-[10px] text-emerald-600 font-bold mt-1.5">✓ Back side attached</p>
                  )}
                </div>

                {/* PAN Card */}
                <div className="p-4 rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/20 flex flex-col items-center text-center">
                  <Upload className="w-6 h-6 text-blue-500 mb-1" />
                  <p className="text-xs font-bold text-slate-800">Upload Photo File (PAN Card)</p>
                  <p className="text-[11px] text-slate-500 mb-2">Clear photo of PAN</p>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileUpload('pan_doc', e)}
                    className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-xl file:border-0 file:text-[11px] file:font-bold file:bg-[#004B9E] file:text-white hover:file:bg-[#00367A] cursor-pointer w-full"
                  />
                  {formData.pan_doc && (
                    <p className="text-[10px] text-emerald-600 font-bold mt-1.5">✓ PAN Card file attached</p>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* STEP 3: Bank Name ( passbook cheque ) */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#004B9E] text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-xs mb-1">
                <Building className="w-4 h-4 text-white" />
                <span>Step 3: Bank Details</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-1">
                    <Building className="w-3.5 h-3.5 text-blue-600" />
                    <span>Bank Name (passbook / cheque)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.bank_name}
                    onChange={(e) => handleInputChange('bank_name', e.target.value)}
                    placeholder="e.g. State Bank of India / HDFC"
                    className="w-full text-xs px-3.5 py-2.5 rounded-2xl border border-blue-200 bg-white focus:bg-white outline-none font-semibold text-slate-800 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-1">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    <span>Account Holder Name</span>
                  </label>
                  <input
                    type="text"
                    value={formData.account_holder_name || formData.full_name}
                    onChange={(e) => handleInputChange('account_holder_name', e.target.value)}
                    placeholder="Name as printed on passbook"
                    className="w-full text-xs px-3.5 py-2.5 rounded-2xl border border-blue-200 bg-white focus:bg-white outline-none font-semibold text-slate-800 shadow-2xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-1">
                    <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                    <span>Account Number</span>
                  </label>
                  <input
                    type="text"
                    value={formData.account_number}
                    onChange={(e) => handleInputChange('account_number', e.target.value)}
                    placeholder="123456789012"
                    className="w-full text-xs px-3.5 py-2.5 rounded-2xl border border-blue-200 bg-white focus:bg-white outline-none font-mono font-bold text-slate-800 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-1">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>IFSC Code</span>
                  </label>
                  <input
                    type="text"
                    value={formData.ifsc_code}
                    onChange={(e) => handleInputChange('ifsc_code', e.target.value.toUpperCase())}
                    placeholder="SBIN0001234"
                    className="w-full text-xs px-3.5 py-2.5 rounded-2xl border border-blue-200 bg-white focus:bg-white outline-none font-mono font-bold uppercase text-slate-800 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-1">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    <span>Branch</span>
                  </label>
                  <input
                    type="text"
                    value={formData.branch}
                    onChange={(e) => handleInputChange('branch', e.target.value)}
                    placeholder="Branch name"
                    className="w-full text-xs px-3.5 py-2.5 rounded-2xl border border-blue-200 bg-white focus:bg-white outline-none font-semibold text-slate-800 shadow-2xs"
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/20 flex flex-col items-center text-center">
                <Upload className="w-6 h-6 text-blue-500 mb-2" />
                <p className="text-xs font-bold text-slate-800">Upload Photo File (passbook / cheque)</p>
                <p className="text-[11px] text-slate-500 mb-2">Upload photo of passbook front page or cancelled cheque</p>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileUpload('bank_proof_doc', e)}
                  className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#004B9E] file:text-white hover:file:bg-[#00367A] cursor-pointer"
                />
                {formData.bank_proof_doc && (
                  <p className="text-[10px] text-emerald-600 font-bold mt-1.5">✓ Bank passbook / cheque attached</p>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: Nominee Details */}
          {currentStep === 4 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#004B9E] text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-xs mb-1">
                <ShieldCheck className="w-4 h-4 text-white" />
                <span>Step 4: Nominee Details (Legal & Accidental Beneficiary)</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Record next of kin nominee information for {formData.role} statutory claims, accidental coverage, and emergency settlements.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-1">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    <span>Nominee Full Name <span className="text-rose-500">*</span></span>
                  </label>
                  <input
                    type="text"
                    value={formData.nominee_name}
                    onChange={(e) => handleInputChange('nominee_name', e.target.value)}
                    placeholder="e.g. Smt. Lakshmi"
                    className="w-full text-xs px-3.5 py-2.5 rounded-2xl border border-blue-200 bg-white focus:bg-white outline-none font-semibold text-slate-800 shadow-2xs"
                    required
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-1">
                    <Users className="w-3.5 h-3.5 text-blue-600" />
                    <span>Relationship with {formData.role} <span className="text-rose-500">*</span></span>
                  </label>
                  <select
                    value={formData.nominee_relationship}
                    onChange={(e) => handleInputChange('nominee_relationship', e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-2xl border border-blue-200 bg-white focus:bg-white outline-none font-semibold text-slate-800 shadow-2xs cursor-pointer"
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
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-1">
                    <Phone className="w-3.5 h-3.5 text-blue-600" />
                    <span>Nominee Contact Number <span className="text-rose-500">*</span></span>
                  </label>
                  <input
                    type="tel"
                    value={formData.nominee_phone}
                    onChange={(e) => handleInputChange('nominee_phone', e.target.value)}
                    placeholder="10-digit mobile number"
                    className="w-full text-xs px-3.5 py-2.5 rounded-2xl border border-blue-200 bg-white focus:bg-white outline-none font-semibold text-slate-800 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span>Nominee Age / Date of Birth</span>
                  </label>
                  <input
                    type="text"
                    value={formData.nominee_age}
                    onChange={(e) => handleInputChange('nominee_age', e.target.value)}
                    placeholder="e.g. 30 or YYYY-MM-DD"
                    className="w-full text-xs px-3.5 py-2.5 rounded-2xl border border-blue-200 bg-white focus:bg-white outline-none font-semibold text-slate-800 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-1">
                    <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                    <span>Nominee Aadhaar (Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.nominee_aadhaar}
                    onChange={(e) => handleInputChange('nominee_aadhaar', e.target.value)}
                    placeholder="12-digit Aadhaar number"
                    className="w-full text-xs px-3.5 py-2.5 rounded-2xl border border-blue-200 bg-white focus:bg-white outline-none font-mono font-bold text-slate-800 shadow-2xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Reference Details */}
          {currentStep === 5 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#004B9E] text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-xs mb-1">
                <Users className="w-4 h-4 text-white" />
                <span>Step 5: Reference Details (Verification)</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Previous transport employer or acquaintance who can verify conduct.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-1">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    <span>Name</span>
                  </label>
                  <input
                    type="text"
                    value={formData.reference_name}
                    onChange={(e) => handleInputChange('reference_name', e.target.value)}
                    placeholder="Reference person name"
                    className="w-full text-xs px-3.5 py-2.5 rounded-2xl border border-blue-200 bg-white focus:bg-white outline-none font-semibold text-slate-800 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-1">
                    <Phone className="w-3.5 h-3.5 text-blue-600" />
                    <span>Phone Number</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.reference_phone}
                    onChange={(e) => handleInputChange('reference_phone', e.target.value)}
                    placeholder="Primary reference phone"
                    className="w-full text-xs px-3.5 py-2.5 rounded-2xl border border-blue-200 bg-white focus:bg-white outline-none font-semibold text-slate-800 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-1">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>Alternative Number</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.reference_alt_phone}
                    onChange={(e) => handleInputChange('reference_alt_phone', e.target.value)}
                    placeholder="Secondary reference phone"
                    className="w-full text-xs px-3.5 py-2.5 rounded-2xl border border-blue-200 bg-white focus:bg-white outline-none font-semibold text-slate-800 shadow-2xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Employment */}
          {currentStep === 6 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#004B9E] text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-xs mb-1">
                <Briefcase className="w-4 h-4 text-white" />
                <span>Step 6: Employment & Allocation</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-blue-50/50 border border-blue-200">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-1">
                    <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                    <span>Worker Type (Employment Category) <span className="text-rose-500">*</span></span>
                  </label>
                  <select
                    value={formData.employment_type || 'Permanent'}
                    onChange={(e) => handleInputChange('employment_type', e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-2xl border border-blue-300 bg-white font-bold text-blue-900 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer shadow-2xs"
                  >
                    <option value="Permanent">Permanent Worker</option>
                    <option value="Temporary">Temporary Worker</option>
                    <option value="Salary Based">Salary Based</option>
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Select whether the {formData.role} is Permanent, Temporary, or Salary Based.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    {formData.role === 'Captain'
                      ? formData.employment_type === 'Temporary'
                        ? 'Temporary Monthly Salary (₹) *'
                        : formData.employment_type === 'Salary Based'
                        ? 'Salary Based Monthly Salary (₹) *'
                        : 'Permanent Monthly Salary (₹) *'
                      : formData.employment_type === 'Temporary'
                        ? 'Temporary Worker (Per Day Salary) (₹) *'
                        : formData.employment_type === 'Salary Based'
                        ? 'Salary Based Worker (Monthly Salary) (₹) *'
                        : 'Permanent Worker (Per Day Salary) (₹) *'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={formData.salary || ''}
                      onChange={(e) => handleInputChange('salary', e.target.value)}
                      placeholder={
                        formData.role === 'Captain' || formData.employment_type === 'Salary Based'
                          ? 'Enter monthly salary amount (₹)'
                          : 'Enter per day salary amount (₹)'
                      }
                      className="w-full text-xs pl-8 pr-3.5 py-2.5 rounded-2xl border border-blue-300 bg-white font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none shadow-2xs"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Admin manual salary entry</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-1">
                    <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                    <span>Employee Code <span className="text-rose-500">*</span></span>
                  </label>
                  <input
                    type="text"
                    value={formData.employee_code}
                    onChange={(e) => handleInputChange('employee_code', e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-2xl border border-blue-200 bg-white focus:bg-white outline-none font-bold text-slate-900 shadow-2xs"
                    required
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span>Joining Date</span>
                  </label>
                  <input
                    type="date"
                    value={formData.joining_date}
                    onChange={(e) => handleInputChange('joining_date', e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-2xl border border-blue-200 bg-white focus:bg-white outline-none font-semibold text-slate-800 shadow-2xs"
                  />
                </div>
              </div>

              {/* Status Selection (Active / Inactive) */}
              <StatusToggle
                label="Status"
                value={formData.employment_status || 'Active'}
                onChange={(val) => handleInputChange('employment_status', val)}
              />

              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-1">
                  <Bus className="w-3.5 h-3.5 text-blue-600" />
                  <span>Assigned Bus</span>
                </label>
                <select
                  value={formData.assigned_bus_id}
                  onChange={(e) => handleInputChange('assigned_bus_id', e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-2xl border border-blue-200 bg-white focus:bg-white outline-none font-semibold text-slate-800 shadow-2xs cursor-pointer"
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
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-1">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>Remarks</span>
                </label>
                <textarea
                  rows={2}
                  value={formData.internal_remarks}
                  onChange={(e) => handleInputChange('internal_remarks', e.target.value)}
                  placeholder="Additional notes or deployment details..."
                  className="w-full text-xs px-3.5 py-2.5 rounded-2xl border border-blue-200 bg-white focus:bg-white outline-none font-semibold text-slate-800 shadow-2xs"
                />
              </div>
            </div>
          )}

          {/* Validation Alert Banner */}
          {stepError && (
            <div className="flex items-center gap-3 p-3.5 bg-rose-50 border-2 border-rose-300 rounded-2xl text-rose-800 text-xs font-bold animate-in fade-in">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
              <div>
                <p className="font-extrabold text-rose-900">Please fill the required detail to proceed:</p>
                <p className="font-medium text-rose-700 mt-0.5">{stepError}</p>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handlePrev}
                className="px-6 py-2.5 rounded-2xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-blue-600" />
                <span>Previous Step</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/admin/employee-registration')}
                className="px-6 py-2.5 rounded-2xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-slate-500" />
                <span>Cancel & Back</span>
              </button>
            )}

            {currentStep < 6 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2.5 rounded-2xl bg-[#004B9E] hover:bg-[#00367A] text-white text-xs font-black flex items-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <span>Next Step</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-7 py-2.5 rounded-2xl bg-[#004B9E] hover:bg-[#00367A] text-white text-xs font-black flex items-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-60"
              >
                <Check className="w-4 h-4 text-white" />
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
          <div className="border-2 border-black overflow-hidden font-sans printable-sheet">
            {/* Official Charvik Letterhead Header */}
            <div className="bg-white border-b-2 border-black">
              <img
                src="/charvik-letterhead-header.png"
                alt="CHARVIK STAFFING CONSULTANCY"
                className="w-full h-auto block"
              />
              <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-700 font-bold">
                <div>CREW &amp; SUPPORT STAFF FLEET VERIFICATION RECORD</div>
                <div className="text-right text-[10px]">
                  <span>Status: <strong className="text-emerald-700">Verified Preview</strong></span>
                </div>
              </div>
            </div>

            {/* Yellow Header */}
            <div className="bg-[#FFFF00] text-black font-black text-center py-2.5 text-sm uppercase tracking-wider border-b-2 border-black">
              Biodata helper &amp; Captains
            </div>

            <table className="w-full text-xs border-collapse">
              <tbody className="divide-y divide-black">
                {/* Gender */}
                <tr className="hover:bg-slate-50">
                  <td className="w-1/2 p-2.5 font-bold border-r border-black bg-slate-50/50">Gender</td>
                  <td className="w-1/2 p-2.5">{formData.gender || 'Male'}</td>
                </tr>

                {/* Name (As per Aadhaar) */}
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-bold border-r border-black bg-slate-50/50">Name (As per Aadhaar)</td>
                  <td className="p-2.5 font-bold text-slate-900">{formData.full_name || '-'}</td>
                </tr>

                {/* DOB */}
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-bold border-r border-black bg-slate-50/50">DOB</td>
                  <td className="p-2.5 font-mono">{formData.date_of_birth || '-'}</td>
                </tr>

                {/* E MAIL */}
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-bold border-r border-black bg-slate-50/50">E MAIL</td>
                  <td className="p-2.5">{formData.email || '-'}</td>
                </tr>

                {/* Phone Number * */}
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-bold border-r border-black bg-slate-50/50">Phone Number *</td>
                  <td className="p-2.5 font-mono font-bold text-blue-700">{formData.phone_number || '-'}</td>
                </tr>

                {/* Alternative Number */}
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-bold border-r border-black bg-slate-50/50">Alternative Number</td>
                  <td className="p-2.5 font-mono">{formData.alternative_phone_number || '-'}</td>
                </tr>

                {/* Aadhaar Number */}
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-bold border-r border-black bg-slate-50/50">Aadhaar Number</td>
                  <td className="p-2.5 font-mono">{formData.aadhaar_number || '-'}</td>
                </tr>

                {/* PAN Card Number */}
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-bold border-r border-black bg-slate-50/50">PAN Card Number</td>
                  <td className="p-2.5 font-mono uppercase">{formData.pan_number || '-'}</td>
                </tr>



                {/* Bank Details */}
                <tr className="bg-slate-100 font-black text-slate-800">
                  <td colSpan={2} className="p-2.5 text-center uppercase tracking-wide border-y border-black font-bold">
                    Bank Details
                  </td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Bank Name</td>
                  <td className="p-2.5 font-bold">{formData.bank_name || '-'}</td>
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

                {/* 15. Employment Details (Header) */}
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
                        : formData.employment_type === 'Salary Based'
                        ? 'bg-blue-100 text-blue-800 border border-blue-300'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    }`}>
                      {formData.employment_type === 'Temporary' ? 'Temporary Worker' : formData.employment_type === 'Salary Based' ? 'Salary Based' : 'Permanent Worker'}
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">
                    {formData.role === 'Captain'
                      ? formData.employment_type === 'Temporary'
                        ? 'Temporary Monthly Salary'
                        : formData.employment_type === 'Salary Based'
                        ? 'Salary Based Monthly Salary'
                        : 'Permanent Monthly Salary'
                      : formData.employment_type === 'Temporary'
                        ? 'Temporary Worker (Per Day Salary)'
                        : formData.employment_type === 'Salary Based'
                        ? 'Salary Based Worker (Monthly Salary)'
                        : 'Permanent Worker (Per Day Salary)'}
                  </td>
                  <td className="p-2.5 font-bold text-slate-900">
                    {formData.salary ? `₹${Number(formData.salary).toLocaleString('en-IN')}` : '₹0'}
                  </td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Designation / Role</td>
                  <td className="p-2.5 font-bold text-blue-700">{formData.role}</td>
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

            {/* Official Declaration */}
            <div className="border-t-2 border-black bg-slate-50/60 p-3 text-[11px] text-slate-700 leading-relaxed">
              <span className="font-bold text-slate-900">Declaration: </span>
              <span>
                I hereby declare that all the information and particulars provided in this biodata sheet are true, complete, and accurate to the best of my knowledge and belief.
              </span>
            </div>

            {/* Signature Section */}
            <div className="border-t-2 border-black grid grid-cols-2 divide-x-2 divide-black bg-white">
              {/* Left: Employee Signature */}
              <div className="p-4 flex flex-col justify-between min-h-[120px]">
                <div>
                  <p className="text-xs font-bold text-slate-900 uppercase tracking-wider">{formData.role} Signature</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Signature of {formData.full_name || formData.role}</p>
                </div>
                <div className="mt-10 pt-2 border-t border-dashed border-slate-500 flex items-center justify-between text-[11px] font-semibold text-slate-700">
                  <span>Sign: ___________________</span>
                  <span>Date: ____________</span>
                </div>
              </div>

              {/* Right: Authorized Signatory */}
              <div className="p-4 flex flex-col justify-between min-h-[120px]">
                <div>
                  <p className="text-xs font-bold text-slate-900 uppercase tracking-wider">Authorized Signatory & Seal</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Charvik Staffing Consultancy</p>
                </div>
                <div className="mt-10 pt-2 border-t border-dashed border-slate-500 flex items-center justify-between text-[11px] font-semibold text-slate-700">
                  <span>Sign & Seal: _____________</span>
                  <span>Date: ____________</span>
                </div>
              </div>
            </div>

            {/* Official Charvik Letterhead Footer */}
            <div className="w-full border-t-2 border-black bg-white">
              <img
                src="/charvik-letterhead-footer.png"
                alt="Charvik Footer"
                className="w-full h-auto block"
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
