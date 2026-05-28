/** @format */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  Search,
  Plane as PlaneIcon,
  ArrowRight,
  ArrowUpRight,
  MapPin,
  Calendar,
  Weight,
  ChevronRight,
  Zap,
  Shield as ShieldIcon,
  Star,
  Star as StarIcon,
  Phone,
  Mail,
  CheckCircle,
  Truck as TruckIcon,
  Globe as GlobeIcon,
  ShieldCheck,
  Award,
  Users,
  Clock as ClockIcon,
  Package as PackageIcon,
} from 'lucide-react';
import Image from 'next/image';
import { WorldMap } from '@/components/WorldMap';
import ReactCountryFlag from 'react-country-flag';
import Navbar from '@/components/Navbar';
import { SlideIn, StaggeredSlideIn } from '@/components/ScrollAnimations';

const services = [
  {
    icon: PlaneIcon,
    label: 'International Courier',
    desc: 'Fast delivery worldwide',
  },
  { icon: PackageIcon, label: 'Express Delivery', desc: 'Priority shipping' },
  { icon: TruckIcon, label: 'Door Pickup', desc: 'We come to you' },
  { icon: ShieldIcon, label: 'Secure Packaging', desc: 'Protected parcels' },
  { icon: ClockIcon, label: '24/7 Tracking', desc: 'Real-time updates' },
  { icon: GlobeIcon, label: '200+ Countries', desc: 'Global coverage' },
];

const stats = [
  { value: '50K+', label: 'Happy Customers', icon: Users },
  { value: '200+', label: 'Countries', icon: GlobeIcon },
  { value: '99%', label: 'Success Rate', icon: Award },
  { value: '24/7', label: 'Support', icon: ClockIcon },
];

