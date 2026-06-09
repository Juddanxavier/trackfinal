"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { ProtectedRoute } from "@/components/protected-route";
import Navbar from "@/components/Navbar";
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
  MapPin,
  Truck,
} from "lucide-react";

interface Shipment {
  id: string;
  trackingNumber: string;
  whiteLabelTrackingCode?: string;
  whiteLabelCode?: string;
  carrierCode: string;
  recipientName: string;
  originCountry: string;
  destinationCountry: string;
  status: "pending" | "in_transit" | "delivered" | "cancelled" | "exception";
  weight?: number;
  createdAt: string;
  currentLocation?: string;
  currentStatus?: string;
}

const countryCodeMap: Record<string, string> = {
  India: "IN",
  "United States": "US",
  USA: "US",
  "United Kingdom": "GB",
  UK: "GB",
  Australia: "AU",
  Canada: "CA",
  Germany: "DE",
  France: "FR",
  UAE: "AE",
  Dubai: "AE",
  Singapore: "SG",
  Japan: "JP",
  China: "CN",
  Malaysia: "MY",
  Netherlands: "NL",
  Italy: "IT",
  Spain: "ES",
  "Saudi Arabia": "SA",
  Qatar: "QA",
  "New Zealand": "NZ",
  Switzerland: "CH",
  Ireland: "IE",
  "South Africa": "ZA",
  Bangladesh: "BD",
  Pakistan: "PK",
  "Sri Lanka": "LK",
  Nepal: "NP",
  Thailand: "TH",
  Indonesia: "ID",
  Philippines: "PH",
  Vietnam: "VN",
  Korea: "KR",
  "South Korea": "KR",
};

function getCountryFlagUrl(code: string): string {
  return `https://flagcdn.com/w80/${code.toLowerCase()}.png`;
}

const statusConfig: Record<
  string,
  { label: string; color: string; bg: string; border: string }
