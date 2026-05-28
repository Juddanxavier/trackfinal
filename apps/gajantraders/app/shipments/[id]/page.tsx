'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/protected-route';
import Navbar from '@/components/Navbar';
import {
  ArrowLeft,
  Plane,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Copy,
  User,
  MapPin,
  Phone,
  Mail,
  Package,
  Calendar,
  Truck,
  ExternalLink,
  BadgeCheck,
  Route,
  Search,
  Weight,
  Hash,
  Globe,
  Building2,
  Headphones,
  Share2,
  ChevronRight,
} from 'lucide-react';

interface ShipmentEvent {
  id: string;
  status: string;
  description: string;
  location?: string;
  timestamp: string;
}

interface Shipment {
  id: string;
  trackingNumber: string;
  whiteLabelTrackingCode?: string;
  whiteLabelCode?: string;
  carrierCode: string;
  recipientName: string;
  recipientEmail?: string;
  recipientPhone?: string;
  recipientAddress?: string;
  originCountry: string;
  destinationCountry: string;
  originCity?: string;
  destinationCity?: string;
  status: 'pending' | 'in_transit' | 'delivered' | 'cancelled' | 'exception';
  goodsType?: string;
  weight?: number;
  createdAt: string;
  updatedAt?: string;
  deliveredAt?: string;
  events?: ShipmentEvent[];
}

const countryCodeMap: Record<string, string> = {
  'India': 'IN', 'United States': 'US', 'USA': 'US', 'United Kingdom': 'GB', 'UK': 'GB',
  'Australia': 'AU', 'Canada': 'CA', 'Germany': 'DE', 'France': 'FR', 'UAE': 'AE',
  'Dubai': 'AE', 'Singapore': 'SG', 'Japan': 'JP', 'China': 'CN', 'Malaysia': 'MY',
};

function getCountryCode(country: string): string {
  return countryCodeMap[country] || country.slice(0, 2).toUpperCase();
}

