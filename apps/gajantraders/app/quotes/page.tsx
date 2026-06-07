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
  MessageSquare,
  Tag,
  Sparkles,
  Award,
  Package,
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

const statusConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
  pending: { label: 'Pending Review', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  quoted: { label: 'Price Ready', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
  accepted: { label: 'Confirmed', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  rejected: { label: 'Declined', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
  expired: { label: 'Expired', color: 'text-zinc-700', bg: 'bg-zinc-100', border: 'border-zinc-200' },
};

const statusPriority: Record<string, number> = {
  pending: 0,
  quoted: 1,
  accepted: 2,
  rejected: 3,
  expired: 4,
};

function sortQuotes(list: Quote[]) {
  return [...list].sort((a, b) => {
    const pri = (statusPriority[a.status] ?? 99) - (statusPriority[b.status] ?? 99);
    if (pri !== 0) return pri;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
}
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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      className="group"
    >
      <div className="bg-white rounded-xl border border-zinc-200/70 overflow-hidden hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200">
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className={`${config.bg} rounded-lg p-2`}>
                {quote.status === 'pending' && <Clock className={`w-4 h-4 ${config.color}`} />}
                {quote.status === 'quoted' && <Sparkles className={`w-4 h-4 ${config.color}`} />}
                {quote.status === 'accepted' && <CheckCircle className={`w-4 h-4 ${config.color}`} />}
                {quote.status === 'rejected' && <XCircle className={`w-4 h-4 ${config.color}`} />}
                {quote.status === 'expired' && <AlertCircle className={`w-4 h-4 ${config.color}`} />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-zinc-900">{quote.quoteNumber}</span>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${config.bg} ${config.color} border ${config.border}`}>{config.label}</span>
                </div>
                <p className="text-xs text-zinc-500 mt-px flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  {quote.serviceType}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 py-3 border-t border-zinc-100">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Image src={originFlag} alt={quote.origin} width={28} height={20} className="rounded ring-1 ring-zinc-200 shrink-0" unoptimized />
              <span className="text-xs text-zinc-700 truncate">{quote.origin}</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Plane className="w-3 h-3 text-zinc-300 rotate-45" />
              <div className="w-6 h-6 rounded-full flex items-center justify-center shadow-sm" style={{ backgroundColor: 'var(--primary)' }}>
                <Plane className="w-3 h-3 text-white rotate-45" />
              </div>
            </div>
            <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
              <span className="text-xs text-zinc-700 truncate">{quote.destination}</span>
              <Image src={destFlag} alt={quote.destination} width={28} height={20} className="rounded ring-1 ring-zinc-200 shrink-0" unoptimized />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-3 border-t border-zinc-100">
            <div className="flex items-center gap-2 flex-1">
              <Weight className="w-3.5 h-3.5 text-zinc-500" />
              <span className="text-xs text-zinc-700">{quote.weight} KG</span>
            </div>
            <div className="flex items-center gap-2 flex-1 justify-end">
              <Calendar className="w-3.5 h-3.5 text-zinc-500" />
              <span className="text-xs text-zinc-700">{formattedDate}</span>
            </div>
          </div>

          {quote.remarks && (
            <div className="flex items-start gap-2 mt-3 pt-3 border-t border-zinc-100">
              <MessageSquare className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] text-amber-600 font-medium mb-0.5">Note</p>
                <p className="text-xs text-zinc-700">{quote.remarks}</p>
              </div>
            </div>
          )}

          {quote.price && quote.status === 'quoted' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-3 p-4 text-white rounded-lg overflow-hidden relative" style={{ backgroundColor: 'var(--primary)' }}
            >
              <div className="absolute top-2 right-2">
                <Award className="w-5 h-5 text-white/30" />
              </div>
              <div className="relative">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-6 h-6 rounded bg-white/20 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[10px] text-white/70 font-medium">Admin Quoted Price</span>
                </div>
                <span className="text-2xl font-bold font-heading">{quote.price}</span>
              </div>
            </motion.div>
          )}

          {quote.price && quote.status !== 'quoted' && (
            <div className="mt-3 p-3 bg-zinc-50 rounded-lg border border-zinc-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Final Price</p>
                  <span className="text-lg font-bold text-zinc-900">{quote.price}</span>
                </div>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${quote.status === 'accepted' ? 'bg-emerald-100' : 'bg-red-100'}`}>
                  {quote.status === 'accepted' && <CheckCircle className="w-5 h-5 text-emerald-600" />}
                  {quote.status === 'rejected' && <XCircle className="w-5 h-5 text-red-500" />}
                </div>
              </div>
            </div>
          )}

          {quote.status === 'quoted' && (
            <div className="border-t border-zinc-100 pt-3 mt-3">
              <p className="text-xs text-zinc-500 mb-3 text-center">Ready to confirm? Accept or decline this quote.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => onAcceptQuote?.(quote.id)}
                  disabled={isAccepting === quote.id}
                  className="flex-1 px-4 py-2.5 text-white text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20" style={{ backgroundColor: 'var(--primary)' }}
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
                  className="flex-1 px-4 py-2.5 bg-zinc-100 hover:bg-red-50 disabled:bg-zinc-50 text-zinc-700 hover:text-red-600 disabled:text-zinc-500 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
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
            <div className="border-t border-emerald-200 pt-3 mt-3">
              <div className="bg-emerald-50 rounded-lg p-3.5 border border-emerald-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-emerald-700">Quote Confirmed!</p>
                    <p className="text-xs text-emerald-600/80">Your shipment is being processed</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {quote.status === 'rejected' && (
            <div className="border-t border-red-200 pt-3 mt-3">
              <div className="bg-red-50 rounded-lg p-3.5 border border-red-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                    <XCircle className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-red-700">Quote Declined</p>
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
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ x: 2 }}
      className="group"
    >
      <div className="flex items-center gap-4 p-3.5 bg-white rounded-lg border border-zinc-200/70 hover:border-primary/30 hover:shadow-sm transition-all">
        <div className={`w-10 h-10 rounded-lg ${config.bg} flex items-center justify-center shrink-0`}>
          {quote.status === 'pending' && <Clock className={`w-4 h-4 ${config.color}`} />}
          {quote.status === 'quoted' && <Sparkles className={`w-4 h-4 ${config.color}`} />}
          {quote.status === 'accepted' && <CheckCircle className={`w-4 h-4 ${config.color}`} />}
          {quote.status === 'rejected' && <XCircle className={`w-4 h-4 ${config.color}`} />}
          {quote.status === 'expired' && <AlertCircle className={`w-4 h-4 ${config.color}`} />}
        </div>

        <div className="shrink-0 min-w-[110px]">
          <span className="text-sm font-semibold text-zinc-900">{quote.quoteNumber}</span>
          <p className="text-xs text-zinc-500 flex items-center gap-1 mt-px">
            <Tag className="w-3 h-3" />
            {quote.serviceType}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Image src={originFlag} alt={quote.origin} width={20} height={14} className="rounded shrink-0" unoptimized />
          <span className="text-xs text-zinc-700 truncate">{quote.origin}</span>
          <Plane className="w-3 h-3 text-zinc-300 shrink-0 rotate-45" />
          <span className="text-xs text-zinc-700 truncate">{quote.destination}</span>
          <Image src={destFlag} alt={quote.destination} width={20} height={14} className="rounded shrink-0" unoptimized />
        </div>

        <div className="flex items-center gap-1 text-xs text-zinc-700 shrink-0">
          <Weight className="w-3.5 h-3.5 text-zinc-500" />
          <span className="font-medium">{quote.weight}</span>
          <span className="text-zinc-500">KG</span>
        </div>

        <div className="text-xs text-zinc-500 shrink-0 min-w-[60px]">{formattedDate}</div>

        {quote.price && <span className="font-bold text-sm shrink-0 min-w-[70px] text-right" style={{ color: 'var(--primary)' }}>{quote.price}</span>}

        <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${config.bg} ${config.color} shrink-0`}>{config.label}</span>
      </div>
    </motion.div>
  );
}

function StatsCard({ stats }: { stats: { total: number; pending: number; quoted: number; accepted: number } }) {
  const total = stats.total;
  const acceptedRate = total > 0 ? Math.round((stats.accepted / total) * 100) : 0;

  return (
    <div className="relative overflow-hidden rounded-xl p-5 text-white" style={{ backgroundColor: 'var(--primary)' }}>
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-white/70 text-xs font-medium">Total Quotes</p>
            <p className="text-3xl font-bold mt-1 font-heading">{stats.total}</p>
          </div>
          <div className="w-11 h-11 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-sm">
            <FileText className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-white/70 text-xs">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>{acceptedRate}% acceptance rate</span>
        </div>
      </div>
    </div>
  );
}

function StatusItem({ label, count, icon: Icon, iconBg, color }: { label: string; count: number; icon: any; iconBg: string; color: string }) {
  return (
    <div className="flex items-center justify-between py-2 px-3 bg-zinc-50 rounded-lg border border-zinc-100">
      <div className="flex items-center gap-2.5">
        <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
        <span className="text-xs font-medium text-zinc-700">{label}</span>
      </div>
      <span className={`text-base font-bold ${color}`}>{count}</span>
    </div>
  );
}

function Sidebar({ stats, onOpenDialog }: { stats: { total: number; pending: number; quoted: number; accepted: number }; onOpenDialog: () => void }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl p-4 text-white shadow-sm" style={{ backgroundColor: 'var(--foreground)' }}>
        <div className="mb-3">
          <h3 className="font-heading font-semibold" style={{ fontSize: 'var(--text-heading-sm)', lineHeight: 'var(--leading-heading-sm)' }}>Need a Quote?</h3>
          <p className="text-zinc-500 text-xs mt-0.5">Get competitive rates + free packing with every shipment</p>
        </div>
        <button
          onClick={onOpenDialog}
          className="w-full py-2.5 bg-white text-zinc-900 rounded-lg text-sm font-medium hover:bg-zinc-100 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Request Quote
        </button>
      </div>

      <StatsCard stats={stats} />

      <div className="bg-white rounded-xl border border-zinc-200/70 p-4">
        <h3 className="text-sm font-semibold text-zinc-800 uppercase tracking-wider mb-3">Status Overview</h3>
        <div className="space-y-2">
          <StatusItem label="Pending" count={stats.pending} icon={Clock} iconBg="bg-amber-100" color="text-amber-700" />
          <StatusItem label="Price Ready" count={stats.quoted} icon={Sparkles} iconBg="bg-blue-100" color="text-blue-700" />
          <StatusItem label="Confirmed" count={stats.accepted} icon={CheckCircle} iconBg="bg-emerald-100" color="text-emerald-700" />
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onOpenDialog }: { onOpenDialog: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-4"
    >
      <div className="w-20 h-20 rounded-2xl bg-zinc-100 flex items-center justify-center mb-5">
        <FileText className="w-10 h-10 text-zinc-300" />
      </div>
      <h2 className="text-lg font-semibold text-zinc-900 mb-1">No quotes yet</h2>
      <p className="text-sm text-zinc-500 text-center mb-5 max-w-sm">Request your first quote to get competitive rates for your international shipments</p>
      <button
        onClick={onOpenDialog}
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white shadow-lg shadow-primary/20 cursor-pointer" style={{ backgroundColor: 'var(--primary)' }}
      >
        <Plus className="w-4 h-4" />
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
        const sorted = sortQuotes(mappedQuotes);
        setQuotes(sorted);
        setFilteredQuotes(sorted);
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
    setFilteredQuotes(sortQuotes(filtered));
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
        <div className="min-h-screen bg-zinc-50">
          <Navbar />
          <div className="max-w-6xl mx-auto px-4 pt-24 pb-8">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3">
                <div className="h-7 w-36 bg-zinc-200 rounded animate-pulse mb-5" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-44 bg-zinc-100 rounded-xl animate-pulse" />
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <div className="h-36 bg-zinc-100 rounded-xl animate-pulse" />
                <div className="h-44 bg-zinc-100 rounded-xl animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-zinc-50">
        <Navbar />

        <main className="max-w-6xl mx-auto px-4 pt-24 pb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-semibold text-zinc-900 font-heading">My Quotes</h1>
              <p className="text-sm text-zinc-500 mt-0.5">View and manage your shipping quotes</p>
            </div>
            <button
              onClick={() => setShowQuoteDialog(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white shadow-lg shadow-primary/20 cursor-pointer" style={{ backgroundColor: 'var(--primary)' }}
            >
              <Plus className="w-4 h-4" />
              New Quote
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3 space-y-4">
              {quotes.length > 0 ? (
                <>
                  <div className="bg-white rounded-lg border border-zinc-200/70 p-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                          type="text"
                          placeholder="Search quotes by number or destination..."
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 bg-zinc-50 rounded-lg text-sm text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      </div>
                      <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="px-3 py-2.5 bg-zinc-50 rounded-lg text-sm text-zinc-700 focus:outline-none"
                      >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="quoted">Price Ready</option>
                        <option value="accepted">Confirmed</option>
                        <option value="rejected">Declined</option>
                      </select>
                      <div className="flex items-center bg-zinc-100 rounded-lg p-0.5">
                        <button
                          onClick={() => setViewMode('grid')}
                          className={`p-1.5 rounded transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
                        >
                          <Grid3X3 className="w-4 h-4" style={viewMode === 'grid' ? { color: 'var(--primary)' } : undefined} />
                        </button>
                        <button
                          onClick={() => setViewMode('list')}
                          className={`p-1.5 rounded transition-all ${viewMode === 'list' ? 'bg-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
                        >
                          <List className="w-4 h-4" style={viewMode === 'list' ? { color: 'var(--primary)' } : undefined} />
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
                      <div className="text-center py-12 text-sm text-zinc-500">No results found</div>
                    )}
                  </AnimatePresence>

                  <div className="flex items-center justify-between bg-white rounded-lg border border-zinc-200/70 px-4 py-3">
                    <div className="text-xs text-zinc-500">
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
                        className="p-1.5 rounded border border-zinc-200 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      {Array.from({ length: Math.max(1, totalPages) }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          disabled={totalPages === 0}
                          className={`w-7 h-7 rounded text-xs ${currentPage === page && totalPages > 0 ? 'text-white' : 'border border-zinc-200 hover:bg-zinc-50 text-zinc-700'}`}
                          style={currentPage === page && totalPages > 0 ? { backgroundColor: 'var(--primary)' } : undefined}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages || totalPages === 0}
                        className="p-1.5 rounded border border-zinc-200 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
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