> = {
  pending: {
    label: "Pending",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
  in_transit: {
    label: "In Transit",
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  delivered: {
    label: "Delivered",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  },
  cancelled: {
    label: "Cancelled",
    color: "text-zinc-700",
    bg: "bg-zinc-100",
    border: "border-zinc-200",
  },
  exception: {
    label: "Exception",
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
  },
};

function getWhiteLabelCode(shipment: Shipment): string | null {
  return shipment.whiteLabelTrackingCode || shipment.whiteLabelCode || null;
}

function ShipmentCard({ shipment }: { shipment: Shipment }) {
  const config = statusConfig[shipment.status] || statusConfig.pending;
  const trackingId = getWhiteLabelCode(shipment);
  if (!trackingId) return null;
  const date = new Date(shipment.createdAt);
  const formattedDate = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const originFlag = getCountryFlagUrl(
    countryCodeMap[shipment.originCountry] || "IN",
  );
  const destFlag = getCountryFlagUrl(
    countryCodeMap[shipment.destinationCountry] || "UN",
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      className="group"
    >
      <Link href={`/shipments/${shipment.id}`}>
        <div className="bg-white rounded-xl border border-zinc-200/70 overflow-hidden hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className={`${config.bg} rounded-lg p-2`}>
                  {shipment.status === "in_transit" && (
                    <Plane className={`w-4 h-4 ${config.color}`} />
                  )}
                  {shipment.status === "delivered" && (
                    <CheckCircle className={`w-4 h-4 ${config.color}`} />
                  )}
                  {shipment.status === "pending" && (
                    <Clock className={`w-4 h-4 ${config.color}`} />
                  )}
                  {shipment.status === "cancelled" && (
                    <XCircle className={`w-4 h-4 ${config.color}`} />
                  )}
                  {shipment.status === "exception" && (
                    <AlertTriangle className={`w-4 h-4 ${config.color}`} />
                  )}
                </div>
                <div>
                  <div className="text-sm font-semibold text-zinc-900">
                    {trackingId}
                  </div>
                  <p className="text-xs text-zinc-500 mt-px">
                    {shipment.recipientName}
                  </p>
                </div>
              </div>
              <span
                className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${config.bg} ${config.color} border ${config.border}`}
              >
                {config.label}
              </span>
            </div>

            <div className="flex items-center gap-3 py-3 border-t border-zinc-100">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Image
                  src={originFlag}
                  alt={shipment.originCountry}
                  width={28}
                  height={20}
                  className="rounded ring-1 ring-zinc-200 shrink-0"
                  unoptimized
                />
                <span className="text-xs text-zinc-700 truncate">
                  {shipment.originCountry}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Plane className="w-3 h-3 text-zinc-300 rotate-45" />
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "var(--primary)" }}
                >
                  <Plane className="w-3 h-3 text-white rotate-45" />
                </div>
              </div>
              <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                <span className="text-xs text-zinc-700 truncate">
                  {shipment.destinationCountry}
                </span>
                <Image
                  src={destFlag}
                  alt={shipment.destinationCountry}
                  width={28}
                  height={20}
                  className="rounded ring-1 ring-zinc-200 shrink-0"
                  unoptimized
                />
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-zinc-500 pt-2 border-t border-zinc-50">
              <span>{formattedDate}</span>
              <span className="text-zinc-200">|</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {shipment.currentLocation || "—"}
              </span>
            </div>
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
  const formattedDate = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  const originFlag = getCountryFlagUrl(
    countryCodeMap[shipment.originCountry] || "IN",
  );
  const destFlag = getCountryFlagUrl(
    countryCodeMap[shipment.destinationCountry] || "UN",
  );

  return (
    <Link href={`/shipments/${shipment.id}`}>
      <motion.div
        initial={{ opacity: 0, x: -6 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ x: 2 }}
        className="group"
      >
        <div className="flex items-center gap-4 p-3.5 bg-white rounded-lg border border-zinc-200/70 hover:border-primary/30 hover:shadow-sm transition-all">
          <div
            className={`w-10 h-10 rounded-lg ${config.bg} flex items-center justify-center shrink-0`}
          >
            {shipment.status === "in_transit" && (
              <Plane className={`w-4 h-4 ${config.color}`} />
            )}
            {shipment.status === "delivered" && (
              <CheckCircle className={`w-4 h-4 ${config.color}`} />
            )}
            {shipment.status === "pending" && (
              <Clock className={`w-4 h-4 ${config.color}`} />
            )}
            {shipment.status === "cancelled" && (
              <XCircle className={`w-4 h-4 ${config.color}`} />
            )}
            {shipment.status === "exception" && (
              <AlertTriangle className={`w-4 h-4 ${config.color}`} />
            )}
          </div>

          <div className="shrink-0 min-w-[110px]">
            <span className="text-sm font-semibold text-zinc-900">
              {trackingId}
            </span>
            <p className="text-xs text-zinc-500 truncate mt-px">
              {shipment.recipientName}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Image
              src={originFlag}
              alt={shipment.originCountry}
              width={20}
              height={14}
              className="rounded shrink-0"
              unoptimized
            />
            <span className="text-xs text-zinc-700 truncate">
              {shipment.originCountry}
            </span>
            <Plane className="w-3 h-3 text-zinc-300 shrink-0 rotate-45" />
            <span className="text-xs text-zinc-700 truncate">
              {shipment.destinationCountry}
            </span>
            <Image
              src={destFlag}
              alt={shipment.destinationCountry}
              width={20}
              height={14}
              className="rounded shrink-0"
              unoptimized
            />
          </div>

          <div className="text-xs text-zinc-500 shrink-0 min-w-[60px]">
            {formattedDate}
          </div>

          <span
            className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${config.bg} ${config.color} shrink-0`}
          >
            {config.label}
          </span>
        </div>
      </motion.div>
    </Link>
  );
}

function StatsCard({
  stats,
}: {
  stats: { total: number; transit: number; delivered: number; pending: number };
}) {
  const total = stats.total;
  const deliveredRate =
    total > 0 ? Math.round((stats.delivered / total) * 100) : 0;

  return (
    <div
      className="relative overflow-hidden rounded-xl p-5 text-white"
      style={{ backgroundColor: "var(--primary)" }}
    >
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-white/70 text-xs font-medium">Total Shipments</p>
            <p className="text-3xl font-bold mt-1 font-heading">
              {stats.total}
            </p>
          </div>
          <div className="w-11 h-11 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-sm">
            <Package className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-white/70 text-xs">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>{deliveredRate}% delivery rate</span>
        </div>
      </div>
    </div>
  );
}

function StatusItem({
  label,
  count,
  icon: Icon,
  iconBg,
  color,
}: {
  label: string;
  count: number;
  icon: any;
  iconBg: string;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between py-2 px-3 bg-zinc-50 rounded-lg border border-zinc-100">
      <div className="flex items-center gap-2.5">
        <div
          className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center`}
        >
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
        <span className="text-xs font-medium text-zinc-700">{label}</span>
      </div>
      <span className={`text-base font-bold ${color}`}>{count}</span>
    </div>
  );
}

function Sidebar({
  stats,
}: {
  stats: { total: number; transit: number; delivered: number; pending: number };
}) {
  return (
    <div className="space-y-4">
      <StatsCard stats={stats} />

      <div className="bg-white rounded-xl border border-zinc-200/70 p-4">
        <h3 className="text-sm font-semibold text-zinc-800 uppercase tracking-wider mb-3">
          Status Overview
        </h3>
        <div className="space-y-2">
          <StatusItem
            label="In Transit"
            count={stats.transit}
            icon={Truck}
            iconBg="bg-blue-100"
            color="text-blue-700"
          />
          <StatusItem
            label="Delivered"
            count={stats.delivered}
            icon={CheckCircle}
            iconBg="bg-emerald-100"
            color="text-emerald-700"
          />
          <StatusItem
            label="Pending"
            count={stats.pending}
            icon={Clock}
            iconBg="bg-amber-100"
            color="text-amber-700"
          />
        </div>
      </div>

      <div
        className="rounded-xl p-4 text-white shadow-sm"
        style={{ backgroundColor: "var(--foreground)" }}
      >
        <div className="mb-3">
          <h3
            className="font-heading font-semibold"
            style={{
              fontSize: "var(--text-heading-sm)",
              lineHeight: "var(--leading-heading-sm)",
            }}
          >
            Track Package
          </h3>
          <p className="text-zinc-500 text-xs mt-0.5">
            Get real-time updates on your shipments
          </p>
        </div>
        <Link
          href="/track"
          className="w-full py-2.5 bg-white text-zinc-900 rounded-lg text-sm font-medium hover:bg-zinc-100 transition-all flex items-center justify-center gap-2"
        >
          <Search className="w-4 h-4" />
          Track Now
        </Link>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-4"
    >
      <div className="w-20 h-20 rounded-2xl bg-zinc-100 flex items-center justify-center mb-5">
        <Package className="w-10 h-10 text-zinc-300" />
      </div>
      <h2 className="text-lg font-semibold text-zinc-900 mb-1">
        No shipments yet
      </h2>
      <p className="text-sm text-zinc-500 text-center mb-5 max-w-sm">
        Create your first shipment to start tracking your packages
      </p>
      <Link
        href="/quote"
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white shadow-lg shadow-primary/20"
        style={{ backgroundColor: "var(--primary)" }}
      >
        <Plus className="w-4 h-4" />
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
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) localStorage.setItem("gt_access_token", token);
  }, [searchParams]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;
      try {
        setIsLoading(true);
        const res = await api.get<Shipment[]>("/shipments/my-shipments");
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
      filtered = filtered.filter((s) => {
        const code = getWhiteLabelCode(s);
        return (
          code?.toLowerCase().includes(q) ||
          s.recipientName.toLowerCase().includes(q)
        );
      });
    }
    if (statusFilter !== "all")
      filtered = filtered.filter((s) => s.status === statusFilter);
    setFilteredShipments(filtered);
    setCurrentPage(1);
  }, [searchQuery, statusFilter, shipments]);

  const totalPages = Math.ceil(filteredShipments.length / itemsPerPage);
  const paginatedShipments = filteredShipments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const stats = {
    total: shipments.length,
    transit: shipments.filter((s) => s.status === "in_transit").length,
    delivered: shipments.filter((s) => s.status === "delivered").length,
    pending: shipments.filter((s) => s.status === "pending").length,
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
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-40 bg-zinc-100 rounded-xl animate-pulse"
                    />
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
              <h1 className="text-xl font-semibold text-zinc-900 font-heading">
                My Shipments
              </h1>
              <p className="text-sm text-zinc-500 mt-0.5">
                Track and manage all your shipments
              </p>
            </div>
            <Link
              href="/quote"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white shadow-lg shadow-primary/20"
              style={{ backgroundColor: "var(--primary)" }}
            >
              <Plus className="w-4 h-4" />
              New Shipment
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3 space-y-4">
              {shipments.length > 0 ? (
                <>
                  <div className="bg-white rounded-lg border border-zinc-200/70 p-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                          type="text"
                          placeholder="Search by tracking number or recipient..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 bg-zinc-50 rounded-lg text-sm text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      </div>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2.5 bg-zinc-50 rounded-lg text-sm text-zinc-700 focus:outline-none"
                      >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="in_transit">In Transit</option>
                        <option value="delivered">Delivered</option>
                      </select>
                      <div className="flex items-center bg-zinc-100 rounded-lg p-0.5">
                        <button
                          onClick={() => setViewMode("grid")}
                          className={`p-1.5 rounded transition-all ${viewMode === "grid" ? "bg-white shadow-sm" : "text-zinc-500 hover:text-zinc-700"}`}
                        >
                          <Grid3X3
                            className="w-4 h-4"
                            style={
                              viewMode === "grid"
                                ? { color: "var(--primary)" }
                                : undefined
                            }
                          />
                        </button>
                        <button
                          onClick={() => setViewMode("list")}
                          className={`p-1.5 rounded transition-all ${viewMode === "list" ? "bg-white shadow-sm" : "text-zinc-500 hover:text-zinc-700"}`}
                        >
                          <List
                            className="w-4 h-4"
                            style={
                              viewMode === "list"
                                ? { color: "var(--primary)" }
                                : undefined
                            }
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  <AnimatePresence mode="wait">
                    {paginatedShipments.length > 0 ? (
                      viewMode === "grid" ? (
                        <motion.div
                          key="grid"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="grid grid-cols-1 md:grid-cols-2 gap-4"
                        >
                          {paginatedShipments.map((shipment) => (
                            <ShipmentCard
                              key={shipment.id}
                              shipment={shipment}
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
                          {paginatedShipments.map((shipment) => (
                            <ShipmentRow
                              key={shipment.id}
                              shipment={shipment}
                            />
                          ))}
                        </motion.div>
                      )
                    ) : (
                      <div className="text-center py-12 text-sm text-zinc-500">
                        No results found
                      </div>
                    )}
                  </AnimatePresence>

                  <div className="flex items-center justify-between bg-white rounded-lg border border-zinc-200/70 px-4 py-3">
                    <div className="text-xs text-zinc-500">
                      {filteredShipments.length > 0 ? (
                        <>
                          Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                          {Math.min(
                            currentPage * itemsPerPage,
                            filteredShipments.length,
                          )}{" "}
                          of {filteredShipments.length}
                        </>
                      ) : (
                        <>No items</>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() =>
                          setCurrentPage((p) => Math.max(1, p - 1))
                        }
                        disabled={currentPage === 1 || totalPages === 0}
                        className="p-1.5 rounded border border-zinc-200 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      {Array.from(
                        { length: Math.max(1, totalPages) },
                        (_, i) => i + 1,
                      ).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          disabled={totalPages === 0}
                          className={`w-7 h-7 rounded text-xs ${currentPage === page && totalPages > 0 ? "text-white" : "border border-zinc-200 hover:bg-zinc-50 text-zinc-700"}`}
                          style={
                            currentPage === page && totalPages > 0
                              ? { backgroundColor: "var(--primary)" }
                              : undefined
                          }
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        onClick={() =>
                          setCurrentPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={
                          currentPage === totalPages || totalPages === 0
                        }
                        className="p-1.5 rounded border border-zinc-200 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
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
