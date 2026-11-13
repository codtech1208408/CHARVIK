import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Package,
  Boxes,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Upload,
  X,
  FileSpreadsheet,
  Printer,
  Wrench,
  Bus,
  Layers,
  Image as ImageIcon,
  Eye,
  Check,
  ChevronDown,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RotateCw,
  Calendar,
  Tag,
  FileText,
  Minus,
  Info
} from 'lucide-react';
import { Modal } from '../components/common/Modal';
import { useToast } from '../components/common/Toast';
import { api } from '../services/api';
import { auditLogger } from '../services/auditLogger';
import { printSheet } from '../utils/printSheet';

export interface ProductItem {
  id: string;
  name: string;
  part_number?: string;
  category: string;
  brand?: string;
  received_date: string;
  quantity_received: number; // initial or total received
  used_quantity: number; // total units used on vehicles
  stock_quantity: number; // available stock = quantity_received - used_quantity
  is_reused?: boolean; // whether this is a reused product
  reused_quantity?: number; // number of reused product units
  reused_product_name?: string; // manually typed reused product name
  photo?: string;
  notes?: string;
  created_at: string;
}

export interface VehicleUsageRecord {
  id: string;
  product_id: string;
  product_name: string;
  part_number?: string;
  vehicle_id?: string;
  vehicle_number: string;
  usage_date: string;
  quantity_used: number;
  odometer_km?: string | number;
  remarks?: string;
  photo?: string;
  created_at: string;
}

const PRODUCTS_STORAGE_KEY = 'charvik_product_spare_parts_v2';
const USAGE_STORAGE_KEY = 'charvik_vehicle_spare_usage_v2';

const CATEGORIES = [
  'All Categories',
  'Spare Part',
  'Lubricants',
  'Filters',
  'Brake & Mechanical',
  'Electrical',
  'Tyres & Wheels',
  'Battery & Power',
  'AC Parts',
  'Consumable',
  'Other'
];

const INITIAL_SEED_PRODUCTS: ProductItem[] = [
  {
    id: 'prod-1',
    name: 'Heavy Duty Front Brake Pads (Set)',
    part_number: 'BP-001',
    category: 'Spare Part',
    brand: 'Bosch Commercial',
    received_date: '2026-10-25',
    quantity_received: 20,
    used_quantity: 4,
    stock_quantity: 16,
    photo: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=500&auto=format&fit=crop&q=60',
    notes: 'Premium ceramic brake pads for Tata & Ashok Leyland fleet',
    created_at: '2026-10-25T10:00:00Z'
  },
  {
    id: 'prod-2',
    name: 'Castrol VECTON 15W-40 CK-4 Engine Oil',
    part_number: 'OIL-15W40',
    category: 'Lubricants',
    brand: 'Castrol',
    received_date: '2026-10-26',
    quantity_received: 15,
    used_quantity: 3,
    stock_quantity: 12,
    photo: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=500&auto=format&fit=crop&q=60',
    notes: '20L sealed buckets for heavy diesel engine servicing',
    created_at: '2026-10-26T11:30:00Z'
  },
  {
    id: 'prod-3',
    name: 'Fleetguard Primary Fuel Water Separator Filter',
    part_number: 'FS-19732',
    category: 'Filters',
    brand: 'Fleetguard Cummins',
    received_date: '2026-10-27',
    quantity_received: 24,
    used_quantity: 6,
    stock_quantity: 18,
    photo: '',
    notes: 'OEM replacement fuel filter cartridges',
    created_at: '2026-10-27T09:15:00Z'
  },
  {
    id: 'prod-4',
    name: 'Heavy Duty 24V Alternator Belt',
    part_number: 'BLT-24V-HD',
    category: 'Electrical',
    brand: 'Gates Fleet',
    received_date: '2026-10-28',
    quantity_received: 10,
    used_quantity: 10,
    stock_quantity: 0,
    photo: '',
    notes: 'High tensile alternator drive belts',
    created_at: '2026-10-28T14:20:00Z'
  }
];

const INITIAL_SEED_USAGE: VehicleUsageRecord[] = [
  {
    id: 'use-1',
    product_id: 'prod-1',
    product_name: 'Heavy Duty Front Brake Pads (Set)',
    part_number: 'BP-001',
    vehicle_number: 'AP16TV1234',
    usage_date: '2026-10-28',
    quantity_used: 2,
    odometer_km: '142850',
    remarks: 'Front axle brake pads replacement during scheduled overhaul',
    photo: '',
    created_at: '2026-10-28T16:00:00Z'
  },
  {
    id: 'use-2',
    product_id: 'prod-2',
    product_name: 'Castrol VECTON 15W-40 CK-4 Engine Oil',
    part_number: 'OIL-15W40',
    vehicle_number: 'AP16TV5678',
    usage_date: '2026-10-29',
    quantity_used: 1,
    odometer_km: '98400',
    remarks: 'Routine 40,000 KM engine oil top-up and filter change',
    photo: '',
    created_at: '2026-10-29T10:30:00Z'
  },
  {
    id: 'use-3',
    product_id: 'prod-3',
    product_name: 'Fleetguard Primary Fuel Water Separator Filter',
    part_number: 'FS-19732',
    vehicle_number: 'TS09UB4545',
    usage_date: '2026-10-30',
    quantity_used: 2,
    odometer_km: '115200',
    remarks: 'Replaced clogged fuel filter after long route',
    photo: '',
    created_at: '2026-10-30T14:45:00Z'
  }
];

