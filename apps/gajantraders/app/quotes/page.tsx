'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/protected-route';
import Navbar from '@/components/Navbar';
import {
  Search,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Grid3X3,
  List,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Weight,
  Loader2,
  Calendar,
  Plane,
  Phone,
  MessageSquare,
  Tag,
  Sparkles,
  Award,
} from 'lucide-react';
import QuoteDialog from '@/components/QuoteDialog';

interface Quote {
  id: string;
  quoteNumber: string;
  origin: string;
  destination: string;
  weight: string;
  serviceType: string;
  status: 'pending' | 'quoted' | 'accepted' | 'rejected' | 'expired';
  date: string;
  price?: string;
  estimatedDays?: number;
  email?: string;
  phone?: string;
  remarks?: string;
}

interface ApiQuote {
  id: string;
  organisationId: string;
  userId: string;
  originCountry: string;
  destinationCountry: string;
  status: 'pending' | 'quoted' | 'accepted' | 'rejected' | 'deleted';
  goodsType: string;
  weight: string | number;
  email: string;
  phone: string;
  remarks?: string;
  price?: string | number;
  estimatedDays?: number;
  createdAt: string;
  updatedAt: string;
}

function mapApiQuoteToQuote(apiQuote: ApiQuote): Quote {
  return {
    id: apiQuote.id,
    quoteNumber: `Q-${apiQuote.createdAt.slice(0, 10).replace(/-/g, '')}-${apiQuote.id.slice(0, 4).toUpperCase()}`,
    origin: apiQuote.originCountry,
    destination: apiQuote.destinationCountry,
    weight: typeof apiQuote.weight === 'number' ? `${apiQuote.weight}` : apiQuote.weight.replace(/\s*kg$/i, ''),
    serviceType: apiQuote.goodsType.charAt(0).toUpperCase() + apiQuote.goodsType.slice(1),
    status: apiQuote.status === 'deleted' ? 'expired' : apiQuote.status,
    date: apiQuote.createdAt,
    price: apiQuote.price ? `₹${apiQuote.price}` : undefined,
    estimatedDays: apiQuote.estimatedDays,
    email: apiQuote.email,
    phone: apiQuote.phone,
    remarks: apiQuote.remarks,
  };
}

