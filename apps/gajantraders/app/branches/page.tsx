"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  ArrowRight,
  Building2,
  Globe,
  Star,
  ChevronRight,
  Navigation,
  HeadphonesIcon,
  Package,
  Shield,
  Search,
  X,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { WorldMap } from "@/components/WorldMap";

const fadeIn = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.5 },
};

const stagger = {
  whileInView: { transition: { staggerChildren: 0.08 } },
  viewport: { once: true },
};

interface Branch {
  city: string;
  state: string;
  address: string;
  phone: string;
  email: string;
  hours: string;
  contactPerson?: string;
  landline?: string;
  isHeadOffice?: boolean;
}

const branches: Branch[] = [
  {
    city: "Trichy",
    state: "Tamil Nadu",
    address:
      "No 18, 3rd Main Road, Srinivasa Nagar, Vayalur Road, Trichy 620017",
    phone: "+91 90033 72780 / +91 95661 56719",
    email: "trichy@gajantraders.com",
    hours: "Mon-Sat: 9:30 AM - 6:30 PM",
    contactPerson: "Kajan",
    isHeadOffice: true,
  },
  {
    city: "Salem",
    state: "Tamil Nadu",
    address: "286-A Gandhi Nagar, Edanganasalai, Elampillai 637502, Salem",
    phone: "+91 90033 62630 / +91 95661 56719",
    email: "salem@gajantraders.com",
    hours: "Mon-Sat: 9:30 AM - 6:30 PM",
    contactPerson: "Kajan",
  },
  {
    city: "Chennai",
    state: "Tamil Nadu",
    address: "104/246, Adam Sahib Street, Royapuram, Chennai 600013",
    phone: "+91 77081 52719 / +91 95008 11847",
    email: "chennai@gajantraders.com",
    hours: "Mon-Sat: 9:30 AM - 6:30 PM",
    contactPerson: "Kajan",
  },
  {
    city: "Chennai",
    state: "Tamil Nadu",
    address:
      "137/70 (First Floor), L.D.G Road, Little Mount, Saidapet, Chennai 600015",
    phone: "+91 72001 58309 / +91 90033 67790",
    email: "chennai2@gajantraders.com",
    hours: "Mon-Sat: 9:30 AM - 6:30 PM",
    contactPerson: "Kajan",
    landline: "044 22201719",
  },
];

const states = [...new Set(branches.map((b) => b.state))];

