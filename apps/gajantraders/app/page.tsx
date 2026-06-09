/** @format */

"use client";

import { motion } from "framer-motion";
import {
  Plane as PlaneIcon,
  ArrowRight,
  MapPin,
  ChevronRight,
  Globe as GlobeIcon,
  Users,
  ShieldCheck,
} from "lucide-react";
import Image from "next/image";
import { WorldMap } from "@/components/WorldMap";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/hero-section";
import ServicesSection from "@/components/services-section";
import StatsSection from "@/components/stats-section";
import TestimonialsSection from "@/components/testimonials-section";
import CTASection from "@/components/cta-section";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="bg-[#1a1a1a]">
        <HeroSection />
        <ServicesSection />

        <section className="py-16 md:py-23 px-4 bg-[#1a1a1a] overflow-hidden">
          <div className="max-w-7xl mx-auto">
            {/* ---- Cinematic Center Header with Inline Image ---- */}
            <div className="text-center mb-24 md:mb-32">
              <motion.h2
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="font-heading text-white leading-[1.05] tracking-tight mx-auto max-w-6xl"
                style={{ fontSize: "clamp(2.5rem, 5vw, 4.5rem)" }}
              >
                Global freight,{" "}
                <span
                  className="inline-block w-14 h-14 md:w-20 md:h-14 rounded-full align-middle bg-cover bg-center mx-3 -mt-1 border-2 border-white/10 shadow-xl contrast-125"
                  style={{
                    backgroundImage:
                      "url(https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=200&q=80&fit=crop)",
                  }}
                />{" "}
                delivered with precision
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.7,
                  delay: 0.15,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="text-white/40 text-base max-w-prose mx-auto mt-6 leading-relaxed"
              >
                Express, air, and ocean freight solutions spanning 200+
                countries. Every shipment tracked, every parcel protected.
              </motion.p>
            </div>

            {/* ---- Gapless Bento Grid ---- */}
            <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-[200px] md:auto-rows-[240px] gap-4 md:gap-5 grid-flow-dense">
              {/* Card 1: Express Freight — hero card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="relative group rounded-2xl overflow-hidden border border-white/[0.06] hover:border-primary/40 transition-all duration-500 col-span-2 row-span-2"
              >
                <div className="absolute inset-0">
                  <Image
                    src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80"
                    alt="Express Freight"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
                    className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out grayscale-[30%] contrast-125"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a]/95 via-[#1a1a1a]/40 to-transparent" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                      <PlaneIcon className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-sm font-semibold text-primary/80 uppercase tracking-[0.05em] leading-relaxed">
                      Priority
                    </span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-1">
                    Express Freight
                  </h3>
                  <p className="text-sm text-white/60 max-w-md leading-relaxed">
                    Fast and reliable delivery for time-sensitive shipments
                    worldwide
                  </p>
                </div>
              </motion.div>

              {/* Card 2: Air Freight — wide */}
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.8,
                  delay: 0.1,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="relative group rounded-2xl overflow-hidden border border-white/[0.06] hover:border-primary/40 transition-all duration-500 col-span-2 row-span-1"
              >
                <div className="absolute inset-0">
                  <Image
                    src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&q=80"
                    alt="Air Freight"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out contrast-125"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a]/90 via-[#1a1a1a]/30 to-transparent" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
                  <h3 className="text-base md:text-lg font-bold text-white mb-0.5">
                    Air Freight
                  </h3>
                  <p className="text-xs md:text-sm text-white/60">
                    Global air cargo for international shipping
                  </p>
                </div>
              </motion.div>

              {/* Card 3: Ocean Cargo — compact */}
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.8,
                  delay: 0.2,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="relative group rounded-2xl overflow-hidden border border-white/[0.06] hover:border-primary/40 transition-all duration-500 col-span-1 row-span-1"
              >
                <div className="absolute inset-0">
                  <Image
                    src="https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?w=400&q=80"
                    alt="Ocean Cargo"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out grayscale-[20%]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a]/95 via-[#1a1a1a]/30 to-transparent" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-sm font-bold text-white mb-0.5">
                    Ocean Cargo
                  </h3>
                  <p className="text-xs text-white/60">
                    Volume shipments worldwide
                  </p>
                </div>
              </motion.div>

              {/* Card 4: Secure Packaging — solid bg with icon */}
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.8,
                  delay: 0.3,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="relative group rounded-2xl overflow-hidden border border-white/[0.06] hover:border-primary/40 hover:bg-primary/[0.03] transition-all duration-500 col-span-1 row-span-1 bg-gradient-to-br from-[#222] to-[#1a1a1a]"
              >
                <div className="h-full w-full flex flex-col justify-center p-4 md:p-5">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors duration-500">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-sm font-bold text-white mb-0.5">
                    Secure Packaging
                  </h3>
                  <p className="text-xs md:text-sm text-white/60">
                    Protected parcels, guaranteed
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <StatsSection />

        <section className="bg-[#f5f5f5] py-16 overflow-hidden">
          <div className="max-w-7xl mx-auto px-6">
            {/* TITLE */}
            <div className="text-center mb-12">
              <h2
                className="text-zinc-900 font-heading font-semibold leading-[1.05] -tracking-[0.48px] text-balance"
                style={{ fontSize: "clamp(1.5rem, 4vw, 2.5rem)" }}
              >
                How Shipments Move
              </h2>
            </div>

            {/* CONTENT */}
            <div className="relative flex flex-col xl:flex-row items-center justify-between gap-8 xl:gap-12">
              {/* LEFT — Steps 1 & 2 */}
              <div className="w-full xl:w-[32%] relative flex flex-col justify-between gap-12 xl:gap-0 order-1 xl:order-none">
                {/* ITEM 1 */}
                <div className="text-center xl:text-left relative">
                  <div className="w-[48px] h-[56px] bg-white rounded-b-[24px] border-t-[3px] border-primary flex items-center justify-center text-primary text-lg font-bold mx-auto xl:mx-0 mb-4">
                    01
                  </div>
                  <h3 className="text-zinc-900 text-xl font-bold mb-2">
                    Receive Packages
                  </h3>
                  <p className="text-gray-500 text-base leading-normal max-w-[280px] mx-auto xl:mx-0">
                    We receive and organize your parcels with care.
                  </p>
                  <div className="relative xl:absolute flex justify-center xl:block left-1/2 xl:left-0 -translate-x-1/2 xl:translate-x-0 mt-6 xl:mt-4">
                    <div className="flex items-center">
                      <div className="w-[100px] h-[100px] border-2 border-primary/50 rounded-[28px] rotate-45 overflow-hidden bg-white shrink-0">
                        <Image
                          src="/images/step1.png"
                          alt="Step 1"
                          width={100}
                          height={100}
                          className="-rotate-45 w-full h-full object-contain p-3"
                        />
                      </div>
                      <div className="hidden xl:block w-[200px] border-t-2 border-dashed border-primary/30" />
                    </div>
                  </div>
                </div>

                {/* ITEM 2 */}
                <div className="text-center xl:text-left relative">
                  <div className="relative xl:absolute flex justify-center xl:block xl:right-0 left-1/2 xl:left-auto -translate-x-1/2 mt-4 xl:translate-x-0 bg-white mx-auto xl:mx-0">
                    <div className="w-[100px] h-[100px] border-2 border-primary/50 rounded-[28px] rotate-45 flex items-center justify-center overflow-hidden bg-white shrink-0">
                      <Image
                        src="/images/step2.png"
                        alt="Step 2"
                        width={100}
                        height={100}
                        className="-rotate-45 w-full h-full object-contain p-2"
                      />
                    </div>
                  </div>
                  <div className="xl:pt-36 text-center xl:text-right">
                    <h3 className="text-zinc-900 text-xl font-bold mb-2 ml-auto max-w-[280px]">
                      Transport Packages
                    </h3>
                    <p className="text-gray-500 text-base leading-normal max-w-[280px] ml-auto">
                      We transport your packages quickly and securely.
                    </p>
                    <div className="w-[48px] h-[56px] bg-white rounded-b-[24px] border-t-[3px] border-primary flex items-center justify-center text-primary text-lg font-bold ml-auto mt-4">
                      02
                    </div>
                  </div>
                </div>
              </div>

              {/* CENTER — order second on mobile */}
              <div className="relative w-full xl:w-[36%] flex justify-center order-2 xl:order-none">
                <div
                  className="absolute w-[280px] h-[280px] sm:w-[380px] sm:h-[380px] rounded-full"
                  style={{ backgroundColor: "#f0ece9" }}
                />
                <Image
                  src="/images/gtman.png"
                  alt="Delivery Man"
                  width={400}
                  height={400}
                  className="relative z-10 max-w-[280px] sm:max-w-[380px] w-full object-contain"
                  style={{ mixBlendMode: "multiply" }}
                />
              </div>

              {/* RIGHT — Steps 3 & 4 */}
              <div className="w-full xl:w-[32%] relative flex flex-col justify-between gap-12 xl:gap-0 order-3 xl:order-none">
                {/* ITEM 3 */}
                <div className="text-center xl:text-left relative">
                  <div className="w-[48px] h-[56px] bg-white rounded-b-[24px] border-t-[3px] border-primary flex items-center justify-center text-primary text-lg font-bold mx-auto xl:mx-0 mb-4">
                    03
                  </div>
                  <h3 className="text-zinc-900 text-xl font-bold mb-2 max-w-[280px]">
                    Deliver Packages
                  </h3>
                  <p className="text-gray-500 text-base leading-normal max-w-[280px]">
                    We deliver your packages right to your doorstep.
                  </p>
                  <div className="relative xl:absolute flex justify-center xl:block right-0 -translate-x-1/2 xl:translate-x-0 mt-6 xl:mt-4">
                    <div className="flex items-center">
                      <div className="hidden xl:block w-[200px] border-t-2 border-dashed border-primary/30" />
                      <div className="w-[100px] h-[100px] border-2 border-primary/50 rounded-[28px] rotate-45 flex items-center justify-center overflow-hidden bg-white shrink-0">
                        <Image
                          src="/images/step3.png"
                          alt="Step 3"
                          width={100}
                          height={100}
                          className="-rotate-45 w-full h-full object-contain p-2"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ITEM 4 */}
                <div className="text-center xl:text-right relative">
                  <div className="relative xl:absolute flex justify-center xl:block w-full xl:w-auto bg-white mt-6 xl:mt-4">
                    <div className="w-[100px] h-[100px] border-2 border-primary/50 rounded-[28px] rotate-45 flex items-center justify-center overflow-hidden bg-white mx-auto xl:mx-0">
                      <Image
                        src="/images/step4.png"
                        alt="Step 4"
                        width={100}
                        height={100}
                        className="-rotate-45 w-full h-full object-contain p-2"
                      />
                    </div>
                  </div>
                  <div className="xl:pt-36 text-center xl:text-right">
                    <h3 className="text-zinc-900 text-xl font-bold mb-2">
                      Parcel Information
                    </h3>
                    <p className="text-gray-500 text-base leading-normal max-w-[280px] ml-auto">
                      We provide real-time tracking for your shipments.
                    </p>
                    <div className="w-[48px] h-[56px] bg-white rounded-b-[24px] border-t-[3px] border-primary flex items-center justify-center text-primary text-lg font-bold ml-auto mt-4">
                      04
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="coverage"
          className="py-32 md:py-48 px-4 bg-zinc-100 overflow-hidden"
        >
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              >
                <h2
                  className="font-heading font-semibold text-zinc-900 leading-[1.05] -tracking-[0.48px] text-balance"
                  style={{ fontSize: "clamp(1.5rem, 4vw, 2.5rem)" }}
                >
                  Delivering Across the Globe
                </h2>
                <p className="text-base text-zinc-700 mt-6 leading-relaxed max-w-prose">
                  With partnerships in 200+ countries and territories, we ensure
                  your packages reach even the most remote corners of the world.
                  Our extensive network of airlines, shipping partners, and
                  local agents guarantee on-time delivery.
                </p>

                <div className="grid grid-cols-2 gap-x-8 gap-y-6 mt-10">
                  {[
                    {
                      value: "200+",
                      label: "Countries",
                      icon: GlobeIcon,
                      color: "bg-primary/10 text-primary",
                    },
                    {
                      value: "500+",
                      label: "Cities Served",
                      icon: MapPin,
                      color: "bg-blue-500/10 text-blue-600",
                    },
                    {
                      value: "50+",
                      label: "Air Routes",
                      icon: PlaneIcon,
                      color: "bg-amber-500/10 text-amber-600",
                    },
                    {
                      value: "10K+",
                      label: "Partners",
                      icon: Users,
                      color: "bg-emerald-500/10 text-emerald-600",
                    },
                  ].map((stat, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 15 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{
                        duration: 0.5,
                        delay: 0.15 + i * 0.08,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      className="flex items-start gap-4"
                    >
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${stat.color}`}
                      >
                        <stat.icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xl font-semibold text-zinc-900 leading-none">
                          {stat.value}
                        </div>
                        <div className="text-sm text-zinc-400 mt-1">
                          {stat.label}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.7,
                  delay: 0.15,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                <WorldMap />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Editorial Split — International Courier */}
        <section className="py-32 md:py-48 px-4 bg-white overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
              {/* Left: Large Artistic Image */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                className="relative lg:col-span-7"
              >
                <div className="relative aspect-[4/5] rounded-2xl overflow-hidden border border-zinc-100 shadow-xl">
                  <Image
                    src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=700&q=80"
                    alt="International parcels from India"
                    fill
                    sizes="(max-width: 1024px) 100vw, (max-width: 1280px) 58vw, 740px"
                    className="object-cover grayscale-[40%] contrast-125 group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/5" />
                  {/* Flat stat badges — no glassmorphism */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.6,
                      delay: 0.3,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="absolute bottom-6 left-6 flex gap-3"
                  >
                    <div className="px-4 py-2.5 rounded-xl bg-white">
                      <p className="text-lg font-semibold text-zinc-900 leading-none">
                        200+
                      </p>
                      <p className="text-sm text-zinc-400 mt-0.5">Countries</p>
                    </div>
                    <div className="px-4 py-2.5 rounded-xl bg-white">
                      <p className="text-lg font-semibold text-zinc-900 leading-none">
                        13+
                      </p>
                      <p className="text-sm text-zinc-400 mt-0.5">Years</p>
                    </div>
                  </motion.div>
                </div>
              </motion.div>

              {/* Right: Content with Inline Typography */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.8,
                  delay: 0.2,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="lg:col-span-5 space-y-8"
              >
                {/* Heading with inline image — no redundant eyebrow */}
                <div>
                  <h2
                    className="font-heading text-zinc-900 leading-[1.05] tracking-tight max-w-3xl"
                    style={{ fontSize: "clamp(2.5rem, 4.5vw, 4rem)" }}
                  >
                    International{" "}
                    <span
                      className="inline-block w-14 h-14 md:w-20 md:h-14 rounded-full align-middle bg-cover bg-center mx-3 -mt-1 border-2 border-zinc-200 shadow-md contrast-125"
                      style={{
                        backgroundImage:
                          "url(https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=200&q=80&fit=crop)",
                      }}
                    />{" "}
                    Courier from India
                  </h2>
                  <p className="text-base text-zinc-700 leading-relaxed mt-6 max-w-prose">
                    Gajan Traders ships parcels from India to 200+ countries.
                    Door-to-door pickup, real-time tracking, delivery you can
                    count on.
                  </p>
                </div>

                {/* Differentiated highlights — not identical cards */}
                <div className="space-y-5 pt-2">
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.5,
                      delay: 0.35,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="flex items-start gap-5"
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-base font-semibold text-zinc-900">
                        Door-to-door pickup
                      </p>
                      <p className="text-sm text-zinc-400 mt-1">
                        We collect from your doorstep anywhere in India, packed
                        and ready for customs.
                      </p>
                    </div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.5,
                      delay: 0.45,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="flex items-start gap-5"
                  >
                    <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0">
                      <span className="text-lg font-semibold text-zinc-700">
                        13+
                      </span>
                    </div>
                    <div>
                      <p className="text-base font-semibold text-zinc-900">
                        Years serving the diaspora
                      </p>
                      <p className="text-sm text-zinc-400 mt-1">
                        Since 2012, trusted by NRI families and export
                        businesses across every continent.
                      </p>
                    </div>
                  </motion.div>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-wrap gap-4 pt-4">
                  <button className="group inline-flex items-center gap-2 px-8 py-4 bg-primary hover:bg-primary/90 text-sm font-semibold text-white rounded-xl transition-all duration-300 cursor-pointer">
                    Get a Free Quote
                    <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </button>
                  <button className="inline-flex items-center gap-2 px-8 py-4 bg-white hover:bg-zinc-50 text-sm font-semibold text-zinc-900 rounded-xl border border-zinc-200 hover:border-zinc-300 transition-all duration-300 cursor-pointer">
                    Contact Sales
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <TestimonialsSection />

        <section className="py-14 px-4" style={{ backgroundColor: "#1a1a1a" }}>
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2
                className="font-heading font-semibold text-white leading-[1.05] -tracking-[0.48px] text-balance"
                style={{ fontSize: "clamp(1.25rem, 3vw, 1.625rem)" }}
              >
                Frequently Asked Questions
              </h2>
            </div>
            <div className="space-y-3">
              {[
                {
                  q: "How long does international delivery take?",
                  a: "Delivery times vary by destination. Express shipments take 2-5 days, while standard shipping may take 7-15 days. Remote areas may require additional time.",
                },
                {
                  q: "What items can I ship internationally?",
                  a: "We ship documents, packages, personal belongings, commercial goods, and food items (non-perishable). Some items may require special documentation.",
                },
                {
                  q: "Is my shipment insured during transit?",
                  a: "Yes, all shipments are covered by our comprehensive insurance policy. Additional coverage can be purchased for high-value items.",
                },
                {
                  q: "Can I track my shipment in real-time?",
                  a: "Absolutely! You can track your shipment 24/7 through our website or mobile app. You will receive SMS and email updates at every milestone.",
                },
                {
                  q: "Do you offer door pickup service?",
                  a: "Yes, we offer free door pickup in select cities. Schedule a pickup online and our team will collect your package from your specified address.",
                },
                {
                  q: "What payment methods do you accept?",
                  a: "We accept all major credit/debit cards, UPI, net banking, and cash on delivery (select locations). Corporate clients can request invoice-based billing.",
                },
              ].map((item, i) => (
                <details
                  key={i}
                  className="group bg-white/[0.03] border border-white/[0.08] rounded-xl overflow-hidden"
                >
                  <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none hover:bg-white/[0.02] transition-colors">
                    <span className="text-sm font-semibold text-white">
                      {item.q}
                    </span>
                    <ChevronRight className="w-4 h-4 text-white/40 transition-transform duration-300 group-open:rotate-90 shrink-0" />
                  </summary>
                  <div className="px-5 pb-5">
                    <p className="text-base text-white/50 leading-relaxed max-w-prose">
                      {item.a}
                    </p>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        <CTASection />
      </main>
    </>
  );
}
