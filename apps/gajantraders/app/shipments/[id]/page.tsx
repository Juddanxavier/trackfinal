"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useParams } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { ProtectedRoute } from "@/components/protected-route";
import Navbar from "@/components/Navbar";
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
  Package,
  Calendar,
  Truck,
  BadgeCheck,
  Route,
  Search,
  Weight,
  Hash,
  Headphones,
  ChevronRight,
} from "lucide-react";

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
  status: "pending" | "in_transit" | "delivered" | "cancelled" | "exception";
  goodsType?: string;
  weight?: number;
  createdAt: string;
  updatedAt?: string;
  deliveredAt?: string;
  events?: ShipmentEvent[];
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
};

function getCountryCode(country: string): string {
  return countryCodeMap[country] || country.slice(0, 2).toUpperCase();
}

const statusConfig: Record<
  string,
  { label: string; color: string; bg: string; border: string; dot: string }
> = {
  pending: {
    label: "Pending",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  in_transit: {
    label: "In Transit",
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    dot: "bg-blue-500",
  },
  delivered: {
    label: "Delivered",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  cancelled: {
    label: "Cancelled",
    color: "text-zinc-700",
    bg: "bg-zinc-100",
    border: "border-zinc-200",
    dot: "bg-zinc-400",
  },
  exception: {
    label: "Exception",
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    dot: "bg-red-500",
  },
};

function Skeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-3 space-y-4">
        <div className="h-44 bg-zinc-100 rounded-xl animate-pulse" />
        <div className="h-64 bg-zinc-100 rounded-xl animate-pulse" />
      </div>
      <div className="space-y-4">
        <div className="h-36 bg-zinc-100 rounded-xl animate-pulse" />
        <div className="h-44 bg-zinc-100 rounded-xl animate-pulse" />
        <div className="h-40 bg-zinc-100 rounded-xl animate-pulse" />
      </div>
    </div>
  );
}

function RouteVisual({
  origin,
  destination,
  originCity,
  destinationCity,
}: {
  origin: string;
  destination: string;
  originCity?: string;
  destinationCity?: string;
}) {
  const originCode = getCountryCode(origin);
  const destCode = getCountryCode(destination);

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex-1 text-center">
        <Image
          src={`https://flagcdn.com/w160/${originCode.toLowerCase()}.png`}
          alt={origin}
          width={56}
          height={38}
          className="rounded-lg ring-2 ring-zinc-100 mx-auto"
          unoptimized
        />
        <p className="text-sm font-semibold text-zinc-900 mt-1.5">{origin}</p>
        {originCity && <p className="text-xs text-zinc-500">{originCity}</p>}
      </div>

      <div className="flex flex-col items-center shrink-0">
        <div className="flex items-center gap-1">
          <div className="w-8 h-px bg-zinc-200" />
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shadow-lg shadow-primary/20"
            style={{ backgroundColor: "var(--primary)" }}
          >
            <Plane className="w-4 h-4 text-white rotate-45" />
          </div>
          <div className="w-8 h-px bg-zinc-200" />
        </div>
        <span className="text-[9px] text-zinc-300 mt-1 uppercase tracking-wider font-medium">
          Route
        </span>
      </div>

      <div className="flex-1 text-center">
        <Image
          src={`https://flagcdn.com/w160/${destCode.toLowerCase()}.png`}
          alt={destination}
          width={56}
          height={38}
          className="rounded-lg ring-2 ring-zinc-100 mx-auto"
          unoptimized
        />
        <p className="text-sm font-semibold text-zinc-900 mt-1.5">
          {destination}
        </p>
        {destinationCity && (
          <p className="text-xs text-zinc-500">{destinationCity}</p>
        )}
      </div>
    </div>
  );
}