export default function BranchesPage() {
  const branchMarkers = branches.map((b) => {
    const coords: Record<string, [number, number]> = {
      Trichy: [10.79, 78.7],
      Salem: [11.65, 78.16],
      Chennai: [13.08, 80.27],
    };
    return {
      id: b.city.toLowerCase().replace(/\s/g, ""),
      location: coords[b.city] || [13.08, 80.27],
    };
  });
  const [activeState, setActiveState] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredBranches = branches.filter((b) => {
    const matchesState = activeState === "All" || b.state === activeState;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      b.city.toLowerCase().includes(q) ||
      b.state.toLowerCase().includes(q) ||
      b.address.toLowerCase().includes(q) ||
      b.contactPerson?.toLowerCase().includes(q);
    return matchesState && matchesSearch;
  });

  const headOffice = branches.find((b) => b.isHeadOffice);
  const otherBranches = filteredBranches.filter((b) => !b.isHeadOffice);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ===== HERO ===== */}
      <section className="bg-zinc-50 pt-36 lg:pt-44 pb-16 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
            >
              <span className="text-primary text-sm font-semibold tracking-[0.2em] uppercase block mb-4">
                Our Network
              </span>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-zinc-900 leading-[0.95] tracking-tight font-heading">
                Find a Gajan Traders branch near you
              </h1>
              <p className="text-lg sm:text-xl text-zinc-700 max-w-2xl mt-6 leading-relaxed">
                With {branches.length} locations across Tamil Nadu serving local
                and international shipping needs. Visit any branch for
                international shipping, tracking support, and expert guidance.
              </p>
              <div className="flex flex-wrap gap-4 mt-8">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-[#172554] text-sm font-bold text-white uppercase tracking-wider transition-all duration-300 rounded-lg"
                >
                  Get a Quote <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 px-6 py-3 border border-zinc-300 text-zinc-700 hover:text-zinc-900 hover:border-zinc-400 text-sm font-semibold uppercase tracking-wider transition-all duration-300 rounded-lg"
                >
                  Contact Support
                </Link>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.7,
                delay: 0.15,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="hidden lg:flex justify-end"
            >
              <WorldMap
                size={520}
                markers={branchMarkers}
                markerColor={[0.9, 0.2, 0.16]}
                arcs={[]}
                phi={1.2}
                theta={0.4}
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== HEAD OFFICE ===== */}
      {headOffice && (
        <section className="py-14 lg:py-20">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <motion.div
              {...fadeIn}
              className="text-center max-w-xl mx-auto mb-12"
            >
              <span className="text-primary text-sm font-semibold tracking-[0.2em] uppercase block mb-4">
                Head Office
              </span>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-zinc-900 leading-[0.95] tracking-tight font-heading">
                Our main office in Trichy
              </h2>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-zinc-50 border border-zinc-200 rounded-2xl overflow-hidden"
            >
              <div className="grid lg:grid-cols-5">
                <div className="lg:col-span-3 p-8 md:p-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-zinc-900">
                        {headOffice.city}
                      </h3>
                      <div className="flex items-center gap-1.5 text-sm text-primary font-medium">
                        <Star className="w-3 h-3 fill-primary" />
                        <span>Main Office</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <p className="text-base text-zinc-700 leading-relaxed">
                          {headOffice.address}
                        </p>
                      </div>
                      <a
                        href={`tel:${headOffice.phone.replace(/\s/g, "")}`}
                        className="flex items-center gap-3 text-base text-zinc-700 hover:text-primary transition-colors"
                      >
                        <Phone className="w-4 h-4 text-primary shrink-0" />
                        <span>{headOffice.phone}</span>
                      </a>
                      <a
                        href={`mailto:${headOffice.email}`}
                        className="flex items-center gap-3 text-base text-zinc-700 hover:text-primary transition-colors"
                      >
                        <Mail className="w-4 h-4 text-primary shrink-0" />
                        <span>{headOffice.email}</span>
                      </a>
                      <div className="flex items-center gap-3 text-base text-zinc-700">
                        <Clock className="w-4 h-4 text-primary shrink-0" />
                        <span>{headOffice.hours}</span>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-zinc-700 uppercase tracking-wider mb-3">
                        Why Gajan Traders
                      </h4>
                      <ul className="space-y-2.5">
                        {[
                          { icon: Package, text: "Free premium packaging" },
                          { icon: Shield, text: "Customs-cleared delivery" },
                          { icon: Globe, text: "200+ country coverage" },
                          { icon: Clock, text: "Real-time tracking" },
                          {
                            icon: HeadphonesIcon,
                            text: "24/7 customer support",
                          },
                        ].map((item, i) => (
                          <li
                            key={i}
                            className="flex items-center gap-2 text-base text-zinc-700"
                          >
                            <item.icon className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span>{item.text}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 mt-8 pt-6 border-t border-zinc-200">
                    <a
                      href="https://maps.google.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-[#172554] text-sm font-bold text-white uppercase tracking-wider transition-all duration-300 rounded-lg"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      Get Directions
                    </a>
                    <a
                      href="tel:+912223445678"
                      className="inline-flex items-center gap-2 px-5 py-2.5 border border-zinc-300 text-zinc-700 hover:text-zinc-900 hover:border-zinc-400 text-sm font-semibold uppercase tracking-wider transition-all duration-300 rounded-lg"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      Call Now
                    </a>
                  </div>
                </div>

                <div className="lg:col-span-2 bg-gradient-to-br from-primary/5 to-primary/[0.02] p-8 md:p-10 flex items-center justify-center border-t lg:border-t-0 lg:border-l border-zinc-200">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Globe className="w-8 h-8 text-primary" />
                    </div>
                    <h4 className="text-base font-semibold text-zinc-900 mb-2">
                      Global Reach, Local Presence
                    </h4>
                    <p className="text-sm text-zinc-700 leading-relaxed max-w-xs mx-auto">
                      From our Trichy main office, we coordinate international
                      shipments across 200+ countries with 4 branch offices
                      serving Tamil Nadu.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* ===== ALL BRANCHES ===== */}
      <section className="pb-14 lg:pb-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            {...fadeIn}
            className="text-center max-w-xl mx-auto mb-12"
          >
            <span className="text-primary text-sm font-semibold tracking-[0.2em] uppercase block mb-4">
              Our Branches
            </span>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-zinc-900 leading-[0.95] tracking-tight font-heading">
              All locations
            </h2>
          </motion.div>

          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setActiveState("All")}
                className={`px-5 py-2.5 rounded-lg text-sm font-semibold uppercase tracking-wider transition-all duration-200 ${
                  activeState === "All"
                    ? "bg-primary text-white"
                    : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                }`}
              >
                All
              </button>
              {states.map((state) => (
                <button
                  key={state}
                  onClick={() => setActiveState(state)}
                  className={`px-5 py-2.5 rounded-lg text-sm font-semibold uppercase tracking-wider transition-all duration-200 ${
                    activeState === state
                      ? "bg-primary text-white"
                      : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                  }`}
                >
                  {state}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search city, state, or address..."
                className="w-full sm:w-72 pl-10 pr-10 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-base text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-primary/40 focus:bg-white transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="w-4 h-4 text-zinc-400 hover:text-zinc-700" />
                </button>
              )}
            </div>
          </div>

          {/* Branch Cards */}
          {otherBranches.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-zinc-300" />
              </div>
              <p className="text-base font-semibold text-zinc-700">
                No branches found
              </p>
              <p className="text-base text-zinc-400 mt-1">
                Try adjusting your search or filter
              </p>
              <button
                onClick={() => {
                  setActiveState("All");
                  setSearchQuery("");
                }}
                className="mt-4 text-base font-semibold text-primary hover:underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {otherBranches.map((branch, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                  className="group bg-white border border-zinc-100 rounded-2xl p-6 hover:border-primary/20 hover:shadow-sm transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-5">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-sm font-semibold text-zinc-400 uppercase tracking-wider px-2.5 py-1 bg-zinc-50 rounded-md border border-zinc-100">
                      {branch.state}
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold text-zinc-900 mb-1">
                    {branch.city}
                  </h3>
                  <p className="text-sm text-zinc-700 leading-relaxed mb-5 line-clamp-2">
                    {branch.address}
                  </p>

                  <div className="space-y-2.5">
                    {branch.contactPerson && (
                      <div className="flex items-center gap-2 text-sm text-zinc-700">
                        <Star className="w-3 h-3 text-primary/60" />
                        <span>{branch.contactPerson}</span>
                      </div>
                    )}
                    <a
                      href={`tel:${branch.phone.replace(/\s/g, "")}`}
                      className="flex items-center gap-2 text-sm text-zinc-700 hover:text-primary transition-colors"
                    >
                      <Phone className="w-3 h-3 text-zinc-400" />
                      <span>{branch.phone}</span>
                    </a>
                    {branch.landline && (
                      <div className="flex items-center gap-2 text-sm text-zinc-700">
                        <Phone className="w-3 h-3 text-zinc-400" />
                        <span>{branch.landline}</span>
                      </div>
                    )}
                    <a
                      href={`mailto:${branch.email}`}
                      className="flex items-center gap-2 text-sm text-zinc-700 hover:text-primary transition-colors"
                    >
                      <Mail className="w-3 h-3 text-zinc-400" />
                      <span className="truncate">{branch.email}</span>
                    </a>
                    <div className="flex items-center gap-2 text-sm text-zinc-700">
                      <Clock className="w-3 h-3 text-zinc-400" />
                      <span>{branch.hours}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-6 pt-4 border-t border-zinc-100">
                    <a
                      href="https://maps.google.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-[#172554] uppercase tracking-wider transition-colors"
                    >
                      <Navigation className="w-3 h-3" />
                      Directions
                    </a>
                    <a
                      href={`tel:${branch.phone.replace(/\s/g, "")}`}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-700 hover:text-zinc-700 uppercase tracking-wider transition-colors ml-auto"
                    >
                      Call <ChevronRight className="w-3 h-3" />
                    </a>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="py-14 lg:py-20 bg-zinc-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="text-primary text-sm font-semibold tracking-[0.2em] uppercase block mb-4">
              Branches FAQ
            </span>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-zinc-900 leading-[0.95] tracking-tight font-heading">
              Common questions about our branches
            </h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-3">
            {[
              {
                q: "Does Gajan Traders have branches across India?",
                a: "Yes — we have branches in Trichy, Salem, and Chennai (Royapuram & Saidapet). Visit any branch for international courier booking, tracking support, and packaging services.",
              },
              {
                q: "Do you offer doorstep pickup?",
                a: "Yes — we offer free doorstep pickup across all serviceable locations. Schedule a pickup online through our website or call your nearest branch directly.",
              },
              {
                q: "What services are available at your branches?",
                a: "Our branches offer international courier booking, tracking support, pickup assistance, free packaging, customs documentation guidance, and dedicated customer support.",
              },
              {
                q: "What are your branch working hours?",
                a: "All branches operate Monday to Saturday, 9:30 AM to 6:30 PM. Sunday is closed.",
              },
            ].map((faq, i) => (
              <div
                key={i}
                className="bg-white border border-zinc-100 rounded-xl p-6 hover:border-zinc-200 transition-all"
              >
                <h3 className="text-base font-semibold text-zinc-900 mb-2">
                  {faq.q}
                </h3>
                <p className="text-base text-zinc-700 leading-relaxed">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="relative py-16 lg:py-24 overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <motion.div {...fadeIn}>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-zinc-900 leading-[0.95] tracking-tight font-heading mb-4">
              Can not make it to a branch?
            </h2>
            <p className="text-zinc-700 max-w-lg mx-auto mb-10 text-lg">
              Schedule a free home pickup and we will handle the rest. No branch
              visit needed.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-8 py-4 bg-primary hover:bg-[#172554] text-sm font-bold text-white uppercase tracking-wider transition-all duration-300 rounded-lg"
              >
                Schedule Pickup <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-8 py-4 border border-zinc-300 text-zinc-700 hover:text-zinc-900 hover:border-zinc-400 text-sm font-semibold uppercase tracking-wider transition-all duration-300 rounded-lg"
              >
                Contact Support
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