export const ProductManagement: React.FC = () => {
  const { success, error } = useToast();

  // 1. Products List State (Persistent in localStorage so all created products remain)
  const [products, setProducts] = useState<ProductItem[]>(() => {
    try {
      const saved = localStorage.getItem(PRODUCTS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return INITIAL_SEED_PRODUCTS;
    } catch {
      return INITIAL_SEED_PRODUCTS;
    }
  });

  // 2. Vehicle Usage History State (Persistent in localStorage)
  const [usageHistory, setUsageHistory] = useState<VehicleUsageRecord[]>(() => {
    try {
      const saved = localStorage.getItem(USAGE_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return INITIAL_SEED_USAGE;
    } catch {
      return INITIAL_SEED_USAGE;
    }
  });

  // 3. Vehicles list from API
  const [buses, setBuses] = useState<any[]>([]);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');

  // Modals
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [isUsageModalOpen, setIsUsageModalOpen] = useState(false);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);
  const [previewPhotoTitle, setPreviewPhotoTitle] = useState<string>('');

  // Receive Product Form (unit, unit cost, supplier removed; photo upload added)
  const [receiveForm, setReceiveForm] = useState({
    product_name: '',
    part_number: '',
    category: 'Spare Part',
    brand: '',
    received_date: new Date().toISOString().split('T')[0],
    quantity_received: 1,
    is_reused: false,
    reused_quantity: 0,
    reused_product_name: '',
    photo: '',
    notes: ''
  });
  const [uploadingReceivePhoto, setUploadingReceivePhoto] = useState(false);
  const receiveFileInputRef = useRef<HTMLInputElement>(null);

  // Record Vehicle Usage Form (used photo upload added)
  const [usageForm, setUsageForm] = useState({
    product_id: '',
    vehicle_id: '',
    vehicle_number: '',
    usage_date: new Date().toISOString().split('T')[0],
    quantity_used: 1,
    odometer_km: '',
    remarks: '',
    photo: ''
  });
  const [uploadingUsagePhoto, setUploadingUsagePhoto] = useState(false);
  const usageFileInputRef = useRef<HTMLInputElement>(null);

  // Load products, vehicle usage, and vehicles from API
  useEffect(() => {
    const loadAllData = async () => {
      try {
        const [bData, pData, uData] = await Promise.all([
          api.getBuses().catch(() => []),
          api.getProducts().catch(() => []),
          api.getProductUsageRecords().catch(() => [])
        ]);
        if (Array.isArray(bData)) setBuses(bData);
        if (Array.isArray(pData) && pData.length > 0) setProducts(pData);
        if (Array.isArray(uData) && uData.length > 0) setUsageHistory(uData);
      } catch (err) {
        console.warn('Could not load inventory data from API:', err);
      }
    };
    loadAllData();
  }, []);

  // Save products to localStorage whenever updated
  useEffect(() => {
    try {
      localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
    } catch (e) {
      console.error('Failed to save products to localStorage', e);
    }
  }, [products]);

  // Save usage history to localStorage whenever updated
  useEffect(() => {
    try {
      localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(usageHistory));
    } catch (e) {
      console.error('Failed to save usage history to localStorage', e);
    }
  }, [usageHistory]);

  // Top KPI Metrics
  const totalProductsCount = products.length;
  const totalReceivedCount = products.reduce((acc, p) => acc + (Number(p.quantity_received) || 0), 0);
  const totalUsedCount = products.reduce((acc, p) => acc + (Number(p.used_quantity) || 0), 0);
  const totalStockCount = Math.max(0, products.reduce((acc, p) => acc + (Number(p.stock_quantity) || 0), 0));
  const totalReusedCount = products.reduce((acc, p) => acc + (Number(p.reused_quantity) || 0), 0);

  // Filtered Products for Inventory Records
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        !searchTerm.trim() ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.part_number && p.part_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.brand && p.brand.toLowerCase().includes(searchTerm.toLowerCase())) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase());

      const matchCategory =
        selectedCategory === 'All Categories' || p.category === selectedCategory;

      return matchSearch && matchCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  // Filtered Usage History
  const filteredUsageHistory = useMemo(() => {
    return usageHistory.filter((u) => {
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        u.product_name.toLowerCase().includes(term) ||
        (u.part_number && u.part_number.toLowerCase().includes(term)) ||
        u.vehicle_number.toLowerCase().includes(term) ||
        (u.remarks && u.remarks.toLowerCase().includes(term))
      );
    });
  }, [usageHistory, searchTerm]);

  // Handlers for Photo Upload (Receive Product)
  const handleReceivePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingReceivePhoto(true);
      const res = await api.uploadFile(file);
      const url = res.fileUrl || res.url;
      if (url) {
        setReceiveForm((prev) => ({ ...prev, photo: url }));
        success('Product photo uploaded successfully!');
      } else {
        error('Could not get uploaded image URL.');
      }
    } catch (err: any) {
      error(err.message || 'Failed to upload photo');
    } finally {
      setUploadingReceivePhoto(false);
    }
  };

  // Handlers for Photo Upload (Record Vehicle Usage)
  const handleUsagePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingUsagePhoto(true);
      const res = await api.uploadFile(file);
      const url = res.fileUrl || res.url;
      if (url) {
        setUsageForm((prev) => ({ ...prev, photo: url }));
        success('Usage verification photo uploaded!');
      } else {
        error('Could not get uploaded image URL.');
      }
    } catch (err: any) {
      error(err.message || 'Failed to upload photo');
    } finally {
      setUploadingUsagePhoto(false);
    }
  };

  // Open Receive Modal
  const handleOpenReceiveModal = () => {
    setReceiveForm({
      product_name: '',
      part_number: '',
      category: 'Spare Part',
      brand: '',
      received_date: new Date().toISOString().split('T')[0],
      quantity_received: 1,
      is_reused: false,
      reused_quantity: 0,
      reused_product_name: '',
      photo: '',
      notes: ''
    });
    setIsReceiveModalOpen(true);
  };

  // Save Receive Product
  const handleSaveReceiveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const isUserAdmin = user?.role?.toLowerCase().includes('admin') || location.pathname.startsWith('/admin');

    if (!receiveForm.product_name?.trim()) {
      if (!isUserAdmin) {
        error('Please enter the Product Name.');
        return;
      }
      receiveForm.product_name = `Product-${Math.floor(100 + Math.random() * 900)}`;
    }
    const qty = Number(receiveForm.quantity_received);
    if (!qty || qty <= 0) {
      if (!isUserAdmin) {
        error('Please enter a valid quantity received (at least 1).');
        return;
      }
      receiveForm.quantity_received = 1;
    }

    const enteredReusedQty = Number(receiveForm.reused_quantity) || 0;
    const reusedName = (receiveForm.reused_product_name || '').trim();
    const isReused = enteredReusedQty > 0 || Boolean(reusedName);
    const reusedQty = isReused ? Math.min(qty, Math.max(1, enteredReusedQty || 1)) : 0;
    const finalReusedName = isReused ? (reusedName || receiveForm.product_name.trim()) : '';

    // Check if product with identical name and part number exists:
    // If it exists, add to its received count and stock.
    // If not, create a new product entry so it appears in history!
    const existingIndex = products.findIndex(
      (p) =>
        p.name.trim().toLowerCase() === receiveForm.product_name.trim().toLowerCase() &&
        (p.part_number || '').trim().toLowerCase() === (receiveForm.part_number || '').trim().toLowerCase()
    );

    let updatedProducts: ProductItem[] = [];
    if (existingIndex >= 0) {
      const existing = products[existingIndex];
      const newTotalReceived = existing.quantity_received + qty;
      const newStock = existing.stock_quantity + qty;
      const newReusedQty = (Number(existing.reused_quantity) || 0) + reusedQty;
      const updated = {
        ...existing,
        category: receiveForm.category || existing.category,
        brand: receiveForm.brand || existing.brand,
        received_date: receiveForm.received_date,
        quantity_received: newTotalReceived,
        stock_quantity: newStock,
        is_reused: existing.is_reused || isReused,
        reused_quantity: newReusedQty,
        reused_product_name: finalReusedName || existing.reused_product_name,
        photo: receiveForm.photo || existing.photo,
        notes: receiveForm.notes || existing.notes
      };
      updatedProducts = [...products];
      updatedProducts[existingIndex] = updated;
      setProducts(updatedProducts);
      api.updateProduct(existing.id, updated).catch((err: any) => {
        error(err.message || 'Failed to sync product update with database');
      });
      success(`Updated stock for ${existing.name}! Added ${qty} units (${reusedQty} reused).`);
    } else {
      const newProduct: ProductItem = {
        id: `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name: receiveForm.product_name.trim(),
        part_number: receiveForm.part_number.trim() || undefined,
        category: receiveForm.category || 'Spare Part',
        brand: receiveForm.brand.trim() || undefined,
        received_date: receiveForm.received_date,
        quantity_received: qty,
        used_quantity: 0,
        stock_quantity: qty,
        is_reused: isReused,
        reused_quantity: reusedQty,
        reused_product_name: finalReusedName || undefined,
        photo: receiveForm.photo || undefined,
        notes: receiveForm.notes.trim() || undefined,
        created_at: new Date().toISOString()
      };
      // Append so ALL previously created products and this new product are displayed
      updatedProducts = [newProduct, ...products];
      setProducts(updatedProducts);
      api.createProduct(newProduct).catch((err: any) => {
        error(err.message || 'Failed to sync product creation with database');
      });
      success(
        isReused
          ? `Reused Product "${newProduct.name}" (${reusedQty} pcs) added to inventory!`
          : `Product "${newProduct.name}" created and added to inventory!`
      );
    }

    auditLogger.log({
      user: 'Admin',
      module: 'Product Management',
      action_type: 'Data Update',
      description: `Received ${qty} units of "${receiveForm.product_name}" (Part: ${receiveForm.part_number || 'N/A'})`
    });

    setIsReceiveModalOpen(false);
  };

  // Open Record Vehicle Usage Modal
  const handleOpenUsageModal = (preselectedProductId?: string) => {
    const selectedProd = products.find((p) => p.id === preselectedProductId) || products[0];
    setUsageForm({
      product_id: selectedProd?.id || '',
      vehicle_id: buses[0]?.id ? String(buses[0].id) : '',
      vehicle_number: buses[0]?.bus_number || buses[0]?.registration_number || 'AP16TV1234',
      usage_date: new Date().toISOString().split('T')[0],
      quantity_used: 1,
      odometer_km: buses[0]?.current_odometer_km || '',
      remarks: '',
      photo: ''
    });
    setIsUsageModalOpen(true);
  };

  // Vehicle select change in usage form
  const handleVehicleChange = (val: string) => {
    const bus = buses.find((b) => String(b.id) === val || b.bus_number === val || b.registration_number === val);
    const busNum = bus?.bus_number || bus?.registration_number || val;
    const busKm = bus?.current_odometer_km || bus?.latest_checkup_km || '';
    setUsageForm((prev) => ({
      ...prev,
      vehicle_id: bus ? String(bus.id) : '',
      vehicle_number: busNum,
      odometer_km: busKm ? String(busKm) : prev.odometer_km
    }));
  };

  // Save Vehicle Usage
  const handleSaveUsage = (e: React.FormEvent) => {
    e.preventDefault();
    const isUserAdmin = user?.role?.toLowerCase().includes('admin') || location.pathname.startsWith('/admin');

    if (!usageForm.product_id) {
      if (!isUserAdmin) {
        error('Please select a product.');
        return;
      }
      if (products.length > 0) {
        usageForm.product_id = products[0].id;
      }
    }
    const targetProduct = products.find((p) => p.id === usageForm.product_id) || products[0];
    if (!targetProduct) {
      if (!isUserAdmin) {
        error('Selected product not found.');
        return;
      }
    }

    const qty = Number(usageForm.quantity_used);
    if (!qty || qty <= 0) {
      error('Please enter a valid quantity used (at least 1).');
      return;
    }

    if (qty > targetProduct.stock_quantity) {
      error(
        `Insufficient stock! Available: ${targetProduct.stock_quantity} units, Requested: ${qty} units.`
      );
      return;
    }

    if (!usageForm.vehicle_number.trim()) {
      error('Please select or specify a vehicle number.');
      return;
    }

    // 1. Deduct stock from Product
    const targetId = targetProduct.id;
    const newUsed = (targetProduct.used_quantity || 0) + qty;
    const newStock = Math.max(0, targetProduct.stock_quantity - qty);
    const updatedProducts = products.map((p) => {
      if (p.id === targetId) {
        return {
          ...p,
          used_quantity: newUsed,
          stock_quantity: newStock
        };
      }
      return p;
    });
    setProducts(updatedProducts);
    api.updateProduct(targetId, { used_quantity: newUsed, stock_quantity: newStock }).catch((err: any) => {
      error(err.message || 'Failed to update stock in database');
    });

    // 2. Add to Vehicle Usage History
    const newUsageRecord: VehicleUsageRecord = {
      id: `use-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      product_id: targetProduct.id,
      product_name: targetProduct.name,
      part_number: targetProduct.part_number,
      vehicle_id: usageForm.vehicle_id || undefined,
      vehicle_number: usageForm.vehicle_number.trim(),
      usage_date: usageForm.usage_date,
      quantity_used: qty,
      odometer_km: usageForm.odometer_km || undefined,
      remarks: usageForm.remarks.trim() || undefined,
      photo: usageForm.photo || undefined,
      created_at: new Date().toISOString()
    };

    setUsageHistory([newUsageRecord, ...usageHistory]);
    api.createProductUsageRecord(newUsageRecord).catch((err: any) => {
      error(err.message || 'Failed to record usage in database');
    });

    auditLogger.log({
      user: 'Admin',
      module: 'Product Management',
      action_type: 'Data Update',
      description: `Issued ${qty} units of "${targetProduct.name}" to vehicle ${usageForm.vehicle_number}`
    });

    success(`Recorded usage: ${qty} unit(s) of ${targetProduct.name} assigned to ${usageForm.vehicle_number}!`);
    setIsUsageModalOpen(false);
  };

  // Delete Product
  const handleDeleteProduct = (prodId: string, prodName: string) => {
    if (window.confirm(`Are you sure you want to remove "${prodName}" from inventory?`)) {
      setProducts(products.filter((p) => p.id !== prodId));
      api.deleteProduct(prodId).catch((err: any) => {
        error(err.message || 'Failed to delete product from database');
      });
      auditLogger.log({
        user: 'Admin',
        module: 'Product Management',
        action_type: 'Data Update',
        description: `Deleted product "${prodName}" from inventory`
      });
      success(`Removed "${prodName}" from inventory.`);
    }
  };

  // Delete Usage Record
  const handleDeleteUsageRecord = (usageId: string, prodName: string) => {
    if (window.confirm(`Are you sure you want to delete this usage record?`)) {
      setUsageHistory(usageHistory.filter((u) => u.id !== usageId));
      api.deleteProductUsageRecord(usageId).catch((err: any) => {
        error(err.message || 'Failed to delete usage record from database');
      });
      auditLogger.log({
        user: 'Admin',
        module: 'Product Management',
        action_type: 'Data Update',
        description: `Deleted vehicle usage record for "${prodName}"`
      });
      success(`Deleted usage record.`);
    }
  };

  // Export to Excel / CSV
  const handleExportCSV = () => {
    try {
      const headers = ['Type', 'Product Name', 'Part Number', 'Category', 'Brand', 'Received', 'Used', 'Current Stock', 'Date', 'Vehicle', 'Odometer KM', 'Remarks'];
      const productRows = products.map((p) => [
        'Inventory Record',
        `"${p.name.replace(/"/g, '""')}"`,
        `"${(p.part_number || '').replace(/"/g, '""')}"`,
        `"${p.category}"`,
        `"${(p.brand || '').replace(/"/g, '""')}"`,
        p.quantity_received,
        p.used_quantity,
        p.stock_quantity,
        p.received_date,
        '',
        '',
        `"${(p.notes || '').replace(/"/g, '""')}"`
      ]);

      const usageRows = usageHistory.map((u) => [
        'Vehicle Usage',
        `"${u.product_name.replace(/"/g, '""')}"`,
        `"${(u.part_number || '').replace(/"/g, '""')}"`,
        '',
        '',
        '',
        u.quantity_used,
        '',
        u.usage_date,
        `"${u.vehicle_number}"`,
        `"${u.odometer_km || ''}"`,
        `"${(u.remarks || '').replace(/"/g, '""')}"`
      ]);

      const csvContent = [headers.join(','), ...productRows.map((r) => r.join(',')), ...usageRows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Charvik_Product_Spare_Parts_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      success('Exported Product & Spare Parts report to CSV!');
    } catch {
      error('Failed to export CSV file.');
    }
  };

  // Print Report
  const handlePrint = () => {
    printSheet({
      title: activeTab === 'inventory' ? 'SPARE PARTS & PRODUCT INVENTORY' : 'SPARE PARTS USAGE LOG',
      subtitle: `Total Items: ${activeTab === 'inventory' ? filteredProducts.length : filteredLogs.length}`,
      elementId: activeTab === 'inventory' ? 'product-inventory-table-container' : 'spare-usage-table-container',
      orientation: 'landscape'
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* =========================================================================
          1. HEADER: PRODUCT & SPARE PARTS with Real Bus Coach Banner
         ========================================================================= */}
      <div
        data-aos="fade-down"
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0747A6] via-[#0D6EFD] to-[#0099FF] p-6 text-white shadow-lg shadow-blue-500/20 flex flex-col md:flex-row md:items-center justify-between gap-5"
      >
        <div className="flex items-center space-x-4 relative z-10 max-w-xl">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 shadow-inner shrink-0">
            <Boxes className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-xs">
                Product &amp; Spare Parts
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-400/25 text-emerald-100 border border-emerald-300/40 shadow-xs flex items-center gap-1.5 backdrop-blur-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
                Inventory Hub
              </span>
            </div>
            <p className="text-xs sm:text-sm text-blue-100/90 font-medium mt-1">
              Receive products, track stock, and record spare parts used on fleet vehicles.
            </p>
          </div>
        </div>

        {/* Real Bus Coach Photo Preview & Action Buttons */}
        <div className="flex items-center gap-3.5 relative z-10 self-start md:self-auto flex-wrap sm:flex-nowrap">
          <div className="hidden sm:block relative shrink-0">
            <div className="w-44 sm:w-52 h-20 sm:h-24 rounded-2xl overflow-hidden shadow-xl border-2 border-white/40 ring-4 ring-white/10 group">
              <img
                src="/assets/fleet5.jpg"
                alt="Spare Parts Coach"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-2">
                <span className="text-[10px] font-black text-white tracking-wider uppercase drop-shadow-xs">Spare Store</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 border border-white/30 text-white backdrop-blur-md text-xs font-bold shadow-xs transition-all cursor-pointer whitespace-nowrap"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
              <span>Export Excel</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 border border-white/30 text-white backdrop-blur-md text-xs font-bold shadow-xs transition-all cursor-pointer whitespace-nowrap"
            >
              <Printer className="w-4 h-4 text-white" />
              <span>Print</span>
            </button>

            <button
              type="button"
              onClick={handleOpenReceiveModal}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-blue-900 hover:bg-blue-50 text-xs font-black shadow-md transition-all cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4 text-blue-800" />
              <span>+ Receive Product</span>
            </button>
          </div>
        </div>

        {/* Decorative soft glow */}
        <div className="absolute -right-8 -top-8 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* =========================================================================
          2. TOP KPI CARDS (Products, Received, Used, Stock)
         ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: PRODUCTS */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between hover:shadow-md transition-all">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">PRODUCTS</p>
            <h3 className="text-2xl sm:text-3xl font-black text-[#142B4A] mt-1 tracking-tight">
              {totalProductsCount}
            </h3>
            <p className="text-[11px] text-slate-400 font-medium mt-1">Unique spare part lines</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-[#142B4A] flex items-center justify-center shrink-0">
            <Package className="w-6 h-6 text-blue-600" />
          </div>
        </div>

        {/* Card 2: RECEIVED */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between hover:shadow-md transition-all">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">RECEIVED</p>
            <h3 className="text-2xl sm:text-3xl font-black text-blue-600 mt-1 tracking-tight">
              {totalReceivedCount}
            </h3>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              {totalReusedCount > 0 ? (
                <span className="text-purple-700 font-bold">
                  {totalReceivedCount - totalReusedCount} New • {totalReusedCount} Reused
                </span>
              ) : (
                'Cumulative units received'
              )}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: USED */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between hover:shadow-md transition-all">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">USED</p>
            <h3 className="text-2xl sm:text-3xl font-black text-rose-600 mt-1 tracking-tight">
              {totalUsedCount}
            </h3>
            <p className="text-[11px] text-slate-400 font-medium mt-1">Fitted on fleet vehicles</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <Wrench className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: STOCK */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between hover:shadow-md transition-all">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">STOCK UNITS</p>
            <h3 className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1 tracking-tight">
              {totalStockCount}
            </h3>
            <p className="text-[11px] text-slate-400 font-medium mt-1">Available in warehouse</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. SEARCH & CATEGORY FILTER BAR
         ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search product, part number, brand, vehicle..."
            className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        <div className="w-full sm:w-64">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700 cursor-pointer"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* =========================================================================
          4. SECTION 1: INVENTORY RECORDS (Highlighted per user request)
         ========================================================================= */}
      <div className="bg-white rounded-2xl border-2 border-amber-500/25 p-5 sm:p-6 shadow-sm space-y-4">
        {/* Highlighted Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 flex items-center justify-center shrink-0 shadow-2xs">
              <Boxes className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                {/* Highlighted Inventory Records Text */}
                <h2 className="text-base sm:text-lg font-black text-[#142B4A] tracking-tight">
                  Inventory Records
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                  Live Stock
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {totalStockCount} units currently available across all products.
              </p>
            </div>
          </div>

          {/* Record Vehicle Usage Action Button */}
          <button
            type="button"
            onClick={() => handleOpenUsageModal()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold bg-[#142B4A] hover:bg-slate-800 text-white shadow-xs hover:shadow-md transition-all cursor-pointer self-start sm:self-auto"
          >
            <Bus className="w-4 h-4 text-blue-300" />
            <span>Record Vehicle Usage</span>
          </button>
        </div>

        {/* Inventory Records Table */}
        <div id="product-inventory-table-container" className="border border-slate-200 rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#DCE6F1] text-black font-bold border-b border-slate-300">
              <tr>
                <th className="py-2.5 px-3 text-center w-12 border-r border-slate-300">S.NO</th>
                <th className="py-2.5 px-3 border-r border-slate-300">PRODUCT</th>
                <th className="py-2.5 px-3 border-r border-slate-300">CATEGORY / BRAND</th>
                <th className="py-2.5 px-3 text-center border-r border-slate-300">RECEIVED</th>
                <th className="py-2.5 px-3 text-center border-r border-slate-300">USED</th>
                <th className="py-2.5 px-3 text-center border-r border-slate-300">STOCK</th>
                <th className="py-2.5 px-3 text-center border-r border-slate-300">STATUS</th>
                <th className="py-2.5 px-3 text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((p, idx) => (
                <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-3 text-center font-bold text-slate-500 border-r border-slate-100">
                    {idx + 1}
                  </td>

                  {/* Product Name & Part Number */}
                  <td className="py-3 px-3 border-r border-slate-100">
                    <div className="flex items-center space-x-3">
                      {p.photo ? (
                        <div
                          onClick={() => {
                            setPreviewPhotoUrl(p.photo || '');
                            setPreviewPhotoTitle(p.name);
                          }}
                          className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 shrink-0 cursor-pointer group relative shadow-2xs"
                          title="Click to view full photo"
                        >
                          <img src={p.photo} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px]">
                            <Eye className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                          <Package className="w-5 h-5" />
                        </div>
                      )}
                      <div>
                        <p className="font-extrabold text-[#142B4A] leading-tight text-xs sm:text-sm">
                          {p.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {p.part_number ? (
                            <span className="font-mono text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                              {p.part_number}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">No Part No.</span>
                          )}
                          <span className="text-[10px] text-slate-400">
                            Rec: {p.received_date}
                          </span>
                          {Boolean(p.is_reused || (p.reused_quantity && p.reused_quantity > 0)) && (
                            <span className="font-bold text-[10px] text-purple-800 bg-purple-100 px-1.5 py-0.5 rounded border border-purple-200 inline-flex items-center gap-1">
                              <RotateCw className="w-2.5 h-2.5 text-purple-600" />
                              Reused ({p.reused_quantity || p.quantity_received})
                              {p.reused_product_name && p.reused_product_name !== p.name && (
                                <span className="font-semibold text-purple-700">· {p.reused_product_name}</span>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Category & Brand */}
                  <td className="py-3 px-3 border-r border-slate-100">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      {p.category}
                    </span>
                    <p className="text-[11px] font-bold text-slate-600 mt-1">
                      {p.brand || '—'}
                    </p>
                  </td>

                  {/* Received */}
                  <td className="py-3 px-3 text-center border-r border-slate-100">
                    <span className="font-extrabold text-blue-700 block">{p.quantity_received}</span>
                    {p.is_reused || (p.reused_quantity && p.reused_quantity > 0) ? (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-black bg-purple-100 text-purple-800 border border-purple-200 mt-1" title="Number of Reused Units">
                        <RotateCw className="w-2.5 h-2.5" />
                        {p.reused_quantity || p.quantity_received} Reused
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 block mt-0.5">Fresh</span>
                    )}
                  </td>

                  {/* Used */}
                  <td className="py-3 px-3 text-center font-bold text-rose-700 border-r border-slate-100">
                    {p.used_quantity || 0}
                  </td>

                  {/* Available Stock */}
                  <td className="py-3 px-3 text-center font-black text-sm border-r border-slate-100">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-lg ${p.stock_quantity > 5
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : p.stock_quantity > 0
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}
                    >
                      {p.stock_quantity}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-3 px-3 text-center border-r border-slate-100">
                    {p.stock_quantity > 5 ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        In Stock
                      </span>
                    ) : p.stock_quantity > 0 ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        Low Stock
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                        Out of Stock
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-3 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1.5">
                      {p.stock_quantity > 0 ? (
                        <button
                          type="button"
                          onClick={() => handleOpenUsageModal(p.id)}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors flex items-center gap-1 cursor-pointer"
                          title="Record vehicle usage for this spare part"
                        >
                          <Wrench className="w-3 h-3" />
                          <span>Use</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenReceiveModal()}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors flex items-center gap-1 cursor-pointer"
                          title="Restock this product"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Restock</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(p.id, p.name)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete product"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400 font-medium">
                    No product records found. Click <strong>"+ Receive Product"</strong> to add your first spare part.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          5. SECTION 2: VEHICLE USAGE HISTORY (Highlighted per user request)
         ========================================================================= */}
      <div className="bg-white rounded-2xl border-2 border-indigo-500/25 p-5 sm:p-6 shadow-sm space-y-4">
        {/* Highlighted Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-700 flex items-center justify-center shrink-0 shadow-2xs">
              <Clock className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                {/* Highlighted Vehicle Usage History Text */}
                <h2 className="text-base sm:text-lg font-black text-[#142B4A] tracking-tight">
                  Vehicle Usage History
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-800 border border-indigo-200">
                  {usageHistory.length} Issued Records
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Every spare part issued against a vehicle with date, odometer, remarks & verification photo.
              </p>
            </div>
          </div>
        </div>

        {/* Vehicle Usage History Table */}
        <div id="spare-usage-table-container" className="border border-slate-200 rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#DCE6F1] text-black font-bold border-b border-slate-300">
              <tr>
                <th className="py-2.5 px-3 text-center w-12 border-r border-slate-300">S.NO</th>
                <th className="py-2.5 px-3 border-r border-slate-300">DATE</th>
                <th className="py-2.5 px-3 border-r border-slate-300">PRODUCT</th>
                <th className="py-2.5 px-3 border-r border-slate-300">VEHICLE</th>
                <th className="py-2.5 px-3 text-center border-r border-slate-300">QUANTITY</th>
                <th className="py-2.5 px-3 border-r border-slate-300">ODOMETER (KM)</th>
                <th className="py-2.5 px-3 border-r border-slate-300">REMARKS</th>
                <th className="py-2.5 px-3 text-center border-r border-slate-300">PHOTO</th>
                <th className="py-2.5 px-3 text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsageHistory.map((u, idx) => (
                <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-3 text-center font-bold text-slate-500 border-r border-slate-100">
                    {idx + 1}
                  </td>

                  {/* Usage Date */}
                  <td className="py-3 px-3 whitespace-nowrap font-bold text-slate-700 border-r border-slate-100">
                    {u.usage_date}
                  </td>

                  {/* Product */}
                  <td className="py-3 px-3 border-r border-slate-100">
                    <p className="font-extrabold text-[#142B4A]">{u.product_name}</p>
                    {u.part_number && (
                      <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                        {u.part_number}
                      </span>
                    )}
                  </td>

                  {/* Vehicle */}
                  <td className="py-3 px-3 whitespace-nowrap border-r border-slate-100">
                    <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-xs">
                      {u.vehicle_number}
                    </span>
                  </td>

                  {/* Quantity */}
                  <td className="py-3 px-3 text-center font-black text-rose-700 border-r border-slate-100">
                    -{u.quantity_used}
                  </td>

                  {/* Odometer */}
                  <td className="py-3 px-3 font-mono font-bold text-slate-700 border-r border-slate-100">
                    {u.odometer_km ? `${Number(u.odometer_km).toLocaleString('en-IN')} KM` : '—'}
                  </td>

                  {/* Remarks */}
                  <td className="py-3 px-3 text-slate-600 border-r border-slate-100 max-w-xs truncate" title={u.remarks}>
                    {u.remarks || '—'}
                  </td>

                  {/* Photo Thumbnail */}
                  <td className="py-3 px-3 text-center border-r border-slate-100">
                    {u.photo ? (
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewPhotoUrl(u.photo || '');
                          setPreviewPhotoTitle(`Usage Proof: ${u.product_name} on ${u.vehicle_number}`);
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer border border-indigo-200"
                      >
                        <ImageIcon className="w-3 h-3" />
                        <span>View</span>
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400">None</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-3 text-center whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handleDeleteUsageRecord(u.id, u.product_name)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete usage record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}

              {filteredUsageHistory.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400 font-medium">
                    No vehicle usage recorded yet. Click <strong>"Record Vehicle Usage"</strong> to issue a spare part to a vehicle.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          MODAL 1: RECEIVE PRODUCT (unit, unit cost, supplier removed; photo upload added)
         ========================================================================= */}
      {isReceiveModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsReceiveModalOpen(false)}
          title="Receive Product"
          subtitle="Add stock and product details into inventory"
          icon={<Package className="w-5 h-5 text-white" />}
          maxWidth="max-w-2xl"
        >
          <form onSubmit={handleSaveReceiveProduct} className="space-y-4 pt-1">
            {/* Top info alert banner matching reference image */}
            <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-2xl flex items-center gap-2.5 text-xs text-blue-900 font-medium">
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Add stock and product details. Received products are permanently saved into inventory.</span>
            </div>

            {/* Section Title */}
            <div className="flex items-center gap-2 text-sm font-black text-slate-800 pt-1">
              <Package className="w-4 h-4 text-blue-600" />
              <span>Product Details</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Product Name */}
              <div className="sm:col-span-2">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-1.5">
                  <Package className="w-4 h-4 text-blue-600" />
                  <span>Product Name <span className="text-rose-600">*</span></span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Brake pad, engine oil, filter..."
                  value={receiveForm.product_name}
                  onChange={(e) => setReceiveForm((prev) => ({ ...prev, product_name: e.target.value }))}
                  className="w-full text-sm px-4 py-3 rounded-2xl border border-blue-200 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs placeholder:text-slate-400"
                />
              </div>

              {/* Part Number */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-1.5">
                  <Tag className="w-4 h-4 text-amber-500" />
                  <span>Part Number</span>
                </label>
                <input
                  type="text"
                  placeholder="BP-001, OIL-15W40..."
                  value={receiveForm.part_number}
                  onChange={(e) => setReceiveForm((prev) => ({ ...prev, part_number: e.target.value }))}
                  className="w-full text-sm px-4 py-3 rounded-2xl border border-blue-200 bg-white font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs placeholder:text-slate-400 placeholder:font-normal"
                />
              </div>

              {/* Category */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-1.5">
                  <Layers className="w-4 h-4 text-purple-600" />
                  <span>Category <span className="text-rose-600">*</span></span>
                </label>
                <select
                  value={receiveForm.category}
                  onChange={(e) => setReceiveForm((prev) => ({ ...prev, category: e.target.value }))}
                  className="w-full text-sm px-4 py-3 rounded-2xl border border-blue-200 bg-white font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
                >
                  {CATEGORIES.filter((c) => c !== 'All Categories').map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Brand */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Brand</span>
                </label>
                <input
                  type="text"
                  placeholder="Bosch, Castrol, Tata..."
                  value={receiveForm.brand}
                  onChange={(e) => setReceiveForm((prev) => ({ ...prev, brand: e.target.value }))}
                  className="w-full text-sm px-4 py-3 rounded-2xl border border-blue-200 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs placeholder:text-slate-400"
                />
              </div>

              {/* Received Date */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-1.5">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>Received Date <span className="text-rose-600">*</span></span>
                </label>
                <input
                  type="date"
                  required
                  value={receiveForm.received_date}
                  onChange={(e) => setReceiveForm((prev) => ({ ...prev, received_date: e.target.value }))}
                  className="w-full text-sm px-4 py-3 rounded-2xl border border-blue-200 bg-white font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                />
              </div>

              {/* Quantity Received */}
              <div className="sm:col-span-2">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-1.5">
                  <Boxes className="w-4 h-4 text-indigo-600" />
                  <span>Quantity Received <span className="text-rose-600">*</span></span>
                </label>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setReceiveForm(prev => ({ ...prev, quantity_received: Math.max(1, (prev.quantity_received || 1) - 1) }))}
                    className="w-11 h-11 rounded-2xl bg-slate-100 hover:bg-rose-100 text-slate-700 hover:text-rose-700 flex items-center justify-center font-black border border-slate-200 transition-all cursor-pointer shadow-2xs"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="e.g. 10"
                    value={receiveForm.quantity_received}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setReceiveForm((prev) => ({
                        ...prev,
                        quantity_received: val,
                        reused_quantity: prev.is_reused ? Math.min(prev.reused_quantity || val, val) : 0
                      }));
                    }}
                    className="flex-1 text-center text-base px-4 py-2.5 rounded-2xl border border-blue-200 bg-white font-black text-[#142B4A] focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setReceiveForm(prev => ({ ...prev, quantity_received: (prev.quantity_received || 0) + 1 }))}
                    className="w-11 h-11 rounded-2xl bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-700 flex items-center justify-center font-black border border-slate-200 transition-all cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Reused Product Section */}
              <div className="sm:col-span-2 p-4 rounded-2xl border-2 border-purple-200 bg-[#FAF5FF] space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-purple-900 uppercase tracking-wide flex items-center gap-1.5">
                    <RotateCw className="w-4 h-4 text-purple-600" />
                    Reused Product
                  </span>
                  <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full border border-purple-200 flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    Add details if this is a reused product
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Reused Product Name (Manually Typed) */}
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-bold text-purple-900 mb-1">
                      <RotateCw className="w-3.5 h-3.5 text-purple-600" />
                      <span>Reused Product Name</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Type reused product name manually..."
                      value={receiveForm.reused_product_name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setReceiveForm((prev) => ({
                          ...prev,
                          reused_product_name: val,
                          is_reused: Boolean(val.trim() || prev.reused_quantity > 0),
                          reused_quantity: prev.reused_quantity > 0 ? prev.reused_quantity : (val.trim() ? 1 : 0)
                        }));
                      }}
                      className="w-full text-sm px-4 py-2.5 rounded-xl border border-purple-300 bg-white font-bold text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-2xs placeholder:text-slate-400 placeholder:font-normal"
                    />
                  </div>

                  {/* No of Reused Products - with +/- */}
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-bold text-purple-900 mb-1">
                      <Boxes className="w-3.5 h-3.5 text-purple-600" />
                      <span>No of Reused Products</span>
                    </label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => { const v = Math.max(0, (receiveForm.reused_quantity||0)-1); setReceiveForm(p=>({...p, reused_quantity:v, is_reused: v>0||Boolean(p.reused_product_name.trim())})); }}
                        className="w-9 h-9 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-700 flex items-center justify-center font-black border border-purple-200 transition-all text-base cursor-pointer shadow-2xs"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        max={receiveForm.quantity_received || undefined}
                        placeholder="0"
                        value={receiveForm.reused_quantity > 0 ? receiveForm.reused_quantity : ''}
                        onChange={(e) => {
                          const val = Math.max(0, parseInt(e.target.value) || 0);
                          setReceiveForm((prev) => ({
                            ...prev,
                            reused_quantity: val,
                            is_reused: val > 0 || Boolean(prev.reused_product_name.trim())
                          }));
                        }}
                        className="flex-1 text-center text-sm px-3 py-2 rounded-xl border border-purple-300 bg-white font-bold text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-2xs"
                      />
                      <button
                        type="button"
                        onClick={() => { const v = (receiveForm.reused_quantity||0)+1; setReceiveForm(p=>({...p, reused_quantity:v, is_reused:true})); }}
                        className="w-9 h-9 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-700 flex items-center justify-center font-black border border-purple-200 transition-all text-base cursor-pointer shadow-2xs"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Photo Upload */}
              <div className="sm:col-span-2">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-1.5">
                  <ImageIcon className="w-4 h-4 text-blue-600" />
                  <span>Product / Spare Part Photo</span>
                </label>
                <input
                  type="file"
                  ref={receiveFileInputRef}
                  accept="image/*"
                  onChange={handleReceivePhotoChange}
                  className="hidden"
                />

                {receiveForm.photo ? (
                  <div className="flex items-center space-x-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl shadow-2xs">
                    <img
                      src={receiveForm.photo}
                      alt="Product preview"
                      className="w-14 h-14 object-cover rounded-xl border border-slate-200 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Photo attached</span>
                      </p>
                      <button
                        type="button"
                        onClick={() => receiveFileInputRef.current?.click()}
                        className="text-[11px] text-blue-600 hover:underline mt-0.5 font-semibold cursor-pointer"
                      >
                        Change photo
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReceiveForm((prev) => ({ ...prev, photo: '' }))}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                      title="Remove photo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={uploadingReceivePhoto}
                    onClick={() => receiveFileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-blue-200 hover:border-blue-500 bg-blue-50/20 hover:bg-blue-50/50 rounded-2xl p-5 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5"
                  >
                    <Upload className="w-7 h-7 text-blue-600" />
                    <span className="text-sm font-bold text-slate-800">
                      {uploadingReceivePhoto ? 'Uploading photo...' : 'Click to upload product photo'}
                    </span>
                    <span className="text-xs text-slate-400">PNG, JPG, WEBP up to 5MB</span>
                  </button>
                )}
              </div>

              {/* Notes */}
              <div className="sm:col-span-2">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-1.5">
                  <FileText className="w-4 h-4 text-slate-500" />
                  <span>Notes</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Storage rack, invoice reference, batch notes..."
                  value={receiveForm.notes}
                  onChange={(e) => setReceiveForm((prev) => ({ ...prev, notes: e.target.value }))}
                  className="w-full text-sm px-4 py-3 rounded-2xl border border-blue-200 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsReceiveModalOpen(false)}
                className="px-6 py-2.5 rounded-2xl border border-slate-300 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <X className="w-4 h-4 text-slate-500" />
                <span>Cancel</span>
              </button>
              <button
                type="submit"
                className="px-7 py-2.5 rounded-2xl bg-[#004B9E] hover:bg-[#00367A] text-white text-sm font-black shadow-md transition-all cursor-pointer flex items-center gap-2"
              >
                <Check className="w-4 h-4 text-white" />
                <span>Save Product</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* =========================================================================
          MODAL 2: RECORD VEHICLE USAGE (used photo upload added per user request)
         ========================================================================= */}
      {isUsageModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsUsageModalOpen(false)}
          title="Record Vehicle Usage"
          subtitle="Deduct spare parts from inventory for a vehicle"
          icon={<Wrench className="w-5 h-5 text-white" />}
          maxWidth="max-w-2xl"
        >
          <form onSubmit={handleSaveUsage} className="space-y-4 pt-1">
            <div className="space-y-3.5">
              {/* Product Selection */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-1.5">
                  <Package className="w-4 h-4 text-blue-600" />
                  <span>Product <span className="text-rose-600">*</span></span>
                </label>
                <select
                  required
                  value={usageForm.product_id}
                  onChange={(e) => setUsageForm((prev) => ({ ...prev, product_id: e.target.value }))}
                  className="w-full text-sm px-4 py-3 rounded-2xl border border-blue-200 bg-white font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
                >
                  <option value="">Select product</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id} disabled={p.stock_quantity <= 0}>
                      {p.name} {p.part_number ? `(${p.part_number})` : ''} — Stock: {p.stock_quantity}
                      {p.stock_quantity <= 0 ? ' [OUT OF STOCK]' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Vehicle Selection & Usage Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-1.5">
                    <Bus className="w-4 h-4 text-blue-600" />
                    <span>Vehicle <span className="text-rose-600">*</span></span>
                  </label>
                  <select
                    required
                    value={usageForm.vehicle_id || usageForm.vehicle_number}
                    onChange={(e) => handleVehicleChange(e.target.value)}
                    className="w-full text-sm px-4 py-3 rounded-2xl border border-blue-200 bg-white font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
                  >
                    <option value="">Select vehicle</option>
                    {buses.length > 0 ? (
                      buses.map((b) => (
                        <option key={b.id} value={String(b.id)}>
                          {b.bus_number || b.registration_number} {b.make_model ? `(${b.make_model})` : ''}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="AP16TV1234">AP16TV1234 (Tata Starbus)</option>
                        <option value="AP16TV5678">AP16TV5678 (Ashok Leyland)</option>
                        <option value="TS09UB4545">TS09UB4545 (Volvo Multi-axle)</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-1.5">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span>Usage Date <span className="text-rose-600">*</span></span>
                  </label>
                  <input
                    type="date"
                    required
                    value={usageForm.usage_date}
                    onChange={(e) => setUsageForm((prev) => ({ ...prev, usage_date: e.target.value }))}
                    className="w-full text-sm px-4 py-3 rounded-2xl border border-blue-200 bg-white font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                  />
                </div>
              </div>

              {/* Quantity Used & Odometer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-1.5">
                    <Boxes className="w-4 h-4 text-rose-500" />
                    <span>Quantity Used <span className="text-rose-600">*</span></span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={usageForm.quantity_used}
                    onChange={(e) => setUsageForm((prev) => ({ ...prev, quantity_used: parseInt(e.target.value) || 0 }))}
                    className="w-full text-sm px-4 py-3 rounded-2xl border border-blue-200 bg-white font-black text-rose-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Odometer (km)</span>
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 142850"
                    value={usageForm.odometer_km}
                    onChange={(e) => setUsageForm((prev) => ({ ...prev, odometer_km: e.target.value }))}
                    className="w-full text-sm px-4 py-3 rounded-2xl border border-blue-200 bg-white font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs placeholder:text-slate-400 placeholder:font-normal"
                  />
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-1.5">
                  <FileText className="w-4 h-4 text-slate-500" />
                  <span>Remarks</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Reason, workshop, technician name, defect resolution..."
                  value={usageForm.remarks}
                  onChange={(e) => setUsageForm((prev) => ({ ...prev, remarks: e.target.value }))}
                  className="w-full text-sm px-4 py-3 rounded-2xl border border-blue-200 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs placeholder:text-slate-400"
                />
              </div>

              {/* Used Photo Upload */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-1.5">
                  <ImageIcon className="w-4 h-4 text-blue-600" />
                  <span>Used / Installed Photo Proof</span>
                </label>
                <input
                  type="file"
                  ref={usageFileInputRef}
                  accept="image/*"
                  onChange={handleUsagePhotoChange}
                  className="hidden"
                />

                {usageForm.photo ? (
                  <div className="flex items-center space-x-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl shadow-2xs">
                    <img
                      src={usageForm.photo}
                      alt="Usage proof"
                      className="w-14 h-14 object-cover rounded-xl border border-slate-200 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-indigo-700 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Used photo attached</span>
                      </p>
                      <button
                        type="button"
                        onClick={() => usageFileInputRef.current?.click()}
                        className="text-[11px] text-blue-600 hover:underline mt-0.5 font-semibold cursor-pointer"
                      >
                        Change photo
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUsageForm((prev) => ({ ...prev, photo: '' }))}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                      title="Remove photo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={uploadingUsagePhoto}
                    onClick={() => usageFileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-blue-200 hover:border-blue-500 bg-blue-50/20 hover:bg-blue-50/50 rounded-2xl p-4 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1"
                  >
                    <Upload className="w-6 h-6 text-blue-600" />
                    <span className="text-sm font-bold text-slate-800">
                      {uploadingUsagePhoto ? 'Uploading proof...' : 'Click to upload used part photo'}
                    </span>
                    <span className="text-xs text-slate-400">Photo of replaced/fitted spare part</span>
                  </button>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsUsageModalOpen(false)}
                className="px-6 py-2.5 rounded-2xl border border-slate-300 text-sm font-bold text-slate-700 hover:bg-slate-50 cursor-pointer flex items-center gap-1.5"
              >
                <X className="w-4 h-4 text-slate-500" />
                <span>Cancel</span>
              </button>
              <button
                type="submit"
                className="px-7 py-2.5 rounded-2xl bg-[#004B9E] hover:bg-[#00367A] text-white text-sm font-black shadow-md transition-all cursor-pointer flex items-center gap-2"
              >
                <Check className="w-4 h-4 text-white" />
                <span>Save Usage</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* =========================================================================
          PHOTO PREVIEW MODAL
         ========================================================================= */}
      {previewPhotoUrl && (
        <Modal
          isOpen={true}
          onClose={() => setPreviewPhotoUrl(null)}
          title={previewPhotoTitle || 'Photo Preview'}
          size="md"
        >
          <div className="space-y-3">
            <div className="max-h-[70vh] rounded-xl overflow-hidden bg-black/90 flex items-center justify-center">
              <img
                src={previewPhotoUrl}
                alt="Product / Usage Photo"
                className="max-h-[70vh] w-auto object-contain"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewPhotoUrl(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                Close Preview
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
