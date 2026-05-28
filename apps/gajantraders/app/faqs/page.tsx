'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  ChevronDown, ArrowRight, HelpCircle, Package,
  Truck, DollarSign, Mail, Plane,
  Ship, MapPin, Ban, HeadphonesIcon, Search
} from 'lucide-react';
import Navbar from '@/components/Navbar';

const fadeIn = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.5 },
};

const categories = [
  { id: 'common', label: 'Common FAQs', icon: HelpCircle },
  { id: 'track', label: 'Track', icon: Truck },
  { id: 'price', label: 'Price', icon: DollarSign },
  { id: 'services', label: 'Services', icon: Package },
  { id: 'prohibited', label: 'Prohibited Items', icon: Ban },
  { id: 'contact', label: 'Contact Us', icon: Mail },
  { id: 'express', label: 'Express Service', icon: Plane },
  { id: 'ocean', label: 'Ocean Freight', icon: Ship },
  { id: 'air', label: 'Air Freight', icon: Plane },
  { id: 'branches', label: 'Branches', icon: MapPin },
];

const faqData: Record<string, { q: string; a: string }[]> = {
  common: [
    {
      q: 'How much does international courier cost from India?',
      a: 'Pricing depends on destination, weight, dimensions, and service type. International shipping to USA starts from a competitive rate per kg. Use our instant rate calculator for an accurate quote.',
    },
    {
      q: 'How long does international delivery take?',
      a: 'Express Air: 3–5 working days. Standard Air: 5–10 working days. Sea freight: 3–6 weeks (subject to customs clearance at destination).',
    },
    {
      q: 'Does Gajan Traders handle customs clearance?',
      a: 'Yes — we handle export declarations, commercial invoices, and destination country requirements to ensure smooth customs processing.',
    },
    {
      q: 'Which countries does Gajan Traders deliver to?',
      a: 'We deliver to 200+ countries including USA, UK, Canada, Australia, UAE, Saudi Arabia, Qatar, Kuwait, Bahrain, and other Gulf nations.',
    },
    {
      q: 'What services does Gajan Traders provide?',
      a: 'International courier and cargo services including document shipping, parcel delivery, excess baggage shipping, and commercial consignments.',
    },
  ],
  track: [
    {
      q: 'Where can I find my tracking number?',
      a: 'Your tracking number is sent via SMS and email at the time of booking. It is also printed on your invoice and booking confirmation.',
    },
    {
      q: 'Why are there gaps in tracking updates?',
      a: 'This is normal in cross-border shipping. Updates occur at key checkpoints — pickup, transit hubs, customs clearance, and final delivery.',
    },
    {
      q: 'How do I track my shipment?',
      a: 'Enter your tracking or AWB number on our Track page to get real-time updates on your shipment status.',
    },
    {
      q: 'Is tracking available for all service types?',
      a: 'Yes — all express, air freight, and ocean freight shipments include tracking from pickup to delivery.',
    },
  ],
  price: [
    {
      q: 'How is international courier pricing calculated?',
      a: 'Pricing is based on destination, chargeable weight (actual or volumetric), dimensions, shipment type, and service level. GST is applicable as per government regulations.',
    },
    {
      q: 'How can I get a price quote?',
      a: 'Use our instant rate calculator on the website — no account required. You can also contact our sales team for bulk shipping rates.',
    },
    {
      q: 'Does delivery speed affect pricing?',
      a: 'Yes — faster delivery options like express service cost more than standard or economy due to priority handling and faster transit times.',
    },
    {
      q: 'Are there any hidden charges?',
      a: 'No — we provide transparent pricing. All charges including fuel surcharges, insurance, and taxes are clearly communicated before booking.',
    },
  ],
  services: [
    {
      q: 'How do I book a shipment with Gajan Traders?',
      a: 'You can book online through our website, schedule a doorstep pickup, or visit any of our branches across India. We handle end-to-end logistics.',
    },
    {
      q: 'What types of shipments do you handle?',
      a: 'We handle documents, parcels, commercial goods, personal effects, excess baggage, and specialized cargo for businesses.',
    },
    {
      q: 'Do you provide packaging assistance?',
      a: 'Yes — we offer professional packaging services to ensure your items are securely packed for international transit.',
    },
  ],
  prohibited: [
    {
      q: 'Why are some products prohibited for shipping?',
      a: 'Certain products are restricted due to safety regulations, airline policies, customs requirements, and international shipping laws.',
    },
    {
      q: 'What items are restricted or prohibited?',
      a: 'Explosives, flammable materials, illegal goods, hazardous chemicals, weapons, and other regulated products. Restrictions vary by destination country.',
    },
    {
      q: 'Can I ship medicines through international courier?',
      a: 'Yes — certain medicines can be shipped with a valid prescription and required documentation, subject to destination country regulations.',
    },
    {
      q: 'How can I know if my item is allowed?',
      a: 'Contact our support team or check our Prohibited Items page for a comprehensive list of restricted commodities.',
    },
  ],
  contact: [
    {
      q: 'What are your support hours?',
      a: 'Our customer support team is available 24/7 to assist you with any queries or concerns.',
    },
    {
      q: 'How can I contact customer support?',
      a: 'You can reach us by phone, email, or through the enquiry form on our Contact Us page. We also have walk-in support at all branch locations.',
    },
    {
      q: 'What should I do if my tracking ID shows no results?',
      a: 'Double-check the tracking number for accuracy. If it still shows no results, contact our support team with your booking details.',
    },
    {
      q: 'Why is my shipment delayed?',
      a: 'Delays can occur due to customs clearance, weather conditions, airline schedules, or unforeseen circumstances. Track your shipment online or contact support for updates.',
    },
  ],
  express: [
    {
      q: 'Can I schedule a pickup from my home?',
      a: 'Yes — we offer free doorstep pickup from your home or office. Schedule online and our team will collect your shipment.',
    },
    {
      q: 'Which express service should I choose?',
      a: 'For urgent shipments, choose our Priority Express service. For a balance of speed and pricing, our Standard Express service is ideal.',
    },
    {
      q: 'Will I be able to track my express shipment?',
      a: 'Yes — all express shipments include real-time tracking from pickup to final delivery.',
    },
  ],
  ocean: [
    {
      q: 'What is ocean freight shipping?',
      a: 'Ocean freight is a cost-effective solution for large or heavy shipments. It is ideal for commercial cargo, bulk goods, and non-urgent consignments.',
    },
    {
      q: 'How long does ocean freight take?',
      a: 'Ocean freight typically takes 3–6 weeks depending on the route and destination. Transit times vary based on shipping lines and port schedules.',
    },
    {
      q: 'What is the price of ocean freight?',
      a: 'Ocean freight pricing depends on cargo volume, container type, weight, and destination. It is generally more economical than air freight for large shipments.',
    },
  ],
  air: [
    {
      q: 'What is air freight?',
      a: 'Air freight is the fastest mode of international shipping, ideal for time-sensitive and high-value shipments.',
    },
    {
      q: 'How is air freight pricing calculated?',
      a: 'Air freight is calculated based on chargeable weight (actual or volumetric weight, whichever is higher), destination, and service level.',
    },
    {
      q: 'How long does air freight delivery take?',
      a: 'Air freight typically takes 3–10 business days depending on the destination and customs processing.',
    },
  ],
  branches: [
    {
      q: 'Does Gajan Traders have branches across India?',
      a: 'Yes — we have a growing network of branches across major cities in India. Visit our Branches page to find the nearest location.',
    },
    {
      q: 'Do you offer doorstep pickup?',
      a: 'Yes — we offer free doorstep pickup across all serviceable locations. Schedule a pickup online or through our customer support.',
    },
    {
      q: 'What services are available at your branches?',
      a: 'Our branches offer international courier booking, tracking support, pickup assistance, packaging services, and customer support.',
    },
  ],
};