function LatestUpdate({ event }: { event: ShipmentEvent }) {
  const date = new Date(event.timestamp);
  const formattedDate = date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });
  const formattedTime = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="rounded-lg p-3.5 border border-zinc-100 bg-zinc-50/50">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
          <MapPin className="w-4 h-4 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-blue-700">
              {event.status}
            </p>
            <span className="text-[10px] text-blue-400 bg-blue-100/60 px-1.5 py-0.5 rounded">
              {formattedDate} at {formattedTime}
            </span>
          </div>
          <p className="text-xs text-zinc-700 mt-0.5">{event.description}</p>
          {event.location && (
            <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
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
      <div className="absolute left-[15px] top-2.5 bottom-2.5 w-0.5 bg-zinc-200" />
      <div className="space-y-0">
        {events.map((event, index) => {
          const date = new Date(event.timestamp);
          const formattedDate = date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
          const formattedTime = date.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          });
          const isLatest = index === 0;

          return (
            <motion.div
              key={event.id || index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, ease: "easeOut" }}
              className="relative flex items-start gap-3.5 pb-5 last:pb-0"
            >
              <div className="relative z-10 w-[31px] shrink-0 flex justify-center">
                <div
                  className={`w-[31px] h-[31px] rounded-full flex items-center justify-center transition-all ${
                    isLatest
                      ? "text-white shadow-sm scale-110"
                      : "bg-white border-2 border-zinc-200"
                  }`}
                  style={
                    isLatest ? { backgroundColor: "var(--primary)" } : undefined
                  }
                >
                  {isLatest ? (
                    <CheckCircle className="w-3.5 h-3.5" />
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
                  )}
                </div>
              </div>
              <div className="flex-1 min-w-0 pt-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p
                    className={`text-xs font-semibold ${isLatest ? "text-zinc-900" : "text-zinc-700"}`}
                  >
                    {event.status}
                  </p>
                  <span
                    className={`text-[9px] px-1 py-0.5 rounded font-medium ${
                      isLatest
                        ? "text-zinc-700 bg-zinc-100"
                        : "bg-zinc-100 text-zinc-500"
                    }`}
                  >
                    {formattedDate}
                  </span>
                </div>
                <p className="text-xs text-zinc-700 mt-0.5">
                  {event.description}
                </p>
                <div className="flex items-center gap-2.5 mt-0.5">
                  {event.location && (
                    <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                      <MapPin className="w-2.5 h-2.5" /> {event.location}
                    </span>
                  )}
                  <span className="text-[10px] text-zinc-500">
                    {formattedTime}
                  </span>
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
    const token = searchParams.get("token");
    if (token) localStorage.setItem("gt_access_token", token);
  }, [searchParams]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id && !searchParams.get("token")) return;
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
    const trackingId =
      shipment?.whiteLabelTrackingCode ||
      shipment?.whiteLabelCode ||
      shipment?.trackingNumber ||
      "";
    if (trackingId) {
      navigator.clipboard.writeText(trackingId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-zinc-50">
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
        <div className="min-h-screen bg-zinc-50">
          <Navbar />
          <main className="max-w-6xl mx-auto px-4 pt-24 pb-8">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="w-20 h-20 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto mb-5">
                <Package className="w-10 h-10 text-zinc-300" />
              </div>
              <h2 className="text-lg font-semibold text-zinc-900 mb-1">
                Shipment not found
              </h2>
              <p className="text-sm text-zinc-500 mb-6 max-w-md mx-auto">
                The shipment you're looking for doesn't exist or has been
                removed.
              </p>
              <Link
                href="/shipments"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white shadow-lg shadow-primary/20"
                style={{ backgroundColor: "var(--primary)" }}
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Shipments
              </Link>
            </motion.div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  const config = statusConfig[shipment.status] || statusConfig.pending;
  const trackingId =
    shipment.whiteLabelTrackingCode ||
    shipment.whiteLabelCode ||
    shipment.trackingNumber;
  const createdDate = new Date(shipment.createdAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const latestEvent = shipment.events?.[0];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-zinc-50">
        <Navbar />

        <main className="max-w-6xl mx-auto px-4 pt-24 pb-8">
          <motion.div
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-4"
          >
            <Link
              href="/shipments"
              className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-700 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Shipments</span>
            </Link>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3 space-y-5">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl border border-zinc-200/70 overflow-hidden"
              >
                <div
                  className={`px-4 py-3 ${config.bg} ${config.border} flex items-center justify-between`}
                >
                  <div className="flex items-center gap-2">
                    {shipment.status === "pending" && (
                      <Clock className={`w-4 h-4 ${config.color}`} />
                    )}
                    {shipment.status === "in_transit" && (
                      <Truck className={`w-4 h-4 ${config.color}`} />
                    )}
                    {shipment.status === "delivered" && (
                      <BadgeCheck className={`w-4 h-4 ${config.color}`} />
                    )}
                    {shipment.status === "cancelled" && (
                      <XCircle className={`w-4 h-4 ${config.color}`} />
                    )}
                    {shipment.status === "exception" && (
                      <AlertTriangle className={`w-4 h-4 ${config.color}`} />
                    )}
                    <span className={`text-xs font-semibold ${config.color}`}>
                      {config.label}
                    </span>
                  </div>
                  <span
                    className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${config.bg} ${config.color} border ${config.border}`}
                  >
                    #{shipment.id.slice(0, 8).toUpperCase()}
                  </span>
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h1 className="text-lg font-semibold text-zinc-900 flex items-center gap-1.5">
                        <Hash className="w-4 h-4 text-zinc-300" />
                        {trackingId}
                      </h1>
                      <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Created {createdDate}
                      </p>
                    </div>
                    <button
                      onClick={copyTracking}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 rounded-lg text-xs font-medium text-zinc-700 transition-all active:scale-95"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      {copied ? "Copied!" : "Copy ID"}
                    </button>
                  </div>

                  <div className="py-4 px-3 bg-zinc-50/50 rounded-lg border border-zinc-100">
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
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 }}
                className="bg-white rounded-xl border border-zinc-200/70 overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-zinc-100">
                  <h3 className="text-xs font-semibold text-zinc-800 flex items-center gap-1.5">
                    <Route
                      className="w-3.5 h-3.5"
                      style={{ color: "var(--primary)" }}
                    />
                    Tracking History
                    {shipment.events && (
                      <span className="text-[10px] font-normal text-zinc-500 ml-0.5">
                        ({shipment.events.length} updates)
                      </span>
                    )}
                  </h3>
                </div>
                <div className="p-4">
                  {!shipment.events || shipment.events.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-14 h-14 rounded-xl bg-zinc-100 flex items-center justify-center mx-auto mb-3">
                        <Clock className="w-7 h-7 text-zinc-300" />
                      </div>
                      <p className="text-sm text-zinc-700 font-medium">
                        No tracking updates yet
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">
                        Updates will appear here once the shipment starts moving
                      </p>
                    </div>
                  ) : (
                    <TrackingTimeline events={shipment.events} />
                  )}
                </div>
              </motion.div>
            </div>

            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 }}
              >
                <div
                  className={`rounded-xl p-4 text-white overflow-hidden ${
                    shipment.status === "delivered"
                      ? "bg-emerald-700"
                      : shipment.status === "in_transit"
                        ? "bg-blue-700"
                        : shipment.status === "exception"
                          ? "bg-red-700"
                          : shipment.status === "cancelled"
                            ? "bg-zinc-600"
                            : "bg-amber-700"
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    {shipment.status === "pending" && (
                      <Clock className="w-4 h-4 text-amber-200" />
                    )}
                    {shipment.status === "in_transit" && (
                      <Truck className="w-4 h-4 text-blue-200" />
                    )}
                    {shipment.status === "delivered" && (
                      <BadgeCheck className="w-4 h-4 text-emerald-200" />
                    )}
                    {shipment.status === "cancelled" && (
                      <XCircle className="w-4 h-4 text-zinc-300" />
                    )}
                    {shipment.status === "exception" && (
                      <AlertTriangle className="w-4 h-4 text-red-200" />
                    )}
                    <span className="text-xs font-medium text-white/80">
                      {config.label}
                    </span>
                  </div>
                  <p className="text-lg font-bold tracking-tight font-heading">
                    {trackingId}
                  </p>
                  <p className="text-xs text-white/60 mt-0.5">
                    {shipment.originCountry} → {shipment.destinationCountry}
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.16 }}
                className="bg-white rounded-xl border border-zinc-200/70 overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-zinc-100">
                  <h3 className="text-xs font-semibold text-zinc-800 flex items-center gap-1.5">
                    <Package
                      className="w-3.5 h-3.5"
                      style={{ color: "var(--primary)" }}
                    />
                    Shipment Info
                  </h3>
                </div>
                <div className="divide-y divide-zinc-50">
                  <div className="px-4 py-3 flex items-center justify-between">
                    <span className="text-xs text-zinc-500">Weight</span>
                    <span className="text-sm font-semibold text-zinc-900">
                      {shipment.weight ? `${shipment.weight} kg` : "—"}
                    </span>
                  </div>
                  <div className="px-4 py-3 flex items-center justify-between">
                    <span className="text-xs text-zinc-500">Goods Type</span>
                    <span className="text-sm font-semibold text-zinc-900">
                      {shipment.goodsType || "—"}
                    </span>
                  </div>
                  <div className="px-4 py-3 flex items-center justify-between">
                    <span className="text-xs text-zinc-500">Carrier</span>
                    <span className="text-sm font-semibold text-zinc-900">
                      {shipment.carrierCode || "—"}
                    </span>
                  </div>
                  <div className="px-4 py-3 flex items-center justify-between">
                    <span className="text-xs text-zinc-500">Created</span>
                    <span className="text-sm font-semibold text-zinc-900">
                      {createdDate}
                    </span>
                  </div>
                  {shipment.deliveredAt && (
                    <div className="px-4 py-3 flex items-center justify-between bg-emerald-50/50">
                      <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                        <BadgeCheck className="w-3 h-3" />
                        Delivered
                      </span>
                      <span className="text-sm font-semibold text-emerald-700">
                        {new Date(shipment.deliveredAt).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric", year: "numeric" },
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl border border-zinc-200/70 overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-zinc-100">
                  <h3 className="text-xs font-semibold text-zinc-800 flex items-center gap-1.5">
                    <User
                      className="w-3.5 h-3.5"
                      style={{ color: "var(--primary)" }}
                    />
                    Recipient
                  </h3>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-3 pb-3 border-b border-zinc-50">
                    <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-zinc-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-zinc-900 truncate">
                        {shipment.recipientName}
                      </p>
                      {shipment.recipientEmail && (
                        <p className="text-xs text-zinc-500 truncate mt-px">
                          {shipment.recipientEmail}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    {shipment.recipientPhone && (
                      <a
                        href={`tel:${shipment.recipientPhone}`}
                        className="flex items-center gap-2.5 text-xs text-zinc-700 hover:text-zinc-900 transition-colors"
                      >
                        <div className="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
                          <Phone className="w-3.5 h-3.5 text-zinc-500" />
                        </div>
                        <span>{shipment.recipientPhone}</span>
                      </a>
                    )}
                    {shipment.recipientAddress && (
                      <div className="flex items-start gap-2.5 text-xs text-zinc-700">
                        <div className="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                        </div>
                        <span className="leading-relaxed">
                          {shipment.recipientAddress}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.24 }}
              >
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
                      Need Help?
                    </h3>
                    <p className="text-zinc-500 text-xs mt-0.5">
                      Free packing on all shipments
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Link
                      href="/track"
                      className="flex items-center justify-between w-full py-2 px-3.5 bg-white/10 hover:bg-white/15 rounded-lg text-xs font-medium transition-all"
                    >
                      <span className="flex items-center gap-2">
                        <Search className="w-3.5 h-3.5 text-zinc-500" />
                        Track Another Package
                      </span>
                      <ChevronRight className="w-3 h-3 text-zinc-700" />
                    </Link>
                    <Link
                      href="/support"
                      className="flex items-center justify-between w-full py-2 px-3.5 bg-white/10 hover:bg-white/15 rounded-lg text-xs font-medium transition-all"
                    >
                      <span className="flex items-center gap-2">
                        <Headphones className="w-3.5 h-3.5 text-zinc-500" />
                        Get Support
                      </span>
                      <ChevronRight className="w-3 h-3 text-zinc-700" />
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
