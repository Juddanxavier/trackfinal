'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ProtectedLayout } from '@/components/ProtectedLayout';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { 
  Package, 
  MapPin, 
  Clock, 
  Search, 
  Filter, 
  ChevronRight, 
  Truck, 
  CheckCircle2, 
  AlertCircle,
  Plus,
  LayoutGrid,
  List,
  X,
  ArrowRight,
  Copy,
  User,
  Mail,
  Phone
} from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

interface ShipmentEvent {
  id: string;
  status: string;
  statusRaw?: string;
  description?: string;
  location?: string;
  eventTime: string;
  createdAt: string;
}

interface Track17Data {
  origin_country?: string;
  destination_country?: string;
  tracking?: {
    checkpoints?: Array<{
      checkpoint_time?: string;
      location?: string;
      status?: string;
      message?: string;
    }>;
  };
}

interface Shipment {
  id: string;
  organisationId: string;
  userId?: string;
  assignedToId?: string;
  trackingNumber: string;
  whiteLabelTrackingCode?: string;
  carrierCode: string;
  recipientName: string;
  recipientEmail?: string;
  recipientPhone?: string;
  recipientAddress?: string;
  originCountry: string;
  destinationCountry: string;
  status: 'pending' | 'in_transit' | 'delivered' | 'cancelled' | 'exception';
  goodsType?: string;
  weight?: number;
  track17Data?: Track17Data;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
  events?: ShipmentEvent[];
}

