import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  ShieldCheck,
  Plus,
  Search,
  Calendar,
  Bus,
  MapPin,
  User,
  Phone,
  Upload,
  Trash2,
  Edit2,
  Check,
  Eye,
  Printer,
  FileSpreadsheet,
  X,
  AlertCircle,
  CheckCircle2,
  Clock,
  Layers,
  ArrowLeft,
  FileCheck,
  Camera,
  Info,
  Users,
  Save,
  ImageIcon,
  Download
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import { api } from '../services/api';
import { Modal } from '../components/common/Modal';
import { getSavedCharvikCompanyDetails, type CharvikCompanyDetails } from '../utils/charvikCompanyDetails';
import { printSheet } from '../utils/printSheet';
import { exportTableToExcel } from '../utils/exportToExcel';
import { SearchableSelect, type SearchOption } from '../components/common/SearchableSelect';

export interface AmenityCheckItem {
  id: string;
  name: string;
  status: 'OK' | 'Not OK';
  remarks: string;
  isCustom?: boolean;
}

export interface CaptainAuditRecordItem {
  id: number | string;
  audit_date: string;
  audit_time: string;
  operator_name?: string;
  bus_number: string;
  route: string;
  captain_name: string;
  captain_phone?: string;
  driver_name?: string;
  driver_phone?: string;
  driver_2_name?: string;
  driver_2_phone?: string;
  helper_name?: string;
  helper_phone?: string;
  audited_by?: string;
  verified_by?: string;
  staff_pictures: string[];
  cleaning_pictures: string[];
  driver_freshup_pictures?: string[];
  amenities: AmenityCheckItem[];
  overall_status: 'Passed' | 'Needs Attention';
  remarks?: string;
  submitted_by_role?: string;
  submitted_by_user_id?: number | string;
  created_at?: string;
  updated_at?: string;
}

export const DEFAULT_AMENITY_NAMES: string[] = [
  'Cleanliness (Interior & Exterior)',
  'Seat & Covers Condition',
  'AC / Cooling',
  'Charging Points',
  'Lighting (Interior & Exterior)',
  'Fire Safety (Extinguisher / Hammer)',
  'First Aid Box',
  'Tools & Emergency Kit',
  'Tyre Condition (Including Spare)',
  'Other Remarks'
];

