'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Globe, Package, Shield, Clock, Users,
  TrendingUp, MapPin, ArrowRight, Award, Zap,
  HeadphonesIcon, ChevronRight, Plane, BarChart3,
  Building2, Network, Star
} from 'lucide-react';
import Navbar from '@/components/Navbar';

const fadeIn = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.5 },
};

const stagger = {
  whileInView: { transition: { staggerChildren: 0.08 } },
  viewport: { once: true },
};

export default function AboutPage() {
  return (
    <div className='min-h-screen bg-white'>
      <Navbar />

      {/* ===== HERO ===== */}
      <section className='bg-zinc-50 pt-36 lg:pt-44 pb-16 overflow-hidden'>
        <div className='max-w-7xl mx-auto px-6 lg:px-8'>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
            <h1 className='text-xl sm:text-2xl lg:text-3xl font-semibold text-zinc-900 leading-[0.95] tracking-tight font-heading max-w-3xl'>
              About Gajan Traders
            </h1>
            <p className='text-base sm:text-lg text-zinc-700 max-w-2xl mt-6 leading-relaxed'>
              Trusted Global Courier Partner orchestration global commerce with surgical precision and unmatched speed.
            </p>
            <div className='flex flex-wrap gap-4 mt-8'>
              <Link
                href='/register'
                className='inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-[#172554] text-sm font-bold text-white uppercase tracking-wider transition-all duration-300 rounded-lg'
              >
                Get Started <ArrowRight className='w-4 h-4' />
              </Link>
              <Link
                href='/contact'
                className='inline-flex items-center gap-2 px-6 py-3 border border-zinc-300 text-zinc-700 hover:text-zinc-900 hover:border-zinc-400 text-sm font-semibold uppercase tracking-wider transition-all duration-300 rounded-lg'
              >
                Contact Us
              </Link>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className='relative max-w-7xl mx-auto px-6 lg:px-8 mt-12'
        >
          <div className='bg-zinc-200 overflow-hidden'>
            <img
              src='https://images.unsplash.com/photo-1566576721344-5e8f3b7b1d3f?w=1200&q=80'
              alt=''
              className='w-full h-[300px] lg:h-[400px] object-cover opacity-80'
            />
          </div>
        </motion.div>
      </section>

      {/* ===== STATS ===== */}
      <section className='-mt-16 relative z-10'>
        <div className='max-w-7xl mx-auto px-6 lg:px-8'>
          <div className='grid grid-cols-3 bg-white border border-zinc-100 shadow-sm'>
            {[
              { icon: Building2, value: '445+', label: 'Branches' },
              { icon: Globe, value: '200+', label: 'Countries' },
              { icon: Award, value: '8+', label: 'Years Experience' },
            ].map((s, i) => (
              <div key={i} className='p-6 lg:p-8 text-center border-r border-zinc-100 last:border-r-0'>
                <s.icon className='w-6 h-6 text-primary mx-auto mb-3' />
                <div className='text-xl lg:text-2xl font-semibold text-zinc-900'>{s.value}</div>
                <div className='text-sm text-zinc-400 mt-1 uppercase tracking-wider'>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== WHO WE ARE ===== */}
      <section className='py-14 lg:py-20'>
        <div className='max-w-7xl mx-auto px-6 lg:px-8'>
          <div className='grid lg:grid-cols-2 gap-16 items-center'>
            <motion.div {...fadeIn}>
              <div className='flex items-center gap-3 mb-5'>
                <Users className='w-6 h-6 text-primary' />
                <span className='text-primary text-sm font-semibold tracking-[0.2em] uppercase'>Who We Are</span>
              </div>
              <h2 className='text-xl sm:text-2xl lg:text-3xl font-semibold text-zinc-900 leading-[0.95] tracking-tight font-heading mb-6'>
                A premium logistics and courier service provider
              </h2>
              <div className='space-y-4 text-lg text-zinc-700 leading-relaxed'>
                <p>
                  Gajan Traders is committed to delivering reliable, efficient, and globally connected shipping solutions. We bridge the gap between Indian businesses and international markets with precision and care.
                </p>
                <p className='text-zinc-400'>
                  With an extensive network across India, operations are driven by precision, consistency, and a strong focus on service excellence. Every shipment is handled with care, ensuring seamless movement across international destinations.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6 }}
            >
              <div className='bg-zinc-100'>
                <img
                  src='https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=80'
                  alt=''
                  className='w-full h-[400px] object-cover'
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== WHAT WE DO ===== */}
      <section className='py-14 lg:py-20 bg-zinc-50'>
        <div className='max-w-7xl mx-auto px-6 lg:px-8'>
          <div className='grid lg:grid-cols-2 gap-16 items-center'>
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6 }}
              className='order-2 lg:order-1'
            >
              <div className='bg-zinc-200'>
                <img
                  src='https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?w=800&q=80'
                  alt=''
                  className='w-full h-[400px] object-cover'
                />
              </div>
            </motion.div>

            <motion.div {...fadeIn} className='order-1 lg:order-2'>
              <div className='flex items-center gap-3 mb-5'>
                <Package className='w-6 h-6 text-primary' />
                <span className='text-primary text-sm font-semibold tracking-[0.2em] uppercase'>What We Do</span>
              </div>
              <h2 className='text-xl sm:text-2xl lg:text-3xl font-semibold text-zinc-900 leading-[0.95] tracking-tight font-heading mb-6'>
                Comprehensive logistics solutions for every need
              </h2>
              <div className='space-y-4 text-lg text-zinc-700 leading-relaxed'>
                <p>
                  Comprehensive logistics solutions are designed to meet the dynamic needs of individuals and businesses.
                </p>
                <p className='text-zinc-400'>
                  Services include International shipping, enabling smooth and secure transportation of documents, parcels, and high-value consignments. Each shipment is managed with a focus on timely delivery, secure handling, and a streamlined customer experience.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== CORE VALUES ===== */}
      <section className='py-14 lg:py-20'>
        <div className='max-w-7xl mx-auto px-6 lg:px-8'>
          <motion.div {...fadeIn} className='text-center max-w-xl mx-auto mb-16'>
            <span className='text-primary text-sm font-semibold tracking-[0.2em] uppercase block mb-4'>Foundation of Excellence</span>
            <h2 className='text-xl sm:text-2xl lg:text-3xl font-semibold text-zinc-900 leading-[0.95] tracking-tight font-heading'>
              Our core values drive every decision we make
            </h2>
          </motion.div>

          <motion.div variants={stagger} initial='initial' whileInView='animate' viewport={{ once: true }} className='grid md:grid-cols-3 gap-8'>
            {[
              {
                icon: Shield,
                title: 'Reliability',
                desc: 'Consistency is our currency. We maintain rigorous standards through contingency planning and real-time monitoring to ensure your shipments arrive as promised.',
                stat: '99.2% On-Time',
              },
              {
                icon: Zap,
                title: 'Speed',
                desc: 'In the modern economy, time is the ultimate resource. Our express network bypasses traditional bottlenecks to ensure rapid cross-border transit.',
                stat: 'Fast Delivery',
              },
              {
                icon: Globe,
                title: 'Global Reach',
                desc: 'No destination is too remote. Our network extends to over 50 countries, bridging the gap between local businesses and global markets.',
                stat: '50+ Countries',
              },
            ].map((v, i) => (
              <motion.div
                key={i}
                variants={fadeIn}
                className='text-center p-8 bg-zinc-50 border border-zinc-100 hover:border-zinc-200 hover:shadow-sm transition-all duration-300'
              >
                <v.icon className='w-10 h-10 text-primary mx-auto mb-5' />
                <h3 className='text-base font-semibold text-zinc-900 mb-3'>{v.title}</h3>
                <p className='text-base text-zinc-700 leading-relaxed'>{v.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== TIMELINE ===== */}
      <section className='py-14 lg:py-20 bg-zinc-50'>
        <div className='max-w-7xl mx-auto px-6 lg:px-8'>
          <motion.div {...fadeIn} className='text-center max-w-xl mx-auto mb-16'>
            <span className='text-primary text-sm font-semibold tracking-[0.2em] uppercase block mb-4'>Our Journey</span>
            <h2 className='text-xl sm:text-2xl lg:text-3xl font-semibold text-zinc-900 leading-[0.95] tracking-tight font-heading'>
              A timeline of growth defined by vision, expansion, and innovation
            </h2>
          </motion.div>

          <div className='max-w-3xl mx-auto'>
            <div className='space-y-0'>
              {[
                { year: '2018', title: 'The Beginning', desc: 'A single office marked the start of a larger vision — to simplify international shipping and create seamless global connections for businesses and individuals.' },
                { year: '2020', title: 'Digital Transformation', desc: 'Launched real-time tracking and digital booking platforms, enabling customers to manage shipments entirely online.' },
                { year: '2022', title: 'Network Expansion', desc: 'Expanded operations to 25+ countries with strategic partnerships, opening new trade corridors for our customers.' },
                { year: '2024', title: 'Scale & Innovation', desc: 'Crossed 10,000 successful shipments. Introduced automated customs documentation and AI-powered route optimization.' },
                { year: '2026+', title: 'The Future', desc: 'Continuing to expand our global footprint with a focus on technology-driven efficiency and sustainable logistics practices.' },
              ].map((t, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  className='flex gap-6 py-6 border-b border-zinc-200 last:border-b-0'
                >
                  <div className='w-20 flex-shrink-0 pt-0.5'>
                    <span className='text-sm font-bold text-primary'>{t.year}</span>
                  </div>
                  <div>
                    <h3 className='text-base font-semibold text-zinc-900'>{t.title}</h3>
                    <p className='text-base text-zinc-700 mt-1 leading-relaxed'>{t.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== THE EDGE ===== */}
      <section className='py-14 lg:py-20'>
        <div className='max-w-7xl mx-auto px-6 lg:px-8'>
          <motion.div {...fadeIn} className='text-center max-w-xl mx-auto mb-16'>
            <span className='text-primary text-sm font-semibold tracking-[0.2em] uppercase block mb-4'>The Gajan Edge</span>
            <h2 className='text-xl sm:text-2xl lg:text-3xl font-semibold text-zinc-900 leading-[0.95] tracking-tight font-heading'>
              We combine expertise with technology for a world-class experience
            </h2>
          </motion.div>

          <div className='grid sm:grid-cols-2 lg:grid-cols-4 gap-6'>
            {[
              { icon: Globe, title: 'Strong Network', desc: 'Strategic partnerships with global carriers and local delivery fleets across 50+ countries.' },
              { icon: Shield, title: 'Secure Logistics', desc: 'Multi-layered security protocols and comprehensive transit insurance for peace of mind.' },
              { icon: HeadphonesIcon, title: 'Dedicated Support', desc: 'Human-led assistance for every shipping query, from booking to final delivery.' },
              { icon: Clock, title: 'Real-Time Tracking', desc: 'Live IoT-based tracking with milestone alerts and proactive status updates.' },
            ].map((e, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className='p-6 bg-zinc-50 border border-zinc-100 hover:border-zinc-200 hover:shadow-sm transition-all duration-300'
              >
                <e.icon className='w-8 h-8 text-primary mb-4' />
                <h3 className='text-zinc-900 font-bold text-base mb-2'>{e.title}</h3>
                <p className='text-base text-zinc-700 leading-relaxed'>{e.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className='relative py-16 lg:py-24 bg-zinc-50 overflow-hidden'>
        <div className='relative max-w-7xl mx-auto px-6 lg:px-8 text-center'>
          <motion.div {...fadeIn}>
            <h2 className='text-xl sm:text-2xl lg:text-3xl font-semibold text-zinc-900 leading-[0.95] tracking-tight font-heading mb-4'>
              Start Shipping Today
            </h2>
            <p className='text-zinc-700 max-w-lg mx-auto mb-10 text-lg'>
              Experience the precision and velocity that thousands of businesses trust every day.
            </p>
            <div className='flex flex-wrap justify-center gap-4'>
              <Link
                href='/register'
                className='inline-flex items-center gap-2 px-8 py-4 bg-primary hover:bg-[#172554] text-sm font-bold text-white uppercase tracking-wider transition-all duration-300 rounded-lg'
              >
                Get Started <ArrowRight className='w-4 h-4' />
              </Link>
              <Link
                href='/contact'
                className='inline-flex items-center gap-2 px-8 py-4 border border-zinc-300 text-zinc-700 hover:text-zinc-900 hover:border-zinc-400 text-sm font-semibold uppercase tracking-wider transition-all duration-300 rounded-lg'
              >
                Contact Us
              </Link>
            </div>
            <div className='flex flex-wrap justify-center gap-8 mt-10 text-sm text-zinc-400'>
              <span>No Hidden Charges</span>
              <span className='w-px h-4 bg-zinc-200' />
              <span>Free Packing</span>
              <span className='w-px h-4 bg-zinc-200' />
              <span>50+ Countries Served</span>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