export default function FaqsPage() {
  const [activeCategory, setActiveCategory] = useState('common');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const currentFaqs = faqData[activeCategory] || [];
  const filteredFaqs = searchQuery
    ? currentFaqs.filter(
        (f) =>
          f.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.a.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : currentFaqs;

  const activeCat = categories.find((c) => c.id === activeCategory);
  const ActiveIcon = activeCat?.icon || HelpCircle;

  return (
    <div className='min-h-screen bg-white'>
      <Navbar />

      {/* ===== HERO ===== */}
      <section className='bg-zinc-50 pt-36 lg:pt-44 pb-16 lg:pb-20 overflow-hidden'>
        <div className='max-w-7xl mx-auto px-6 lg:px-8'>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
            <div className='inline-flex items-center gap-2 px-4 py-2 bg-primary/5 border border-primary/10 text-primary text-sm font-bold uppercase tracking-widest mb-6 rounded-lg'>
              <HelpCircle className='w-4 h-4' />
              Help Center
            </div>
            <h1 className='text-xl sm:text-2xl lg:text-3xl font-semibold text-zinc-900 leading-[0.95] tracking-tight font-heading max-w-3xl'>
              Frequently Asked Questions
            </h1>
            <p className='text-base sm:text-lg text-zinc-500 max-w-2xl mt-6 leading-relaxed'>
              Find answers to common questions about our international courier and cargo services.
              Can&apos;t find what you&apos;re looking for? Our support team is available 24/7.
            </p>
            <div className='flex flex-wrap gap-4 mt-8'>
              <Link
                href='/contact'
                className='inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-[#172554] text-base font-bold text-white uppercase tracking-wider transition-all duration-300 rounded-lg'
              >
                Contact Support <ArrowRight className='w-4 h-4' />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== FAQ CONTENT ===== */}
      <section className='py-14 lg:py-20'>
        <div className='max-w-7xl mx-auto px-6 lg:px-8'>
          <div className='flex gap-8 lg:gap-12 flex-col lg:flex-row'>
            {/* Sidebar */}
            <aside className='lg:w-72 shrink-0'>
              <div className='lg:sticky lg:top-32'>
                <div className='relative mb-4'>
                  <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400' />
                  <input
                    type='text'
                    placeholder='Search FAQs...'
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className='w-full pl-9 pr-4 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all'
                  />
                </div>
                <p className='text-xs text-zinc-400 uppercase tracking-widest mb-3 font-medium'>Categories</p>
                <div className='flex flex-wrap lg:flex-col gap-1.5'>
                  {categories.map((cat) => {
                    const isActive = activeCategory === cat.id;
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => { setActiveCategory(cat.id); setOpenFaq(null); setSearchQuery(''); }}
                        className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 text-left rounded-lg ${
                          isActive
                            ? 'bg-primary text-white shadow-md'
                            : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 border border-transparent'
                        }`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-zinc-400'}`} />
                        {cat.label}
                      </button>
                    );
                  })}
                </div>

                <div className='mt-8 bg-primary/5 border border-primary/10 p-6 rounded-lg'>
                  <HeadphonesIcon className='w-6 h-6 text-primary mb-3' />
                  <h3 className='text-sm font-semibold text-zinc-900 mb-1'>Need direct help?</h3>
                  <p className='text-xs text-zinc-500 mb-4 leading-relaxed'>
                    Our support team is available 24/7 to assist you.
                  </p>
                  <Link
                    href='/contact'
                    className='inline-flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-[#172554] text-xs font-bold text-white uppercase tracking-wider transition-all duration-300 rounded-lg'
                  >
                    Raise a Query
                  </Link>
                </div>
              </div>
            </aside>

            {/* FAQ List */}
            <div className='flex-1 min-w-0'>
              <motion.div key={activeCategory} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                <div className='flex items-center gap-3 mb-8 pb-6 border-b border-zinc-100'>
                  <div className='w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center'>
                    <ActiveIcon className='w-5 h-5 text-primary' />
                  </div>
                  <div>
                    <h2 className='text-lg font-semibold text-zinc-900 font-heading'>{activeCat?.label || 'FAQs'}</h2>
                    <p className='text-sm text-zinc-400'>{filteredFaqs.length} {filteredFaqs.length === 1 ? 'answer' : 'answers'}</p>
                  </div>
                </div>

                {filteredFaqs.length === 0 ? (
                  <div className='text-center py-16'>
                    <Search className='w-10 h-10 text-zinc-200 mx-auto mb-3' />
                    <p className='text-base font-medium text-zinc-500'>No results found</p>
                    <p className='text-sm text-zinc-400 mt-1'>Try a different search term or category.</p>
                  </div>
                ) : (
                  <div className='space-y-3'>
                    {filteredFaqs.map((faq, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: i * 0.04 }}
                        className={`border rounded-lg overflow-hidden transition-all duration-200 ${
                          openFaq === i
                            ? 'border-primary/20 shadow-sm'
                            : 'border-zinc-100 hover:border-zinc-200'
                        }`}
                      >
                        <button
                          onClick={() => setOpenFaq(openFaq === i ? null : i)}
                          className='w-full flex items-center justify-between gap-4 px-6 py-5 text-left bg-white'
                        >
                          <span className='text-sm font-semibold text-zinc-900'>{faq.q}</span>
                          <ChevronDown
                            className={`w-4 h-4 shrink-0 transition-all duration-300 ${
                              openFaq === i ? 'rotate-180 text-primary' : 'text-zinc-400'
                            }`}
                          />
                        </button>
                        <AnimatePresence>
                          {openFaq === i && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className='overflow-hidden'
                            >
                              <div className='px-6 pb-5 pt-0 border-t border-zinc-100 bg-white'>
                                <p className='text-base text-zinc-500 leading-relaxed mt-4'>{faq.a}</p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className='relative py-16 lg:py-24 bg-zinc-50 overflow-hidden'>
        <div className='relative max-w-7xl mx-auto px-6 lg:px-8 text-center'>
          <motion.div {...fadeIn}>
            <h2 className='text-xl sm:text-2xl lg:text-3xl font-semibold text-zinc-900 leading-[0.95] tracking-tight font-heading mb-4'>
              Still Have Questions?
            </h2>
            <p className='text-zinc-500 max-w-lg mx-auto mb-10 text-base'>
              Get in touch with our team for personalized support. We&apos;re available 24/7 to help you.
            </p>
            <div className='flex flex-wrap justify-center gap-4'>
              <Link
                href='/contact'
                className='inline-flex items-center gap-2 px-8 py-4 bg-primary hover:bg-[#172554] text-sm font-bold text-white uppercase tracking-wider transition-all duration-300 rounded-lg'
              >
                Contact Us <ArrowRight className='w-4 h-4' />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