function ShipmentDetailModal({ shipment, onClose }: { shipment: Shipment; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'timeline' | 'details'>('timeline');
  const [copied, setCopied] = useState(false);

  const copyTracking = () => {
    navigator.clipboard.writeText(shipment.whiteLabelTrackingCode || shipment.trackingNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Get tracking history from events or track17Data
  const getTrackingHistory = () => {
    if (shipment.events && shipment.events.length > 0) {
      return shipment.events.map(event => ({
        date: new Date(event.eventTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        time: new Date(event.eventTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        location: event.location || 'Unknown',
        status: event.status,
        description: event.description || event.statusRaw || 'Status update',
        completed: true,
      }));
    }
    
    if (shipment.track17Data?.tracking?.checkpoints) {
      return shipment.track17Data.tracking.checkpoints.map(cp => ({
        date: cp.checkpoint_time ? new Date(cp.checkpoint_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A',
        time: cp.checkpoint_time ? new Date(cp.checkpoint_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '',
        location: cp.location || 'Unknown',
        status: cp.status || 'Update',
        description: cp.message || 'Tracking update',
        completed: true,
      }));
    }
    
    return [];
  };

  const trackingHistory = getTrackingHistory();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-3xl max-h-[90vh] overflow-hidden bg-white border border-gray-200 rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Shipment Details</h2>
            <div className="flex items-center gap-2 mt-1">
              {shipment.whiteLabelTrackingCode ? (
                <span className="text-primary font-medium">{shipment.whiteLabelTrackingCode}</span>
              ) : (
                <span className="text-gray-500">{shipment.trackingNumber}</span>
              )}
              <button
                onClick={copyTracking}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                title="Copy tracking number"
              >
                <Copy className="size-4 text-gray-400" />
              </button>
              {copied && <span className="text-xs text-emerald-600">Copied!</span>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="size-6 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('timeline')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'timeline' 
                ? 'text-primary border-b-2 border-primary' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Tracking Timeline
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'details' 
                ? 'text-primary border-b-2 border-primary' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Package Details
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <AnimatePresence mode="wait">
            {activeTab === 'timeline' ? (
              <motion.div
                key="timeline"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-0"
              >
                {trackingHistory.length > 0 ? (
                  trackingHistory.map((event, index) => (
                    <div key={index} className="relative pl-8 pb-8 last:pb-0">
                      {index < trackingHistory.length - 1 && (
                        <div className="absolute left-3 top-6 bottom-0 w-px bg-gray-200" />
                      )}
                      <div className={`absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center bg-emerald-100 border border-emerald-300`}>
                        <CheckCircle2 className="size-3 text-emerald-600" />
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div>
                          <h4 className="font-semibold text-gray-900">{event.status}</h4>
                          <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                          <p className="text-sm text-gray-400 mt-1">{event.location}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">{event.date}</p>
                          <p className="text-sm text-gray-400">{event.time}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Truck className="size-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No tracking events available yet.</p>
                    <p className="text-sm text-gray-400 mt-1">Tracking information will appear once the shipment is picked up.</p>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Route */}
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Route</h3>
                  <div className="flex items-center gap-4">
                    <div className="text-center flex-1">
                      <p className="text-lg font-semibold text-gray-900">{shipment.originCountry}</p>
                      <p className="text-xs text-gray-500">Origin</p>
                    </div>
                    <div className="flex-[2] flex items-center gap-2">
                      <div className="flex-1 h-px bg-gray-300" />
                      <ArrowRight className="size-4 text-gray-400" />
                      <div className="flex-1 h-px bg-gray-300" />
                    </div>
                    <div className="text-center flex-1">
                      <p className="text-lg font-semibold text-gray-900">{shipment.destinationCountry}</p>
                      <p className="text-xs text-gray-500">Destination</p>
                    </div>
                  </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {shipment.whiteLabelTrackingCode && (
                    <div className="p-4 bg-primary/10 rounded-xl border border-primary/30 col-span-2">
                      <p className="text-xs text-primary/70 uppercase tracking-wider">Tracking ID</p>
                      <p className="text-gray-900 font-bold text-lg mt-1">{shipment.whiteLabelTrackingCode}</p>
                    </div>
                  )}
                  {shipment.weight && (
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Weight</p>
                      <p className="text-gray-900 font-medium mt-1">{shipment.weight} kg</p>
                    </div>
                  )}
                  {shipment.goodsType && (
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Goods Type</p>
                      <p className="text-gray-900 font-medium mt-1">{shipment.goodsType}</p>
                    </div>
                  )}
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Created</p>
                    <p className="text-gray-900 font-medium mt-1">
                      {new Date(shipment.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  {shipment.deliveredAt && (
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Delivered</p>
                      <p className="text-gray-900 font-medium mt-1">
                        {new Date(shipment.deliveredAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  )}
                </div>

                {/* Recipient */}
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Recipient Information</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="size-4 text-gray-400" />
                      <p className="text-gray-900 font-medium">{shipment.recipientName}</p>
                    </div>
                    {shipment.recipientEmail && (
                      <div className="flex items-center gap-2">
                        <Mail className="size-4 text-gray-400" />
                        <p className="text-gray-600">{shipment.recipientEmail}</p>
                      </div>
                    )}
                    {shipment.recipientPhone && (
                      <div className="flex items-center gap-2">
                        <Phone className="size-4 text-gray-400" />
                        <p className="text-gray-600">{shipment.recipientPhone}</p>
                      </div>
                    )}
                    {shipment.recipientAddress && (
                      <div className="flex items-start gap-2">
                        <MapPin className="size-4 text-gray-400 mt-0.5" />
                        <p className="text-gray-600">{shipment.recipientAddress}</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function MyShipmentsPage() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [filteredShipments, setFilteredShipments] = useState<Shipment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      localStorage.setItem('accessToken', token);
    }
  }, [searchParams]);

  // Fetch shipments from API
  useEffect(() => {
    const fetchShipments = async () => {
      if (!user?.id) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch shipments for the current customer
        // Using the customer-specific endpoint
        const response = await api.get<Shipment[]>(`/shipments/my-shipments`);
        
        setShipments(response);
        setFilteredShipments(response);
      } catch (err: any) {
        console.error('Error fetching shipments:', err);
        if (err.status === 403) {
          setError('You do not have permission to view shipments. Please contact support.');
        } else {
          setError('Failed to load shipments. Please try again later.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchShipments();
  }, [user?.id]);

  useEffect(() => {
    let filtered = shipments;
    if (searchQuery) {
      filtered = filtered.filter(s => 
        s.whiteLabelTrackingCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.trackingNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.destinationCountry?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.originCountry?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.recipientName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(s => s.status === statusFilter);
    }
    setFilteredShipments(filtered);
  }, [searchQuery, statusFilter, shipments]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle2 className="size-5 text-emerald-600" />;
      case 'in_transit': return <Truck className="size-5 text-blue-600" />;
      case 'pending': return <Clock className="size-5 text-amber-600" />;
      case 'cancelled': return <X className="size-5 text-gray-500" />;
      case 'exception': return <AlertCircle className="size-5 text-red-600" />;
      default: return <Package className="size-5 text-gray-500" />;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'in_transit': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'cancelled': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'exception': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusBgClass = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-emerald-50';
      case 'in_transit': return 'bg-blue-50';
      case 'pending': return 'bg-amber-50';
      case 'cancelled': return 'bg-gray-50';
      case 'exception': return 'bg-red-50';
      default: return 'bg-gray-50';
    }
  };

  const formatStatus = (status: string) => {
    if (!status) return 'Unknown';
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  // Calculate stats
  const stats = {
    total: shipments.length,
    inTransit: shipments.filter(s => s.status === 'in_transit').length,
    delivered: shipments.filter(s => s.status === 'delivered').length,
    pending: shipments.filter(s => s.status === 'pending').length,
    cancelled: shipments.filter(s => s.status === 'cancelled').length,
    exception: shipments.filter(s => s.status === 'exception').length,
  };

  if (isLoading) {
    return (
      <ProtectedLayout
        title="My Shipments"
        subtitle="Track and manage all your shipments in one place"
        action={{ label: 'Get a Quote', href: '/quote', icon: <Plus className="size-5" /> }}
      >
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="size-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </ProtectedLayout>
    );
  }

  if (error) {
    return (
      <ProtectedLayout
        title="My Shipments"
        subtitle="Track and manage all your shipments in one place"
        action={{ label: 'Get a Quote', href: '/quote', icon: <Plus className="size-5" /> }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl">
            <AlertCircle className="size-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Shipments</h3>
            <p className="text-gray-500 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-[#4C833E] text-white font-semibold rounded-xl transition-all duration-200"
            >
              Try Again
            </button>
          </div>
        </div>
      </ProtectedLayout>
    );
  }

  return (
    <>
      <ProtectedLayout
        title="My Shipments"
        subtitle="Track and manage all your shipments in one place"
        action={{ label: 'Get a Quote', href: '/quote', icon: <Plus className="size-5" /> }}
      >
        {/* Stats */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: 'Total', value: stats.total, color: 'text-gray-900' },
              { label: 'In Transit', value: stats.inTransit, color: 'text-blue-600' },
              { label: 'Delivered', value: stats.delivered, color: 'text-emerald-600' },
              { label: 'Pending', value: stats.pending, color: 'text-amber-600' },
              { label: 'Cancelled', value: stats.cancelled, color: 'text-gray-500' },
              { label: 'Exceptions', value: stats.exception, color: 'text-red-600' },
            ].map((stat, idx) => (
              <button
                key={idx}
                onClick={() => setStatusFilter(stat.label.toLowerCase().replace(' ', '_'))}
                className={`p-4 bg-white border border-gray-200 rounded-xl text-left hover:border-primary/40 hover:shadow-sm transition-all ${
                  statusFilter === stat.label.toLowerCase().replace(' ', '_') ? 'border-primary bg-primary/5' : ''
                }`}
              >
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Search and Filter */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by tracking number, destination, carrier..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-12 pr-10 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer min-w-[180px]"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="in_transit">In Transit</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="exception">Exception</option>
                </select>
              </div>
              <div className="flex bg-white border border-gray-200 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                  aria-label="List view"
                >
                  <List className="size-4" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                  aria-label="Grid view"
                >
                  <LayoutGrid className="size-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Shipments List */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          {filteredShipments.length === 0 ? (
            <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl">
              <Package className="size-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {shipments.length === 0 ? 'No shipments yet' : 'No shipments found'}
              </h3>
              <p className="text-gray-500 mb-6">
                {shipments.length === 0 
                  ? 'You haven\'t created any shipments yet. Get a quote to start shipping!'
                  : 'Try adjusting your search or filters'}
              </p>
              <Link
                href="/quote"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-[#4C833E] text-white font-semibold rounded-xl transition-all duration-200"
              >
                {shipments.length === 0 ? 'Get Your First Quote' : 'Get a Quote'}
                <ChevronRight className="size-5" />
              </Link>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
              {filteredShipments.map((shipment) => (
                <motion.div
                  key={shipment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div 
                    className="p-6 bg-white border border-gray-200 rounded-2xl hover:border-primary/40 hover:shadow-md transition-all cursor-pointer group"
                    onClick={() => setSelectedShipment(shipment)}
                  >
                    {viewMode === 'list' ? (
                      // List View
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className={`size-12 rounded-xl flex items-center justify-center ${getStatusBgClass(shipment.status)}`}>
                            {getStatusIcon(shipment.status)}
                          </div>
                          <div>
                            <div className="flex items-center gap-3">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {shipment.whiteLabelTrackingCode || shipment.trackingNumber}
                              </h3>
                              <Badge className={`${getStatusClass(shipment.status)} border`}>
                                {formatStatus(shipment.status)}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                              <MapPin className="size-4" />
                              <span>{shipment.originCountry}</span>
                              <ArrowRight className="size-3" />
                              <span>{shipment.destinationCountry}</span>
                            </div>
                    {shipment.whiteLabelTrackingCode && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-400">White Label ID:</span>
                        <span className="text-xs font-medium text-primary">{shipment.whiteLabelTrackingCode}</span>
                      </div>
                    )}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-6 lg:gap-8">
                          <div className="text-center">
                            <p className="text-xs text-gray-400 uppercase tracking-wider">Created</p>
                            <p className="text-sm font-medium text-gray-900">
                              {new Date(shipment.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </p>
                          </div>
                          {shipment.weight && (
                            <div className="text-center">
                              <p className="text-xs text-gray-400 uppercase tracking-wider">Weight</p>
                              <p className="text-sm font-medium text-gray-900">{shipment.weight} kg</p>
                            </div>
                          )}
                          <div className="text-center">
                            <p className="text-xs text-gray-400 uppercase tracking-wider">Recipient</p>
                            <p className="text-sm font-medium text-gray-900 truncate max-w-[120px]">{shipment.recipientName}</p>
                          </div>
                          <div className="hidden lg:flex">
                            <ChevronRight className="size-5 text-gray-400 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Grid View
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div className={`size-10 rounded-lg flex items-center justify-center ${getStatusBgClass(shipment.status)}`}>
                            {getStatusIcon(shipment.status)}
                          </div>
                          <Badge className={`${getStatusClass(shipment.status)} border`}>
                            {formatStatus(shipment.status)}
                          </Badge>
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-gray-900">
                            {shipment.whiteLabelTrackingCode || shipment.trackingNumber}
                          </h3>
                          <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                            <MapPin className="size-3" />
                            <span className="truncate">{shipment.originCountry}</span>
                            <ArrowRight className="size-3" />
                            <span className="truncate">{shipment.destinationCountry}</span>
                          </div>
                          {shipment.whiteLabelTrackingCode && (
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs text-gray-400">ID:</span>
                              <span className="text-xs font-medium text-primary">{shipment.whiteLabelTrackingCode}</span>
                            </div>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-xs text-gray-400 uppercase tracking-wider">Created</p>
                            <p className="font-medium text-gray-900">
                              {new Date(shipment.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </p>
                          </div>
                          {shipment.weight && (
                            <div>
                              <p className="text-xs text-gray-400 uppercase tracking-wider">Weight</p>
                              <p className="font-medium text-gray-900">{shipment.weight} kg</p>
                            </div>
                          )}
                          <div className={shipment.weight ? '' : 'col-span-2'}>
                            <p className="text-xs text-gray-400 uppercase tracking-wider">Recipient</p>
                            <p className="font-medium text-gray-900 truncate">{shipment.recipientName}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </ProtectedLayout>

      {/* Shipment Detail Modal */}
      <AnimatePresence>
        {selectedShipment && (
          <ShipmentDetailModal 
            shipment={selectedShipment} 
            onClose={() => setSelectedShipment(null)} 
          />
        )}
      </AnimatePresence>
    </>
  );
}