const statusConfig: Record<string, { label: string; color: string; bg: string; border: string; badge: string }> = {
  pending: { label: 'Pending Review', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-500' },
  quoted: { label: 'Price Ready', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-500' },
  accepted: { label: 'Confirmed', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-500' },
  rejected: { label: 'Declined', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-500' },
  expired: { label: 'Expired', color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200', badge: 'bg-slate-400' },
};

const goodsTypeIcons: Record<string, string> = {
  general: '📦',
  fragile: '⚠️',
  electronics: '💻',
  perishable: '🥤',
  hazardous: '☢️',
  machinery: '⚙️',
  chemicals: '🧪',
  other: '📦',
};

const countryCodeMap: Record<string, string> = {
  'India': 'IN',
  'Australia': 'AU', 'Bangladesh': 'BD', 'Bhutan': 'BT', 'Canada': 'CA', 'China': 'CN',
  'Dubai (UAE)': 'AE', 'France': 'FR', 'Germany': 'DE', 'Hong Kong': 'HK',
  'Indonesia': 'ID', 'Italy': 'IT', 'Japan': 'JP', 'Kenya': 'KE', 'Malaysia': 'MY',
  'Nepal': 'NP', 'Netherlands': 'NL', 'New Zealand': 'NZ', 'Pakistan': 'PK',
  'Philippines': 'PH', 'Singapore': 'SG', 'South Africa': 'ZA', 'South Korea': 'KR',
  'Spain': 'ES', 'Sri Lanka': 'LK', 'Thailand': 'TH', 'UK': 'GB', 'USA': 'US', 'Vietnam': 'VN',
};

function getCountryFlagUrl(code: string): string {
  return `https://flagcdn.com/w80/${code.toLowerCase()}.png`;
}

function QuoteCard({ quote, onAcceptQuote, onDeclineQuote, isAccepting, isDeclining }: { quote: Quote; onAcceptQuote?: (id: string) => void; onDeclineQuote?: (id: string) => void; isAccepting?: string | null; isDeclining?: string | null }) {
  const config = statusConfig[quote.status] || statusConfig.pending;
  const date = new Date(quote.date);
  const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const originFlag = getCountryFlagUrl(countryCodeMap[quote.origin] || 'IN');
  const destFlag = getCountryFlagUrl(countryCodeMap[quote.destination] || 'UN');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="group"
    >
      <div className="relative bg-white rounded-2xl border border-slate-200/60 overflow-hidden hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
        <div className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`relative ${config.bg} rounded-xl p-2.5`}>
                {quote.status === 'pending' && <Clock className={`w-5 h-5 ${config.color}`} />}
                {quote.status === 'quoted' && <Sparkles className={`w-5 h-5 ${config.color}`} />}
                {quote.status === 'accepted' && <CheckCircle className={`w-5 h-5 ${config.color}`} />}
                {quote.status === 'rejected' && <XCircle className={`w-5 h-5 ${config.color}`} />}
                {quote.status === 'expired' && <AlertCircle className={`w-5 h-5 ${config.color}`} />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900">{quote.quoteNumber}</span>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}>{config.label}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    {quote.serviceType}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/10 rounded-xl p-4 mb-4 border border-slate-100">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="relative">
                  <Image src={originFlag} alt={quote.origin} width={48} height={32} className="rounded-lg shadow-md ring-2 ring-white" unoptimized />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">Origin</p>
                  <p className="text-sm font-semibold text-slate-700">{quote.origin}</p>
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
                  <p className="text-sm font-semibold text-slate-700">{quote.destination}</p>
                </div>
                <div className="relative">
                  <Image src={destFlag} alt={quote.destination} width={48} height={32} className="rounded-lg shadow-md ring-2 ring-white" unoptimized />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 text-center border border-slate-100">
              <Weight className="w-6 h-6 text-slate-400 mx-auto mb-2" />
              <p className="text-[10px] text-slate-400 mb-1">Weight</p>
              <p className="text-lg font-bold text-slate-700">{quote.weight} <span className="text-xs font-medium">KG</span></p>
            </div>
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 text-center border border-slate-100">
              <Calendar className="w-6 h-6 text-slate-400 mx-auto mb-2" />
              <p className="text-[10px] text-slate-400 mb-1">Created</p>
              <p className="text-sm font-semibold text-slate-700">{formattedDate}</p>
            </div>
          </div>

          {quote.remarks && (
            <div className="flex items-start gap-2 mb-4 p-3 bg-amber-50/50 rounded-lg border border-amber-100/50">
              <MessageSquare className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] text-amber-600 font-medium mb-0.5">Note</p>
                <p className="text-xs text-slate-600">{quote.remarks}</p>
              </div>
            </div>
          )}

          {quote.price && quote.status === 'quoted' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-xl p-5 mb-4 text-white relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
              <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-10 -translate-x-10" />
              <div className="absolute top-2 right-2">
                <Award className="w-6 h-6 text-white/40" />
              </div>
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <span className="text-blue-100 text-xs font-medium">Admin Quoted Price</span>
                  </div>
                </div>
                <span className="text-3xl font-bold">{quote.price}</span>
              </div>
            </motion.div>
          )}

          {quote.price && quote.status !== 'quoted' && (
            <div className="mb-4 p-4 bg-gradient-to-r from-slate-100 to-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">Final Price</p>
                  <span className="text-2xl font-bold text-slate-900">{quote.price}</span>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${quote.status === 'accepted' ? 'bg-emerald-100' : 'bg-red-100'}`}>
                  {quote.status === 'accepted' && <CheckCircle className="w-6 h-6 text-emerald-600" />}
                  {quote.status === 'rejected' && <XCircle className="w-6 h-6 text-red-500" />}
                </div>
              </div>
            </div>
          )}

          {quote.status === 'quoted' && (
            <div className="border-t border-slate-100 pt-4">
              <p className="text-xs text-slate-500 mb-3 text-center">Ready to confirm? Accept or decline this quote.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => onAcceptQuote?.(quote.id)}
                  disabled={isAccepting === quote.id}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-primary to-slate-600 hover:from-slate-600 hover:to-slate-700 disabled:from-slate-300 disabled:to-slate-400 text-white text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                >
                  {isAccepting === quote.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  Accept Quote
                </button>
                <button
                  onClick={() => onDeclineQuote?.(quote.id)}
                  disabled={isDeclining === quote.id}
                  className="flex-1 px-4 py-3 bg-slate-100 hover:bg-red-50 disabled:bg-slate-50 text-slate-600 hover:text-red-600 disabled:text-slate-400 text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  {isDeclining === quote.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  Decline
                </button>
              </div>
            </div>
          )}

          {quote.status === 'accepted' && (
            <div className="border-t border-emerald-200 pt-4">
              <div className="bg-gradient-to-r from-emerald-50 to-slate-50 rounded-xl p-4 border border-emerald-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-emerald-700">Quote Confirmed!</p>
                    <p className="text-xs text-emerald-600/80">Your shipment is being processed</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {quote.status === 'rejected' && (
            <div className="border-t border-red-200 pt-4">
              <div className="bg-gradient-to-r from-red-50 to-rose-50 rounded-xl p-4 border border-red-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                    <XCircle className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-red-700">Quote Declined</p>
                    <p className="text-xs text-red-600/80">You can request a new quote anytime</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function QuoteRow({ quote }: { quote: Quote }) {
  const config = statusConfig[quote.status] || statusConfig.pending;
  const date = new Date(quote.date);
  const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const originFlag = getCountryFlagUrl(countryCodeMap[quote.origin] || 'IN');
  const destFlag = getCountryFlagUrl(countryCodeMap[quote.destination] || 'UN');

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ x: 2 }}
      className="group"
    >
      <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 hover:border-primary/30 hover:shadow-md transition-all">
        <div className={`w-12 h-12 rounded-xl ${config.bg} flex items-center justify-center shrink-0`}>
          {quote.status === 'pending' && <Clock className={`w-5 h-5 ${config.color}`} />}
          {quote.status === 'quoted' && <Sparkles className={`w-5 h-5 ${config.color}`} />}
          {quote.status === 'accepted' && <CheckCircle className={`w-5 h-5 ${config.color}`} />}
          {quote.status === 'rejected' && <XCircle className={`w-5 h-5 ${config.color}`} />}
          {quote.status === 'expired' && <AlertCircle className={`w-5 h-5 ${config.color}`} />}
        </div>

        <div className="shrink-0 min-w-[120px]">
          <span className="font-semibold text-slate-900 text-sm">{quote.quoteNumber}</span>
          <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
            <Tag className="w-3 h-3" />
            {quote.serviceType}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Image src={originFlag} alt={quote.origin} width={24} height={16} className="rounded shrink-0" unoptimized />
          <span className="text-sm text-slate-600 truncate">{quote.origin}</span>
          <Plane className="w-4 h-4 text-primary shrink-0 rotate-45" />
          <Image src={destFlag} alt={quote.destination} width={24} height={16} className="rounded shrink-0" unoptimized />
          <span className="text-sm text-slate-600 truncate">{quote.destination}</span>
        </div>

        <div className="flex items-center gap-1 text-sm text-slate-600 shrink-0">
          <Weight className="w-4 h-4 text-slate-400" />
          <span className="font-medium">{quote.weight}</span>
          <span className="text-slate-400">KG</span>
        </div>

        <div className="text-sm text-slate-400 shrink-0 min-w-[70px]">{formattedDate}</div>

        {quote.price && <span className="font-bold text-primary shrink-0 min-w-[80px] text-right">{quote.price}</span>}

        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${config.bg} ${config.color} shrink-0`}>{config.label}</span>
      </div>
    </motion.div>
  );
}

function StatsCard({ stats }: { stats: { total: number; pending: number; quoted: number; accepted: number } }) {
  const total = stats.total;
  const acceptedRate = total > 0 ? Math.round((stats.accepted / total) * 100) : 0;

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-primary via-blue-600 to-indigo-700 rounded-2xl p-5 text-white">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
      <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-10 -translate-x-10" />
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-blue-100 text-sm font-medium">Total Quotes</p>
            <p className="text-4xl font-bold mt-1">{stats.total}</p>
          </div>
          <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <FileText className="w-7 h-7" />
          </div>
        </div>
        <div className="flex items-center gap-2 text-blue-100 text-sm">
          <TrendingUp className="w-4 h-4" />
          <span>{acceptedRate}% acceptance rate</span>
        </div>
      </div>
    </div>
  );
}

function StatusOverview({ stats }: { stats: { pending: number; quoted: number; accepted: number } }) {
  const items = [
    { key: 'pending', label: 'Pending', icon: Clock, color: 'amber' },
    { key: 'quoted', label: 'Price Ready', icon: Sparkles, color: 'blue' },
    { key: 'accepted', label: 'Confirmed', icon: CheckCircle, color: 'emerald' },
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

function Sidebar({ stats, onOpenDialog }: { stats: { total: number; pending: number; quoted: number; accepted: number }; onOpenDialog: () => void }) {
  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 text-white shadow-lg">
        <div className="mb-4">
          <h3 className="font-semibold text-lg">Need a Quote?</h3>
          <p className="text-slate-400 text-sm mt-1">Get competitive rates for your shipments</p>
        </div>
        <button
          onClick={onOpenDialog}
          className="w-full py-3 bg-white text-slate-900 rounded-xl font-medium hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Request Quote
        </button>
      </div>

      <StatsCard stats={stats} />
      <StatusOverview stats={stats} />
    </div>
  );
}



function EmptyState({ onOpenDialog }: { onOpenDialog: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 px-4"
    >
      <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mb-6 shadow-xl">
        <FileText className="w-12 h-12 text-primary" />
      </div>
      <h2 className="text-xl font-semibold text-slate-900 mb-2">No quotes yet</h2>
      <p className="text-slate-500 text-center mb-6 max-w-md">Request your first quote to get competitive rates for your international shipments</p>
      <button
        onClick={onOpenDialog}
        className="px-6 py-3 bg-gradient-to-r from-primary to-indigo-600 text-white font-medium rounded-xl hover:from-slate-600 hover:to-indigo-700 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
      >
        <Plus className="w-5 h-5" />
        Request Quote
      </button>
    </motion.div>
  );
}



function QuotesPageContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [filteredQuotes, setFilteredQuotes] = useState<Quote[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showQuoteDialog, setShowQuoteDialog] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [acceptingQuoteId, setAcceptingQuoteId] = useState<string | null>(null);
  const [decliningQuoteId, setDecliningQuoteId] = useState<string | null>(null);
  const itemsPerPage = 12;

  const handleAcceptQuote = async (id: string) => {
    setAcceptingQuoteId(id);
    try {
      await api.patch(`/quotes/${id}`, { status: 'accepted' });
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error('Failed to accept quote', err);
    } finally {
      setAcceptingQuoteId(null);
    }
  };

  const handleDeclineQuote = async (id: string) => {
    setDecliningQuoteId(id);
    try {
      await api.patch(`/quotes/${id}`, { status: 'rejected' });
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error('Failed to decline quote', err);
    } finally {
      setDecliningQuoteId(null);
    }
  };

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) localStorage.setItem('gt_access_token', token);
  }, [searchParams]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;
      try {
        setIsLoading(true);
        const res = await api.get<ApiQuote[]>('/quotes/me');
        const mappedQuotes = res.map(mapApiQuoteToQuote);
        setQuotes(mappedQuotes);
        setFilteredQuotes(mappedQuotes);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user?.id, refreshTrigger]);

  useEffect(() => {
    let filtered = quotes;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(qt =>
        qt.quoteNumber.toLowerCase().includes(q) ||
        qt.destination.toLowerCase().includes(q) ||
        qt.origin.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') filtered = filtered.filter(qt => qt.status === statusFilter);
    setFilteredQuotes(filtered);
    setCurrentPage(1);
  }, [searchQuery, statusFilter, quotes]);

  const totalPages = Math.ceil(filteredQuotes.length / itemsPerPage);
  const paginatedQuotes = filteredQuotes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const stats = {
    total: quotes.length,
    pending: quotes.filter(q => q.status === 'pending').length,
    quoted: quotes.filter(q => q.status === 'quoted').length,
    accepted: quotes.filter(q => q.status === 'accepted').length,
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
                  <h1 className="text-2xl font-semibold text-slate-900">My Quotes</h1>
                  <p className="text-slate-500 mt-1">View and manage your shipping quotes</p>
                </div>
                <button
                  onClick={() => setShowQuoteDialog(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-slate-700 transition-all shadow-lg shadow-primary/20 cursor-pointer"
                >
                  <Plus className="w-5 h-5" />
                  New Quote
                </button>
              </div>

              {quotes.length > 0 ? (
                <>
                  <div className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search quotes by number or destination..."
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
                        <option value="quoted">Price Ready</option>
                        <option value="accepted">Confirmed</option>
                        <option value="rejected">Declined</option>
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
                    {paginatedQuotes.length > 0 ? (
                      viewMode === 'grid' ? (
                        <motion.div
                          key="grid"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="grid grid-cols-1 md:grid-cols-2 gap-4"
                        >
                          {paginatedQuotes.map(quote => (
                            <QuoteCard
                              key={quote.id}
                              quote={quote}
                              onAcceptQuote={handleAcceptQuote}
                              onDeclineQuote={handleDeclineQuote}
                              isAccepting={acceptingQuoteId}
                              isDeclining={decliningQuoteId}
                            />
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
                          {paginatedQuotes.map(quote => (
                            <QuoteRow key={quote.id} quote={quote} />
                          ))}
                        </motion.div>
                      )
                    ) : (
                      <div className="text-center py-12 text-slate-500">No results found</div>
                    )}
                  </AnimatePresence>

                  <div className="flex items-center justify-between pt-4 bg-white rounded-xl p-4 border border-slate-200/80">
                    <div className="text-sm text-slate-500">
                      {filteredQuotes.length > 0 ? (
                        <>
                          Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredQuotes.length)} of {filteredQuotes.length}
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
                <EmptyState onOpenDialog={() => setShowQuoteDialog(true)} />
              )}
            </div>

            <div className="space-y-4">
              <Sidebar stats={stats} onOpenDialog={() => setShowQuoteDialog(true)} />
            </div>
          </div>
        </main>

        <QuoteDialog
          isOpen={showQuoteDialog}
          onClose={() => setShowQuoteDialog(false)}
          onSuccess={() => {
            setRefreshTrigger(prev => prev + 1);
          }}
        />
      </div>
    </ProtectedRoute>
  );
}

export default function QuotesPage() {
  return (
    <Suspense>
      <QuotesPageContent />
    </Suspense>
  );
}
