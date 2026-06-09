"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ArrowRight,
  MapPin,
  Clock,
  Truck,
  Package,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronRight,
  HelpCircle,
  Phone,
  Mail,
  Globe,
  ShieldCheck,
  Headphones,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import ReactCountryFlag from "react-country-flag";

interface ShipmentEvent {
  id: string;
  status: string;
  description: string;
  location?: string;
  timestamp: string;
}

interface TrackingResult {
  trackingNumber: string;
  carrierCode: string;
  carrierName: string | null;
  status: "pending" | "in_transit" | "delivered" | "cancelled" | "exception";
  originCountry: string;
  destinationCountry: string;
  recipientName: string;
  createdAt: string;
  updatedAt: string;
  deliveredAt?: string;
  events: ShipmentEvent[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

const statusConfig: Record<
  string,
  { label: string; icon: any; color: string; gradient: string }
> = {
  pending: {
    label: "Pending",
    icon: Clock,
    color: "text-amber-600",
    gradient: "from-amber-50 via-amber-50/80 to-amber-100/30",
  },
  in_transit: {
    label: "In Transit",
    icon: Truck,
    color: "text-blue-600",
    gradient: "from-blue-50 via-blue-50/80 to-blue-100/30",
  },
  delivered: {
    label: "Delivered",
    icon: CheckCircle,
    color: "text-emerald-600",
    gradient: "from-emerald-50 via-emerald-50/80 to-emerald-100/30",
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    color: "text-zinc-700",
    gradient: "from-zinc-50 via-zinc-50/80 to-zinc-100/30",
  },
  exception: {
    label: "Exception",
    icon: AlertTriangle,
    color: "text-red-600",
    gradient: "from-red-50 via-red-50/80 to-red-100/30",
  },
};

const countryToFlag: Record<string, string> = {
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

function formatDate(ts: string) {
  const d = new Date(ts);
  return {
    date: d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    time: d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
  };
}

const faqs = [
  {
    q: "Where do I find my tracking number?",
    a: 'It is in the shipment confirmation email or SMS you received when your package was dispatched. It is a 12-digit alphanumeric code starting with "GT".',
  },
  {
    q: "How often is tracking information updated?",
    a: "Tracking is updated in real-time at every checkpoint. You will see updates within minutes of each scan at pickup, departure, transit, customs, and delivery.",
  },
  {
    q: "What if my tracking number is not found?",
    a: "It can take up to 24 hours after dispatch for the tracking number to activate in the system. If it still does not work after 24 hours, contact our support team.",
  },
  {
    q: "Can I track multiple shipments at once?",
    a: "Yes, you can track multiple shipments by entering each tracking number separately. You can also view all your active shipments on the My Shipments page.",
  },
  {
    q: "What do the different statuses mean?",
    a: 'Each status represents a checkpoint: "Picked Up" means we have your package, "In Transit" means it is moving, "Customs" means it is being cleared, and "Delivered" means it has arrived.',
  },
];

function TrackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const codeParam = searchParams?.get("code") || "";

  const [code, setCode] = useState(codeParam);
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [loading, setLoading] = useState(!!codeParam);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(!!codeParam);

  useEffect(() => {
    if (!codeParam) return;
    setCode(codeParam);
    fetchTracking(codeParam);
  }, [codeParam]);

  const fetchTracking = async (trackingCode: string) => {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch(
        `${API_URL}/shipments/public/track/${trackingCode}`,
      );
      if (!res.ok) {
        if (res.status === 404) throw new Error("Shipment not found");
        throw new Error("Failed to fetch tracking data");
      }
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;
    setSearched(true);
    router.push(`/track?code=${encodeURIComponent(trimmed)}`, {
      scroll: false,
    });
  };

  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 16 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-40px" },
    transition: { duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] },
  });

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-zinc-50">
        {/* Search Section */}
        <section className="bg-zinc-50 pt-36 lg:pt-44 pb-16 overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="flex items-center gap-3 mb-5">
                  <Package className="w-5 h-5 text-primary" />
                  <span className="text-primary text-sm font-semibold tracking-[0.2em] uppercase">
                    Track a Shipment
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-zinc-900 leading-[0.95] tracking-tight font-heading max-w-3xl">
                  Track Your Shipment
                </h1>
                <p className="text-base sm:text-lg text-zinc-700 max-w-2xl mt-6 leading-relaxed">
                  Enter your tracking number or whitelabel ID to see real-time
                  delivery status and shipment timeline.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15 }}
              >
                <div className="bg-white rounded-2xl p-6 md:p-8 border border-zinc-100 hover:border-primary/20 transition-all duration-300">
                  <form onSubmit={handleSubmit} className="space-y-3.5">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-300 pointer-events-none" />
                      <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="Enter tracking or whitelabel ID"
                        className="w-full pl-12 pr-4 py-3.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-sm"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!code.trim() || loading}
                      className="w-full py-3.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer"
                      style={{
                        background:
                          !code.trim() || loading
                            ? "#e63329"
                            : "linear-gradient(135deg, #e63329 0%, #cc2b22 100%)",
                      }}
                    >
                      {loading ? "Searching..." : "Track Shipment"}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Results Section */}
        <section className="pb-16 lg:pb-24 px-6 lg:px-8 bg-zinc-50">
          <div
            className={
              result && !loading ? "max-w-7xl mx-auto" : "max-w-3xl mx-auto"
            }
          >
            {!searched && !loading && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.2,
                  duration: 0.5,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="bg-white rounded-2xl p-12 md:p-16 text-center border border-zinc-100 hover:border-primary/20 transition-all duration-300"
              >
                <div className="flex items-center justify-center gap-4 mb-6">
                  {[
                    { icon: Clock, color: "text-amber-300" },
                    { icon: Truck, color: "text-blue-300" },
                    { icon: CheckCircle, color: "text-emerald-300" },
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      className="w-14 h-14 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center"
                    >
                      <item.icon className={`w-6 h-6 ${item.color}`} />
                    </motion.div>
                  ))}
                </div>
                <h2 className="text-lg font-semibold text-zinc-900 mb-2">
                  Awaiting input
                </h2>
                <p className="text-sm text-zinc-700 max-w-xs mx-auto leading-relaxed">
                  Enter a tracking number above to see real-time shipment
                  status, timeline, and delivery details.
                </p>
                <div className="flex items-center justify-center gap-1.5 mt-6 text-sm text-zinc-400">
                  <ArrowRight className="w-3 h-3" />
                  <span>Paste your number in the field above</span>
                </div>
              </motion.div>
            )}

            {loading && (
              <div className="space-y-4">
                <div className="h-32 bg-white rounded-2xl animate-pulse border border-zinc-100" />
                <div className="h-48 bg-white rounded-2xl animate-pulse border border-zinc-100" />
              </div>
            )}

            {error && !loading && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="bg-white rounded-2xl p-12 md:p-16 text-center border border-zinc-100"
              >
                <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-5">
                  <Package className="w-8 h-8 text-red-300" />
                </div>
                <h2 className="text-lg font-semibold text-zinc-900 mb-1">
                  Shipment not found
                </h2>
                <p className="text-sm text-zinc-700 mb-6 max-w-xs mx-auto leading-relaxed">
                  No shipment found with that ID. Please check the number and
                  try again.
                </p>
                <button
                  onClick={() => {
                    setError("");
                    setCode("");
                    setSearched(false);
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white cursor-pointer"
                  style={{
                    background:
                      "linear-gradient(135deg, #e63329 0%, #cc2b22 100%)",
                  }}
                >
                  Try Again
                </button>
              </motion.div>
            )}

            {result && !loading && (
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-5">
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="bg-white rounded-2xl overflow-hidden border border-zinc-100 hover:border-primary/20 transition-all duration-300"
                  >
                    <div
                      className={`bg-gradient-to-r ${statusConfig[result.status]?.gradient || "from-zinc-50"} px-5 md:px-6 py-4 flex items-center justify-between`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center bg-white shadow-sm ${statusConfig[result.status]?.color || "text-zinc-700"}`}
                        >
                          {React.createElement(
                            statusConfig[result.status]?.icon || Package,
                            { className: "w-5 h-5" },
                          )}
                        </div>
                        <div>
                          <p
                            className={`text-sm font-semibold ${statusConfig[result.status]?.color || "text-zinc-700"}`}
                          >
                            {statusConfig[result.status]?.label || "Unknown"}
                          </p>
                          <p className="text-sm text-zinc-400 mt-0.5 font-mono tracking-wider">
                            {result.trackingNumber}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-zinc-400">
                        Updated {formatDate(result.updatedAt).date}
                      </span>
                    </div>

                    <div className="px-5 md:px-6 py-6">
                      <div className="flex items-center justify-between gap-4">
                        <div className="text-center flex-1">
                          <p className="text-sm text-zinc-500 uppercase tracking-wider mb-2">
                            Origin
                          </p>
                          <div className="flex items-center justify-center gap-2">
                            {countryToFlag[result.originCountry] && (
                              <ReactCountryFlag
                                countryCode={
                                  countryToFlag[result.originCountry]
                                }
                                svg
                                style={{
                                  width: "1.25em",
                                  height: "1.25em",
                                  borderRadius: "2px",
                                }}
                              />
                            )}
                            <p className="text-sm font-semibold text-zinc-900">
                              {result.originCountry}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="w-12 md:w-20 h-px bg-gradient-to-r from-zinc-200 via-primary/30 to-zinc-200" />
                          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-primary shadow-sm">
                            <Package className="w-5 h-5 text-white" />
                          </div>
                          <div className="w-12 md:w-20 h-px bg-gradient-to-r from-zinc-200 via-primary/30 to-zinc-200" />
                        </div>
                        <div className="text-center flex-1">
                          <p className="text-sm text-zinc-500 uppercase tracking-wider mb-2">
                            Destination
                          </p>
                          <div className="flex items-center justify-center gap-2">
                            {countryToFlag[result.destinationCountry] && (
                              <ReactCountryFlag
                                countryCode={
                                  countryToFlag[result.destinationCountry]
                                }
                                svg
                                style={{
                                  width: "1.25em",
                                  height: "1.25em",
                                  borderRadius: "2px",
                                }}
                              />
                            )}
                            <p className="text-sm font-semibold text-zinc-900">
                              {result.destinationCountry}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.5,
                      delay: 0.08,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="bg-white rounded-2xl overflow-hidden border border-zinc-100 hover:border-primary/20 transition-all duration-300"
                  >
                    <div className="px-5 md:px-6 py-4 border-b border-zinc-100">
                      <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-zinc-400" />
                        <span className="text-sm font-semibold text-zinc-900">
                          Tracking Timeline
                        </span>
                        {result.events.length > 0 && (
                          <span className="text-xs text-zinc-400">
                            ({result.events.length} events)
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="px-5 md:px-6 py-5">
                      {result.events.length === 0 ? (
                        <div className="text-center py-10">
                          <div className="w-12 h-12 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center mx-auto mb-3">
                            <Clock className="w-6 h-6 text-zinc-300" />
                          </div>
                          <p className="text-sm text-zinc-700 font-medium">
                            No tracking updates yet
                          </p>
                          <p className="text-xs text-zinc-400 mt-1">
                            Updates will appear once the shipment starts moving
                          </p>
                        </div>
                      ) : (
                        <div className="relative">
                          <div
                            className="absolute left-[17px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-primary via-zinc-200 to-zinc-200"
                            aria-hidden="true"
                          />
                          <div className="space-y-0">
                            {result.events.map((event, index) => {
                              const { date, time } = formatDate(
                                event.timestamp,
                              );
                              const isLatest = index === 0;
                              return (
                                <motion.div
                                  key={event.id || index}
                                  initial={{ opacity: 0, x: -8 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{
                                    delay: 0.15 + index * 0.06,
                                    duration: 0.4,
                                  }}
                                  className="relative flex items-start gap-4 pb-7 last:pb-0 group"
                                >
                                  <div className="relative z-10 shrink-0 flex justify-center pt-0.5">
                                    {isLatest ? (
                                      <div className="w-[34px] h-[34px] rounded-full flex items-center justify-center ring-4 ring-white bg-primary shadow-sm group-hover:scale-110 transition-transform duration-300">
                                        <div className="w-2.5 h-2.5 rounded-full bg-white" />
                                      </div>
                                    ) : (
                                      <div className="w-[34px] h-[34px] rounded-full flex items-center justify-center bg-zinc-100 group-hover:bg-zinc-200 transition-colors duration-300">
                                        <div className="w-2.5 h-2.5 rounded-full bg-primary/60" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0 pt-1.5">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <p
                                        className={`text-sm font-semibold ${isLatest ? "text-zinc-900" : "text-zinc-700"}`}
                                      >
                                        {event.status}
                                      </p>
                                      <span
                                        className={`text-sm px-2 py-0.5 rounded font-medium ${
                                          isLatest
                                            ? "bg-primary/10 text-primary"
                                            : "bg-zinc-100 text-zinc-700"
                                        }`}
                                      >
                                        {date}
                                      </span>
                                    </div>
                                    <p className="text-sm text-zinc-700 mt-0.5">
                                      {event.description}
                                    </p>
                                    <div className="flex items-center gap-3 mt-1">
                                      {event.location && (
                                        <span className="text-sm text-zinc-400 flex items-center gap-1">
                                          <MapPin className="w-3 h-3" />{" "}
                                          {event.location}
                                        </span>
                                      )}
                                      <span className="text-sm text-zinc-400">
                                        {time}
                                      </span>
                                    </div>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.5,
                      delay: 0.24,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="bg-gradient-to-br from-zinc-50 to-zinc-100 rounded-2xl p-6 md:p-8 text-center border border-zinc-200/50"
                  >
                    <Headphones className="w-8 h-8 text-zinc-400 mx-auto mb-3" />
                    <h3 className="text-sm font-semibold text-zinc-900 mb-1">
                      Need help with your shipment?
                    </h3>
                    <p className="text-sm text-zinc-700 max-w-sm mx-auto leading-relaxed mb-4">
                      Our support team is available 24/7 to assist with any
                      delivery questions.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-3">
                      <a
                        href="mailto:support@gajantraders.com"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-zinc-200 text-sm font-semibold text-zinc-700 hover:border-primary/30 hover:text-primary transition-all duration-300"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        Email Support
                      </a>
                      <a
                        href="tel:+1234567890"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-zinc-200 text-sm font-semibold text-zinc-700 hover:border-primary/30 hover:text-primary transition-all duration-300"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        Call Support
                      </a>
                    </div>
                  </motion.div>
                </div>

                <aside className="lg:col-span-1 space-y-4">
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.5,
                      delay: 0.16,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="bg-white rounded-2xl overflow-hidden border border-zinc-100 hover:border-primary/20 transition-all duration-300"
                  >
                    <div className="px-5 md:px-6 py-4 border-b border-zinc-100">
                      <div className="flex items-center gap-3">
                        <Package className="w-4 h-4 text-zinc-400" />
                        <span className="text-sm font-semibold text-zinc-900">
                          Shipment Details
                        </span>
                      </div>
                    </div>
                    <div className="px-5 md:px-6 py-5">
                      <div className="grid grid-cols-2 gap-y-5 gap-x-6">
                        <div>
                          <p className="text-sm text-zinc-500 uppercase tracking-wider mb-1.5">
                            Recipient
                          </p>
                          <p className="text-sm text-zinc-900 font-medium">
                            {result.recipientName}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-zinc-500 uppercase tracking-wider mb-1.5">
                            Carrier
                          </p>
                          <p className="text-sm text-zinc-900 font-medium">
                            {result.carrierName ||
                              result.carrierCode ||
                              "\u2014"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-zinc-500 uppercase tracking-wider mb-1.5">
                            Created
                          </p>
                          <p className="text-sm text-zinc-900 font-medium">
                            {formatDate(result.createdAt).date}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-zinc-500 uppercase tracking-wider mb-1.5">
                            Status
                          </p>
                          <p
                            className={`text-sm font-medium ${statusConfig[result.status]?.color || "text-zinc-900"}`}
                          >
                            {statusConfig[result.status]?.label || "Unknown"}
                          </p>
                        </div>
                        {result.deliveredAt && (
                          <>
                            <div>
                              <p className="text-sm text-zinc-500 uppercase tracking-wider mb-1.5">
                                Delivered
                              </p>
                              <p className="text-sm font-medium text-zinc-900">
                                {formatDate(result.deliveredAt).date}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-zinc-500 uppercase tracking-wider mb-1.5">
                                Last Location
                              </p>
                              <p className="text-sm text-zinc-900 font-medium">
                                {result.events[0].location}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>

                  <div className="flex items-center gap-2 mb-1">
                    <HelpCircle className="w-4 h-4 text-primary" />
                    <span className="text-primary text-sm font-semibold tracking-[0.2em] uppercase">
                      Quick Links
                    </span>
                  </div>
                  {[
                    {
                      icon: HelpCircle,
                      title: "Find tracking number",
                      desc: "Check your confirmation email or SMS for the 12-digit GT code.",
                    },
                    {
                      icon: Clock,
                      title: "Delivery times",
                      desc: "Express 2-5 days, Standard 7-15 days to most countries.",
                    },
                    {
                      icon: Globe,
                      title: "Global coverage",
                      desc: "200+ countries and territories with real-time tracking.",
                    },
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.25 + i * 0.06, duration: 0.4 }}
                      className="bg-white rounded-xl p-4 border border-zinc-100 hover:border-primary/20 transition-all duration-300"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center shrink-0">
                          <item.icon className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-semibold text-zinc-900">
                            {item.title}
                          </h4>
                          <p className="text-[11px] text-zinc-700 mt-0.5 leading-relaxed">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  <motion.div
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4, duration: 0.4 }}
                    className="bg-gradient-to-br from-primary/5 to-primary/[0.02] rounded-xl p-4 border border-primary/10"
                  >
                    <h4 className="text-sm font-semibold text-zinc-900 mb-2">
                      Contact support
                    </h4>
                    <p className="text-[11px] text-zinc-700 leading-relaxed mb-3">
                      Available 24/7 for tracking issues and delivery questions.
                    </p>
                    <div className="space-y-2">
                      <a
                        href="mailto:support@gajantraders.com"
                        className="flex items-center gap-2 text-[11px] text-zinc-700 hover:text-primary transition-colors"
                      >
                        <Mail className="w-3 h-3" />
                        support@gajantraders.com
                      </a>
                      <a
                        href="tel:+1234567890"
                        className="flex items-center gap-2 text-[11px] text-zinc-700 hover:text-primary transition-colors"
                      >
                        <Phone className="w-3 h-3" />
                        +1 234 567 890
                      </a>
                    </div>
                  </motion.div>
                </aside>
              </div>
            )}
          </div>
        </section>

        {!searched && (
          <section className="pb-14 lg:pb-20 px-6 lg:px-8 bg-zinc-50">
            <div className="max-w-7xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="flex items-center gap-3 mb-8">
                  <HelpCircle className="w-5 h-5 text-primary" />
                  <span className="text-primary text-sm font-semibold tracking-[0.2em] uppercase">
                    Quick Guide
                  </span>
                </div>
              </motion.div>
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  {
                    icon: HelpCircle,
                    title: "Find your tracking number",
                    desc: 'Located in your shipment confirmation email or SMS. It is a 12-digit code starting with "GT".',
                  },
                  {
                    icon: Clock,
                    title: "Delivery times",
                    desc: "Express 2-5 days, Standard 7-15 days to most countries worldwide.",
                  },
                  {
                    icon: Globe,
                    title: "Global coverage",
                    desc: "200+ countries and territories delivered with real-time tracking.",
                  },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{
                      duration: 0.5,
                      delay: i * 0.08,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="bg-white rounded-2xl p-6 border border-zinc-100 hover:border-primary/20 hover:shadow-sm transition-all duration-300"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mb-4">
                      <item.icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="text-sm font-semibold text-zinc-900">
                      {item.title}
                    </h3>
                    <p className="text-sm text-zinc-700 mt-1.5 leading-relaxed">
                      {item.desc}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="py-14 lg:py-20 px-6 lg:px-8 bg-white">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="flex items-center gap-3 mb-5 justify-center">
                <HelpCircle className="w-5 h-5 text-primary" />
                <span className="text-primary text-sm font-semibold tracking-[0.2em] uppercase">
                  Help Center
                </span>
              </div>
              <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-zinc-900 leading-[1.1] tracking-tight font-heading text-center">
                Tracking FAQs
              </h2>
            </motion.div>
            <div className="mt-10 space-y-3">
              {faqs.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{
                    duration: 0.5,
                    delay: i * 0.06,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                >
                  <details className="group bg-zinc-50 rounded-xl overflow-hidden border border-zinc-100 hover:border-zinc-200 transition-all duration-300">
                    <summary className="flex items-center justify-between px-5 md:px-6 py-4 cursor-pointer list-none hover:bg-zinc-100/50 transition-colors">
                      <span className="text-sm font-semibold text-zinc-900 pr-4">
                        {item.q}
                      </span>
                      <ChevronRight className="w-4 h-4 text-zinc-400 transition-transform duration-200 group-open:rotate-90 shrink-0" />
                    </summary>
                    <div className="px-5 md:px-6 pb-4 md:pb-5">
                      <p className="text-sm text-zinc-700 leading-relaxed max-w-prose">
                        {item.a}
                      </p>
                    </div>
                  </details>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

export default function TrackPage() {
  return (
    <Suspense>
      <TrackContent />
    </Suspense>
  );
}
