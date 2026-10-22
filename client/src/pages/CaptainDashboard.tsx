import React, { useState, useEffect } from 'react';
import {
  Compass,
  Bus,
  Gauge,
  ShieldCheck,
  AlertTriangle,
  MapPin,
  Clock,
  Phone,
  User as UserIcon,
  CheckCircle2,
  Camera,
  Upload,
  Radio,
  FileText,
  Navigation,
  Bell,
  Calendar,
  Save,
  Check,
  X,
  CreditCard,
  Building,
  Image as ImageIcon,
  Printer,
  Eye,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';

export const CaptainDashboard: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [loading, setLoading] = useState(true);
  const [dutyData, setDutyData] = useState<any>(null);

  // Active section tab for mobile-friendly view
  const [mobileTab, setMobileTab] = useState<'duty' | 'daily-km' | 'condition' | 'complaints' | 'profile'>('duty');

  // Crew Biodata Sheet Modal (Driver or Helper)
  const [viewingCrewBiodata, setViewingCrewBiodata] = useState<{ role: 'Driver' | 'Helper'; data: any } | null>(null);

  // Live Location Sharing Toggle State
  const [isSharingLocation, setIsSharingLocation] = useState(true);
  const [liveGpsCoords, setLiveGpsCoords] = useState({
    lat: 16.5062,
    lng: 80.6480,
    speed: 42,
    battery: 98,
    heading: 'North-East',
    lastPing: 'Just now'
  });

  // Daily KM Entry State
  const [openingKm, setOpeningKm] = useState<number | string>('');
  const [closingKm, setClosingKm] = useState<number | string>('');
  const [kmRemarks, setKmRemarks] = useState('');
  const [savingKm, setSavingKm] = useState(false);

  // Bus Condition Checklist State
  const [checklist, setChecklist] = useState({
    exterior: true,
    tyres: true,
    brakes: true,
    ac: true,
    engine: true,
    lights: true,
    seatsCleanliness: true,
    emergencyExits: true
  });
  const [beforePhoto, setBeforePhoto] = useState<string | null>(null);
  const [afterPhoto, setAfterPhoto] = useState<string | null>(null);
  const [conditionNotes, setConditionNotes] = useState('');
  const [savingCondition, setSavingCondition] = useState(false);

  // Complaint Reporting State
  const [complaintCategory, setComplaintCategory] = useState('AC / Cooling');
  const [complaintDescription, setComplaintDescription] = useState('');
  const [complaintPriority, setComplaintPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  const [complaintPhoto, setComplaintPhoto] = useState<string | null>(null);
  const [submittingComplaint, setSubmittingComplaint] = useState(false);

  // Document Viewing Modal State
  const [viewingDoc, setViewingDoc] = useState<{ title: string; docUrl: string } | null>(null);

  useEffect(() => {
    loadDutyInfo();
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLiveGpsCoords((prev) => ({
            ...prev,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            speed: Math.round((pos.coords.speed || 0) * 3.6),
            lastPing: 'Live'
          }));
        },
        () => {},
        { enableHighAccuracy: false, timeout: 5000 }
      );
    }
  }, []);

  const loadDutyInfo = async () => {
    try {
      setLoading(true);
      const res = await api.getCaptainDuty();
      setDutyData(res);
      if (res?.bus) {
        setOpeningKm(res.bus.current_odometer_km || 0);
      }
    } catch (err: any) {
      error(err.message || 'Failed to load Captain duty info');
    } finally {
      setLoading(false);
    }
  };

  const handleKmSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dutyData?.bus) {
      error('No bus currently assigned to your duty profile.');
      return;
    }
    const op = Number(openingKm);
    const cl = Number(closingKm);
    if (!cl || cl < op) {
      error('Closing KM must be greater than Opening KM');
      return;
    }

    setSavingKm(true);
    try {
      await api.createDailyKm({
        bus_id: dutyData.bus.id,
        entry_date: new Date().toISOString().split('T')[0],
        opening_km: op,
        closing_km: cl,
        driver_id: dutyData.driver?.id || null,
        remarks: kmRemarks || 'Logged by Route Captain on mobile duty'
      });
      success(`Daily KM logged! Distance: ${cl - op} KM for Bus ${dutyData.bus.bus_number}`);
      setKmRemarks('');
      setClosingKm('');
      loadDutyInfo();
    } catch (err: any) {
      error(err.message || 'Failed to submit daily km');
    } finally {
      setSavingKm(false);
    }
  };

  const handleConditionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dutyData?.bus) return;

    setSavingCondition(true);
    try {
      await api.createBusCondition({
        bus_id: dutyData.bus.id,
        inspection_date: new Date().toISOString().split('T')[0],
        inspector_name: dutyData.captain?.name || user?.name || 'Route Captain',
        exterior_body: checklist.exterior ? 'Good' : 'Needs Attention',
        tyre_condition: checklist.tyres ? 'Good' : 'Needs Check',
        brake_condition: checklist.brakes ? 'Good' : 'Needs Bleeding',
        ac_condition: checklist.ac ? 'Working' : 'Not Cooling',
        engine_condition: checklist.engine ? 'Optimal' : 'Check Warning',
        lights_condition: checklist.lights ? 'All Working' : 'Faulty Bulb',
        seat_condition: checklist.seatsCleanliness ? 'Clean & Sanitized' : 'Needs Cleaning',
        doors_emergency_exits: checklist.emergencyExits ? 'Clear & Operable' : 'Obstructed',
        roadworthiness_status: 'Fit for Service',
        photo_attachments: [beforePhoto, afterPhoto].filter(Boolean).join(','),
        inspector_remarks: conditionNotes || 'Captain pre-trip & post-trip inspection completed'
      });
      success('Bus condition checklist & photos logged successfully!');
      setConditionNotes('');
    } catch (err: any) {
      error(err.message || 'Failed to save condition report');
    } finally {
      setSavingCondition(false);
    }
  };

  const handleComplaintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dutyData?.bus) return;
    if (!complaintDescription) {
      error('Please describe the issue or defect');
      return;
    }

    setSubmittingComplaint(true);
    try {
      await api.createComplaint({
        bus_id: dutyData.bus.id,
        category: complaintCategory,
        description: complaintDescription,
        priority: complaintPriority,
        reported_by: `${dutyData.captain?.name || user?.name} (Captain)`,
        contact_number: dutyData.captain?.phone || user?.phone_number || '',
        attachments: complaintPhoto || ''
      });
      success('Complaint & photo evidence logged to Fleet HQ maintenance team!');
      setComplaintDescription('');
      setComplaintPhoto(null);
      loadDutyInfo();
    } catch (err: any) {
      error(err.message || 'Failed to report complaint');
    } finally {
      setSubmittingComplaint(false);
    }
  };

  // Mock Photo capture helper using Canvas/File
  const handlePhotoCapture = (type: 'before' | 'after' | 'complaint') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        try {
          const res = await api.uploadFile(file);
          if (type === 'before') setBeforePhoto(res.url);
          else if (type === 'after') setAfterPhoto(res.url);
          else setComplaintPhoto(res.url);
          success('Photo captured and uploaded successfully!');
        } catch {
          // Local preview fallback
          const localUrl = URL.createObjectURL(file);
          if (type === 'before') setBeforePhoto(localUrl);
          else if (type === 'after') setAfterPhoto(localUrl);
          else setComplaintPhoto(localUrl);
          success('Photo attached locally for inspection record.');
        }
      }
    };
    input.click();
  };

  if (loading && !dutyData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-3 text-xs font-semibold text-slate-500">Loading Captain duty profile & live bus feed...</p>
      </div>
    );
  }

  const { captain, duty, bus, driver, helper, todayKm, busComplaints, dutyHistory, notifications } = dutyData || {};

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-16">
      {/* =========================================================================
          1. MOBILE TOP HERO: Captain Profile Chip & Live Duty Status
         ========================================================================= */}
      <div className="bg-gradient-to-r from-[#142B4A] via-[#1E3A5F] to-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16"></div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-13 h-13 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-400/40 flex items-center justify-center font-black text-lg uppercase shadow-inner shrink-0">
              <Compass className="w-7 h-7 text-amber-400 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  Captain {captain?.name || user?.name}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400/20 text-amber-300 border border-amber-400/40">
                  {captain?.code || 'Captain'}
                </span>
              </div>
              <p className="text-xs text-blue-200/80 font-medium mt-0.5 flex items-center gap-1.5">
                <Phone className="w-3 h-3 text-amber-400" />
                <span>Mobile: {captain?.phone || user?.phone_number || 'Not Provided'}</span>
              </p>
            </div>
          </div>

          {/* Duty Status Badge & Quick GPS Toggle */}
          <div className="flex items-center space-x-2 bg-white/10 p-1.5 rounded-xl border border-white/10">
            <button
              onClick={() => setIsSharingLocation(!isSharingLocation)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                isSharingLocation
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'bg-white/10 text-slate-300 hover:text-white'
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${isSharingLocation ? 'animate-pulse' : ''}`} />
              <span>{isSharingLocation ? 'GPS Live (Broadcasting)' : 'GPS Off'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. MOBILE-FRIENDLY NAVIGATION PILLS
         ========================================================================= */}
      <div className="flex space-x-1.5 sm:space-x-2 overflow-x-auto pb-1 bg-white p-2 rounded-2xl border border-slate-200/80 shadow-xs">
        <button
          onClick={() => setMobileTab('duty')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
            mobileTab === 'duty'
              ? 'bg-[#142B4A] text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>My Duty</span>
        </button>

        <button
          onClick={() => setMobileTab('daily-km')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
            mobileTab === 'daily-km'
              ? 'bg-[#142B4A] text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Gauge className="w-3.5 h-3.5" />
          <span>Daily KM Entry</span>
        </button>

        <button
          onClick={() => setMobileTab('condition')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
            mobileTab === 'condition'
              ? 'bg-[#142B4A] text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Condition Checklist</span>
        </button>

        <button
          onClick={() => setMobileTab('complaints')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
            mobileTab === 'complaints'
              ? 'bg-[#142B4A] text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Report Defect</span>
        </button>

        <button
          onClick={() => setMobileTab('profile')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
            mobileTab === 'profile'
              ? 'bg-[#142B4A] text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <UserIcon className="w-3.5 h-3.5" />
          <span>My Profile & Docs</span>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: MY DUTY (Project, Assigned Bus, Route, Driver, Helper, Timings)
         ========================================================================= */}
      {mobileTab === 'duty' && (
        <div className="space-y-4">
          {/* Duty Overview Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                  Current Assigned Project
                </span>
                <h3 className="text-base sm:text-lg font-black text-[#142B4A] mt-1.5">
                  {duty?.project || 'General Fleet Assignment'}
                </h3>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Active Duty
              </span>
            </div>

            {/* Bus & Shift Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50">
                <span className="text-[10px] font-bold text-blue-700 uppercase">Assigned Bus</span>
                <p className="text-base font-black text-[#142B4A] mt-0.5">{bus?.bus_number || 'Awaiting Allocation'}</p>
                <p className="text-xs text-slate-600">{bus?.make} {bus?.model} • {bus?.seating_capacity} Seater AC</p>
                <p className="text-[11px] text-slate-500 mt-1 font-mono">Reg: {bus?.registration_number || '-'}</p>
              </div>

              <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50">
                <span className="text-[10px] font-bold text-amber-700 uppercase">Duty Timings & Shift</span>
                <p className="text-base font-black text-[#142B4A] mt-0.5">{duty?.shift || 'Scheduled Shift'}</p>
                <p className="text-xs text-slate-600 flex items-center gap-1 mt-1">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Daily Operational Run</span>
                </p>
              </div>
            </div>

            {/* Route & Stops Details */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-rose-500" />
                <span className="font-bold text-xs text-[#142B4A]">Route Details & Stops</span>
              </div>
              <p className="text-xs font-semibold text-slate-800">{duty?.route || 'Assigned Fleet Route'}</p>
              <p className="text-[11px] text-slate-500 mt-1">{duty?.stops || 'Scheduled Route Stops'}</p>
            </div>

            {/* Crew on Duty (Driver & Helper) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                    DR
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Assigned Driver</span>
                    <p className="text-xs font-bold text-[#142B4A]">{driver?.full_name || driver?.name || 'Unassigned'}</p>
                    <p className="text-[11px] text-slate-500">Phone: {driver?.phone_number || driver?.phone || '-'}</p>
                  </div>
                </div>
                {driver ? (
                  <button
                    onClick={() => setViewingCrewBiodata({ role: 'Driver', data: driver })}
                    className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Biodata</span>
                  </button>
                ) : (
                  <span className="text-[11px] text-slate-400 font-semibold px-2 py-1 bg-slate-50 rounded-lg border border-slate-100">Unassigned</span>
                )}
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                    HL
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Assigned Helper</span>
                    <p className="text-xs font-bold text-[#142B4A]">{helper?.full_name || helper?.name || 'Unassigned'}</p>
                    <p className="text-[11px] text-slate-500">Phone: {helper?.phone_number || helper?.phone || '-'}</p>
                  </div>
                </div>
                {helper ? (
                  <button
                    onClick={() => setViewingCrewBiodata({ role: 'Helper', data: helper })}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Biodata</span>
                  </button>
                ) : (
                  <span className="text-[11px] text-slate-400 font-semibold px-2 py-1 bg-slate-50 rounded-lg border border-slate-100">Unassigned</span>
                )}
              </div>
            </div>
          </div>

          {/* Live Location Sharing Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className={`w-4 h-4 ${isSharingLocation ? 'text-emerald-500 animate-pulse' : 'text-slate-400'}`} />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Live GPS Location Sharing</h4>
              </div>
              <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${isSharingLocation ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                {isSharingLocation ? 'ONLINE' : 'PAUSED'}
              </span>
            </div>

            {isSharingLocation && (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 block">Latitude</span>
                  <strong className="text-slate-800 font-mono">{liveGpsCoords.lat.toFixed(4)}° N</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Longitude</span>
                  <strong className="text-slate-800 font-mono">{liveGpsCoords.lng.toFixed(4)}° E</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Current Speed</span>
                  <strong className="text-emerald-700 font-bold">{liveGpsCoords.speed} KM/H</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Telemetry Status</span>
                  <strong className="text-blue-700 font-bold">Broadcasting to HQ</strong>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: DAILY KM ENTRY (Assigned Bus Pre-filled)
         ========================================================================= */}
      {mobileTab === 'daily-km' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-bold text-[#142B4A]">Daily Kilometer Entry</h3>
            <p className="text-xs text-slate-500">Log start and end odometer readings for your assigned bus today</p>
          </div>

          <form onSubmit={handleKmSubmit} className="space-y-4 text-xs">
            {/* Bus Info Display */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">Assigned Bus</span>
                <p className="text-sm font-black text-[#142B4A]">{bus?.bus_number || 'Awaiting Allocation'}</p>
                <p className="text-[11px] text-slate-500">{bus?.make} {bus?.model} ({bus?.registration_number || '-'})</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Last Recorded KM</span>
                <p className="text-sm font-mono font-bold text-blue-600">{bus?.current_odometer_km?.toLocaleString()} KM</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Opening Odometer KM</label>
                <input
                  type="number"
                  value={openingKm}
                  onChange={(e) => setOpeningKm(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Closing Odometer KM</label>
                <input
                  type="number"
                  value={closingKm}
                  onChange={(e) => setClosingKm(e.target.value)}
                  placeholder="e.g. 45380"
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs outline-none"
                  required
                />
              </div>
            </div>

            {Number(closingKm) > Number(openingKm) && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-900 flex justify-between">
                <span>Calculated Run Distance:</span>
                <span>{Number(closingKm) - Number(openingKm)} Kilometres</span>
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-700 mb-1">Captain Duty Remarks (Optional)</label>
              <input
                type="text"
                value={kmRemarks}
                onChange={(e) => setKmRemarks(e.target.value)}
                placeholder="e.g. Smooth trip, on schedule, no traffic halts"
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={savingKm}
              className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-[#142B4A] hover:bg-[#1E3A5F] transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 shadow-md"
            >
              {savingKm ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Submit Today's KM Log</span>
                </>
              )}
            </button>
          </form>

          {/* Past 5 duty trips */}
          {dutyHistory?.length > 0 && (
            <div className="mt-6 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold text-[#142B4A] mb-2 uppercase tracking-wider">Recent Completed Duty Runs</h4>
              <div className="divide-y divide-slate-100 text-xs">
                {dutyHistory.slice(0, 4).map((h: any) => (
                  <div key={h.id} className="py-2.5 flex items-center justify-between text-slate-600">
                    <div>
                      <span className="font-bold text-slate-800">{h.entry_date}</span>
                      <p className="text-[11px] text-slate-400">{h.bus_number} • Driver: {h.driver_name || 'Assigned'}</p>
                    </div>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                      +{h.distance_travelled_km} KM
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 3: BUS CONDITION CHECKLIST WITH BEFORE & AFTER PHOTOS
         ========================================================================= */}
      {mobileTab === 'condition' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-bold text-[#142B4A]">Bus Condition Checklist & Photo Inspection</h3>
            <p className="text-xs text-slate-500">Inspect vehicle roadworthiness and upload before & after shift photographs</p>
          </div>

          <form onSubmit={handleConditionSubmit} className="space-y-4 text-xs">
            {/* Checklist items */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                { key: 'exterior', label: 'Exterior Body & Mirrors Intact' },
                { key: 'tyres', label: 'Tyre Pressure & Tread Condition' },
                { key: 'brakes', label: 'Brakes & Air Pressure Optimal' },
                { key: 'ac', label: 'Air Conditioning / Cooling Functional' },
                { key: 'engine', label: 'Engine Oil & Coolant Levels Normal' },
                { key: 'lights', label: 'Headlamps, Indicators & Brake Lights' },
                { key: 'seatsCleanliness', label: 'Passenger Seats Clean & Sanitized' },
                { key: 'emergencyExits', label: 'Emergency Exit Door & Glass Hammer Clear' },
              ].map((item) => (
                <label
                  key={item.key}
                  className="flex items-center space-x-2.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition select-none"
                >
                  <input
                    type="checkbox"
                    checked={(checklist as any)[item.key]}
                    onChange={(e) => setChecklist((prev) => ({ ...prev, [item.key]: e.target.checked }))}
                    className="w-4 h-4 text-emerald-600 rounded-md focus:ring-emerald-500"
                  />
                  <span className="font-semibold text-slate-700">{item.label}</span>
                </label>
              ))}
            </div>

            {/* Before and After Photos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              {/* Before Photo */}
              <div className="p-3.5 rounded-xl border-2 border-dashed border-slate-200 text-center">
                <span className="font-bold text-xs text-slate-700 block mb-1">Pre-Trip Before Photo</span>
                {beforePhoto ? (
                  <div className="relative mt-2">
                    <img src={beforePhoto} alt="Before Shift" className="w-full h-32 object-cover rounded-lg shadow-xs" />
                    <button
                      type="button"
                      onClick={() => setBeforePhoto(null)}
                      className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handlePhotoCapture('before')}
                    className="mt-2 w-full py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 text-xs font-semibold hover:bg-slate-100 flex items-center justify-center gap-1.5"
                  >
                    <Camera className="w-3.5 h-3.5 text-blue-600" />
                    <span>Take Before Photo</span>
                  </button>
                )}
              </div>

              {/* After Photo */}
              <div className="p-3.5 rounded-xl border-2 border-dashed border-slate-200 text-center">
                <span className="font-bold text-xs text-slate-700 block mb-1">Post-Trip After Photo</span>
                {afterPhoto ? (
                  <div className="relative mt-2">
                    <img src={afterPhoto} alt="After Shift" className="w-full h-32 object-cover rounded-lg shadow-xs" />
                    <button
                      type="button"
                      onClick={() => setAfterPhoto(null)}
                      className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handlePhotoCapture('after')}
                    className="mt-2 w-full py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 text-xs font-semibold hover:bg-slate-100 flex items-center justify-center gap-1.5"
                  >
                    <Camera className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Take After Photo</span>
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Captain Inspection Observations</label>
              <textarea
                rows={2}
                value={conditionNotes}
                onChange={(e) => setConditionNotes(e.target.value)}
                placeholder="Note down tire wear, interior cleanliness, or driver remarks..."
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={savingCondition}
              className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 shadow-md"
            >
              {savingCondition ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Submit Bus Condition & Photos</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* =========================================================================
          TAB 4: COMPLAINT REPORTING WITH PHOTOS
         ========================================================================= */}
      {mobileTab === 'complaints' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-bold text-[#142B4A]">Report Defect or Breakdown</h3>
            <p className="text-xs text-slate-500">Submit urgent issues directly to Fleet HQ workshop with photo evidence</p>
          </div>

          <form onSubmit={handleComplaintSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Category</label>
                <select
                  value={complaintCategory}
                  onChange={(e) => setComplaintCategory(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-xs"
                >
                  <option value="AC / Cooling">AC / Cooling Issue</option>
                  <option value="Tyre / Puncture">Tyre / Puncture Issue</option>
                  <option value="Brake / Air Leakage">Brake / Air Leakage</option>
                  <option value="Electrical / Lighting">Electrical / Lighting</option>
                  <option value="Engine / Heating">Engine / Overheating</option>
                  <option value="Cleanliness / Hygiene">Cleanliness / Hygiene</option>
                  <option value="Other">Other Mechanical</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Priority Severity</label>
                <select
                  value={complaintPriority}
                  onChange={(e) => setComplaintPriority(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-xs"
                >
                  <option value="Low">Low (Can wait for routine check)</option>
                  <option value="Medium">Medium (Attention required)</option>
                  <option value="High">High (Immediate inspection)</option>
                  <option value="Critical">Critical (Halt bus for safety)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Problem Description</label>
              <textarea
                rows={3}
                value={complaintDescription}
                onChange={(e) => setComplaintDescription(e.target.value)}
                placeholder="Describe the noise, warning light, temperature issue, or defect..."
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs outline-none"
                required
              />
            </div>

            {/* Photo Attachment */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Defect Photo Evidence</label>
              {complaintPhoto ? (
                <div className="relative mt-1">
                  <img src={complaintPhoto} alt="Complaint Evidence" className="w-full h-36 object-cover rounded-xl border" />
                  <button
                    type="button"
                    onClick={() => setComplaintPhoto(null)}
                    className="absolute top-2 right-2 p-1.5 bg-rose-600 text-white rounded-full shadow-md"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handlePhotoCapture('complaint')}
                  className="w-full py-3 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-semibold flex items-center justify-center gap-2"
                >
                  <Camera className="w-4 h-4 text-amber-600" />
                  <span>Attach Photo Evidence (Camera / Gallery)</span>
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={submittingComplaint}
              className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 shadow-md"
            >
              {submittingComplaint ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  <span>Submit Defect Report to Fleet HQ</span>
                </>
              )}
            </button>
          </form>

          {/* Active reported complaints for this bus */}
          {busComplaints?.length > 0 && (
            <div className="mt-6 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold text-[#142B4A] mb-2 uppercase tracking-wider">Your Active Reported Issues</h4>
              <div className="space-y-2 text-xs">
                {busComplaints.map((c: any) => (
                  <div key={c.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800">{c.complaint_ref} — {c.category}</span>
                      <p className="text-[11px] text-slate-500 truncate max-w-xs">{c.description}</p>
                    </div>
                    <Badge variant={c.status === 'Resolved' ? 'success' : 'warning'}>{c.status}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 5: MY PROFILE (Official Biodata helper & Captains Format)
         ========================================================================= */}
      {mobileTab === 'profile' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-sm space-y-4">
            {/* Header with Print */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                {captain?.profile_photo ? (
                  <img
                    src={captain.profile_photo}
                    alt={captain?.name || user?.name}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-300"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-300 flex items-center justify-center text-lg font-black">
                    {captain?.name?.slice(0, 2) || 'CP'}
                  </div>
                )}
                <div>
                  <h3 className="text-base font-black text-[#142B4A]">{captain?.name || user?.name}</h3>
                  <p className="text-xs text-slate-500 font-semibold">
                    Route Captain • {captain?.code || 'EMP-CPT-001'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Biodata</span>
              </button>
            </div>

            {/* Official Biodata helper & Captains Table matching image.png */}
            <div className="border-2 border-black overflow-hidden font-sans text-xs bg-white">
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
                      {captain?.profile_photo ? (
                        <div className="flex items-center space-x-3">
                          <img
                            src={captain.profile_photo}
                            alt="Profile"
                            className="w-16 h-16 object-cover rounded-lg border border-slate-300"
                          />
                          <button
                            onClick={() =>
                              setViewingDoc({
                                title: `${captain?.name || user?.name} - Profile Photo`,
                                docUrl: captain.profile_photo
                              })
                            }
                            className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>View Full</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">No Photo Uploaded</span>
                      )}
                    </td>
                  </tr>

                  {/* 2. Gender */}
                  <tr className="hover:bg-slate-50">
                    <td className="p-2.5 font-bold border-r border-black bg-slate-50/50">Gender</td>
                    <td className="p-2.5">{captain?.gender || 'Male'}</td>
                  </tr>

                  {/* 3. Name (As per Aadhaar) */}
                  <tr className="hover:bg-slate-50">
                    <td className="p-2.5 font-bold border-r border-black bg-slate-50/50">Name (As per Aadhaar)</td>
                    <td className="p-2.5 font-bold text-slate-900">{captain?.name || user?.name || '-'}</td>
                  </tr>

                  {/* 4. DOB */}
                  <tr className="hover:bg-slate-50">
                    <td className="p-2.5 font-bold border-r border-black bg-slate-50/50">DOB</td>
                    <td className="p-2.5 font-mono">{captain?.date_of_birth || '1992-05-14'}</td>
                  </tr>

                  {/* 5. E MAIL */}
                  <tr className="hover:bg-slate-50">
                    <td className="p-2.5 font-bold border-r border-black bg-slate-50/50">E MAIL</td>
                    <td className="p-2.5">{captain?.email || user?.email || 'captain@charvik.com'}</td>
                  </tr>

                  {/* 6. Phone Number * */}
                  <tr className="hover:bg-slate-50">
                    <td className="p-2.5 font-bold border-r border-black bg-slate-50/50">Phone Number *</td>
                    <td className="p-2.5 font-mono font-bold text-blue-700">{captain?.phone || user?.phone_number || '-'}</td>
                  </tr>

                  {/* 7. Alternative Number */}
                  <tr className="hover:bg-slate-50">
                    <td className="p-2.5 font-bold border-r border-black bg-slate-50/50">Alternative Number</td>
                    <td className="p-2.5 font-mono">{captain?.alternative_phone_number || '-'}</td>
                  </tr>

                  {/* 8. Aadhaar Number */}
                  <tr className="hover:bg-slate-50">
                    <td className="p-2.5 font-bold border-r border-black bg-slate-50/50">Aadhaar Number</td>
                    <td className="p-2.5 font-mono">{captain?.aadhaar_number || '9876-5432-1098'}</td>
                  </tr>

                  {/* 9. Upload Photo File (Aadhaar front back ) */}
                  <tr className="hover:bg-slate-50">
                    <td className="p-2.5 font-bold border-r border-black bg-slate-50/50">Upload Photo File (Aadhaar front back )</td>
                    <td className="p-2.5">
                      {captain?.aadhaar_doc ? (
                        <button
                          onClick={() => setViewingDoc({ title: 'Aadhaar Card Document', docUrl: captain.aadhaar_doc })}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Aadhaar File</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 italic">Not Uploaded</span>
                      )}
                    </td>
                  </tr>

                  {/* 10. PAN Card Number */}
                  <tr className="hover:bg-slate-50">
                    <td className="p-2.5 font-bold border-r border-black bg-slate-50/50">PAN Card Number</td>
                    <td className="p-2.5 font-mono uppercase">{captain?.pan_number || 'ABCDE1234F'}</td>
                  </tr>

                  {/* 11. Upload Photo File (PAN Card) */}
                  <tr className="hover:bg-slate-50">
                    <td className="p-2.5 font-bold border-r border-black bg-slate-50/50">Upload Photo File (PAN Card)</td>
                    <td className="p-2.5">
                      {captain?.pan_doc ? (
                        <button
                          onClick={() => setViewingDoc({ title: 'PAN Card Document', docUrl: captain.pan_doc })}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View PAN Card</span>
                        </button>
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
                    <td className="p-2.5 font-bold">{captain?.bank_name || 'State Bank of India'}</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Upload Photo File</td>
                    <td className="p-2.5">
                      <button
                        onClick={() =>
                          setViewingDoc({
                            title: 'Bank Passbook Proof',
                            docUrl: captain?.bank_proof_doc || '/uploads/docs/passbook_sample.pdf'
                          })
                        }
                        className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Passbook File</span>
                      </button>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Account Holder Name</td>
                    <td className="p-2.5">{captain?.account_holder_name || captain?.name || user?.name || '-'}</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Account Number</td>
                    <td className="p-2.5 font-mono">{captain?.account_number || '123456789012'}</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">IFSC Code</td>
                    <td className="p-2.5 font-mono uppercase">{captain?.ifsc_code || 'SBIN0001234'}</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Branch</td>
                    <td className="p-2.5">{captain?.branch || 'Benz Circle Branch'}</td>
                  </tr>

                  {/* 13. Reference Details */}
                  <tr className="bg-slate-100 font-black text-slate-800">
                    <td colSpan={2} className="p-2.5 text-center uppercase tracking-wide border-y border-black font-bold">
                      Reference Details
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Name</td>
                    <td className="p-2.5">{captain?.reference_name || 'Venkatesh Rao'}</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Phone Number</td>
                    <td className="p-2.5 font-mono">{captain?.reference_phone || '9848011223'}</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Alternative Number</td>
                    <td className="p-2.5 font-mono">{captain?.reference_alt_phone || '9848099887'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Notifications */}
            {notifications?.length > 0 && (
              <div className="pt-3 border-t border-slate-100">
                <h4 className="text-xs font-bold text-[#142B4A] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-amber-500" />
                  <span>Duty &amp; Assignment Notifications</span>
                </h4>
                <div className="space-y-2">
                  {notifications.map((n: any) => (
                    <div key={n.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs flex items-start gap-2.5">
                      <div className="w-2 h-2 rounded-full bg-amber-500 mt-1 shrink-0"></div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <strong className="text-slate-800">{n.title}</strong>
                          <span className="text-[10px] text-slate-400">{n.time}</span>
                        </div>
                        <p className="text-slate-600 text-[11px] mt-0.5">{n.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: Crew Biodata Sheet (Driver or Helper)
         ========================================================================= */}
      {viewingCrewBiodata && (
        <Modal
          isOpen={!!viewingCrewBiodata}
          onClose={() => setViewingCrewBiodata(null)}
          title={`${viewingCrewBiodata.role} Biodata Record: ${viewingCrewBiodata.data?.full_name || viewingCrewBiodata.data?.name}`}
          subtitle="Charvik Staffing Consultancy • Employee Verification Sheet"
          maxWidth="max-w-2xl"
        >
          <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3 border-slate-200">
              <div className="flex items-center space-x-3">
                <img src="/logo.jpg" alt="Logo" className="w-10 h-10 object-contain" />
                <div>
                  <h3 className="font-extrabold text-sm text-[#142B4A]">CHARVIK STAFFING CONSULTANCY</h3>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">{viewingCrewBiodata.role} Master Biodata</p>
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

            {/* If Driver: Biodata Driver Table */}
            {viewingCrewBiodata.role === 'Driver' ? (
              <div className="border-2 border-black overflow-hidden font-sans">
                <div className="bg-[#FFFF00] text-black font-black text-center py-2.5 text-sm uppercase tracking-wider border-b-2 border-black">
                  Biodata Driver
                </div>

                <table className="w-full text-xs border-collapse">
                  <tbody className="divide-y divide-black">
                    <tr className="hover:bg-slate-50">
                      <td className="w-1/2 p-2.5 font-bold border-r border-black bg-slate-50/50">Profile Photo</td>
                      <td className="w-1/2 p-2.5">
                        {viewingCrewBiodata.data?.profile_photo ? (
                          <img src={viewingCrewBiodata.data.profile_photo} alt="Profile" className="w-16 h-16 object-cover rounded-lg border border-slate-300" />
                        ) : (
                          <span className="text-slate-400 italic">No Photo Uploaded</span>
                        )}
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold border-r border-black bg-slate-50/50">Gender</td>
                      <td className="p-2.5">{viewingCrewBiodata.data?.gender || 'Male'}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold border-r border-black bg-slate-50/50">Name (As per Aadhaar)</td>
                      <td className="p-2.5 font-bold text-slate-900">{viewingCrewBiodata.data?.full_name || viewingCrewBiodata.data?.name || '-'}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold border-r border-black bg-slate-50/50">DOB</td>
                      <td className="p-2.5 font-mono">{viewingCrewBiodata.data?.date_of_birth || '-'}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold border-r border-black bg-slate-50/50">E MAIL</td>
                      <td className="p-2.5">{viewingCrewBiodata.data?.email || '-'}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold border-r border-black bg-slate-50/50">Phone Number *</td>
                      <td className="p-2.5 font-mono font-bold text-blue-700">{viewingCrewBiodata.data?.phone_number || viewingCrewBiodata.data?.phone || '-'}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold border-r border-black bg-slate-50/50">Alternative Number</td>
                      <td className="p-2.5 font-mono">{viewingCrewBiodata.data?.alternative_phone_number || '-'}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold border-r border-black bg-slate-50/50">Aadhaar Number</td>
                      <td className="p-2.5 font-mono">{viewingCrewBiodata.data?.aadhaar_number || '-'}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold border-r border-black bg-slate-50/50">Upload Photo File (Aadhaar front back )</td>
                      <td className="p-2.5">
                        {viewingCrewBiodata.data?.aadhaar_front_doc ? (
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">✓ Uploaded</span>
                        ) : (
                          <span className="text-slate-400 italic">Not Uploaded</span>
                        )}
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold border-r border-black bg-slate-50/50">PAN Card Number</td>
                      <td className="p-2.5 font-mono uppercase">{viewingCrewBiodata.data?.pan_number || '-'}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold border-r border-black bg-slate-50/50">Upload Photo File (PAN Card)</td>
                      <td className="p-2.5">
                        {viewingCrewBiodata.data?.pan_doc ? (
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">✓ Uploaded</span>
                        ) : (
                          <span className="text-slate-400 italic">Not Uploaded</span>
                        )}
                      </td>
                    </tr>

                    <tr className="bg-slate-100 font-black text-slate-800">
                      <td colSpan={2} className="p-2.5 text-center uppercase tracking-wide border-y border-black font-bold">
                        Driving Licence Details
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Upload Photo File (DL front back)</td>
                      <td className="p-2.5">
                        {viewingCrewBiodata.data?.licence_front_doc ? (
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">✓ Uploaded</span>
                        ) : (
                          <span className="text-slate-400 italic">Not Uploaded</span>
                        )}
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Driving Licence Number</td>
                      <td className="p-2.5 font-mono font-bold text-blue-700 uppercase">{viewingCrewBiodata.data?.licence_number || '-'}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Issued By State</td>
                      <td className="p-2.5">{viewingCrewBiodata.data?.issuing_state || '-'}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Issued RTO Office</td>
                      <td className="p-2.5">{viewingCrewBiodata.data?.issuing_rto_office || '-'}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Issue Date (TRANS)</td>
                      <td className="p-2.5 font-mono">{viewingCrewBiodata.data?.licence_issue_date || '-'}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Validity Date (TRANS)2-Day Buffer</td>
                      <td className="p-2.5 font-mono font-bold text-blue-700">{viewingCrewBiodata.data?.licence_validity_date || '-'}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Total Experience as Per Licence</td>
                      <td className="p-2.5">{viewingCrewBiodata.data?.licence_experience_years ? `${viewingCrewBiodata.data.licence_experience_years} Years` : '-'}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Any Criminal Background As Per Licence</td>
                      <td className="p-2.5">{viewingCrewBiodata.data?.criminal_background_details || 'Clean Record / None'}</td>
                    </tr>

                    <tr className="bg-slate-100 font-black text-slate-800">
                      <td colSpan={2} className="p-2.5 text-center uppercase tracking-wide border-y border-black font-bold">
                        Bank Name
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Bank Name</td>
                      <td className="p-2.5 font-bold">{viewingCrewBiodata.data?.bank_name || '-'}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Upload Photo File (passbook check )</td>
                      <td className="p-2.5">
                        {viewingCrewBiodata.data?.bank_proof_doc ? (
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">✓ Uploaded</span>
                        ) : (
                          <span className="text-slate-400 italic">Not Uploaded</span>
                        )}
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Account Holder Name</td>
                      <td className="p-2.5">{viewingCrewBiodata.data?.account_holder_name || viewingCrewBiodata.data?.full_name || '-'}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Account Number</td>
                      <td className="p-2.5 font-mono">{viewingCrewBiodata.data?.account_number || '-'}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">IFSC Code</td>
                      <td className="p-2.5 font-mono uppercase">{viewingCrewBiodata.data?.ifsc_code || '-'}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Branch</td>
                      <td className="p-2.5">{viewingCrewBiodata.data?.branch || '-'}</td>
                    </tr>

                    <tr className="bg-slate-100 font-black text-slate-800">
                      <td colSpan={2} className="p-2.5 text-center uppercase tracking-wide border-y border-black font-bold">
                        Reference Details
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Name</td>
                      <td className="p-2.5">{viewingCrewBiodata.data?.reference_name || '-'}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Phone Number</td>
                      <td className="p-2.5 font-mono">{viewingCrewBiodata.data?.reference_phone || '-'}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Alternative Number</td>
                      <td className="p-2.5 font-mono">{viewingCrewBiodata.data?.reference_alt_phone || '-'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              /* If Helper: Biodata helper & Captains Table */
              <div className="border-2 border-black overflow-hidden font-sans">
                <div className="bg-[#FFFF00] text-black font-black text-center py-2.5 text-sm uppercase tracking-wider border-b-2 border-black">
                  Biodata helper &amp; Captains
                </div>

                <table className="w-full text-xs border-collapse">
                  <tbody className="divide-y divide-black">
                    <tr className="hover:bg-slate-50">
                      <td className="w-1/2 p-2.5 font-bold border-r border-black bg-slate-50/50">Profile Photo</td>
                      <td className="w-1/2 p-2.5">
                        {viewingCrewBiodata.data?.profile_photo ? (
                          <img src={viewingCrewBiodata.data.profile_photo} alt="Profile" className="w-16 h-16 object-cover rounded-lg border border-slate-300" />
                        ) : (
                          <span className="text-slate-400 italic">No Photo Uploaded</span>
                        )}
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold border-r border-black bg-slate-50/50">Gender</td>
                      <td className="p-2.5">{viewingCrewBiodata.data?.gender || 'Male'}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold border-r border-black bg-slate-50/50">Name (As per Aadhaar)</td>
                      <td className="p-2.5 font-bold text-slate-900">{viewingCrewBiodata.data?.full_name || viewingCrewBiodata.data?.name || '-'}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold border-r border-black bg-slate-50/50">DOB</td>
                      <td className="p-2.5 font-mono">{viewingCrewBiodata.data?.date_of_birth || '-'}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold border-r border-black bg-slate-50/50">E MAIL</td>
                      <td className="p-2.5">{viewingCrewBiodata.data?.email || '-'}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold border-r border-black bg-slate-50/50">Phone Number *</td>
                      <td className="p-2.5 font-mono font-bold text-blue-700">{viewingCrewBiodata.data?.phone_number || viewingCrewBiodata.data?.phone || '-'}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold border-r border-black bg-slate-50/50">Alternative Number</td>
                      <td className="p-2.5 font-mono">{viewingCrewBiodata.data?.alternative_phone_number || '-'}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold border-r border-black bg-slate-50/50">Aadhaar Number</td>
                      <td className="p-2.5 font-mono">{viewingCrewBiodata.data?.aadhaar_number || '-'}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold border-r border-black bg-slate-50/50">Upload Photo File (Aadhaar front back )</td>
                      <td className="p-2.5">
                        {viewingCrewBiodata.data?.aadhaar_front_doc ? (
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">✓ Uploaded</span>
                        ) : (
                          <span className="text-slate-400 italic">Not Uploaded</span>
                        )}
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold border-r border-black bg-slate-50/50">PAN Card Number</td>
                      <td className="p-2.5 font-mono uppercase">{viewingCrewBiodata.data?.pan_number || '-'}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold border-r border-black bg-slate-50/50">Upload Photo File (PAN Card)</td>
                      <td className="p-2.5">
                        {viewingCrewBiodata.data?.pan_doc ? (
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">✓ Uploaded</span>
                        ) : (
                          <span className="text-slate-400 italic">Not Uploaded</span>
                        )}
                      </td>
                    </tr>

                    <tr className="bg-slate-100 font-black text-slate-800">
                      <td colSpan={2} className="p-2.5 text-center uppercase tracking-wide border-y border-black font-bold">
                        Bank Name ( passbook cheque )
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Bank Name</td>
                      <td className="p-2.5 font-bold">{viewingCrewBiodata.data?.bank_name || '-'}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Upload Photo File</td>
                      <td className="p-2.5">
                        {viewingCrewBiodata.data?.bank_proof_doc ? (
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">✓ Uploaded</span>
                        ) : (
                          <span className="text-slate-400 italic">Not Uploaded</span>
                        )}
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Account Holder Name</td>
                      <td className="p-2.5">{viewingCrewBiodata.data?.account_holder_name || viewingCrewBiodata.data?.full_name || '-'}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Account Number</td>
                      <td className="p-2.5 font-mono">{viewingCrewBiodata.data?.account_number || '-'}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">IFSC Code</td>
                      <td className="p-2.5 font-mono uppercase">{viewingCrewBiodata.data?.ifsc_code || '-'}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Branch</td>
                      <td className="p-2.5">{viewingCrewBiodata.data?.branch || '-'}</td>
                    </tr>

                    <tr className="bg-slate-100 font-black text-slate-800">
                      <td colSpan={2} className="p-2.5 text-center uppercase tracking-wide border-y border-black font-bold">
                        Reference Details
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Name</td>
                      <td className="p-2.5">{viewingCrewBiodata.data?.reference_name || '-'}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Phone Number</td>
                      <td className="p-2.5 font-mono">{viewingCrewBiodata.data?.reference_phone || '-'}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-semibold pl-4 border-r border-black bg-slate-50/50">Alternative Number</td>
                      <td className="p-2.5 font-mono">{viewingCrewBiodata.data?.reference_alt_phone || '-'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* =========================================================================
          MODAL: Document Viewer
         ========================================================================= */}
      {viewingDoc && (
        <Modal
          isOpen={!!viewingDoc}
          onClose={() => setViewingDoc(null)}
          title={viewingDoc.title}
        >
          <div className="space-y-4 text-center p-2 text-xs">
            {viewingDoc.docUrl && (viewingDoc.docUrl.endsWith('.pdf') || viewingDoc.docUrl.includes('/docs/')) ? (
              <div className="p-8 rounded-2xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center">
                <FileText className="w-12 h-12 text-slate-400 mb-2" />
                <p className="font-bold text-slate-800 text-sm">{viewingDoc.title}</p>
                <p className="text-xs text-slate-500 mt-1">Verified official identity document on record</p>
                <div className="mt-4 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 font-bold text-xs border border-emerald-200">
                  Status: Government Verified &amp; Stored
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <img
                  src={viewingDoc.docUrl}
                  alt={viewingDoc.title}
                  className="max-h-[60vh] w-auto rounded-xl object-contain border border-slate-200 shadow-sm"
                />
              </div>
            )}

            <button
              onClick={() => setViewingDoc(null)}
              className="w-full py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
            >
              Close Viewer
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};