const features = [
  {
    title: 'Fast Customs Clearance',
    desc: 'Streamlined processes for hassle-free international shipping',
    icon: CheckCircle,
  },
  {
    title: 'Secure Packaging',
    desc: 'Industry-leading packaging standards to protect your valuables',
    icon: ShieldCheck,
  },
  {
    title: 'Real-Time Tracking',
    desc: 'Know exactly where your package is at all times',
    icon: TruckIcon,
  },
  {
    title: '24/7 Customer Support',
    desc: 'Our team is always ready to help with any queries',
    icon: Phone,
  },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<'track' | 'quote'>('track');
  const [trackingId, setTrackingId] = useState('');
  const [formData, setFormData] = useState({
    from: '',
    to: '',
    weight: '',
    date: '',
    service: 'standard',
  });

  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  return (
    <>
      <Navbar />
      <main className='bg-foreground'>
        <motion.section
          style={{ opacity: heroOpacity, scale: heroScale }}
          className='relative min-h-screen overflow-hidden'>
          <div className='absolute inset-0 z-0'>
            <motion.div
              className='relative w-full h-full'
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ duration: 1.5 }}>
              <Image
                src='/images/herobg.jpg'
                alt='Cargo plane'
                fill
                className='object-cover'
                priority
              />
            </motion.div>
            <div className='absolute inset-0 bg-gradient-to-r from-[#0a0a0a]/98 via-[#0a0a0a]/80 to-[#0a0a0a]/40' />
          </div>

          {/* Animated route lines */}
          <div className='absolute inset-0 z-[1] pointer-events-none overflow-hidden'>
            <svg className='absolute top-1/4 right-1/3 w-96 h-96 opacity-[0.04]' viewBox='0 0 400 400' fill='none'>
              <circle cx='200' cy='200' r='180' stroke='white' strokeWidth='0.5' />
              <circle cx='200' cy='200' r='120' stroke='white' strokeWidth='0.5' strokeDasharray='4 8' />
              <circle cx='200' cy='200' r='60' stroke='white' strokeWidth='1' />
            </svg>
            <motion.svg
              className='absolute bottom-1/4 left-[15%] w-64 h-64 opacity-[0.03]'
              viewBox='0 0 300 300'
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}>
              <circle cx='150' cy='150' r='140' stroke='white' strokeWidth='0.5' strokeDasharray='2 6' />
              <circle cx='150' cy='150' r='90' stroke='white' strokeWidth='0.5' />
            </motion.svg>
          </div>

          <div className='relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16'>
            <div className='grid lg:grid-cols-12 gap-8 xl:gap-12 items-center min-h-[calc(100vh-6rem)]'>
              {/* Left Content */}
              <div className='lg:col-span-7 space-y-8'>
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className='inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.06]'>
                  <span className='relative flex h-2 w-2'>
                    <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75' />
                    <span className='relative inline-flex rounded-full h-2 w-2 bg-primary' />
                  </span>
                  <span className='text-xs text-white/60 font-medium tracking-wide'>
                    Trusted by 50,000+ customers worldwide
                  </span>
                </motion.div>

                <div className='space-y-6'>
                  <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className='text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-semibold text-white leading-[0.9] tracking-tight font-heading'>
                    Send Your Parcel{' '}
                    <span className='inline-block text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-400 to-primary/60'>
                      Anywhere Fast
                    </span>
                  </motion.h1>

                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className='text-base md:text-lg text-white/40 max-w-lg leading-relaxed'>
                    Premium international courier services. Fast, secure delivery
                    to 200+ countries with real-time tracking and door-step pickup.
                  </motion.p>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className='flex flex-wrap gap-4'>
                  <Link
                    href='/register'
                    className='group inline-flex items-center gap-2.5 px-7 py-3.5 bg-primary hover:bg-[#172554] text-sm font-bold text-white rounded-xl transition-all duration-300 font-heading uppercase tracking-wider shadow-lg shadow-primary/25'>
                    Get Started
                    <ArrowRight className='w-4 h-4 transition-transform group-hover:translate-x-1' />
                  </Link>
                  <button className='inline-flex items-center gap-2.5 px-7 py-3.5 bg-white/[0.04] hover:bg-white/[0.08] text-sm font-semibold text-white/80 hover:text-white rounded-xl border border-white/[0.08] hover:border-white/[0.15] transition-all duration-300 font-heading uppercase tracking-wider cursor-pointer'>
                    <Search className='w-3.5 h-3.5' />
                    Track Shipment
                  </button>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className='flex flex-wrap items-center gap-5 pt-6 border-t border-white/[0.06]'>
                  <div className='flex items-center gap-2'>
                    <ShieldIcon className='w-4 h-4 text-primary' />
                    <span className='text-xs text-white/40'>Secure & Insured</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Zap className='w-4 h-4 text-amber-400' />
                    <span className='text-xs text-white/40'>Express Available</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Star className='w-4 h-4 text-primary' />
                    <span className='text-xs text-white/40'>4.9/5 Rating</span>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.45 }}
                  className='flex items-center gap-4'>
                  <div className='flex -space-x-3'>
                    {[
                      { code: 'FR', countryCode: 'FR' },
                      { code: 'CH', countryCode: 'CH' },
                      { code: 'BE', countryCode: 'BE' },
                      { code: 'US', countryCode: 'US' },
                      { code: 'UK', countryCode: 'GB' },
                    ].map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.6 + i * 0.08 }}
                        className='w-9 h-9 rounded-full bg-white/[0.06] border-2 border-[#0a0a0a] flex items-center justify-center overflow-hidden'>
                        <ReactCountryFlag
                          countryCode={item.countryCode}
                          svg
                          style={{
                            width: '1.5em',
                            height: '1.5em',
                          }}
                        />
                      </motion.div>
                    ))}
                  </div>
                  <span className='text-xs text-white/30'>
                    Shipping to 150+ countries
                  </span>
                </motion.div>
              </div>

              {/* Right - Widget Panel */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className='lg:col-span-5 relative'>
                {/* Decorative glow behind widget */}
                <div className='absolute -inset-4 bg-primary/5 blur-3xl rounded-3xl' />
                <div className='relative bg-white/[0.03] backdrop-blur-2xl rounded-2xl border border-white/[0.06] shadow-2xl shadow-black/40 overflow-hidden'>
                  <div className='flex bg-white/[0.02] border-b border-white/[0.06]'>
                    <button
                      onClick={() => setActiveTab('track')}
                      className={`flex-1 px-5 py-4 text-xs font-semibold transition-all duration-300 cursor-pointer flex items-center justify-center gap-2.5 ${
                        activeTab === 'track'
                          ? 'bg-white/[0.04] text-white border-b-2 border-primary'
                          : 'text-white/40 hover:text-white/70 hover:bg-white/[0.02]'
                      }`}>
                      <Search className='w-3.5 h-3.5' />
                      Track Package
                    </button>
                    <button
                      onClick={() => setActiveTab('quote')}
                      className={`flex-1 px-5 py-4 text-xs font-semibold transition-all duration-300 cursor-pointer flex items-center justify-center gap-2.5 ${
                        activeTab === 'quote'
                          ? 'bg-white/[0.04] text-white border-b-2 border-primary'
                          : 'text-white/40 hover:text-white/70 hover:bg-white/[0.02]'
                      }`}>
                      <PackageIcon className='w-3.5 h-3.5' />
                      Get Quote
                    </button>
                  </div>

                  <div className='p-6 md:p-7 space-y-5'>
                    {activeTab === 'track' ? (
                      <div className='space-y-5'>
                        <div>
                          <label className='block text-xs font-medium text-white/50 mb-2 tracking-wide uppercase'>
                            Tracking Number
                          </label>
                          <div className='relative group'>
                            <Search className='absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-primary transition-colors' />
                            <input
                              type='text'
                              value={trackingId}
                              onChange={(e) => setTrackingId(e.target.value)}
                              placeholder='GT1234567890'
                              className='w-full pl-11 pr-4 py-3.5 bg-white/[0.04] border border-white/[0.06] rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:bg-white/[0.06] transition-all text-sm tracking-wider font-mono'
                            />
                          </div>
                        </div>
                        <div className='flex items-center gap-3'>
                          <button
                            type='button'
                            onClick={() => setTrackingId('')}
                            className='flex-1 py-3.5 bg-white/[0.04] hover:bg-white/[0.08] text-sm font-medium text-white/50 rounded-xl border border-white/[0.06] transition-all duration-300 cursor-pointer'>
                            Clear
                          </button>
                          <button className='flex-[2] py-3.5 bg-primary hover:bg-[#172554] text-sm font-bold text-white rounded-xl transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-primary/20'>
                            Track Now
                            <ArrowRight className='w-4 h-4' />
                          </button>
                        </div>
                        <p className='text-[10px] text-center text-white/20 tracking-wide'>
                          Enter your tracking ID to see real-time updates
                        </p>
                      </div>
                    ) : (
                      <div className='space-y-4'>
                        <div className='grid grid-cols-2 gap-3'>
                          <div>
                            <label className='block text-xs font-medium text-white/50 mb-1.5'>
                              From
                            </label>
                            <div className='relative'>
                              <MapPin className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20' />
                              <input
                                type='text'
                                value={formData.from}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    from: e.target.value,
                                  })
                                }
                                placeholder='City'
                                className='w-full pl-10 pr-3 py-3 bg-white/[0.04] border border-white/[0.06] rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:bg-white/[0.06] transition-all text-xs'
                              />
                            </div>
                          </div>
                          <div>
                            <label className='block text-xs font-medium text-white/50 mb-1.5'>
                              To
                            </label>
                            <div className='relative'>
                              <MapPin className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20' />
                              <input
                                type='text'
                                value={formData.to}
                                onChange={(e) =>
                                  setFormData({ ...formData, to: e.target.value })
                                }
                                placeholder='City'
                                className='w-full pl-10 pr-3 py-3 bg-white/[0.04] border border-white/[0.06] rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:bg-white/[0.06] transition-all text-xs'
                              />
                            </div>
                          </div>
                        </div>
                        <div className='grid grid-cols-2 gap-3'>
                          <div>
                            <label className='block text-xs font-medium text-white/50 mb-1.5'>
                              Weight (kg)
                            </label>
                            <div className='relative'>
                              <Weight className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20' />
                              <input
                                type='text'
                                value={formData.weight}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    weight: e.target.value,
                                  })
                                }
                                placeholder='0.0'
                                className='w-full pl-10 pr-3 py-3 bg-white/[0.04] border border-white/[0.06] rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:bg-white/[0.06] transition-all text-xs'
                              />
                            </div>
                          </div>
                          <div>
                            <label className='block text-xs font-medium text-white/50 mb-1.5'>
                              Date
                            </label>
                            <div className='relative'>
                              <Calendar className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20' />
                              <input
                                type='date'
                                value={formData.date}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    date: e.target.value,
                                  })
                                }
                                className='w-full pl-10 pr-3 py-3 bg-white/[0.04] border border-white/[0.06] rounded-xl text-white/60 focus:outline-none focus:border-primary/50 focus:bg-white/[0.06] transition-all text-xs [color-scheme:dark]'
                              />
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className='block text-xs font-medium text-white/50 mb-1.5'>
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
                            className='w-full px-4 py-3 bg-white/[0.04] border border-white/[0.06] rounded-xl text-white/60 focus:outline-none focus:border-primary/50 focus:bg-white/[0.06] transition-all text-xs appearance-none cursor-pointer'>
                            <option value='standard' className='bg-zinc-900'>
                              Standard (5-10 days)
                            </option>
                            <option value='express' className='bg-zinc-900'>
                              Express (2-3 days)
                            </option>
                            <option value='priority' className='bg-zinc-900'>
                              Priority (24h)
                            </option>
                          </select>
                        </div>
                        <div className='flex items-center gap-3'>
                          <button
                            type='button'
                            onClick={() =>
                              setFormData({
                                from: '',
                                to: '',
                                weight: '',
                                date: '',
                                service: 'standard',
                              })
                            }
                            className='flex-1 py-3.5 bg-white/[0.04] hover:bg-white/[0.08] text-sm font-medium text-white/50 rounded-xl border border-white/[0.06] transition-all duration-300 cursor-pointer'>
                            Clear
                          </button>
                          <button className='flex-[2] py-3.5 bg-primary hover:bg-[#172554] text-sm font-bold text-white rounded-xl transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-primary/20'>
                            Get Quote
                            <ArrowRight className='w-4 h-4' />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className='absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2'>
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className='w-px h-10 bg-gradient-to-b from-transparent via-white/20 to-transparent'
            />
            <motion.span
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
              className='text-[10px] text-white/20 uppercase tracking-[0.2em]'>
              Scroll
            </motion.span>
          </motion.div>
        </motion.section>

        <section className='py-14 px-4 bg-foreground'>
          <div className='max-w-7xl mx-auto'>
            <StaggeredSlideIn
              direction='up'
              delayBetween={0.08}
              className='grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8'>
              {stats.map((stat, i) => (
                <motion.div
                  key={i}
                  whileHover={{ scale: 1.02 }}
                  className='flex items-center gap-3 p-4 md:p-5 rounded-xl bg-white/[0.02] border border-white/5'>
                  <div className='w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0'>
                    <stat.icon className='w-5 h-5 text-primary' />
                  </div>
                  <div>
                    <div className='text-lg md:text-xl font-bold text-white'>
                      {stat.value}
                    </div>
                    <div className='text-[10px] md:text-xs text-white/40'>
                      {stat.label}
                    </div>
                  </div>
                </motion.div>
              ))}
            </StaggeredSlideIn>
          </div>
        </section>

        <section className='py-14 px-4 bg-white'>
          <div className='max-w-7xl mx-auto'>
            <SlideIn direction='up'>
              <div className='text-center mb-16'>
                <span className='text-primary text-xs font-semibold tracking-wider uppercase'>
                  Simple Process
                </span>
                <h2 className='text-lg md:text-xl font-semibold text-zinc-900 mt-3 font-heading'>
                  Send a Parcel Abroad in 4 Steps
                </h2>
              </div>
            </SlideIn>
            <div className='grid grid-cols-1 md:grid-cols-4 gap-8 relative'>
              <div className='hidden md:block absolute top-10 left-[8%] right-[8%] h-0.5'>
                <div className='h-full bg-gradient-to-r from-zinc-200 via-primary to-zinc-200 rounded-full' />
              </div>
              {[
                {
                  num: '01',
                  title: 'Get Quote',
                  desc: 'Enter your shipment details and get instant pricing. Transparent rates with no hidden fees.',
                  icon: PackageIcon,
                },
                {
                  num: '02',
                  title: 'Pack & Process',
                  desc: 'Our experts will handle safe packing and documentation. We ensure your parcel is securely packaged.',
                  icon: ShieldIcon,
                },
                {
                  num: '03',
                  title: 'Ship Worldwide',
                  desc: 'Fast global courier delivery network. Your parcel travels via our reliable air and sea routes.',
                  icon: PlaneIcon,
                },
                {
                  num: '04',
                  title: 'Deliver & Track',
                  desc: 'Real-time live tracking until it reaches the doorstep. Get updates at every milestone.',
                  icon: TruckIcon,
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15, duration: 0.5 }}
                  className='flex flex-col items-center text-center relative'>
                  <div className='w-20 h-20 rounded-full bg-primary flex items-center justify-center z-10 shadow-lg shadow-primary/20'>
                    <item.icon className='w-10 h-10 text-white' />
                  </div>
                  <span className='absolute top-0 w-7 h-7 rounded-full bg-zinc-900 flex items-center justify-center text-xs font-bold text-white mt-2'>
                    {item.num}
                  </span>
                  <h3 className='text-sm font-semibold text-zinc-900 mt-6 mb-2'>
                    {item.title}
                  </h3>
                  <p className='text-sm text-zinc-500 leading-relaxed max-w-[260px]'>
                    {item.desc}
                  </p>
                </motion.div>
              ))}
            </div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className='flex justify-center mt-16'>
              <button className='group px-8 py-4 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 cursor-pointer flex items-center gap-2'>
                Book Your First Shipment
                <ChevronRight className='w-5 h-5 transition-transform group-hover:translate-x-1' />
              </button>
            </motion.div>
            <p className='text-xs text-zinc-400 text-center mt-6 max-w-md mx-auto'>
              * Free pickup available in select cities. Delivery times vary by
              destination. T&C apply.
            </p>
          </div>
        </section>

        <section
          id='coverage'
          className='py-2 px-4 bg-zinc-100 overflow-hidden'>
          <div className='max-w-7xl mx-auto'>
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-12 items-center'>
              <SlideIn direction='left' className='py-14'>
                <span className='text-primary text-xs font-semibold tracking-wider uppercase'>
                  Global Network
                </span>
                <h2 className='text-lg md:text-xl font-semibold text-zinc-900 mt-3 mb-4 font-heading'>
                  Delivering Across the Globe
                </h2>
                <p className='text-base text-zinc-500 mb-8 leading-relaxed'>
                  With partnerships in 200+ countries and territories, we ensure
                  your packages reach even the most remote corners of the world.
                  Our extensive network of airlines, shipping partners, and
                  local agents guarantees seamless delivery.
                </p>
                <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                  {[
                    { value: '200+', label: 'Countries', icon: GlobeIcon },
                    { value: '500+', label: 'Cities Served', icon: MapPin },
                    { value: '50+', label: 'Air Routes', icon: PlaneIcon },
                    { value: '10K+', label: 'Partners', icon: Users },
                  ].map((stat, i) => (
                    <motion.div
                      key={i}
                      whileHover={{ scale: 1.02 }}
                      className='p-4 rounded-xl bg-white border border-zinc-200 text-center hover:border-primary/30 hover:shadow-lg transition-all duration-300'>
                      <stat.icon className='w-5 h-5 text-primary mx-auto mb-2' />
                      <div className='text-lg font-semibold text-zinc-900'>
                        {stat.value}
                      </div>
                      <div className='text-sm text-zinc-500 mt-1'>
                        {stat.label}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </SlideIn>
              <SlideIn direction='right' delay={0.2}>
                <WorldMap />
              </SlideIn>
            </div>
          </div>
        </section>

        {/* Trust & Services Section - Split Layout */}
        <section className='py-16 px-4 bg-white overflow-hidden'>
          <div className='max-w-7xl mx-auto'>
            <div className='grid lg:grid-cols-2 gap-12 lg:gap-20 items-center'>
              {/* Left: Large Image */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
                className='relative'>
                {/* Main Image */}
                <div className='relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl'>
                  <Image
                    src='https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80'
                    alt='International courier service'
                    fill
                    className='object-cover'
                  />
                  <div className='absolute inset-0 bg-gradient-to-t from-black/30 to-transparent' />
                </div>

                {/* Floating Stats Card */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className='absolute -bottom-6 -right-6 lg:right-8 bg-white rounded-2xl shadow-xl p-6 border border-zinc-100'>
                  <div className='flex items-center gap-4'>
                    <div className='w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center'>
                      <GlobeIcon className='w-7 h-7 text-primary' />
                    </div>
                    <div>
                      <p className='text-xl font-semibold text-zinc-900'>200+</p>
                      <p className='text-sm text-zinc-500'>Countries Served</p>
                    </div>
                  </div>
                </motion.div>

                {/* Floating Experience Badge */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  className='absolute -top-4 -left-4 lg:left-8 bg-primary text-white rounded-2xl shadow-xl px-5 py-3'>
                  <p className='text-xl font-semibold'>13+</p>
                  <p className='text-xs font-medium opacity-90'>
                    Years Experience
                  </p>
                </motion.div>
              </motion.div>

              {/* Right: Content */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className='space-y-8'>
                {/* Trust Badge */}
                <div className='inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/10'>
                  <div className='flex -space-x-2'>
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className='w-7 h-7 rounded-full bg-gradient-to-br from-primary/60 to-primary border-2 border-white flex items-center justify-center'>
                        <Users className='w-3.5 h-3.5 text-white' />
                      </div>
                    ))}
                  </div>
                  <span className='text-sm font-semibold text-primary'>
                    Trusted by 1M+ NRI families
                  </span>
                </div>

                {/* Heading */}
                <div>
                  <h2 className='text-xl md:text-2xl lg:text-3xl font-semibold text-zinc-900 leading-tight font-heading mb-4'>
                    International Courier
                    <span className='text-primary'> Services from India</span>
                  </h2>
                  <p className='text-base text-zinc-600 leading-relaxed'>
                    Fast, Secure & Worldwide Delivery. Gajan Traders is
                    India&apos;s trusted international courier service, shipping
                    parcels to 200+ countries with door-to-door pickup,
                    real-time tracking, and on-time delivery.
                  </p>
                </div>

                {/* Feature Grid */}
                <div className='grid grid-cols-2 gap-4'>
                  {[
                    { icon: ShieldCheck, text: 'Secure Packaging' },
                    { icon: ClockIcon, text: 'On-Time Delivery' },
                    { icon: GlobeIcon, text: '200+ Countries' },
                    { icon: Award, text: '13+ Years Experience' },
                  ].map((feature, i) => (
                    <div
                      key={i}
                      className='flex items-center gap-3 p-4 bg-zinc-50 rounded-xl border border-zinc-100'>
                      <div className='w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0'>
                        <feature.icon className='w-5 h-5 text-primary' />
                      </div>
                      <span className='text-sm font-semibold text-zinc-700'>
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>

                {/* CTA Buttons */}
                <div className='flex flex-wrap gap-4 pt-2'>
                  <button className='group px-8 py-4 bg-primary hover:bg-primary/90 text-sm font-bold text-white rounded-xl transition-all duration-300 cursor-pointer flex items-center gap-2 shadow-lg shadow-primary/20'>
                    Get a Free Quote
                    <ArrowRight className='w-4 h-4 transition-transform group-hover:translate-x-1' />
                  </button>
                  <button className='px-8 py-4 bg-white hover:bg-zinc-50 text-sm font-semibold text-zinc-900 rounded-xl border-2 border-zinc-200 hover:border-zinc-300 transition-all duration-300 cursor-pointer'>
                    Contact Sales
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section
          id='testimonials'
          className='py-16 px-4 overflow-hidden'
          style={{ backgroundColor: '#131818' }}>
          <div className='max-w-7xl mx-auto'>
            <div className='text-center mb-16'>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className='inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6'>
                <StarIcon className='w-4 h-4 text-primary fill-primary' />
                <span className='text-sm font-medium text-primary'>
                  Testimonials
                </span>
              </motion.div>
              <h2 className='text-3xl md:text-4xl font-semibold text-white mb-4 font-heading'>
                Loved by <span className='text-primary'>2000+</span> Customers
              </h2>
              <p className='text-lg text-white/50 max-w-xl mx-auto'>
                Real feedback from businesses worldwide who trust us with their
                shipments.
              </p>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {[
                {
                  quote:
                    "Absolutely the fastest service I've used for my Malaysia shipments. The rate of ₹290/kg is unbeatable for the speed.",
                  name: 'John Doe',
                  initials: 'JD',
                  role: 'E-commerce Seller',
                  country: 'Malaysia',
                  flag: 'MY',
                },
                {
                  quote:
                    'Gajan Traders removed all the headache from customs clearance. My packages to UK arrive earlier than expected every time.',
                  name: 'Anita S.',
                  initials: 'AS',
                  role: 'Textile Exporter',
                  country: 'United Kingdom',
                  flag: 'GB',
                },
                {
                  quote:
                    'Great tracking interface. I can see exactly where my shipment is without calling support.',
                  name: 'Rahul K.',
                  initials: 'RK',
                  role: 'Retail Manager',
                  country: 'UAE',
                  flag: 'AE',
                },
                {
                  quote:
                    'Customer support is top notch. They helped me repackage a shipment to save weight. Highly recommended!',
                  name: 'Mohamed K.',
                  initials: 'MK',
                  role: 'Small Business Owner',
                  country: 'Saudi Arabia',
                  flag: 'SA',
                },
                {
                  quote:
                    'Best rates for USA shipments. Saved me 20% compared to DHL.',
                  name: 'Sarah R.',
                  initials: 'SR',
                  role: 'Artisan',
                  country: 'USA',
                  flag: 'US',
                },
                {
                  quote:
                    'Reliable and trustworthy. Been using them for 2 years now.',
                  name: 'Dinesh K.',
                  initials: 'DK',
                  role: 'Trader',
                  country: 'Canada',
                  flag: 'CA',
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -8 }}
                  className='group relative p-8 rounded-3xl bg-white/[0.03] border border-white/[0.06] hover:border-primary/40 transition-all duration-300 cursor-pointer overflow-hidden'>
                  <div className='absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500' />
                  <div className='absolute top-6 right-6 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all duration-500' />

                  <div className='relative z-10'>
                    <div className='flex items-center gap-1 mb-5'>
                      {[...Array(5)].map((_, r) => (
                        <StarIcon
                          key={r}
                          className='w-4 h-4 text-amber-400 fill-amber-400'
                        />
                      ))}
                    </div>

                    <div className='relative mb-6'>
                      <span className='absolute -top-4 -left-2 text-5xl text-primary/15 font-serif'>
                        "
                      </span>
                      <p className='text-sm text-white/70 leading-relaxed pl-5'>
                        {item.quote}
                      </p>
                    </div>

                    <div className='flex items-center justify-between pt-5 border-t border-white/5'>
                      <div className='flex items-center gap-4'>
                        <div className='w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform'>
                          <span className='text-white font-bold'>
                            {item.initials}
                          </span>
                        </div>
                        <div>
                          <p className='font-semibold text-white group-hover:text-primary transition-colors'>
                            {item.name}
                          </p>
                          <p className='text-xs text-white/40'>{item.role}</p>
                        </div>
                      </div>
                      <ReactCountryFlag
                        countryCode={item.flag}
                        className='w-8 h-6 rounded shadow-sm'
                        svg
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className='mt-16 pt-8 border-t border-white/5'>
              <p className='text-center text-sm text-white/30 mb-6'>
                Powering growth for 2000+ businesses
              </p>
              <div className='flex flex-wrap items-center justify-center gap-12 opacity-30'>
                {['Flipkart', 'Amazon', 'Myntra', 'Shopify', 'FedEx'].map(
                  (brand, i) => (
                    <span
                      key={i}
                      className='text-xl font-bold text-white tracking-wider'>
                      {brand.toUpperCase()}
                    </span>
                  ),
                )}
              </div>
            </div>
          </div>
        </section>

        <section className='py-14 px-4' style={{ backgroundColor: '#131818' }}>
          <div className='max-w-4xl mx-auto'>
            <div className='text-center mb-12'>
              <span className='text-primary text-xs font-semibold tracking-wider uppercase'>
                FAQ
              </span>
              <h2 className='text-lg md:text-xl font-semibold text-white mt-3 font-heading'>
                Frequently Asked Questions
              </h2>
            </div>
            <div className='space-y-3'>
              {[
                {
                  q: 'How long does international delivery take?',
                  a: 'Delivery times vary by destination. Express shipments take 2-5 days, while standard shipping may take 7-15 days. Remote areas may require additional time.',
                },
                {
                  q: 'What items can I ship internationally?',
                  a: 'We ship documents, packages, personal belongings, commercial goods, and food items (non-perishable). Some items may require special documentation.',
                },
                {
                  q: 'Is my shipment insured during transit?',
                  a: 'Yes, all shipments are covered by our comprehensive insurance policy. Additional coverage can be purchased for high-value items.',
                },
                {
                  q: 'Can I track my shipment in real-time?',
                  a: 'Absolutely! You can track your shipment 24/7 through our website or mobile app. You will receive SMS and email updates at every milestone.',
                },
                {
                  q: 'Do you offer door pickup service?',
                  a: 'Yes, we offer free door pickup in select cities. Schedule a pickup online and our team will collect your package from your specified address.',
                },
                {
                  q: 'What payment methods do you accept?',
                  a: 'We accept all major credit/debit cards, UPI, net banking, and cash on delivery (select locations). Corporate clients can request invoice-based billing.',
                },
              ].map((item, i) => (
                <details
                  key={i}
                  className='group bg-white/[0.03] border border-white/[0.08] rounded-xl overflow-hidden'>
                  <summary className='flex items-center justify-between px-5 py-4 cursor-pointer list-none hover:bg-white/[0.02] transition-colors'>
                    <span className='text-sm font-semibold text-white'>
                      {item.q}
                    </span>
                    <ChevronRight className='w-4 h-4 text-white/40 transition-transform duration-300 group-open:rotate-90 shrink-0' />
                  </summary>
                  <div className='px-5 pb-5'>
                    <p className='text-sm text-white/50 leading-relaxed'>
                      {item.a}
                    </p>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className='py-14 px-4' style={{ backgroundColor: '#121212' }}>
          <div className='max-w-4xl mx-auto text-center'>
            <SlideIn direction='up'>
              <span className='text-primary text-xs font-semibold tracking-wider uppercase'>
                Get In Touch
              </span>
              <h2 className='text-lg md:text-xl font-semibold text-white mt-3 mb-4 font-heading'>
                Ready to Ship?
              </h2>
              <p className='text-base text-white/50 mb-8 max-w-md mx-auto'>
                Contact us today for a free consultation and quote. Our team is
                available 24/7 to assist you.
              </p>
            </SlideIn>
            <SlideIn
              direction='up'
              delay={0.1}
              className='flex flex-col sm:flex-row items-center justify-center gap-4'>
              <a
                href='mailto:info@gajantraders.com'
                className='flex items-center gap-2 px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg text-sm font-medium text-white/80 transition-all duration-300 cursor-pointer'>
                <Mail className='w-4 h-4' />
                info@gajantraders.com
              </a>
              <a
                href='tel:+1234567890'
                className='flex items-center gap-2 px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg text-sm font-medium text-white/80 transition-all duration-300 cursor-pointer'>
                <Phone className='w-4 h-4' />
                +1 234 567 890
              </a>
            </SlideIn>
          </div>
        </section>

        <footer
          className='py-8 px-4 border-t border-white/10'
          style={{ backgroundColor: '#121212' }}>
          <div className='max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4'>
            <div className='flex items-center gap-2'>
              <PlaneIcon className='w-5 h-5 text-primary' />
              <span className='text-sm font-bold text-white'>
                Gajan Traders
              </span>
            </div>
            <p className='text-xs text-white/40'>
              &copy; 2026 Gajan Traders. All rights reserved.
            </p>
            <div className='flex items-center gap-4'>
              <Mail className='w-4 h-4 text-white/30 cursor-pointer hover:text-white/60 transition-colors' />
              <Phone className='w-4 h-4 text-white/30 cursor-pointer hover:text-white/60 transition-colors' />
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