export const generateVehicleAuditReportHtml = (record: CaptainAuditRecordItem, mode: 'bw' | 'colourful') => {
  const isColourful = mode === 'colourful';
  const borderColor = isColourful ? '#002B66' : '#000000';
  const pillBg = isColourful ? '#002B66' : '#000000';
  const logoFilter = isColourful ? 'none' : 'grayscale(100%) contrast(140%)';
  const primaryText = isColourful ? '#002B66' : '#000000';
  const tagBg = isColourful ? '#e0f2fe' : '#ffffff';
  const generalRemarksTagBg = isColourful ? '#bfdbfe' : '#ffffff';

  const defaultItems = [
    'Cleanliness (Interior & Exterior)',
    'Seat & Covers Condition',
    'AC / Cooling',
    'Charging Points',
    'Lighting (Interior & Exterior)',
    'Fire Safety (Extinguisher / Hammer)',
    'First Aid Box',
    'Tools & Emergency Kit',
    'Tyre Condition (Including Spare)',
    'Other Remarks'
  ];

  // Map amenities or fallback to default 10 items
  const items = (record.amenities && record.amenities.length > 0)
    ? record.amenities
    : defaultItems.map((name, i) => ({
      id: `item-${i}`,
      name,
      status: 'OK' as const,
      remarks: ''
    }));

  return `
    <div
      id="charvik-printable-vehicle-audit-report"
      style="
        width: 100%;
        max-width: 720px;
        min-height: 980px;
        margin: 0 auto;
        background: #ffffff;
        color: #000000;
        border: 2px solid ${borderColor};
        border-radius: 14px;
        padding: 18px 22px 20px 22px;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        font-family: Arial, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        position: relative;
      "
    >
      <div>
        <!-- Top Header: Logo on left, Phone and Email only on right -->
        <div style="display: flex; align-items: center; justify-content: space-between; padding-bottom: 6px;">
          <div style="display: flex; flex-direction: column; align-items: flex-start;">
            <img
              src="/charvik-invoice-logo.png"
              alt="CHARVIK Staffing & Consultancy"
              style="height: 60px; max-height: 65px; width: auto; max-width: 280px; display: block; object-fit: contain; filter: ${logoFilter};"
              onerror="this.src='/logo-brand.png'"
            />
          </div>

          <div style="display: flex; align-items: center;">
            <div style="border-left: 1.5px solid ${borderColor}; height: 44px; margin: 0 16px;"></div>
            <div style="display: flex; flex-direction: column; gap: 4px; text-align: left;">
              <div style="display: flex; align-items: center; gap: 6px; font-size: 15px; font-weight: 900; color: ${primaryText}; white-space: nowrap;">
                <span style="font-size: 15px; ${isColourful ? 'color: #0284c7;' : ''}">📞</span>
                <span>9505151527</span>
              </div>
              <div style="display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; color: ${primaryText}; white-space: nowrap;">
                <span style="font-size: 13px; ${isColourful ? 'color: #0284c7;' : ''}">✉</span>
                <span>charvikstaffingconsulrancy@gmail.com</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Horizontal Divider -->
        <div style="border-bottom: 2.5px solid ${borderColor}; width: 100%; margin: 6px 0 14px 0;"></div>

        <!-- Centered Pill: VEHICLE AUDIT REPORT -->
        <div style="display: flex; justify-content: center; align-items: center; margin: 0 0 14px 0;">
          <div
            style="
              background: ${pillBg};
              color: #ffffff;
              text-align: center;
              padding: 6px 36px;
              border-radius: 9999px;
              font-weight: 900;
              font-size: 18px;
              letter-spacing: 0.08em;
              display: inline-block;
            "
          >
            VEHICLE AUDIT REPORT
          </div>
        </div>

        <!-- Vehicle & Crew Info Box -->
        <div
          style="
            border: 2px solid ${borderColor};
            border-radius: 12px;
            overflow: hidden;
            width: 100%;
            background: #ffffff;
            margin-bottom: 12px;
            padding: 8px 10px;
            box-sizing: border-box;
          "
        >
          <!-- 0. Operator Name -->
          <div style="display: flex; align-items: center; margin-bottom: 6px;">
            <div style="width: 32%; background: ${tagBg}; border-radius: 8px; padding: 4px 10px; display: flex; align-items: center; gap: 8px; font-weight: 900; font-size: 13px; color: ${primaryText};">
              <span style="font-size: 14px;">🏢</span>
              <span>Operator Name</span>
            </div>
            <div style="width: 4%; text-align: center; font-weight: 900; font-size: 14px; color: ${primaryText};">:</div>
            <div style="width: 64%; border: 1.5px solid ${borderColor}; border-radius: 8px; padding: 4px 12px; min-height: 22px; font-weight: 800; font-size: 13px; color: #000000; box-sizing: border-box; display: flex; align-items: center;">
              ${record.operator_name || '-'}
            </div>
          </div>

          <!-- 1. Bus Number -->
          <div style="display: flex; align-items: center; margin-bottom: 6px;">
            <div style="width: 32%; background: ${tagBg}; border-radius: 8px; padding: 4px 10px; display: flex; align-items: center; gap: 8px; font-weight: 900; font-size: 13px; color: ${primaryText};">
              <span style="font-size: 14px;">🚌</span>
              <span>Bus Number</span>
            </div>
            <div style="width: 4%; text-align: center; font-weight: 900; font-size: 14px; color: ${primaryText};">:</div>
            <div style="width: 64%; border: 1.5px solid ${borderColor}; border-radius: 8px; padding: 4px 12px; min-height: 22px; font-weight: 800; font-size: 13px; color: #000000; font-family: monospace; box-sizing: border-box; display: flex; align-items: center;">
              ${record.bus_number || '-'}
            </div>
          </div>

          <!-- 2. Route -->
          <div style="display: flex; align-items: center; margin-bottom: 6px;">
            <div style="width: 32%; background: ${tagBg}; border-radius: 8px; padding: 4px 10px; display: flex; align-items: center; gap: 8px; font-weight: 900; font-size: 13px; color: ${primaryText};">
              <span style="font-size: 14px;">📍</span>
              <span>Route</span>
            </div>
            <div style="width: 4%; text-align: center; font-weight: 900; font-size: 14px; color: ${primaryText};">:</div>
            <div style="width: 64%; border: 1.5px solid ${borderColor}; border-radius: 8px; padding: 4px 12px; min-height: 22px; font-weight: 800; font-size: 13px; color: #000000; box-sizing: border-box; display: flex; align-items: center;">
              ${record.route || '-'}
            </div>
          </div>

          <!-- 3. Captain Name -->
          <div style="display: flex; align-items: center; margin-bottom: 6px;">
            <div style="width: 32%; background: ${tagBg}; border-radius: 8px; padding: 4px 10px; display: flex; align-items: center; gap: 8px; font-weight: 900; font-size: 13px; color: ${primaryText};">
              <span style="font-size: 14px;">👮</span>
              <span>Captain Name</span>
            </div>
            <div style="width: 4%; text-align: center; font-weight: 900; font-size: 14px; color: ${primaryText};">:</div>
            <div style="width: 64%; border: 1.5px solid ${borderColor}; border-radius: 8px; padding: 4px 12px; min-height: 22px; font-weight: 800; font-size: 13px; color: #000000; box-sizing: border-box; display: flex; align-items: center;">
              ${record.captain_name || '-'}
            </div>
          </div>

          <!-- 4. Driver Name - 1 -->
          <div style="display: flex; align-items: center; margin-bottom: 6px;">
            <div style="width: 32%; background: ${tagBg}; border-radius: 8px; padding: 4px 10px; display: flex; align-items: center; gap: 8px; font-weight: 900; font-size: 13px; color: ${primaryText};">
              <span style="font-size: 14px;">👤</span>
              <span>Driver Name – 1</span>
            </div>
            <div style="width: 4%; text-align: center; font-weight: 900; font-size: 14px; color: ${primaryText};">:</div>
            <div style="width: 64%; border: 1.5px solid ${borderColor}; border-radius: 8px; padding: 4px 12px; min-height: 22px; font-weight: 800; font-size: 13px; color: #000000; box-sizing: border-box; display: flex; align-items: center;">
              ${record.driver_name || '-'}
            </div>
          </div>

          <!-- 5. Driver Name - 2 -->
          <div style="display: flex; align-items: center; margin-bottom: 6px;">
            <div style="width: 32%; background: ${tagBg}; border-radius: 8px; padding: 4px 10px; display: flex; align-items: center; gap: 8px; font-weight: 900; font-size: 13px; color: ${primaryText};">
              <span style="font-size: 14px;">👤</span>
              <span>Driver Name – 2</span>
            </div>
            <div style="width: 4%; text-align: center; font-weight: 900; font-size: 14px; color: ${primaryText};">:</div>
            <div style="width: 64%; border: 1.5px solid ${borderColor}; border-radius: 8px; padding: 4px 12px; min-height: 22px; font-weight: 800; font-size: 13px; color: #000000; box-sizing: border-box; display: flex; align-items: center;">
              ${record.driver_2_name || '-'}
            </div>
          </div>

          <!-- 6. Helper Name -->
          <div style="display: flex; align-items: center;">
            <div style="width: 32%; background: ${tagBg}; border-radius: 8px; padding: 4px 10px; display: flex; align-items: center; gap: 8px; font-weight: 900; font-size: 13px; color: ${primaryText};">
              <span style="font-size: 14px;">👥</span>
              <span>Helper Name</span>
            </div>
            <div style="width: 4%; text-align: center; font-weight: 900; font-size: 14px; color: ${primaryText};">:</div>
            <div style="width: 64%; border: 1.5px solid ${borderColor}; border-radius: 8px; padding: 4px 12px; min-height: 22px; font-weight: 800; font-size: 13px; color: #000000; box-sizing: border-box; display: flex; align-items: center;">
              ${record.helper_name || '-'}
            </div>
          </div>
        </div>

        <!-- Centered Pill: AUDIT CHECKLIST -->
        <div style="display: flex; justify-content: center; align-items: center; margin: 10px 0 10px 0;">
          <div
            style="
              background: ${pillBg};
              color: #ffffff;
              text-align: center;
              padding: 5px 32px;
              border-radius: 9999px;
              font-weight: 900;
              font-size: 16px;
              letter-spacing: 0.08em;
              display: inline-block;
            "
          >
            AUDIT CHECKLIST
          </div>
        </div>

        <!-- Checklist Table -->
        <table
          style="
            width: 100%;
            border-collapse: collapse;
            border: 2px solid ${borderColor};
            border-radius: 8px;
            overflow: hidden;
            margin-bottom: 12px;
            font-size: 12px;
          "
        >
          <thead>
            <tr style="background: ${pillBg}; color: #ffffff; font-weight: 900;">
              <th style="padding: 7px 4px; text-align: center; width: 6%; border-right: 1.5px solid #ffffff; font-size: 12px;">#</th>
              <th style="padding: 7px 8px; text-align: center; width: 42%; border-right: 1.5px solid #ffffff; font-size: 12px;">AUDIT ITEM / AMENITY</th>
              <th style="padding: 7px 4px; text-align: center; width: 8%; border-right: 1.5px solid #ffffff; font-size: 12px;">OK</th>
              <th style="padding: 7px 4px; text-align: center; width: 11%; border-right: 1.5px solid #ffffff; font-size: 12px;">NOT OK</th>
              <th style="padding: 7px 8px; text-align: center; width: 33%; font-size: 12px;">REMARKS</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((it, idx) => {
              const isOk = it.status === 'OK';
              const isNotOk = it.status === 'Not OK';
              const okBorder = isColourful ? '#16a34a' : '#000000';
              const okColor = isColourful ? '#16a34a' : '#000000';
              const notOkBorder = isColourful ? '#dc2626' : '#000000';
              const notOkColor = isColourful ? '#dc2626' : '#000000';

              return `
                <tr style="border-bottom: 1.5px solid ${borderColor};">
                  <td style="padding: 5px 4px; text-align: center; font-weight: 900; border-right: 1.5px solid ${borderColor};">${idx + 1}</td>
                  <td style="padding: 5px 8px; font-weight: 800; color: #000000; border-right: 1.5px solid ${borderColor};">${it.name}</td>
                  <td style="padding: 5px 4px; text-align: center; border-right: 1.5px solid ${borderColor};">
                    <div style="display: inline-flex; align-items: center; justify-content: center; width: 18px; height: 18px; border: 2px solid ${okBorder}; border-radius: 4px; font-size: 13px; font-weight: 900; color: ${okColor};">
                      ${isOk ? '✔' : ''}
                    </div>
                  </td>
                  <td style="padding: 5px 4px; text-align: center; border-right: 1.5px solid ${borderColor};">
                    <div style="display: inline-flex; align-items: center; justify-content: center; width: 18px; height: 18px; border: 2px solid ${notOkBorder}; border-radius: 4px; font-size: 13px; font-weight: 900; color: ${notOkColor};">
                      ${isNotOk ? '✔' : ''}
                    </div>
                  </td>
                  <td style="padding: 5px 8px; font-weight: 600; color: #000000;">
                    ${it.remarks || ''}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <!-- General Remarks Box -->
        <div style="margin-bottom: 14px;">
          <div
            style="
              background: ${generalRemarksTagBg};
              border: 1.5px solid ${borderColor};
              border-bottom: none;
              border-radius: 8px 8px 0 0;
              padding: 4px 14px;
              display: inline-block;
              font-weight: 900;
              font-size: 12px;
              color: ${primaryText};
            "
          >
            General Remarks :
          </div>
          <div
            style="
              border: 1.5px solid ${borderColor};
              border-radius: 0 10px 10px 10px;
              min-height: 48px;
              padding: 6px 12px;
              font-size: 12px;
              font-weight: 600;
              color: #000000;
              background: #ffffff;
              box-sizing: border-box;
            "
          >
            ${record.remarks || ''}
          </div>
        </div>
      </div>

      <!-- Footer: Audited By, Verified By, Date -->
      <div>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-top: 10px;">
          <div style="border: 1.5px solid ${borderColor}; border-radius: 8px; padding: 7px 12px; font-weight: 800; font-size: 12px; color: #000000; background: #ffffff;">
            Audited By : <span style="font-weight: 900;">${record.audited_by || record.captain_name || ''}</span>
          </div>
          <div style="border: 1.5px solid ${borderColor}; border-radius: 8px; padding: 7px 12px; font-weight: 800; font-size: 12px; color: #000000; background: #ffffff;">
            Verified By : <span style="font-weight: 900;">${record.verified_by || 'Operations Incharge'}</span>
          </div>
          <div style="border: 1.5px solid ${borderColor}; border-radius: 8px; padding: 7px 12px; font-weight: 800; font-size: 12px; color: #000000; background: #ffffff;">
            Date : <span style="font-weight: 900;">${record.audit_date || new Date().toISOString().split('T')[0]}</span>
          </div>
        </div>
      </div>
    </div>
  `;
};

export const CaptainAuditRecord: React.FC = () => {
  const { user } = useAuth();
  const [companyDetails, setCompanyDetails] = useState<CharvikCompanyDetails>(getSavedCharvikCompanyDetails());
  const location = useLocation();
  const { success, error } = useToast();

  const isAdmin = Boolean(
    user?.role === 'Super Admin' ||
    user?.role === 'Admin' ||
    user?.email?.toLowerCase().includes('admin')
  );

  const [records, setRecords] = useState<CaptainAuditRecordItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [buses, setBuses] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [organizers, setOrganizers] = useState<any[]>([]);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Passed' | 'Needs Attention'>('All');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Form Modal State (Create / Edit)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // View / Print Modal State
  const [viewRecord, setViewRecord] = useState<CaptainAuditRecordItem | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [activePhotoModal, setActivePhotoModal] = useState<string | null>(null);

  // Form Fields
  const [operatorName, setOperatorName] = useState('');
  const [busNumber, setBusNumber] = useState('');
  const [route, setRoute] = useState('');
  const [captainName, setCaptainName] = useState('');
  const [captainPhone, setCaptainPhone] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [driverName2, setDriverName2] = useState('');
  const [driverPhone2, setDriverPhone2] = useState('');
  const [helperName, setHelperName] = useState('');
  const [helperPhone, setHelperPhone] = useState('');
  const [auditedBy, setAuditedBy] = useState('');
  const [verifiedBy, setVerifiedBy] = useState('');
  const [auditDate, setAuditDate] = useState(new Date().toISOString().split('T')[0]);
  const [staffPictures, setStaffPictures] = useState<string[]>([]);
  const [driverFreshupPictures, setDriverFreshupPictures] = useState<string[]>([]);
  const [cleaningPictures, setCleaningPictures] = useState<string[]>([]);
  const [amenities, setAmenities] = useState<AmenityCheckItem[]>([]);
  const [editingAmenityIndex, setEditingAmenityIndex] = useState<number | null>(null);
  const [editingAmenityName, setEditingAmenityName] = useState<string>('');
  const [generalRemarks, setGeneralRemarks] = useState('');

  const [uploadingStaffPhoto, setUploadingStaffPhoto] = useState(false);
  const [uploadingDriverFreshupPhoto, setUploadingDriverFreshupPhoto] = useState(false);
  const [uploadingCleaningPhoto, setUploadingCleaningPhoto] = useState(false);

  const staffFileInputRef = useRef<HTMLInputElement>(null);
  const driverFreshupFileInputRef = useRef<HTMLInputElement>(null);
  const cleaningFileInputRef = useRef<HTMLInputElement>(null);

  // Initialize Default Amenities
  const initializeAmenities = () => {
    return DEFAULT_AMENITY_NAMES.map((name, index) => ({
      id: `amenity-${index}-${Date.now()}`,
      name,
      status: 'OK' as const,
      remarks: '',
      isCustom: false
    }));
  };

  // Fetch all records and dropdown data
  const loadData = async () => {
    setLoading(true);
    try {
      const [auditData, busData, routeData, empData, taskData, orgData] = await Promise.all([
        api.getCaptainAudits().catch(() => []),
        api.getBuses().catch(() => []),
        api.getRoutes().catch(() => []),
        api.getEmployees().catch(() => []),
        api.getTasks().catch(() => []),
        api.getOrganizers().catch(() => [])
      ]);

      setRecords(Array.isArray(auditData) ? auditData : []);
      setBuses(Array.isArray(busData) ? busData : []);
      setRoutes(Array.isArray(routeData) ? routeData : []);
      setEmployees(Array.isArray(empData) ? empData : []);
      setTasks(Array.isArray(taskData) ? taskData : []);
      setOrganizers(Array.isArray(orgData) ? orgData : []);
    } catch (err: any) {
      console.error('Error loading captain audit data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Isolated Print for Vehicle Audit Report
  const executePrintVehicleAuditReport = (record: CaptainAuditRecordItem, mode: 'bw' | 'colourful') => {
    const reportHtml = generateVehicleAuditReportHtml(record, mode);
    let iframe = document.getElementById('vehicle-audit-report-frame') as HTMLIFrameElement;
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'vehicle-audit-report-frame';
      iframe.style.position = 'fixed';
      iframe.style.top = '-10000px';
      iframe.style.left = '-10000px';
      iframe.style.width = '1024px';
      iframe.style.height = '1440px';
      iframe.style.opacity = '0';
      iframe.style.pointerEvents = 'none';
      iframe.style.border = 'none';
      iframe.style.zIndex = '-9999';
      document.body.appendChild(iframe);
    }

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Vehicle Audit Report - ${record.bus_number || 'Audit'}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 6mm 8mm;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              margin: 0;
              padding: 0;
              background: #ffffff;
              display: flex;
              justify-content: center;
              font-family: Arial, sans-serif;
            }
            #charvik-printable-vehicle-audit-report {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
          </style>
        </head>
        <body>
          ${reportHtml}
        </body>
      </html>
    `);
    doc.close();

    const triggerPrint = () => {
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (e) {
          console.error('Print Vehicle Audit Report error:', e);
        }
      }, 350);
    };

    const imgs = doc.getElementsByTagName('img');
    if (imgs.length === 0) {
      triggerPrint();
    } else {
      let loaded = 0;
      const total = imgs.length;
      let fired = false;
      const done = () => {
        if (fired) return;
        fired = true;
        triggerPrint();
      };
      for (let i = 0; i < total; i++) {
        if (imgs[i].complete) {
          loaded++;
        } else {
          imgs[i].onload = () => {
            loaded++;
            if (loaded >= total) done();
          };
          imgs[i].onerror = () => {
            loaded++;
            if (loaded >= total) done();
          };
        }
      }
      if (loaded >= total) done();
      setTimeout(done, 1500);
    }
  };

  // Handle Print Record
  const handlePrintRecord = (record: CaptainAuditRecordItem) => {
    setViewRecord(record);
    setIsViewOpen(true);
  };

  // Search Options for Operator, Bus, Route, Captain, Drivers, Helper
  const operatorSearchOptions: SearchOption[] = useMemo(() => {
    const rawOps: string[] = [
      'Sri Krishna Travels',
      'Vyshnavi Travels',
      'Chandrika Finance',
      'Orange Travels',
      'Kaveri Travels',
      'SRS Travels',
      'Morning Star Travels'
    ];
    tasks.forEach((t: any) => {
      if (t.client_name) rawOps.push(t.client_name);
      if (t.operator_name) rawOps.push(t.operator_name);
    });
    organizers.forEach((o: any) => {
      if (o.organization_name) rawOps.push(o.organization_name);
      if (o.name) rawOps.push(o.name);
    });
    buses.forEach((b: any) => {
      if (b.operator_name) rawOps.push(b.operator_name);
    });
    const unique = Array.from(new Set(rawOps.map((s) => s.trim()).filter(Boolean)));
    return unique.map((op) => ({
      value: op,
      label: op
    }));
  }, [tasks, organizers, buses]);

  const busSearchOptions: SearchOption[] = useMemo(() => {
    const unique = Array.from(
      new Set(
        buses
          .map((b: any) => (b.bus_number || b.registration_number || '').trim())
          .filter(Boolean)
      )
    );
    tasks.forEach((t: any) => {
      const b = (t.vehicle_number || t.bus_number || '').trim();
      if (b && !unique.includes(b)) unique.push(b);
    });
    return unique.map((busNo) => ({
      value: busNo,
      label: busNo
    }));
  }, [buses, tasks]);

  const routeSearchOptions: SearchOption[] = useMemo(() => {
    const rawRoutes: string[] = [];
    routes.forEach((r: any) => {
      if (r.route_name) rawRoutes.push(r.route_name);
      if (r.origin && r.destination) rawRoutes.push(`${r.origin} - ${r.destination}`);
    });
    tasks.forEach((t: any) => {
      if (t.route_corridor) rawRoutes.push(t.route_corridor);
      if (t.route) rawRoutes.push(t.route);
    });
    if (rawRoutes.length === 0) {
      rawRoutes.push('Hyderabad - Bangalore', 'Hyderabad - Vijayawada', 'Bangalore - Chennai', 'Hyderabad - Visakhapatnam');
    }
    const unique = Array.from(new Set(rawRoutes.map((s) => s.trim()).filter(Boolean)));
    return unique.map((rt) => ({
      value: rt,
      label: rt
    }));
  }, [routes, tasks]);

  const captainSearchOptions: SearchOption[] = useMemo(() => {
    const caps = employees.filter((e: any) => (e.role || '').toLowerCase().includes('captain'));
    const list = caps.length > 0 ? caps : employees;
    return list.map((e: any) => ({
      value: e.full_name || e.name,
      label: e.full_name || e.name,
      sublabel: e.phone_number || e.phone || undefined,
      badge: e.employee_code || undefined
    }));
  }, [employees]);

  const driver1SearchOptions: SearchOption[] = useMemo(() => {
    const drvs = employees.filter((e: any) => (e.role || '').toLowerCase().includes('driver'));
    const list = drvs.length > 0 ? drvs : employees;
    return list.map((e: any) => ({
      value: e.full_name || e.name,
      label: e.full_name || e.name,
      sublabel: e.phone_number || e.phone || undefined,
      badge: e.employee_code || undefined
    }));
  }, [employees]);

  const driver2SearchOptions: SearchOption[] = useMemo(() => {
    return driver1SearchOptions;
  }, [driver1SearchOptions]);

  const helperSearchOptions: SearchOption[] = useMemo(() => {
    const helpers = employees.filter((e: any) => (e.role || '').toLowerCase().includes('helper'));
    const list = helpers.length > 0 ? helpers : employees;
    return list.map((e: any) => ({
      value: e.full_name || e.name,
      label: e.full_name || e.name,
      sublabel: e.phone_number || e.phone || undefined,
      badge: e.employee_code || undefined
    }));
  }, [employees]);

  // Auto-populate when Operator is selected
  const handleOperatorSelect = (opName: string) => {
    setOperatorName(opName);
    if (!opName) return;

    // 1. Try to find recent task with this operator
    const matchedTask = tasks.find((t: any) =>
      (t.client_name && t.client_name.toLowerCase() === opName.toLowerCase()) ||
      (t.operator_name && t.operator_name.toLowerCase() === opName.toLowerCase())
    );

    // 2. Try to find bus with this operator
    const matchedBus = buses.find((b: any) =>
      (b.operator_name && b.operator_name.toLowerCase() === opName.toLowerCase()) ||
      (b.make && b.make.toLowerCase() === opName.toLowerCase())
    );

    if (matchedTask) {
      if (matchedTask.vehicle_number || matchedTask.bus_number) {
        setBusNumber(matchedTask.vehicle_number || matchedTask.bus_number);
      }
      if (matchedTask.route_corridor || matchedTask.route) {
        setRoute(matchedTask.route_corridor || matchedTask.route);
      }
      if (matchedTask.captain_name) {
        setCaptainName(matchedTask.captain_name);
        if (matchedTask.captain_phone) setCaptainPhone(matchedTask.captain_phone);
      }
      if (matchedTask.driver_name) {
        setDriverName(matchedTask.driver_name);
        if (matchedTask.driver_phone) setDriverPhone(matchedTask.driver_phone);
      }
      if (matchedTask.driver_2_name) {
        setDriverName2(matchedTask.driver_2_name);
      }
      if (matchedTask.helper_name) {
        setHelperName(matchedTask.helper_name);
      }
    } else if (matchedBus) {
      const bNo = matchedBus.bus_number || matchedBus.registration_number;
      if (bNo) setBusNumber(bNo);
      if (matchedBus.route || matchedBus.assigned_route) {
        setRoute(matchedBus.route || matchedBus.assigned_route);
      }
      if (matchedBus.driver_name) {
        setDriverName(matchedBus.driver_name);
      }
    }
  };

  // Auto-populate when Bus Number is selected
  const handleBusSelect = (busNo: string) => {
    setBusNumber(busNo);
    if (!busNo) return;

    const matchedTask = tasks.find((t: any) =>
      (t.vehicle_number && t.vehicle_number.toLowerCase() === busNo.toLowerCase()) ||
      (t.bus_number && t.bus_number.toLowerCase() === busNo.toLowerCase())
    );

    const matchedBus = buses.find((b: any) =>
      (b.bus_number && b.bus_number.toLowerCase() === busNo.toLowerCase()) ||
      (b.registration_number && b.registration_number.toLowerCase() === busNo.toLowerCase())
    );

    if (matchedTask) {
      if (!operatorName && (matchedTask.client_name || matchedTask.operator_name)) {
        setOperatorName(matchedTask.client_name || matchedTask.operator_name);
      }
      if (matchedTask.captain_name) {
        setCaptainName(matchedTask.captain_name);
        if (matchedTask.captain_phone) setCaptainPhone(matchedTask.captain_phone);
      }
      if (matchedTask.driver_name) {
        setDriverName(matchedTask.driver_name);
        if (matchedTask.driver_phone) setDriverPhone(matchedTask.driver_phone);
      }
      if (matchedTask.driver_2_name) setDriverName2(matchedTask.driver_2_name);
      if (matchedTask.helper_name) setHelperName(matchedTask.helper_name);
    } else if (matchedBus) {
      if (!operatorName && (matchedBus.operator_name || matchedBus.make)) {
        setOperatorName(matchedBus.operator_name || matchedBus.make);
      }
      if (matchedBus.driver_name) {
        setDriverName(matchedBus.driver_name);
      }
    }
  };

  const handleCaptainSelect = (capName: string) => {
    setCaptainName(capName);
    const emp = employees.find((e: any) => (e.full_name || e.name || '').toLowerCase() === capName.toLowerCase());
    if (emp?.phone_number || emp?.phone) setCaptainPhone(emp.phone_number || emp.phone);
  };

  const handleDriver1Select = (dName: string) => {
    setDriverName(dName);
    const emp = employees.find((e: any) => (e.full_name || e.name || '').toLowerCase() === dName.toLowerCase());
    if (emp?.phone_number || emp?.phone) setDriverPhone(emp.phone_number || emp.phone);
  };

  const handleDriver2Select = (dName: string) => {
    setDriverName2(dName);
    const emp = employees.find((e: any) => (e.full_name || e.name || '').toLowerCase() === dName.toLowerCase());
    if (emp?.phone_number || emp?.phone) setDriverPhone2(emp.phone_number || emp.phone);
  };

  const handleHelperSelect = (hName: string) => {
    setHelperName(hName);
    const emp = employees.find((e: any) => (e.full_name || e.name || '').toLowerCase() === hName.toLowerCase());
    if (emp?.phone_number || emp?.phone) setHelperPhone(emp.phone_number || emp.phone);
  };

  const handleExportTableExcel = () => {
    const headers = ['S.No', 'Date & Time', 'Bus Number', 'Route', 'Captain', 'Captain Phone', 'Driver', 'Driver Phone', 'Cleanliness (1-5)', 'Blanket Count', 'Water Bottles', 'Curtains', 'Compliant Status'];
    const rows = filteredRecords.map((r, idx) => [
      idx + 1,
      `${r.audit_date || ''} ${r.audit_time || ''}`.trim(),
      r.bus_number || '',
      r.route || '',
      r.captain_name || '',
      r.captain_phone || '',
      r.driver_name || '',
      r.driver_phone || '',
      r.cleanliness_rating || '5',
      r.blanket_count || 0,
      r.water_bottles_supplied ? 'Yes' : 'No',
      r.curtains_status || 'OK',
      r.overall_status || 'Passed'
    ]);

    exportTableToExcel({
      title: 'Captain Pre-Trip Audit Records',
      subtitle: `Total Records: ${filteredRecords.length} | Passed: ${metrics.passed} | Needs Attention: ${metrics.flagged}`,
      headers,
      rows
    });
  };

  const handlePrintTable = () => {
    printSheet({
      title: 'Captain Pre-Trip Audit Records',
      subtitle: `Total Records: ${filteredRecords.length} | Audits logged across active routes`,
      elementId: 'captain-audit-records-table-container',
      orientation: 'landscape'
    });
  };

  const handleExportSingleRecordExcel = (rec: CaptainAuditRecordItem) => {
    const headers = ['Checklist Item', 'Inspected Status', 'Remarks / Observations'];
    const rows = (rec.amenities_checklist || []).map((item) => [
      item.name,
      item.status,
      item.remarks || '-'
    ]);
    exportTableToExcel({
      title: `Captain Pre-Trip Audit Sheet - Bus ${rec.bus_number}`,
      subtitle: `Audit ID: #${rec.id} | Date: ${rec.audit_date} ${rec.audit_time} | Route: ${rec.route} | Captain: ${rec.captain_name} | Driver: ${rec.driver_name} | Overall Status: ${rec.overall_status}`,
      headers,
      rows
    });
  };

  // Open Form for New Submission
  const handleOpenNewForm = () => {
    setIsEditing(false);
    setEditingId(null);
    setOperatorName('');
    setBusNumber('');
    setRoute('');
    setCaptainName(user?.role === 'Captain' ? (user?.name || '') : '');
    setCaptainPhone(user?.phone_number || '');
    setDriverName('');
    setDriverPhone('');
    setDriverName2('');
    setDriverPhone2('');
    setHelperName('');
    setHelperPhone('');
    setAuditedBy(user?.name || 'Neelam Harish');
    setVerifiedBy('Operations Incharge');
    setAuditDate(new Date().toISOString().split('T')[0]);
    setStaffPictures([]);
    setDriverFreshupPictures([]);
    setCleaningPictures([]);
    setAmenities(initializeAmenities());
    setGeneralRemarks('');
    setIsFormOpen(true);
  };

  // Open Form for Editing (Admin only)
  const handleOpenEditForm = (rec: CaptainAuditRecordItem) => {
    if (!isAdmin) {
      error('Access Denied: Only Admins can modify submitted audit records.');
      return;
    }
    setIsEditing(true);
    setEditingId(rec.id);
    setOperatorName(rec.operator_name || '');
    setBusNumber(rec.bus_number || '');
    setRoute(rec.route || '');
    setCaptainName(rec.captain_name || '');
    setCaptainPhone(rec.captain_phone || '');
    setDriverName(rec.driver_name || '');
    setDriverPhone(rec.driver_phone || '');
    setDriverName2(rec.driver_2_name || '');
    setDriverPhone2(rec.driver_2_phone || '');
    setHelperName(rec.helper_name || '');
    setHelperPhone(rec.helper_phone || '');
    setAuditedBy(rec.audited_by || rec.captain_name || user?.name || '');
    setVerifiedBy(rec.verified_by || 'Operations Incharge');
    setAuditDate(rec.audit_date || new Date().toISOString().split('T')[0]);
    setStaffPictures(Array.isArray(rec.staff_pictures) ? [...rec.staff_pictures] : []);
    setDriverFreshupPictures(
      Array.isArray(rec.driver_freshup_pictures) ? [...rec.driver_freshup_pictures] : []
    );
    setCleaningPictures(Array.isArray(rec.cleaning_pictures) ? [...rec.cleaning_pictures] : []);
    setAmenities(Array.isArray(rec.amenities) && rec.amenities.length > 0 ? [...rec.amenities] : initializeAmenities());
    setGeneralRemarks(rec.remarks || '');
    setIsFormOpen(true);
  };

  // Handle Deleting Record (Admin only)
  const handleDeleteRecord = async (id: number | string) => {
    if (!isAdmin) {
      error('Access Denied: Only Admins can delete audit records.');
      return;
    }
    if (!window.confirm('Are you sure you want to permanently delete this Captain Audit Record?')) {
      return;
    }
    try {
      await api.deleteCaptainAudit(id);
      success('Captain Audit Record deleted successfully.');
      setRecords((prev) => prev.filter((r) => r.id !== id));
      if (viewRecord?.id === id) {
        setIsViewOpen(false);
        setViewRecord(null);
      }
    } catch (err: any) {
      error(err.message || 'Failed to delete record');
    }
  };

  // Photo Upload Handlers
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'staff' | 'cleaning' | 'freshup'
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    let currentList = staffPictures;
    if (type === 'cleaning') currentList = cleaningPictures;
    if (type === 'freshup') currentList = driverFreshupPictures;

    const remainingSlots = 5 - currentList.length;

    if (remainingSlots <= 0) {
      error('You have already reached the limit of 5 pictures.');
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);

    if (type === 'staff') setUploadingStaffPhoto(true);
    else if (type === 'freshup') setUploadingDriverFreshupPhoto(true);
    else setUploadingCleaningPhoto(true);

    const uploadedUrls: string[] = [];

    for (const file of filesToUpload) {
      if (file.size > 10 * 1024 * 1024) {
        error(`File ${file.name} exceeds 10MB limit and was skipped.`);
        continue;
      }
      try {
        const res = await api.uploadFile(file);
        const url = res.fileUrl || res.url;
        if (url) {
          uploadedUrls.push(url);
        } else {
          // Fallback to local DataURL for instant preview
          const reader = new FileReader();
          reader.onload = (loadEv) => {
            if (loadEv.target?.result) {
              uploadedUrls.push(loadEv.target.result as string);
            }
          };
          reader.readAsDataURL(file);
        }
      } catch (err) {
        // Fallback to local DataURL
        const reader = new FileReader();
        await new Promise<void>((resolve) => {
          reader.onload = (loadEv) => {
            if (loadEv.target?.result) {
              uploadedUrls.push(loadEv.target.result as string);
            }
            resolve();
          };
          reader.readAsDataURL(file);
        });
      }
    }

    if (type === 'staff') {
      setStaffPictures((prev) => [...prev, ...uploadedUrls].slice(0, 5));
      setUploadingStaffPhoto(false);
      if (staffFileInputRef.current) staffFileInputRef.current.value = '';
    } else if (type === 'freshup') {
      setDriverFreshupPictures((prev) => [...prev, ...uploadedUrls].slice(0, 5));
      setUploadingDriverFreshupPhoto(false);
      if (driverFreshupFileInputRef.current) driverFreshupFileInputRef.current.value = '';
    } else {
      setCleaningPictures((prev) => [...prev, ...uploadedUrls].slice(0, 5));
      setUploadingCleaningPhoto(false);
      if (cleaningFileInputRef.current) cleaningFileInputRef.current.value = '';
    }

    if (uploadedUrls.length > 0) {
      success(`Uploaded ${uploadedUrls.length} photo(s) successfully.`);
    }
  };

  const removePhoto = (index: number, type: 'staff' | 'cleaning' | 'freshup') => {
    if (type === 'staff') {
      setStaffPictures((prev) => prev.filter((_, i) => i !== index));
    } else if (type === 'freshup') {
      setDriverFreshupPictures((prev) => prev.filter((_, i) => i !== index));
    } else {
      setCleaningPictures((prev) => prev.filter((_, i) => i !== index));
    }
  };

  // Amenities Table Actions
  const handleToggleAmenityStatus = (index: number, newStatus: 'OK' | 'Not OK') => {
    setAmenities((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], status: newStatus };
      return copy;
    });
  };

  const handleAmenityRemarkChange = (index: number, remarks: string) => {
    setAmenities((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], remarks };
      return copy;
    });
  };

  const handleCustomAmenityNameChange = (index: number, name: string) => {
    setAmenities((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], name };
      return copy;
    });
  };

  const handleStartEditAmenity = (index: number) => {
    setEditingAmenityIndex(index);
    setEditingAmenityName(amenities[index]?.name || '');
  };

  const handleSaveEditAmenity = (index: number) => {
    if (editingAmenityName.trim()) {
      setAmenities((prev) => {
        const copy = [...prev];
        copy[index] = { ...copy[index], name: editingAmenityName.trim() };
        return copy;
      });
    }
    setEditingAmenityIndex(null);
    setEditingAmenityName('');
  };

  const handleCancelEditAmenity = () => {
    setEditingAmenityIndex(null);
    setEditingAmenityName('');
  };

  const handleAddMoreAmenity = () => {
    const defaultName = `New Amenity ${amenities.length + 1}`;
    const newItem: AmenityCheckItem = {
      id: `custom-amenity-${Date.now()}`,
      name: defaultName,
      status: 'OK',
      remarks: '',
      isCustom: true
    };
    setAmenities((prev) => [...prev, newItem]);
    setEditingAmenityIndex(amenities.length);
    setEditingAmenityName(defaultName);
  };

  const handleRemoveAmenity = (index: number) => {
    setAmenities((prev) => prev.filter((_, i) => i !== index));
    if (editingAmenityIndex === index) {
      setEditingAmenityIndex(null);
      setEditingAmenityName('');
    }
  };

  // Submit Handler
  const handleSubmitAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isUserAdmin = isAdmin || location.pathname.startsWith('/admin');

    let cleanBus = busNumber.trim();
    if (!cleanBus) {
      if (!isUserAdmin) {
        error('Bus Number is required.');
        return;
      }
      cleanBus = 'AP16TV1234';
      setBusNumber(cleanBus);
    }

    let cleanRoute = route.trim();
    if (!cleanRoute) {
      if (!isUserAdmin) {
        error('Route is required.');
        return;
      }
      cleanRoute = 'General Route';
      setRoute(cleanRoute);
    }

    let cleanCaptain = captainName.trim();
    if (!cleanCaptain) {
      if (!isUserAdmin) {
        error('Captain Name is required.');
        return;
      }
      cleanCaptain = 'Admin';
      setCaptainName(cleanCaptain);
    }

    // Check if any amenity has 'Not OK'
    const hasDeficiencies = amenities.some((a) => a.status === 'Not OK');
    const overall_status: 'Passed' | 'Needs Attention' = hasDeficiencies ? 'Needs Attention' : 'Passed';

    const now = new Date();
    const audit_date = auditDate || now.toISOString().split('T')[0];
    const audit_time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    const payload: Partial<CaptainAuditRecordItem> = {
      audit_date,
      audit_time,
      operator_name: operatorName.trim(),
      bus_number: busNumber.trim().toUpperCase(),
      route: route.trim(),
      captain_name: cleanCaptain,
      captain_phone: captainPhone.trim(),
      driver_name: driverName.trim(),
      driver_phone: driverPhone.trim(),
      driver_2_name: driverName2.trim(),
      driver_2_phone: driverPhone2.trim(),
      helper_name: helperName.trim(),
      helper_phone: helperPhone.trim(),
      audited_by: auditedBy.trim() || user?.name || cleanCaptain,
      verified_by: verifiedBy.trim() || 'Operations Incharge',
      staff_pictures: staffPictures,
      driver_freshup_pictures: driverFreshupPictures,
      cleaning_pictures: cleaningPictures,
      amenities,
      overall_status,
      remarks: generalRemarks.trim(),
      submitted_by_role: user?.role || 'Captain',
      submitted_by_user_id: user?.id || null
    };

    setSubmitting(true);
    try {
      if (isEditing && editingId) {
        if (!isAdmin) {
          error('Only Admin can edit submitted records.');
          setSubmitting(false);
          return;
        }
        await api.updateCaptainAudit(editingId, payload);
        success('Vehicle Audit Record updated successfully.');
        setRecords((prev) => prev.map((r) => (r.id === editingId ? { ...r, ...payload } as any : r)));
      } else {
        const created = await api.createCaptainAudit(payload);
        success('Vehicle Audit Record submitted successfully!');
        setRecords((prev) => [created, ...prev]);
      }
      setIsFormOpen(false);
    } catch (err: any) {
      error(err.message || 'Failed to submit Vehicle Audit Record');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered Records
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        !q ||
        rec.bus_number.toLowerCase().includes(q) ||
        (rec.operator_name && rec.operator_name.toLowerCase().includes(q)) ||
        rec.captain_name.toLowerCase().includes(q) ||
        rec.route.toLowerCase().includes(q) ||
        (rec.driver_name && rec.driver_name.toLowerCase().includes(q)) ||
        (rec.driver_2_name && rec.driver_2_name.toLowerCase().includes(q)) ||
        (rec.helper_name && rec.helper_name.toLowerCase().includes(q));

      const matchStatus =
        statusFilter === 'All' || rec.overall_status === statusFilter;

      let matchDate = true;
      if (fromDate) {
        matchDate = matchDate && rec.audit_date >= fromDate;
      }
      if (toDate) {
        matchDate = matchDate && rec.audit_date <= toDate;
      }

      return matchSearch && matchStatus && matchDate;
    });
  }, [records, searchTerm, statusFilter, fromDate, toDate]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = records.length;
    const passed = records.filter((r) => r.overall_status === 'Passed').length;
    const flagged = records.filter((r) => r.overall_status === 'Needs Attention').length;
    const todayStr = new Date().toISOString().split('T')[0];
    const todayAudits = records.filter((r) => r.audit_date === todayStr).length;

    return { total, passed, flagged, todayAudits };
  }, [records]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Main Actions with Real Bus Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0747A6] via-[#0D6EFD] to-[#0099FF] p-6 text-white shadow-lg shadow-blue-500/20 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center space-x-4 relative z-10 max-w-xl">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 shadow-inner shrink-0">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-xs">
                Captain Audit Record
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-400/25 text-emerald-100 border border-emerald-300/40 shadow-xs flex items-center gap-1.5 backdrop-blur-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
                {records.length} Total Audits
              </span>
            </div>
            <p className="text-xs sm:text-sm text-blue-100/90 font-medium mt-1">
              Onboard bus inspection, amenities verification, and crew photo checklist.
            </p>
          </div>
        </div>

        {/* Bus Coach Photo Preview & Action Button */}
        <div className="flex items-center gap-3.5 relative z-10 self-start md:self-auto flex-wrap sm:flex-nowrap">


          <button
            type="button"
            onClick={handleExportTableExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all cursor-pointer shadow-sm whitespace-nowrap"
            title="Export Audit Records to Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
            <span>Export Excel</span>
          </button>

          <button
            type="button"
            onClick={handlePrintTable}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 transition-all cursor-pointer shadow-sm whitespace-nowrap"
            title="Print Audit Sheet"
          >
            <Printer className="w-4 h-4 text-purple-100" />
            <span>Print Sheet</span>
          </button>

          <button
            onClick={handleOpenNewForm}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-900 rounded-xl font-extrabold text-xs shadow-sm transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4 text-slate-900" />
            <span>+ Submit Audit Record</span>
          </button>
        </div>

        {/* Decorative soft glow */}
        <div className="absolute -right-8 -top-8 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Role Notice for Captains */}
      {!isAdmin && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-xl flex items-center gap-3 text-xs">
          <Info className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Captain Notice:</strong> Once an audit record is submitted, it is permanently locked and cannot be edited or deleted by captains. Only Administrators have modification permissions.
          </span>
        </div>
      )}

      {/* KPI Stat Cards - Vibrant Gradients matching user reference */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Total Audits (Vibrant Blue) */}
        <div className="bg-gradient-to-r from-sky-400 to-blue-600 text-white p-5 rounded-3xl shadow-lg shadow-blue-500/20 flex items-center justify-between hover:scale-[1.01] transition-transform">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs text-white flex items-center justify-center shrink-0 shadow-inner">
              <Bus className="w-6 h-6 text-white" />
            </div>
            <div className="space-y-0.5">
              <span className="text-[11px] font-black text-sky-100 uppercase tracking-wider block">
                TOTAL AUDITS
              </span>
              <span className="text-2xl sm:text-3xl font-black text-white font-mono block">{metrics.total}</span>
              <span className="text-xs text-sky-100/90 font-medium block">Inspections logged</span>
            </div>
          </div>
        </div>

        {/* Card 2: Passed (All OK) (Vibrant Emerald Green) */}
        <div className="bg-gradient-to-r from-emerald-500 to-green-600 text-white p-5 rounded-3xl shadow-lg shadow-emerald-500/20 flex items-center justify-between hover:scale-[1.01] transition-transform">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs text-white flex items-center justify-center shrink-0 shadow-inner">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div className="space-y-0.5">
              <span className="text-[11px] font-black text-emerald-100 uppercase tracking-wider block">
                PASSED (ALL OK)
              </span>
              <span className="text-2xl sm:text-3xl font-black text-white font-mono block">{metrics.passed}</span>
              <span className="text-xs text-emerald-100/90 font-medium block">100% compliant</span>
            </div>
          </div>
        </div>

        {/* Card 3: Needs Attention (Vibrant Rose Red) */}
        <div className="bg-gradient-to-r from-rose-500 to-red-600 text-white p-5 rounded-3xl shadow-lg shadow-rose-500/20 flex items-center justify-between hover:scale-[1.01] transition-transform">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs text-white flex items-center justify-center shrink-0 shadow-inner">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <div className="space-y-0.5">
              <span className="text-[11px] font-black text-rose-100 uppercase tracking-wider block">
                NEEDS ATTENTION
              </span>
              <span className="text-2xl sm:text-3xl font-black text-white font-mono block">{metrics.flagged}</span>
              <span className="text-xs text-rose-100/90 font-medium block">Deficiencies noted</span>
            </div>
          </div>
        </div>

        {/* Card 4: Today's Audits (Vibrant Indigo-Purple) */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-5 rounded-3xl shadow-lg shadow-purple-900/20 flex items-center justify-between hover:scale-[1.01] transition-transform">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs text-white flex items-center justify-center shrink-0 shadow-inner">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div className="space-y-0.5">
              <span className="text-[11px] font-black text-purple-100 uppercase tracking-wider block">
                TODAY'S AUDITS
              </span>
              <span className="text-2xl sm:text-3xl font-black text-white font-mono block">{metrics.todayAudits}</span>
              <span className="text-xs text-purple-100/90 font-medium block">Active date shifts</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search Bus No / Captain / Route / Driver..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="md:col-span-3 flex items-center gap-1.5">
            <select
              value={statusFilter}
              onChange={(e: any) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
            >
              <option value="All">All Compliance Statuses</option>
              <option value="Passed">Passed (Compliant)</option>
              <option value="Needs Attention">Needs Attention</option>
            </select>
          </div>

          <div className="md:col-span-5 flex items-center gap-2">
            <div className="flex-1 flex items-center gap-1 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase">From:</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full text-xs bg-transparent border-none focus:outline-hidden"
              />
            </div>
            <div className="flex-1 flex items-center gap-1 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase">To:</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full text-xs bg-transparent border-none focus:outline-hidden"
              />
            </div>
            {(fromDate || toDate || searchTerm || statusFilter !== 'All') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('All');
                  setFromDate('');
                  setToDate('');
                }}
                className="px-2.5 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-xl font-bold cursor-pointer transition-colors"
                title="Clear Filters"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Records Table */}
      <div id="captain-audit-records-table-container" className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-gradient-to-r from-[#2563EB] via-[#4F46E5] to-[#7C3AED] text-white">
              <tr className="text-white font-black border-b border-indigo-900/30 uppercase tracking-wider text-xs">
                <th className="py-2.5 px-3 w-12 text-center">S.No</th>
                <th className="py-2.5 px-3">Date & Time</th>
                <th className="py-2.5 px-3">Operator</th>
                <th className="py-2.5 px-3">Bus Number</th>
                <th className="py-2.5 px-3">Route</th>
                <th className="py-2.5 px-3">Captain</th>
                <th className="py-2.5 px-3">Driver</th>
                <th className="py-2.5 px-3">Amenities Checklist</th>
                <th className="py-2.5 px-3">Photos</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-center no-print">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400 font-medium">
                    Loading Captain Audit Records...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    <ShieldCheck className="w-10 h-10 mx-auto text-slate-300 mb-2 stroke-1" />
                    <p className="font-semibold text-slate-600">No Captain Audit Records found.</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Click "Submit Captain Audit Record" to add an onboard audit.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec, index) => {
                  const amenitiesList = Array.isArray(rec.amenities) ? rec.amenities : [];
                  const okCount = amenitiesList.filter((a) => a.status === 'OK').length;
                  const totalCount = amenitiesList.length || 14;
                  const isFullyPassed = okCount === totalCount;
                  const totalPhotos = (rec.staff_pictures?.length || 0) + (rec.driver_freshup_pictures?.length || 0) + (rec.cleaning_pictures?.length || 0);

                  return (
                    <tr key={rec.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="py-2 px-3 text-center font-bold text-slate-400">
                        {index + 1}
                      </td>

                      <td className="py-2 px-3 font-semibold text-slate-700 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{rec.audit_date}</span>
                        </div>
                        {rec.audit_time && (
                          <span className="text-[10px] text-slate-400 font-normal pl-5 block">
                            {rec.audit_time}
                          </span>
                        )}
                      </td>

                      <td className="py-2 px-3 whitespace-nowrap">
                        <span className="font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 inline-flex items-center gap-1.5">
                          🏢 {rec.operator_name || '-'}
                        </span>
                      </td>

                      <td className="py-2 px-3 whitespace-nowrap">
                        <span className="font-extrabold text-[#142B4A] bg-blue-50/80 px-2.5 py-1 rounded-lg border border-blue-200/60 inline-flex items-center gap-1.5">
                          <Bus className="w-3.5 h-3.5 text-blue-600" />
                          {rec.bus_number}
                        </span>
                      </td>

                      <td className="py-2 px-3 text-slate-700 font-medium max-w-[180px] truncate" title={rec.route}>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{rec.route}</span>
                        </div>
                      </td>

                      <td className="py-2 px-3 whitespace-nowrap">
                        <div className="font-semibold text-slate-800">{rec.captain_name}</div>
                        {rec.captain_phone && (
                          <div className="text-xs font-bold tracking-wider text-slate-400 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {rec.captain_phone}
                          </div>
                        )}
                      </td>

                      <td className="py-2 px-3 whitespace-nowrap">
                        <div className="font-medium text-slate-700">{rec.driver_name || '-'}</div>
                        {rec.driver_phone && (
                          <div className="text-xs font-bold tracking-wider text-slate-400 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {rec.driver_phone}
                          </div>
                        )}
                      </td>

                      <td className="py-2 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${isFullyPassed
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                            : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                            }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{okCount} / {totalCount} OK</span>
                        </span>
                      </td>

                      <td className="py-2 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-xs font-bold tracking-wider font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                          <Camera className="w-3 h-3 text-slate-500" />
                          {totalPhotos} photo{totalPhotos !== 1 ? 's' : ''}
                        </span>
                      </td>

                      <td className="py-2 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold tracking-wider font-extrabold ${rec.overall_status === 'Passed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                            }`}
                        >
                          {rec.overall_status === 'Passed' ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <AlertCircle className="w-3 h-3 text-rose-600" />
                          )}
                          {rec.overall_status}
                        </span>
                      </td>

                      <td className="py-2 px-3 text-center whitespace-nowrap no-print">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setViewRecord(rec);
                              setIsViewOpen(true);
                            }}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="View Audit Report"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handlePrintRecord(rec)}
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Print Audit Report"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* Edit & Delete strictly restricted to Admin */}
                          {isAdmin && (
                            <>
                              <button
                                onClick={() => handleOpenEditForm(rec)}
                                className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                                title="Edit Record (Admin Only)"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteRecord(rec.id)}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete Record (Admin Only)"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: SUBMIT / EDIT CAPTAIN AUDIT RECORD FORM (Images 1, 2, 3, 4 layout) */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={isEditing ? 'Edit Captain Audit Record (Admin)' : 'Captain Audit Record Form'}
        subtitle="Complete the bus inspection checklist and upload crew & bus photos."
        maxWidth="max-w-4xl"
      >
        <form onSubmit={handleSubmitAudit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Card 1: Vehicle & Crew Information (With Search & Select for everything) */}
          <div className="bg-blue-50/20 p-4 rounded-2xl border border-blue-100 space-y-3.5">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#004B9E] text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-xs mb-1">
              <Users className="w-4 h-4 text-white" />
              <span>Vehicle &amp; Crew Information</span>
            </div>

            {/* Operator Name (Above Bus Number as requested) */}
            <div className="space-y-1">
              <SearchableSelect
                label="Operator Name"
                required
                placeholder="Select or type Operator Name (e.g. Sri Krishna Travels)"
                searchPlaceholder="Search operator name..."
                options={operatorSearchOptions}
                value={operatorName}
                onChange={handleOperatorSelect}
                allowCustom={true}
              />
            </div>

            {/* Bus Number */}
            <div className="space-y-1">
              <SearchableSelect
                label="Bus Number"
                required
                placeholder="Select or type Bus Number (e.g. AP16TV1234)"
                searchPlaceholder="Search bus number..."
                options={busSearchOptions}
                value={busNumber}
                onChange={handleBusSelect}
                allowCustom={true}
              />
            </div>

            {/* Route */}
            <div className="space-y-1">
              <SearchableSelect
                label="Route"
                required
                placeholder="Select or type Route (e.g. Hyderabad - Bangalore)"
                searchPlaceholder="Search route..."
                options={routeSearchOptions}
                value={route}
                onChange={(val) => setRoute(val)}
                allowCustom={true}
              />
            </div>

            {/* Captain Name */}
            <div className="pt-1 border-t border-blue-100/60">
              <SearchableSelect
                label="Captain Name"
                required
                placeholder="Select or type Captain Name"
                searchPlaceholder="Search captain..."
                options={captainSearchOptions}
                value={captainName}
                onChange={handleCaptainSelect}
                allowCustom={true}
              />
            </div>

            {/* Driver Name – 1 */}
            <div className="pt-1 border-t border-blue-100/60">
              <SearchableSelect
                label="Driver Name – 1"
                required
                placeholder="Select or type Driver 1 Name"
                searchPlaceholder="Search primary driver..."
                options={driver1SearchOptions}
                value={driverName}
                onChange={handleDriver1Select}
                allowCustom={true}
              />
            </div>

            {/* Driver Name – 2 */}
            <div className="pt-1 border-t border-blue-100/60">
              <SearchableSelect
                label="Driver Name – 2 (Optional)"
                placeholder="Select or type Driver 2 Name"
                searchPlaceholder="Search second driver..."
                options={driver2SearchOptions}
                value={driverName2}
                onChange={handleDriver2Select}
                allowCustom={true}
              />
            </div>

            {/* Helper Name */}
            <div className="pt-1 border-t border-blue-100/60">
              <SearchableSelect
                label="Helper Name (Optional)"
                placeholder="Select or type Helper Name"
                searchPlaceholder="Search helper..."
                options={helperSearchOptions}
                value={helperName}
                onChange={handleHelperSelect}
                allowCustom={true}
              />
            </div>
          </div>

          {/* Card 2: Amenities Checklist with Edit & Delete */}
          <div className="bg-blue-50/20 p-4 rounded-2xl border border-blue-100 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                  <Layers className="w-4 h-4 text-blue-700" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800">
                    Amenities
                  </h3>
                  <p className="text-xs text-slate-500">
                    Check each item as OK or Not OK. Use Edit or Delete to manage items.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddMoreAmenity}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors cursor-pointer shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add More Amenities</span>
              </button>
            </div>

            {/* Amenities Table */}
            <div className="bg-white rounded-2xl border border-blue-200 overflow-hidden shadow-2xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#004B9E] text-white font-bold border-b border-blue-900 uppercase tracking-wider text-[11px]">
                    <th className="py-2.5 px-3 text-center w-12 border-r border-blue-800/60">#</th>
                    <th className="py-2.5 px-3.5 border-r border-blue-800/60">Amenity / Item</th>
                    <th className="py-2.5 px-3 text-center w-20 border-r border-blue-800/60">OK</th>
                    <th className="py-2.5 px-3 text-center w-20 border-r border-blue-800/60">Not OK</th>
                    <th className="py-2.5 px-3.5 border-r border-blue-800/60">Remarks</th>
                    <th className="py-2.5 px-2.5 w-24 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {amenities.map((item, idx) => {
                    const isOk = item.status === 'OK';
                    const isNotOk = item.status === 'Not OK';

                    return (
                      <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="py-2.5 px-3 text-center font-bold text-slate-600 border-r border-slate-100">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3.5 font-semibold text-slate-800 border-r border-slate-100">
                          {editingAmenityIndex === idx ? (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                value={editingAmenityName}
                                onChange={(e) => setEditingAmenityName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleSaveEditAmenity(idx);
                                  } else if (e.key === 'Escape') {
                                    handleCancelEditAmenity();
                                  }
                                }}
                                className="w-full px-2 py-1 text-xs border border-blue-400 rounded-lg focus:outline-hidden font-semibold text-slate-900 bg-white"
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveEditAmenity(idx)}
                                className="p-1 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer shrink-0"
                                title="Save Name"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={handleCancelEditAmenity}
                                className="p-1 rounded-md bg-slate-200 text-slate-700 hover:bg-slate-300 cursor-pointer shrink-0"
                                title="Cancel"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span className="font-semibold text-slate-800">{item.name}</span>
                          )}
                        </td>

                        {/* OK Button */}
                        <td className="py-2 px-3 text-center border-r border-slate-100">
                          <button
                            type="button"
                            onClick={() => handleToggleAmenityStatus(idx, 'OK')}
                            className="inline-flex items-center justify-center p-0.5 cursor-pointer focus:outline-none"
                            title="Mark as OK"
                          >
                            {isOk ? (
                              <span className="inline-flex items-center justify-center w-5 h-5 bg-emerald-600 rounded-md text-white shadow-2xs">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </span>
                            ) : (
                              <span className="inline-block w-5 h-5 bg-white border-2 border-slate-300 rounded-md hover:border-slate-400"></span>
                            )}
                          </button>
                        </td>

                        {/* Not OK Button */}
                        <td className="py-2 px-3 text-center border-r border-slate-100">
                          <button
                            type="button"
                            onClick={() => handleToggleAmenityStatus(idx, 'Not OK')}
                            className="inline-flex items-center justify-center p-0.5 cursor-pointer focus:outline-none"
                            title="Mark as Not OK"
                          >
                            {isNotOk ? (
                              <span className="inline-flex items-center justify-center w-5 h-5 bg-rose-600 rounded-md text-white shadow-2xs">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </span>
                            ) : (
                              <span className="inline-block w-5 h-5 bg-white border-2 border-slate-300 rounded-md hover:border-slate-400"></span>
                            )}
                          </button>
                        </td>

                        {/* Remarks Input field */}
                        <td className="py-2 px-3.5 border-r border-slate-100">
                          <input
                            type="text"
                            placeholder="Optional notes / remark..."
                            value={item.remarks}
                            onChange={(e) => handleAmenityRemarkChange(idx, e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs border border-blue-100 rounded-xl focus:border-blue-400 outline-none bg-white"
                          />
                        </td>

                        {/* Actions column: Edit & Delete for all amenities */}
                        <td className="py-2 px-2.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {editingAmenityIndex === idx ? (
                              <button
                                type="button"
                                onClick={() => handleSaveEditAmenity(idx)}
                                className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                title="Save amenity name"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleStartEditAmenity(idx)}
                                className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title="Edit amenity name"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveAmenity(idx)}
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete amenity"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-1">
              <span className="px-3 py-1 bg-blue-50 text-blue-900 rounded-lg text-xs font-bold border border-blue-200">
                Total Checklist Items: <strong>{amenities.length}</strong> (
                {amenities.filter((a) => a.status === 'OK').length} OK,{' '}
                {amenities.filter((a) => a.status === 'Not OK').length} Not OK)
              </span>
            </div>
          </div>

          {/* Card 3: Bus Cleaning Picture */}
          <div className="bg-blue-50/20 p-4 rounded-2xl border border-blue-100 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-black text-slate-800 flex items-center gap-1">
                  Bus Cleaning Picture <span className="text-rose-500 font-bold">*</span>
                </label>
                <p className="text-xs text-slate-500 mt-0.5">
                  Upload up to 5 supported files. Max 10 MB per file.
                </p>
              </div>
              <span className="text-xs font-bold text-slate-400">
                {cleaningPictures.length} / 5 uploaded
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {cleaningPictures.map((picUrl, idx) => (
                <div key={idx} className="relative group w-20 h-20 rounded-xl overflow-hidden border border-slate-300 bg-white">
                  <img src={picUrl} alt={`Cleaning ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(idx, 'cleaning')}
                    className="absolute top-1 right-1 p-1 bg-rose-600/90 hover:bg-rose-700 text-white rounded-full transition-colors cursor-pointer shadow-sm"
                    title="Remove"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {cleaningPictures.length < 5 && (
                <div>
                  <input
                    type="file"
                    ref={cleaningFileInputRef}
                    accept="image/*"
                    multiple
                    onChange={(e) => handleFileUpload(e, 'cleaning')}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => cleaningFileInputRef.current?.click()}
                    disabled={uploadingCleaningPhoto}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-blue-50/50 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{uploadingCleaningPhoto ? 'Uploading...' : 'Add file'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Card 4: Staff Picture */}
          <div className="bg-blue-50/20 p-4 rounded-2xl border border-blue-100 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-black text-slate-800 flex items-center gap-1">
                  Staff Picture <span className="text-rose-500 font-bold">*</span>
                </label>
                <p className="text-xs text-slate-500 mt-0.5">
                  Upload up to 5 supported files. Max 10 MB per file.
                </p>
              </div>
              <span className="text-xs font-bold text-slate-400">
                {staffPictures.length} / 5 uploaded
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {staffPictures.map((picUrl, idx) => (
                <div key={idx} className="relative group w-20 h-20 rounded-xl overflow-hidden border border-slate-300 bg-white">
                  <img src={picUrl} alt={`Staff ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(idx, 'staff')}
                    className="absolute top-1 right-1 p-1 bg-rose-600/90 hover:bg-rose-700 text-white rounded-full transition-colors cursor-pointer shadow-sm"
                    title="Remove"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {staffPictures.length < 5 && (
                <div>
                  <input
                    type="file"
                    ref={staffFileInputRef}
                    accept="image/*"
                    multiple
                    onChange={(e) => handleFileUpload(e, 'staff')}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => staffFileInputRef.current?.click()}
                    disabled={uploadingStaffPhoto}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-blue-50/50 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{uploadingStaffPhoto ? 'Uploading...' : 'Add file'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Card 5: Driver Freshup Image / Crew Photo (Below Staff Picture) */}
          <div className="bg-blue-50/20 p-4 rounded-2xl border border-blue-100 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-black text-slate-800 flex items-center gap-1">
                  <Camera className="w-4 h-4 text-blue-600" />
                  <span>Driver Freshup Image / Crew Photo</span>
                </label>
                <p className="text-xs text-slate-500 mt-0.5">
                  Upload crew / driver freshup photos. Max 5 files.
                </p>
              </div>
              <span className="text-xs font-bold text-slate-400">
                {driverFreshupPictures.length} / 5 uploaded
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {driverFreshupPictures.map((picUrl, idx) => (
                <div key={idx} className="relative group w-20 h-20 rounded-xl overflow-hidden border border-slate-300 bg-white">
                  <img src={picUrl} alt={`Freshup ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(idx, 'freshup')}
                    className="absolute top-1 right-1 p-1 bg-rose-600/90 hover:bg-rose-700 text-white rounded-full transition-colors cursor-pointer shadow-sm"
                    title="Remove"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {driverFreshupPictures.length < 5 && (
                <div>
                  <input
                    type="file"
                    ref={driverFreshupFileInputRef}
                    accept="image/*"
                    multiple
                    onChange={(e) => handleFileUpload(e, 'freshup')}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => driverFreshupFileInputRef.current?.click()}
                    disabled={uploadingDriverFreshupPhoto}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-blue-50/50 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{uploadingDriverFreshupPhoto ? 'Uploading...' : 'Add Driver Freshup Photo'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Card 6: General Audit Remarks */}
          <div className="bg-blue-50/20 p-4 rounded-2xl border border-blue-100 space-y-1.5">
            <label className="text-xs font-bold text-slate-800">
              General Remarks
            </label>
            <textarea
              rows={2}
              placeholder="Any additional feedback or supervisor instructions..."
              value={generalRemarks}
              onChange={(e) => setGeneralRemarks(e.target.value)}
              className="w-full p-3.5 text-xs bg-white border border-blue-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-2xs font-medium text-slate-800"
            />
          </div>

          {/* Card 7: Signatories (Audited By, Verified By, Date) */}
          <div className="bg-blue-50/20 p-4 rounded-2xl border border-blue-100 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-800 text-white rounded-lg text-[11px] font-bold uppercase tracking-wider shadow-xs">
              <span>Signatories &amp; Verification</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Audited By</label>
                <input
                  type="text"
                  placeholder="Inspector / Captain Name"
                  value={auditedBy}
                  onChange={(e) => setAuditedBy(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-blue-200 bg-white font-semibold text-slate-800"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Verified By</label>
                <input
                  type="text"
                  placeholder="Supervisor / Operations Incharge"
                  value={verifiedBy}
                  onChange={(e) => setVerifiedBy(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-blue-200 bg-white font-semibold text-slate-800"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Date</label>
                <input
                  type="date"
                  value={auditDate}
                  onChange={(e) => setAuditDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-blue-200 bg-white font-semibold text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-6 py-2.5 rounded-2xl border border-slate-300 font-bold text-sm text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-7 py-2.5 rounded-2xl bg-[#004B9E] hover:bg-[#00367A] text-white text-sm font-black shadow-md flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>
                {submitting
                  ? 'Saving Record...'
                  : isEditing
                    ? 'Update Audit Record'
                    : 'Save Audit Record'}
              </span>
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: VIEW & PRINT OFFICIAL CAPTAIN AUDIT REPORT SHEET                  */}
      {/* ========================================================================= */}
      {viewRecord && (
        <Modal
          isOpen={isViewOpen}
          onClose={() => setIsViewOpen(false)}
          title={`Captain Audit Sheet #${viewRecord.id}`}
          subtitle={`Bus ${viewRecord.bus_number} • Date: ${viewRecord.audit_date}`}
          maxWidth="max-w-4xl"
        >
          <div className="p-4 sm:p-6 space-y-6 max-h-[85vh] overflow-y-auto print:p-0 print:max-h-none print:overflow-visible bg-slate-50">
            {/* Action Bar for Modal (hidden on print) */}
            <div className="flex flex-wrap items-center justify-between gap-3 no-print pb-4 border-b border-slate-200 bg-white p-4 rounded-2xl shadow-xs">
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-black uppercase ${viewRecord.overall_status === 'Passed'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                    }`}
                >
                  Status: {viewRecord.overall_status}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  Audited on {viewRecord.audit_date} {viewRecord.audit_time}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Print Report (Black & White mode) */}
                <button
                  type="button"
                  onClick={() => executePrintVehicleAuditReport(viewRecord, 'bw')}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
                  title="Print official report"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Report</span>
                </button>

                {/* Save as PDF (Colourful mode) */}
                <button
                  type="button"
                  onClick={() => executePrintVehicleAuditReport(viewRecord, 'colourful')}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#004B9E] hover:bg-[#00367A] text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
                  title="Save colorful report as PDF"
                >
                  <Download className="w-4 h-4" />
                  <span>Save as PDF</span>
                </button>

                {/* Export Excel */}
                <button
                  type="button"
                  onClick={() => handleExportSingleRecordExcel(viewRecord)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Export Excel</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsViewOpen(false)}
                  className="px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Official Report Preview Container (Matches exact reference layout) */}
            <div className="flex justify-center p-2 sm:p-6 bg-slate-200/70 rounded-2xl overflow-x-auto shadow-inner">
              <div
                className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-full"
                dangerouslySetInnerHTML={{
                  __html: generateVehicleAuditReportHtml(viewRecord, 'colourful')
                }}
              />
            </div>

            {/* Uploaded Photos Section Below Report Preview */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <Camera className="w-4 h-4 text-blue-600" />
                <span>Uploaded Audit Inspection Photos</span>
              </h3>

              {/* Staff Pictures */}
              {viewRecord.staff_pictures && viewRecord.staff_pictures.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Staff Pictures ({viewRecord.staff_pictures.length})
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    {viewRecord.staff_pictures.map((pic, i) => (
                      <div
                        key={i}
                        onClick={() => setActivePhotoModal(pic)}
                        className="aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-50 cursor-pointer hover:opacity-90 shadow-2xs hover:shadow-md transition-all group relative"
                      >
                        <img src={pic} alt={`Staff ${i + 1}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold">
                          View
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Driver Freshup / Crew Photos */}
              {viewRecord.driver_freshup_pictures && viewRecord.driver_freshup_pictures.length > 0 && (
                <div className={viewRecord.staff_pictures && viewRecord.staff_pictures.length > 0 ? 'pt-2 border-t border-slate-100' : ''}>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Driver Freshup Image / Crew Photos ({viewRecord.driver_freshup_pictures.length})
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    {viewRecord.driver_freshup_pictures.map((pic, i) => (
                      <div
                        key={i}
                        onClick={() => setActivePhotoModal(pic)}
                        className="aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-50 cursor-pointer hover:opacity-90 shadow-2xs hover:shadow-md transition-all group relative"
                      >
                        <img src={pic} alt={`Freshup ${i + 1}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold">
                          View
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bus Cleaning Pictures */}
              {viewRecord.cleaning_pictures && viewRecord.cleaning_pictures.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Bus Cleaning Pictures ({viewRecord.cleaning_pictures.length})
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    {viewRecord.cleaning_pictures.map((pic, i) => (
                      <div
                        key={i}
                        onClick={() => setActivePhotoModal(pic)}
                        className="aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-50 cursor-pointer hover:opacity-90 shadow-2xs hover:shadow-md transition-all group relative"
                      >
                        <img src={pic} alt={`Cleaning ${i + 1}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold">
                          View
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Lightbox / Zoom Photo Modal */}
      {activePhotoModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setActivePhotoModal(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh]">
            <img src={activePhotoModal} alt="Zoomed audit capture" className="max-w-full max-h-[85vh] rounded-2xl object-contain" />
            <button
              onClick={() => setActivePhotoModal(null)}
              className="absolute top-2 right-2 p-2 bg-black/60 text-white rounded-full hover:bg-black"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaptainAuditRecord;

