"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Search,
  ArrowRight,
  MapPin,
  Calendar,
  Weight,
  Shield as ShieldIcon,
  Zap,
  Star,
  Package as PackageIcon,
} from "lucide-react";
import Image from "next/image";
import ReactCountryFlag from "react-country-flag";

export default function HeroSection() {
  const [activeTab, setActiveTab] = useState<"track" | "quote">("track");
  const [trackingId, setTrackingId] = useState("");
  const [formData, setFormData] = useState({
    from: "",
    to: "",
    weight: "",
    date: "",
    service: "standard",
  });

  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  return (
    <motion.section
      style={{ opacity: heroOpacity, scale: heroScale }}
      className="relative min-h-screen overflow-hidden"
    >
      <div className="absolute inset-0 z-0">
        <motion.div
          className="relative w-full h-full"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5 }}
        >
          <Image
            src="/images/hero.png"
            alt="Logistics cargo port"
            fill
            className="object-cover"
            priority
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a1a1a] via-[#1a1a1a]/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a]/60 via-transparent to-transparent" />
        <div
          className="absolute bottom-0 left-0 right-0 h-32"
          style={{
            background:
              "linear-gradient(to top, rgba(20, 20, 20, 0.40) 0%, transparent 100%)",
          }}
        />
      </div>

      {/* Animated route lines */}
      <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden">
        <svg
          className="absolute top-1/4 right-1/3 w-96 h-96 opacity-[0.04]"
          viewBox="0 0 400 400"
          fill="none"
        >
          <circle cx="200" cy="200" r="180" stroke="white" strokeWidth="0.5" />
          <circle
            cx="200"
            cy="200"
            r="120"
            stroke="white"
            strokeWidth="0.5"
            strokeDasharray="4 8"
          />
          <circle cx="200" cy="200" r="60" stroke="white" strokeWidth="1" />
        </svg>
        <motion.svg
          className="absolute bottom-1/4 left-[15%] w-64 h-64 opacity-[0.03]"
          viewBox="0 0 300 300"
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        >
          <circle
            cx="150"
            cy="150"
            r="140"
            stroke="white"
            strokeWidth="0.5"
            strokeDasharray="2 6"
          />
          <circle cx="150" cy="150" r="90" stroke="white" strokeWidth="0.5" />
        </motion.svg>
      </div>

      {/* Radial glow behind content */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 80% at 30% 40%, rgba(40, 40, 40, 0.80) 0%, transparent 80%)",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        <div className="grid lg:grid-cols-12 gap-8 xl:gap-12 items-center min-h-[calc(100vh-6rem)]">
          {/* Left Content */}
          <div className="lg:col-span-7 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-white/[0.08]"
              style={{
                background:
                  "linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.02) 100%)",
              }}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              <span className="text-sm text-white/60 font-medium tracking-wide">
                Trusted by 5000+ customers worldwide
              </span>
            </motion.div>

            <div className="space-y-6">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="font-heading text-white leading-[1] -tracking-[1.76px] text-balance max-w-6xl mx-auto"
                style={{ fontSize: "clamp(2.5rem, 8vw, 3.5rem)" }}
              >
                Send Your Parcel{" "}
                <span className="text-primary">Anywhere Fast</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-base text-white/40 max-w-prose leading-relaxed"
              >
                Ship parcels from India to 200+ countries. Door-to-door pickup,
                real-time tracking, delivery you can count on.
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap gap-4"
            >
              <Link
                href="/register"
                className="group inline-flex items-center gap-2.5 px-7 py-3.5 text-sm font-semibold text-white rounded-xl transition-all duration-300 shadow-lg shadow-primary/25"
                style={{
                  background:
                    "linear-gradient(135deg, #e63329 0%, #cc2b22 100%)",
                }}
              >
                Get Started
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <button className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-white/[0.04] hover:bg-white/[0.08] text-sm font-medium text-white/80 hover:text-white rounded-xl border border-white/[0.08] hover:border-white/[0.15] transition-all duration-300 cursor-pointer">
                <Search className="w-3.5 h-3.5" />
                Track Shipment
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-wrap items-center gap-5 pt-6 border-t border-white/[0.06]"
            >
              <div className="flex items-center gap-2">
                <ShieldIcon className="w-4 h-4 text-primary" />
                <span className="text-sm text-white/40">Secure & Insured</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="text-sm text-white/40">Express Available</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-primary" />
                <span className="text-sm text-white/40">4.9/5 Rating</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.45 }}
              className="flex items-center gap-4"
            >
              <div className="flex -space-x-3">
                {[
                  { code: "FR", countryCode: "FR" },
                  { code: "CH", countryCode: "CH" },
                  { code: "BE", countryCode: "BE" },
                  { code: "US", countryCode: "US" },
                  { code: "UK", countryCode: "GB" },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 + i * 0.08 }}
                    className="w-9 h-9 rounded-full bg-white/[0.06] border-2 border-[#0a0a0a] flex items-center justify-center overflow-hidden"
                  >
                    <ReactCountryFlag
                      countryCode={item.countryCode}
                      svg
                      style={{
                        width: "1.5em",
                        height: "1.5em",
                      }}
                    />
                  </motion.div>
                ))}
              </div>
              <span className="text-xs text-white/30">
                Shipping to 150+ countries
              </span>
            </motion.div>
          </div>

          {/* Right - Widget Panel */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="lg:col-span-5 relative"
          >
            {/* Decorative glow behind widget */}
            <div className="absolute -inset-4 bg-primary/5 blur-3xl rounded-3xl" />
            <div className="relative bg-white/[0.03] backdrop-blur-2xl rounded-2xl border border-white/[0.06] shadow-2xl shadow-black/40 overflow-hidden">
              <div className="flex bg-white/[0.02] border-b border-white/[0.06]">
                <button
                  onClick={() => setActiveTab("track")}
                  className={`flex-1 px-5 py-4 text-xs font-semibold transition-all duration-300 cursor-pointer flex items-center justify-center gap-2.5 ${
                    activeTab === "track"
                      ? "bg-white/[0.04] text-white border-b-2 border-primary"
                      : "text-white/40 hover:text-white/70 hover:bg-white/[0.02]"
                  }`}
                >
                  <Search className="w-3.5 h-3.5" />
                  Track Package
                </button>
                <button
                  onClick={() => setActiveTab("quote")}
                  className={`flex-1 px-5 py-4 text-xs font-semibold transition-all duration-300 cursor-pointer flex items-center justify-center gap-2.5 ${
                    activeTab === "quote"
                      ? "bg-white/[0.04] text-white border-b-2 border-primary"
                      : "text-white/40 hover:text-white/70 hover:bg-white/[0.02]"
                  }`}
                >
                  <PackageIcon className="w-3.5 h-3.5" />
                  Get Quote
                </button>
              </div>

              <div className="p-6 md:p-7 space-y-5">
                {activeTab === "track" ? (
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-white/50 mb-2 tracking-wide uppercase">
                        Tracking Number
                      </label>
                      <div className="relative group">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-primary transition-colors" />
                        <input
                          type="text"
                          value={trackingId}
                          onChange={(e) => setTrackingId(e.target.value)}
                          placeholder="GT1234567890"
                          className="w-full pl-11 pr-4 py-3.5 bg-white/[0.04] border border-white/[0.06] rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:bg-white/[0.06] transition-all text-sm tracking-wider font-mono"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setTrackingId("")}
                        className="flex-1 py-3.5 bg-white/[0.04] hover:bg-white/[0.08] text-sm font-medium text-white/50 rounded-xl border border-white/[0.06] transition-all duration-300 cursor-pointer"
                      >
                        Clear
                      </button>
                      <button className="flex-[2] py-3.5 bg-primary hover:bg-[#172554] text-sm font-bold text-white rounded-xl transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-primary/20">
                        Track Now
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-[10px] text-center text-white/20 tracking-wide">
                      Enter your tracking ID to see real-time updates
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-white/50 mb-1.5">
                          From
                        </label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                          <input
                            type="text"
                            value={formData.from}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                from: e.target.value,
                              })
                            }
                            placeholder="City"
                            className="w-full pl-10 pr-3 py-3 bg-white/[0.04] border border-white/[0.06] rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:bg-white/[0.06] transition-all text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white/50 mb-1.5">
                          To
                        </label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                          <input
                            type="text"
                            value={formData.to}
                            onChange={(e) =>
                              setFormData({ ...formData, to: e.target.value })
                            }
                            placeholder="City"
                            className="w-full pl-10 pr-3 py-3 bg-white/[0.04] border border-white/[0.06] rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:bg-white/[0.06] transition-all text-sm"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-white/50 mb-1.5">
                          Weight (kg)
                        </label>
                        <div className="relative">
                          <Weight className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                          <input
                            type="text"
                            value={formData.weight}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                weight: e.target.value,
                              })
                            }
                            placeholder="0.0"
                            className="w-full pl-10 pr-3 py-3 bg-white/[0.04] border border-white/[0.06] rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:bg-white/[0.06] transition-all text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white/50 mb-1.5">
                          Date
                        </label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                          <input
                            type="date"
                            value={formData.date}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                date: e.target.value,
                              })
                            }
                            className="w-full pl-10 pr-3 py-3 bg-white/[0.04] border border-white/[0.06] rounded-xl text-white/60 focus:outline-none focus:border-primary/50 focus:bg-white/[0.06] transition-all text-xs [color-scheme:dark]"
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/50 mb-1.5">
                        Service Type
                      </label>
                      <select
                        value={formData.service}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            service: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.06] rounded-xl text-white/60 focus:outline-none focus:border-primary/50 focus:bg-white/[0.06] transition-all text-xs appearance-none cursor-pointer"
                      >
                        <option value="standard" className="bg-zinc-900">
                          Standard (5-10 days)
                        </option>
                        <option value="express" className="bg-zinc-900">
                          Express (2-3 days)
                        </option>
                        <option value="priority" className="bg-zinc-900">
                          Priority (24h)
                        </option>
                      </select>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            from: "",
                            to: "",
                            weight: "",
                            date: "",
                            service: "standard",
                          })
                        }
                        className="flex-1 py-3.5 bg-white/[0.04] hover:bg-white/[0.08] text-sm font-medium text-white/50 rounded-xl border border-white/[0.06] transition-all duration-300 cursor-pointer"
                      >
                        Clear
                      </button>
                      <button className="flex-[2] py-3.5 bg-primary hover:bg-[#172554] text-sm font-semibold text-white rounded-xl transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-primary/20">
                        Get Quote
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}
