'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/protected-route';
import Navbar from '@/components/Navbar';
import {
  Search,
  Plus,
  Plane,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Grid3X3,
  List,
  Package,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  ArrowRight,
  Calendar,
  MapPin,
  Truck,
} from 'lucide-react';

interface Shipment {
  id: string;
  trackingNumber: string;
  whiteLabelTrackingCode?: string;
  whiteLabelCode?: string;
  carrierCode: string;
  recipientName: string;
  originCountry: string;
  destinationCountry: string;
  status: 'pending' | 'in_transit' | 'delivered' | 'cancelled' | 'exception';
  weight?: number;
  createdAt: string;
  currentLocation?: string;
  currentStatus?: string;
}

const countryCodeMap: Record<string, string> = {
  'India': 'IN', 'United States': 'US', 'USA': 'US', 'United Kingdom': 'GB', 'UK': 'GB',
  'Australia': 'AU', 'Canada': 'CA', 'Germany': 'DE', 'France': 'FR', 'UAE': 'AE',
  'Dubai': 'AE', 'Singapore': 'SG', 'Japan': 'JP', 'China': 'CN', 'Malaysia': 'MY',
  'Netherlands': 'NL', 'Italy': 'IT', 'Spain': 'ES', 'Saudi Arabia': 'SA', 'Qatar': 'QA',
  'New Zealand': 'NZ', 'Switzerland': 'CH', 'Ireland': 'IE', 'South Africa': 'ZA',
  'Bangladesh': 'BD', 'Pakistan': 'PK', 'Sri Lanka': 'LK', 'Nepal': 'NP', 'Thailand': 'TH',
  'Indonesia': 'ID', 'Philippines': 'PH', 'Vietnam': 'VN', 'Korea': 'KR', 'South Korea': 'KR',
};

function getCountryFlagUrl(code: string): string {
  return `https://flagcdn.com/w80/${code.toLowerCase()}.png`;
}

const statusConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
  pending: { label: 'Pending', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  in_transit: { label: 'In Transit', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
  delivered: { label: 'Delivered', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  cancelled: { label: 'Cancelled', color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200' },
  exception: { label: 'Exception', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
};

function getWhiteLabelCode(shipment: Shipment): string | null {
  return shipment.whiteLabelTrackingCode || shipment.whiteLabelCode || null;
}

function ShipmentCard({ shipment }: { shipment: Shipment }) {
  const config = statusConfig[shipment.status] || statusConfig.pending;
  const trackingId = getWhiteLabelCode(shipment);
  if (!trackingId) return null;
  const date = new Date(shipment.createdAt);
  const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const originFlag = getCountryFlagUrl(countryCodeMap[shipment.originCountry] || 'IN');
  const destFlag = getCountryFlagUrl(countryCodeMap[shipment.destinationCountry] || 'UN');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="group"
    >
      <Link href={`/shipments/${shipment.id}`}>
        <div className="relative bg-white rounded-2xl border border-slate-200/60 overflow-hidden hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
          <div className="p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`${config.bg} rounded-xl p-2.5`}>
                  {shipment.status === 'in_transit' && <Plane className={`w-5 h-5 ${config.color}`} />}
                  {shipment.status === 'delivered' && <CheckCircle className={`w-5 h-5 ${config.color}`} />}
                  {shipment.status === 'pending' && <Clock className={`w-5 h-5 ${config.color}`} />}
                  {shipment.status === 'cancelled' && <XCircle className={`w-5 h-5 ${config.color}`} />}
                  {shipment.status === 'exception' && <AlertTriangle className={`w-5 h-5 ${config.color}`} />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{trackingId}</span>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}>{config.label}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{shipment.recipientName}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/10 rounded-xl p-4 mb-4 border border-slate-100">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="relative">
                    <Image src={originFlag} alt={shipment.originCountry} width={48} height={32} className="rounded-lg shadow-md ring-2 ring-white" unoptimized />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">Origin</p>
                    <p className="text-sm font-semibold text-slate-700">{shipment.originCountry}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 px-4">
                  <div className="h-px w-12 bg-gradient-to-r from-transparent via-primary to-transparent" />
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-slate-600 rounded-full flex items-center justify-center shadow-lg shadow-primary/30">
                    <Plane className="w-5 h-5 text-white rotate-45" />
                  </div>
                  <div className="h-px w-12 bg-gradient-to-r from-transparent via-primary to-transparent" />
                </div>

                <div className="flex items-center gap-3 flex-1 justify-end">
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">Destination</p>
                    <p className="text-sm font-semibold text-slate-700">{shipment.destinationCountry}</p>
                  </div>
                  <div className="relative">
                    <Image src={destFlag} alt={shipment.destinationCountry} width={48} height={32} className="rounded-lg shadow-md ring-2 ring-white" unoptimized />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 text-center border border-slate-100">
                <Calendar className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                <p className="text-[10px] text-slate-400 mb-1">Created</p>
                <p className="text-sm font-semibold text-slate-700">{formattedDate}</p>
              </div>
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 text-center border border-slate-100">
                <MapPin className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                <p className="text-[10px] text-slate-400 mb-1">Current Location</p>
                <p className="text-sm font-semibold text-slate-700 truncate">{shipment.currentLocation || '--'}</p>
              </div>
            </div>

            {shipment.status === 'delivered' && (
              <div className="mt-4 pt-4 border-t border-emerald-100">
                <div className="bg-gradient-to-r from-emerald-50 to-slate-50 rounded-xl p-4 border border-emerald-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-emerald-700">Package Delivered!</p>
                      <p className="text-xs text-emerald-600/80">Successfully delivered to recipient</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {shipment.status === 'in_transit' && (
              <div className="mt-4 pt-4 border-t border-blue-100">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                      <Truck className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-blue-700">In Transit</p>
                      <p className="text-xs text-blue-600/80">Package is on its way</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {shipment.status === 'exception' && (
              <div className="mt-4 pt-4 border-t border-red-100">
                <div className="bg-gradient-to-r from-red-50 to-rose-50 rounded-xl p-4 border border-red-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-red-700">Exception Occurred</p>
                      <p className="text-xs text-red-600/80">Please contact support</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function ShipmentRow({ shipment }: { shipment: Shipment }) {
  const config = statusConfig[shipment.status] || statusConfig.pending;
  const trackingId = getWhiteLabelCode(shipment);
  if (!trackingId) return null;
  const date = new Date(shipment.createdAt);
  const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const originFlag = getCountryFlagUrl(countryCodeMap[shipment.originCountry] || 'IN');
  const destFlag = getCountryFlagUrl(countryCodeMap[shipment.destinationCountry] || 'UN');

  return (
    <Link href={`/shipments/${shipment.id}`}>
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ x: 2 }}
        className="group"
      >
        <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 hover:border-primary/30 hover:shadow-md transition-all">
          <div className={`w-12 h-12 rounded-xl ${config.bg} flex items-center justify-center shrink-0`}>
            {shipment.status === 'in_transit' && <Plane className={`w-5 h-5 ${config.color}`} />}
            {shipment.status === 'delivered' && <CheckCircle className={`w-5 h-5 ${config.color}`} />}
            {shipment.status === 'pending' && <Clock className={`w-5 h-5 ${config.color}`} />}
            {shipment.status === 'cancelled' && <XCircle className={`w-5 h-5 ${config.color}`} />}
            {shipment.status === 'exception' && <AlertTriangle className={`w-5 h-5 ${config.color}`} />}
          </div>

          <div className="shrink-0 min-w-[120px]">
            <span className="font-semibold text-slate-900 text-sm">{trackingId}</span>
            <p className="text-xs text-slate-400 truncate mt-0.5">{shipment.recipientName}</p>
          </div>

          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Image src={originFlag} alt={shipment.originCountry} width={24} height={16} className="rounded shrink-0" unoptimized />
            <span className="text-sm text-slate-600 truncate">{shipment.originCountry}</span>
            <Plane className="w-4 h-4 text-primary shrink-0 rotate-45" />
            <Image src={destFlag} alt={shipment.destinationCountry} width={24} height={16} className="rounded shrink-0" unoptimized />
            <span className="text-sm text-slate-600 truncate">{shipment.destinationCountry}</span>
          </div>

          <div className="text-sm text-slate-400 shrink-0 min-w-[70px]">{formattedDate}</div>

          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${config.bg} ${config.color} shrink-0`}>{config.label}</span>
        </div>
      </motion.div>
    </Link>
  );
}

function StatsCard({ stats }: { stats: { total: number; transit: number; delivered: number; pending: number } }) {
  const total = stats.total;
  const deliveredRate = total > 0 ? Math.round((stats.delivered / total) * 100) : 0;

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-primary via-blue-600 to-indigo-700 rounded-2xl p-5 text-white">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
      <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-10 -translate-x-10" />
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-blue-100 text-sm font-medium">Total Shipments</p>
            <p className="text-4xl font-bold mt-1">{stats.total}</p>
          </div>
          <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Package className="w-7 h-7" />
          </div>
        </div>
        <div className="flex items-center gap-2 text-blue-100 text-sm">
          <TrendingUp className="w-4 h-4" />
          <span>{deliveredRate}% delivery rate</span>
        </div>
      </div>
    </div>
  );
}

function StatusOverview({ stats }: { stats: { transit: number; delivered: number; pending: number } }) {
  const items = [
    { key: 'in_transit', label: 'In Transit', icon: Truck, color: 'blue' },
    { key: 'delivered', label: 'Delivered', icon: CheckCircle, color: 'emerald' },
    { key: 'pending', label: 'Pending', icon: Clock, color: 'amber' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <h3 className="text-sm font-semibold text-slate-800 mb-4">Status Overview</h3>
      <div className="space-y-3">
        {items.map(item => (
          <div key={item.key} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg bg-${item.color}-100 flex items-center justify-center`}>
                <item.icon className={`w-5 h-5 text-${item.color}-600`} />
              </div>
              <span className="text-sm font-medium text-slate-700">{item.label}</span>
            </div>
            <span className={`text-xl font-bold text-${item.color}-700`}>{stats[item.key as keyof typeof stats]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Sidebar({ stats }: { stats: { total: number; transit: number; delivered: number; pending: number } }) {
  const deliveredRate = stats.total > 0 ? Math.round((stats.delivered / stats.total) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 text-white shadow-lg">
        <div className="mb-4">
          <h3 className="font-semibold text-lg">Track Package</h3>
          <p className="text-slate-400 text-sm mt-1">Get real-time updates on your shipments</p>
        </div>
        <Link
          href="/track"
          className="w-full py-3 bg-white text-slate-900 rounded-xl font-medium hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
        >
          <Search className="w-5 h-5" />
          Track Now
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider">Total Shipments</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{stats.total}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Package className="w-6 h-6 text-primary" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h3 className="text-sm font-semibold text-slate-800 mb-4">Status Overview</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Truck className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-slate-700">In Transit</span>
            </div>
            <span className="text-xl font-bold text-blue-700">{stats.transit}</span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="text-sm font-medium text-slate-700">Delivered</span>
            </div>
            <span className="text-xl font-bold text-emerald-700">{stats.delivered}</span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <span className="text-sm font-medium text-slate-700">Pending</span>
            </div>
            <span className="text-xl font-bold text-amber-700">{stats.pending}</span>
          </div>
        </div>
      </div>

      
    </div>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 px-4"
    >
      <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mb-6 shadow-xl">
        <Package className="w-12 h-12 text-primary" />
      </div>
      <h2 className="text-xl font-semibold text-slate-900 mb-2">No shipments yet</h2>
      <p className="text-slate-500 text-center mb-6 max-w-md">Create your first shipment to start tracking your packages</p>
      <Link
        href="/quote"
        className="px-6 py-3 bg-gradient-to-r from-primary to-indigo-600 text-white font-medium rounded-xl hover:from-slate-600 hover:to-indigo-700 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
      >
        <Plus className="w-5 h-5" />
        Create Shipment
      </Link>
    </motion.div>
  );
}

function ShipmentsPageContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [filteredShipments, setFilteredShipments] = useState<Shipment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) localStorage.setItem('gt_access_token', token);
  }, [searchParams]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;
      try {
        setIsLoading(true);
        const res = await api.get<Shipment[]>('/shipments/my-shipments');
        setShipments(res);
        setFilteredShipments(res);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user?.id]);

  useEffect(() => {
    let filtered = shipments;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(s => {
        const code = getWhiteLabelCode(s);
        return code?.toLowerCase().includes(q) || s.recipientName.toLowerCase().includes(q);
      });
    }
    if (statusFilter !== 'all') filtered = filtered.filter(s => s.status === statusFilter);
    setFilteredShipments(filtered);
    setCurrentPage(1);
  }, [searchQuery, statusFilter, shipments]);

  const totalPages = Math.ceil(filteredShipments.length / itemsPerPage);
  const paginatedShipments = filteredShipments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const stats = {
    total: shipments.length,
    transit: shipments.filter(s => s.status === 'in_transit').length,
    delivered: shipments.filter(s => s.status === 'delivered').length,
    pending: shipments.filter(s => s.status === 'pending').length,
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-slate-50">
          <Navbar />
          <div className="max-w-6xl mx-auto px-4 pt-24 pb-8">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3">
                <div className="h-8 w-40 bg-slate-200 rounded animate-pulse mb-6" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-64 bg-slate-200 rounded-2xl animate-pulse" />
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <div className="h-48 bg-slate-200 rounded-2xl animate-pulse" />
                <div className="h-56 bg-slate-200 rounded-2xl animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/10">
        <Navbar />

        <main className="max-w-6xl mx-auto px-4 pt-24 pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-semibold text-slate-900">My Shipments</h1>
                  <p className="text-slate-500 mt-1">Track and manage all your shipments</p>
                </div>
                <Link
                  href="/quote"
                  className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-slate-700 transition-all shadow-lg shadow-primary/20"
                >
                  <Plus className="w-5 h-5" />
                  New Shipment
                </Link>
              </div>

              {shipments.length > 0 ? (
                <>
                  <div className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search by tracking number or recipient..."
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          className="w-full pl-11 pr-4 py-3 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      </div>
                      <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="px-4 py-3 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="in_transit">In Transit</option>
                        <option value="delivered">Delivered</option>
                      </select>
                      <div className="flex items-center bg-slate-100 rounded-xl p-1">
                        <button
                          onClick={() => setViewMode('grid')}
                          className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-primary' : 'text-slate-400'}`}
                        >
                          <Grid3X3 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setViewMode('list')}
                          className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-primary' : 'text-slate-400'}`}
                        >
                          <List className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <AnimatePresence mode="wait">
                    {paginatedShipments.length > 0 ? (
                      viewMode === 'grid' ? (
                        <motion.div
                          key="grid"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="grid grid-cols-1 md:grid-cols-2 gap-4"
                        >
                          {paginatedShipments.map(shipment => (
                            <ShipmentCard key={shipment.id} shipment={shipment} />
                          ))}
                        </motion.div>
                      ) : (
                        <motion.div
                          key="list"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="space-y-2"
                        >
                          {paginatedShipments.map(shipment => (
                            <ShipmentRow key={shipment.id} shipment={shipment} />
                          ))}
                        </motion.div>
                      )
                    ) : (
                      <div className="text-center py-12 text-slate-500">No results found</div>
                    )}
                  </AnimatePresence>

                  <div className="flex items-center justify-between pt-4 bg-white rounded-xl p-4 border border-slate-200/80">
                    <div className="text-sm text-slate-500">
                      {filteredShipments.length > 0 ? (
                        <>
                          Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredShipments.length)} of {filteredShipments.length}
                        </>
                      ) : (
                        <>No items</>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1 || totalPages === 0}
                        className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      {Array.from({ length: Math.max(1, totalPages) }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          disabled={totalPages === 0}
                          className={`w-8 h-8 rounded-lg text-sm ${currentPage === page && totalPages > 0 ? 'bg-primary text-white' : 'border border-slate-200 hover:bg-slate-50 disabled:opacity-50'}`}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages || totalPages === 0}
                        className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <EmptyState />
              )}
            </div>

            <div className="space-y-4">
              <Sidebar stats={stats} />
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}

export default function ShipmentsPage() {
  return (
    <Suspense>
      <ShipmentsPageContent />
    </Suspense>
  );
}
