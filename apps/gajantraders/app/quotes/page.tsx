'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ProtectedRoute } from '@/components/protected-route';
import { useAuth } from '@/lib/auth-context';
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Clock4, 
  ChevronRight, 
  Plus, 
  Calendar, 
  MapPin, 
  Package,
  IndianRupee,
  Search
} from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { Badge } from '@/components/ui/badge';

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
  estimatedDays?: string;
}

function MyQuotesContent() {
  const { user } = useAuth();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [filteredQuotes, setFilteredQuotes] = useState<Quote[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      const mockQuotes: Quote[] = [
        {
          id: '1',
          quoteNumber: 'Q-2024-001',
          origin: 'Mumbai, India',
          destination: 'London, UK',
          weight: '2.5 kg',
          serviceType: 'Express',
          status: 'quoted',
          date: '2024-01-15',
          price: '₹4,500',
          estimatedDays: '5-7'
        },
        {
          id: '2',
          quoteNumber: 'Q-2024-002',
          origin: 'Delhi, India',
          destination: 'New York, USA',
          weight: '5.2 kg',
          serviceType: 'Standard',
          status: 'pending',
          date: '2024-01-18'
        },
        {
          id: '3',
          quoteNumber: 'Q-2024-003',
          origin: 'Bangalore, India',
          destination: 'Singapore',
          weight: '1.8 kg',
          serviceType: 'Express',
          status: 'accepted',
          date: '2024-01-10',
          price: '₹2,800',
          estimatedDays: '3-4'
        },
        {
          id: '4',
          quoteNumber: 'Q-2024-004',
          origin: 'Chennai, India',
          destination: 'Dubai, UAE',
          weight: '3.5 kg',
          serviceType: 'Economy',
          status: 'rejected',
          date: '2024-01-05'
        }
      ];
      setQuotes(mockQuotes);
      setFilteredQuotes(mockQuotes);
      setIsLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    let filtered = quotes;
    if (searchQuery) {
      filtered = filtered.filter(q =>
        q.quoteNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.origin.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.serviceType.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(q => q.status === statusFilter);
    }
    setFilteredQuotes(filtered);
  }, [searchQuery, statusFilter, quotes]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted': return <CheckCircle2 className="size-5 text-emerald-400" />;
      case 'quoted': return <IndianRupee className="size-5 text-blue-400" />;
      case 'pending': return <Clock4 className="size-5 text-amber-400" />;
      case 'rejected': return <XCircle className="size-5 text-red-400" />;
      case 'expired': return <Clock className="size-5 text-white/50" />;
      default: return <FileText className="size-5 text-white/60" />;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'accepted': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'quoted': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'pending': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'expired': return 'bg-white/10 text-white/60 border-white/20';
      default: return 'bg-white/10 text-white/60 border-white/20';
    }
  };

  const getStatusBgClass = (status: string) => {
    switch (status) {
      case 'accepted': return 'bg-emerald-500/10';
      case 'quoted': return 'bg-blue-500/10';
      case 'pending': return 'bg-amber-500/10';
      case 'rejected': return 'bg-red-500/10';
      case 'expired': return 'bg-white/5';
      default: return 'bg-white/5';
    }
  };

  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (isLoading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-[#121212] pt-20">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="size-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#121212]">
        {/* Header */}
        <div className="border-b border-white/10 bg-[#121212]/50 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-black text-white font-[family-name:var(--font-oswald)]">
                  My Quotes
                </h1>
                <p className="text-white/50 mt-2">
                  View and manage your shipping quotes
                </p>
              </div>
              <Link
                href="/quote"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-[#4C833E] text-white font-semibold rounded-xl transition-all duration-200"
              >
                <Plus className="size-5" />
                Request New Quote
              </Link>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: 'Total', value: quotes.length, color: 'text-white' },
              { label: 'Pending', value: quotes.filter(q => q.status === 'pending').length, color: 'text-amber-400' },
              { label: 'Quoted', value: quotes.filter(q => q.status === 'quoted').length, color: 'text-blue-400' },
              { label: 'Accepted', value: quotes.filter(q => q.status === 'accepted').length, color: 'text-emerald-400' },
              { label: 'Rejected', value: quotes.filter(q => q.status === 'rejected').length, color: 'text-red-400' },
            ].map((stat, idx) => (
              <button
                key={idx}
                onClick={() => setStatusFilter(stat.label.toLowerCase())}
                className={`p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl text-left hover:border-primary/40 transition-all ${
                  statusFilter === stat.label.toLowerCase() ? 'border-primary bg-primary/5' : ''
                }`}
              >
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-sm text-white/50">{stat.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-white/30" />
            <input
              type="text"
              placeholder="Search by quote number, destination, service type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 focus:bg-white/[0.07] transition-all"
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
          <div className="flex flex-wrap gap-2">
            {['all', 'pending', 'quoted', 'accepted', 'rejected', 'expired'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  statusFilter === status
                    ? 'bg-primary text-white'
                    : 'bg-white/[0.03] text-white/70 border border-white/[0.06] hover:border-primary/40'
                }`}
              >
                {status === 'all' ? 'All Quotes' : formatStatus(status)}
              </button>
            ))}
          </div>
        </div>

        {/* Quotes List */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          {filteredQuotes.length === 0 ? (
            <div className="text-center py-16 bg-white/[0.03] border border-white/[0.06] rounded-2xl">
              <FileText className="size-16 text-white/20 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No quotes found</h3>
              <p className="text-white/50 mb-6">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'You haven\'t requested any quotes yet'}
              </p>
              <Link
                href="/quote"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-[#4C833E] text-white font-semibold rounded-xl transition-all duration-200"
              >
                Request Your First Quote
                <ChevronRight className="size-5" />
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredQuotes.map((quote) => (
                <motion.div
                  key={quote.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="p-6 bg-white/[0.03] border border-white/[0.06] rounded-2xl hover:border-primary/40 transition-all cursor-pointer group">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className={`size-12 rounded-xl flex items-center justify-center ${getStatusBgClass(quote.status)}`}>
                          {getStatusIcon(quote.status)}
                        </div>
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold text-white">{quote.quoteNumber}</h3>
                            <Badge className={`${getStatusClass(quote.status)} border`}>
                              {formatStatus(quote.status)}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-sm text-white/50">
                            <MapPin className="size-4" />
                            <span>{quote.origin}</span>
                            <ChevronRight className="size-4" />
                            <span>{quote.destination}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-6 lg:gap-8">
                        <div className="text-center">
                          <p className="text-xs text-white/40 uppercase tracking-wider">Requested</p>
                          <p className="text-sm font-medium text-white">
                            {new Date(quote.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-white/40 uppercase tracking-wider">Service</p>
                          <p className="text-sm font-medium text-white">{quote.serviceType}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-white/40 uppercase tracking-wider">Weight</p>
                          <p className="text-sm font-medium text-white">{quote.weight}</p>
                        </div>
                        {quote.price && (
                          <div className="text-center">
                            <p className="text-xs text-white/40 uppercase tracking-wider">Price</p>
                            <p className="text-lg font-bold text-primary">{quote.price}</p>
                          </div>
                        )}
                        <div className="hidden lg:flex">
                          <ChevronRight className="size-5 text-white/40 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>
                    </div>

                    {quote.status === 'quoted' && (
                      <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap gap-3">
                        <button className="px-4 py-2 bg-primary hover:bg-[#4C833E] text-white text-sm font-medium rounded-lg transition-colors">
                          Accept Quote
                        </button>
                        <button className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white/80 text-sm font-medium rounded-lg transition-colors">
                          Reject
                        </button>
                        <button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/60 text-sm font-medium rounded-lg transition-colors">
                          View Details
                        </button>
                      </div>
                    )}

                    {quote.status === 'accepted' && quote.estimatedDays && (
                      <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-2 text-sm text-white/60">
                        <Calendar className="size-4" />
                        <span>Estimated delivery in {quote.estimatedDays} business days</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}

export default function MyQuotesPage() {
  return (
    <ProtectedRoute>
      <MyQuotesContent />
    </ProtectedRoute>
  );
}