const statusConfig: Record<string, { label: string; color: string; bg: string; border: string; dot: string }> = {
  pending: { label: 'Pending', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-500' },
  in_transit: { label: 'In Transit', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', dot: 'bg-blue-500' },
  delivered: { label: 'Delivered', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  cancelled: { label: 'Cancelled', color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200', dot: 'bg-slate-400' },
  exception: { label: 'Exception', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', dot: 'bg-red-500' },
};

function Skeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-3 space-y-4">
        <div className="h-52 bg-white/70 rounded-2xl border border-slate-200/60 animate-pulse" />
        <div className="h-72 bg-white/70 rounded-2xl border border-slate-200/60 animate-pulse" />
      </div>
      <div className="space-y-4">
        <div className="h-44 bg-white/70 rounded-2xl border border-slate-200/60 animate-pulse" />
        <div className="h-52 bg-white/70 rounded-2xl border border-slate-200/60 animate-pulse" />
        <div className="h-48 bg-white/70 rounded-2xl border border-slate-200/60 animate-pulse" />
      </div>
    </div>
  );
}

function RouteVisual({ origin, destination, originCity, destinationCity }: { origin: string; destination: string; originCity?: string; destinationCity?: string }) {
  const originCode = getCountryCode(origin);
  const destCode = getCountryCode(destination);

  return (
    <div className="relative">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 text-center">
          <div className="relative inline-block">
            <Image
              src={`https://flagcdn.com/w160/${originCode.toLowerCase()}.png`}
              alt={origin}
              width={72}
              height={48}
              className="rounded-xl shadow-md ring-4 ring-white mx-auto"
              unoptimized
            />
          </div>
          <p className="font-semibold text-slate-900 mt-2 text-sm">{origin}</p>
          {originCity && <p className="text-xs text-slate-400">{originCity}</p>}
        </div>

        <div className="flex flex-col items-center px-2">
          <div className="flex items-center gap-2">
            <div className="h-px w-12 bg-gradient-to-r from-slate-300 via-primary/50 to-slate-300" />
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-blue-500 rounded-full flex items-center justify-center shadow-lg shadow-primary/30 shrink-0">
              <Plane className="w-5 h-5 text-white rotate-45" />
            </div>
            <div className="h-px w-12 bg-gradient-to-r from-slate-300 via-primary/50 to-slate-300" />
          </div>
          <span className="text-[10px] text-slate-400 mt-1.5 uppercase tracking-wider font-medium">Route</span>
        </div>

        <div className="flex-1 text-center">
          <div className="relative inline-block">
            <Image
              src={`https://flagcdn.com/w160/${destCode.toLowerCase()}.png`}
              alt={destination}
              width={72}
              height={48}
              className="rounded-xl shadow-md ring-4 ring-white mx-auto"
              unoptimized
            />
          </div>
          <p className="font-semibold text-slate-900 mt-2 text-sm">{destination}</p>
          {destinationCity && <p className="text-xs text-slate-400">{destinationCity}</p>}
        </div>
      </div>
    </div>
  );
}

function LatestUpdate({ event }: { event: ShipmentEvent }) {
  const date = new Date(event.timestamp);
  const formattedDate = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  const formattedTime = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="bg-gradient-to-br from-blue-50 via-blue-50/50 to-indigo-50/50 rounded-xl border border-blue-100/80 p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
          <MapPin className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-blue-700">{event.status}</p>
            <span className="text-[11px] text-blue-400 bg-blue-100/60 px-2 py-0.5 rounded-full">{formattedDate} at {formattedTime}</span>
          </div>
          <p className="text-sm text-blue-600/80 mt-1">{event.description}</p>
          {event.location && (
            <p className="text-xs text-blue-500 mt-1 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {event.location}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function TrackingTimeline({ events }: { events: ShipmentEvent[] }) {
  return (
    <div className="relative">
      <div className="absolute left-[19px] top-3 bottom-3 w-0.5 bg-gradient-to-b from-primary via-blue-300 to-slate-200/60" />
      <div className="space-y-0">
        {events.map((event, index) => {
          const date = new Date(event.timestamp);
          const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          const formattedTime = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
          const isLatest = index === 0;

          return (
            <motion.div
              key={event.id || index}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06, ease: 'easeOut' }}
              className="relative flex items-start gap-4 pb-6 last:pb-0"
            >
              <div className={`relative z-10 w-[39px] shrink-0 flex justify-center`}>
                <div className={`w-[39px] h-[39px] rounded-full flex items-center justify-center transition-all duration-300 ${
                  isLatest
                    ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-110'
                    : 'bg-white border-2 border-slate-200 text-slate-400'
                }`}>
                  {isLatest ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-current" />
                  )}
                </div>
              </div>
              <div className="flex-1 min-w-0 pt-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className={`text-sm font-semibold ${isLatest ? 'text-slate-900' : 'text-slate-700'}`}>{event.status}</p>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                    isLatest ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-400'
                  }`}>{formattedDate}</span>
                </div>
                <p className="text-sm text-slate-500 mt-0.5">{event.description}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  {event.location && (
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {event.location}
                    </span>
                  )}
                  <span className="text-xs text-slate-400">{formattedTime}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function ShipmentDetailPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) localStorage.setItem('gt_access_token', token);
  }, [searchParams]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id && !searchParams.get('token')) return;
      if (!params.id) return;
      try {
        setIsLoading(true);
        const res = await api.get<Shipment>(`/shipments/${params.id}`);
        setShipment(res);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user?.id, params.id, searchParams]);

  const copyTracking = () => {
    const trackingId = shipment?.whiteLabelTrackingCode || shipment?.whiteLabelCode || shipment?.trackingNumber || '';
    if (trackingId) {
      navigator.clipboard.writeText(trackingId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/10">
          <Navbar />
          <div className="max-w-6xl mx-auto px-4 pt-24 pb-8">
            <Skeleton />
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!shipment) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/10">
          <Navbar />
          <main className="max-w-6xl mx-auto px-4 pt-24 pb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20"
            >
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mx-auto mb-6 shadow-xl">
                <Package className="w-12 h-12 text-slate-400" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 mb-2">Shipment not found</h2>
              <p className="text-slate-500 mb-8 max-w-md mx-auto">The shipment you're looking for doesn't exist or has been removed.</p>
              <Link
                href="/shipments"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
              >
                <ArrowLeft className="w-4 h-4" />Back to Shipments
              </Link>
            </motion.div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  const config = statusConfig[shipment.status] || statusConfig.pending;
  const trackingId = shipment.whiteLabelTrackingCode || shipment.whiteLabelCode || shipment.trackingNumber;
  const createdDate = new Date(shipment.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const latestEvent = shipment.events?.[0];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/10">
        <Navbar />

        <main className="max-w-6xl mx-auto px-4 pt-24 pb-8">
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-4"
          >
            <Link
              href="/shipments"
              className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-primary transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to Shipments</span>
            </Link>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3 space-y-5">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm"
              >
                <div className={`${config.bg} px-5 py-3 border-b ${config.border} flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
                    {shipment.status === 'pending' && <Clock className={`w-4 h-4 ${config.color}`} />}
                    {shipment.status === 'in_transit' && <Truck className={`w-4 h-4 ${config.color}`} />}
                    {shipment.status === 'delivered' && <BadgeCheck className={`w-4 h-4 ${config.color}`} />}
                    {shipment.status === 'cancelled' && <XCircle className={`w-4 h-4 ${config.color}`} />}
                    {shipment.status === 'exception' && <AlertTriangle className={`w-4 h-4 ${config.color}`} />}
                    <span className={`text-sm font-semibold ${config.color}`}>{config.label}</span>
                  </div>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${config.bg} ${config.color} border ${config.border}`}>
                    #{shipment.id.slice(0, 8).toUpperCase()}
                  </span>
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between mb-5">
                    <div>
                      <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Hash className="w-5 h-5 text-slate-300" />
                        {trackingId}
                      </h1>
                      <p className="text-sm text-slate-400 mt-1 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        Created {createdDate}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
                        config.bg} ${config.color} border ${config.border}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                        {config.label}
                      </span>
                      <button
                        onClick={copyTracking}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-medium text-slate-600 transition-all active:scale-95"
                      >
                        <Copy className="w-4 h-4" />
                        {copied ? 'Copied!' : 'Copy ID'}
                      </button>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/10 rounded-xl p-5 border border-slate-100/80">
                    <RouteVisual
                      origin={shipment.originCountry}
                      destination={shipment.destinationCountry}
                      originCity={shipment.originCity}
                      destinationCity={shipment.destinationCity}
                    />
                  </div>

                  {latestEvent && (
                    <div className="mt-4">
                      <LatestUpdate event={latestEvent} />
                    </div>
                  )}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm"
              >
                <div className="px-5 py-4 border-b border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <Route className="w-4 h-4 text-primary" />
                    Tracking History
                    {shipment.events && (
                      <span className="text-xs font-normal text-slate-400 ml-1">({shipment.events.length} updates)</span>
                    )}
                  </h3>
                </div>
                <div className="p-5">
                  {(!shipment.events || shipment.events.length === 0) ? (
                    <div className="text-center py-14">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mx-auto mb-3 shadow-sm">
                        <Clock className="w-8 h-8 text-slate-400" />
                      </div>
                      <p className="text-slate-500 text-sm font-medium">No tracking updates yet</p>
                      <p className="text-slate-400 text-xs mt-1">Updates will appear here once the shipment starts moving</p>
                    </div>
                  ) : (
                    <TrackingTimeline events={shipment.events} />
                  )}
                </div>
              </motion.div>
            </div>

            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <div className={`rounded-2xl p-5 text-white shadow-lg overflow-hidden relative ${
                  shipment.status === 'delivered' ? 'bg-gradient-to-br from-emerald-600 to-emerald-800' :
                  shipment.status === 'in_transit' ? 'bg-gradient-to-br from-primary to-blue-800' :
                  shipment.status === 'exception' ? 'bg-gradient-to-br from-red-600 to-red-800' :
                  shipment.status === 'cancelled' ? 'bg-gradient-to-br from-slate-600 to-slate-800' :
                  'bg-gradient-to-br from-amber-600 to-amber-800'
                }`}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
                  <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-10 -translate-x-10" />
                  <div className="relative">
                    <div className="flex items-center gap-2 mb-2">
                      {shipment.status === 'pending' && <Clock className="w-5 h-5 text-amber-200" />}
                      {shipment.status === 'in_transit' && <Truck className="w-5 h-5 text-blue-200" />}
                      {shipment.status === 'delivered' && <BadgeCheck className="w-5 h-5 text-emerald-200" />}
                      {shipment.status === 'cancelled' && <XCircle className="w-5 h-5 text-slate-300" />}
                      {shipment.status === 'exception' && <AlertTriangle className="w-5 h-5 text-red-200" />}
                      <span className="text-sm font-medium text-white/80">{config.label}</span>
                    </div>
                    <p className="text-2xl font-bold tracking-tight">{trackingId}</p>
                    <p className="text-xs text-white/60 mt-1">{shipment.originCountry} → {shipment.destinationCountry}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm"
              >
                <div className="px-5 py-3.5 border-b border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <Package className="w-4 h-4 text-primary" />
                    Shipment Info
                  </h3>
                </div>
                <div className="divide-y divide-slate-100">
                  <div className="px-5 py-3.5 flex items-center justify-between">
                    <span className="text-xs text-slate-400">Weight</span>
                    <span className="text-sm font-semibold text-slate-900">{shipment.weight ? `${shipment.weight} kg` : '—'}</span>
                  </div>
                  <div className="px-5 py-3.5 flex items-center justify-between">
                    <span className="text-xs text-slate-400">Goods Type</span>
                    <span className="text-sm font-semibold text-slate-900">{shipment.goodsType || '—'}</span>
                  </div>
                  <div className="px-5 py-3.5 flex items-center justify-between">
                    <span className="text-xs text-slate-400">Carrier</span>
                    <span className="text-sm font-semibold text-slate-900">{shipment.carrierCode || '—'}</span>
                  </div>
                  <div className="px-5 py-3.5 flex items-center justify-between">
                    <span className="text-xs text-slate-400">Created</span>
                    <span className="text-sm font-semibold text-slate-900">{createdDate}</span>
                  </div>
                  {shipment.deliveredAt && (
                    <div className="px-5 py-3.5 flex items-center justify-between bg-emerald-50/50">
                      <span className="text-xs text-emerald-600 font-medium flex items-center gap-1.5">
                        <BadgeCheck className="w-3.5 h-3.5" />
                        Delivered
                      </span>
                      <span className="text-sm font-semibold text-emerald-700">
                        {new Date(shipment.deliveredAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm"
              >
                <div className="px-5 py-3.5 border-b border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    Recipient
                  </h3>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-3.5 mb-4 pb-4 border-b border-slate-100">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center shrink-0 ring-2 ring-primary/10">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 text-sm truncate">{shipment.recipientName}</p>
                      {shipment.recipientEmail && (
                        <p className="text-xs text-slate-400 truncate mt-0.5">{shipment.recipientEmail}</p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    {shipment.recipientPhone && (
                      <a href={`tel:${shipment.recipientPhone}`} className="flex items-center gap-3 text-sm text-slate-600 hover:text-primary transition-colors group">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                          <Phone className="w-4 h-4 text-slate-400 group-hover:text-primary" />
                        </div>
                        <span>{shipment.recipientPhone}</span>
                      </a>
                    )}
                    {shipment.recipientAddress && (
                      <div className="flex items-start gap-3 text-sm text-slate-600">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                          <MapPin className="w-4 h-4 text-slate-400" />
                        </div>
                        <span className="leading-relaxed">{shipment.recipientAddress}</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 text-white shadow-lg">
                  <div className="mb-4">
                    <h3 className="font-semibold text-lg">Need Help?</h3>
                    <p className="text-slate-400 text-sm mt-1">Contact support for assistance</p>
                  </div>
                  <div className="space-y-2.5">
                    <Link
                      href="/track"
                      className="flex items-center justify-between w-full py-2.5 px-4 bg-white/10 hover:bg-white/15 rounded-xl text-sm font-medium transition-all group"
                    >
                      <span className="flex items-center gap-2.5">
                        <Search className="w-4 h-4 text-slate-400" />
                        Track Another Package
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                    <Link
                      href="/support"
                      className="flex items-center justify-between w-full py-2.5 px-4 bg-white/10 hover:bg-white/15 rounded-xl text-sm font-medium transition-all group"
                    >
                      <span className="flex items-center gap-2.5">
                        <Headphones className="w-4 h-4 text-slate-400" />
                        Get Support
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}

export default function ShipmentDetailPage() {
  return (
    <Suspense>
      <ShipmentDetailPageContent />
    </Suspense>
  );
}
