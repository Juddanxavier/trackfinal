'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight, Ban,
  Flame, Gem, Scale, AlertTriangle,
  Droplets, Gavel, Apple, PawPrint,
  CheckCircle, XCircle, ClipboardList,
  Mail, Phone, FileWarning, type LucideIcon
} from 'lucide-react';
import Navbar from '@/components/Navbar';

function ThreeDIcon({ icon: Icon, iconClass = '' }: { icon: LucideIcon; iconClass?: string }) {
  return (
    <div className='relative inline-block' style={{ transformStyle: 'preserve-3d' }}>
      <div
        className='absolute inset-0 rounded-lg'
        style={{ transform: 'translateZ(-4px) translateX(2px) translateY(2px)', background: 'rgba(0,0,0,0.1)' }}
      />
      <div
        className='absolute inset-0 rounded-lg'
        style={{ transform: 'translateZ(-2px) translateX(1px) translateY(1px)', background: 'rgba(0,0,0,0.05)' }}
      />
      <div className={`relative rounded-lg flex items-center justify-center ${iconClass}`} style={{ transform: 'translateZ(0)' }}>
        <Icon className='w-full h-full p-2' />
      </div>
    </div>
  );
}

const fadeIn = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.5 },
};

const prohibitedItems = [
  {
    icon: Ban,
    label: 'Currency',
    description: 'Shipping of currency, cash, or monetary instruments is strictly prohibited.',
    image: 'https://images.unsplash.com/photo-1579621970563-449ec4c1b0a4?w=400&q=80',
  },
  {
    icon: Flame,
    label: 'Hazardous',
    description: 'Hazardous or dangerous goods including explosives, gases, and flammable materials are not allowed.',
    image: 'https://images.unsplash.com/photo-1580822184713-fc5400e7fe10?w=400&q=80',
  },
  {
    icon: Gem,
    label: 'Valuables',
    description: 'Precious & semi-precious items including gold, silver, diamonds, and gemstones are prohibited.',
    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&q=80',
  },
  {
    icon: Scale,
    label: 'Legal',
    description: 'Legally restricted items such as narcotics, firearms, and counterfeit goods are not permitted.',
    image: 'https://images.unsplash.com/photo-1616077168070-5cb5f5f0a3f0?w=400&q=80',
  },
  {
    icon: AlertTriangle,
    label: 'Shipment Risk',
    description: 'Shipments posing risk of damage or delay to other consignments are not accepted.',
    image: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=400&q=80',
  },
  {
    icon: Droplets,
    label: 'Liquids',
    description: 'Liquids and semi-liquids including oils, paints, and chemicals are prohibited.',
    image: 'https://images.unsplash.com/photo-1587905064218-f2c91f2e0e20?w=400&q=80',
  },
  {
    icon: Gavel,
    label: 'Regulatory',
    description: 'Goods banned by local or international law may not be shipped under any circumstances.',
    image: 'https://images.unsplash.com/photo-1554295405-abb8fd54f153?w=400&q=80',
  },
  {
    icon: Apple,
    label: 'Perishable',
    description: 'Perishable food items, beverages, and temperature-sensitive goods are not allowed.',
    image: 'https://images.unsplash.com/photo-1556845334-d23d8f0e5e1b?w=400&q=80',
  },
  {
    icon: PawPrint,
    label: 'Living',
    description: 'Shipping of live animals, plants, or biological specimens is strictly prohibited.',
    image: 'https://images.unsplash.com/photo-1545249390-291516c1d2b0?w=400&q=80',
  },
];

const categories = [
  { label: 'Dangerous Goods', items: ['Explosives & fireworks', 'Flammable liquids & solids', 'Compressed gases', 'Radioactive materials', 'Corrosive substances'], image: 'https://images.unsplash.com/photo-1580795483976-0f05c0e4bc87?w=600&q=80' },
  { label: 'Valuables & Currency', items: ['Cash & monetary instruments', 'Gold, silver & precious metals', 'Diamonds & gemstones', 'Negotiable securities', 'Traveler cheques'], image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&q=80' },
  { label: 'Illegal & Restricted', items: ['Narcotics & drugs', 'Firearms & weapons', 'Counterfeit goods', 'Stolen property', 'Prescription medications without license'], image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&q=80' },
  { label: 'Perishable & Living', items: ['Live animals & plants', 'Perishable food items', 'Biological specimens', 'Frozen goods', 'Seeds & agricultural products'], image: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=600&q=80' },
  { label: 'Liquids & Chemicals', items: ['Paints & solvents', 'Oils & lubricants', 'Acids & alkalis', 'Infectious substances', 'Aerosols & pressurized containers'], image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&q=80' },
  { label: 'Regulatory', items: ['Items banned by local laws', 'Endangered species products', 'Cultural artifacts', 'Military equipment', 'Nuclear materials'], image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=600&q=80' },
];

export default function ProhibitedPage() {

  return (
    <div className='min-h-screen bg-white'>
      <Navbar />

      {/* ===== HERO ===== */}
      <section className='bg-zinc-50 pt-36 lg:pt-44 pb-16 lg:pb-20 overflow-hidden'>
        <div className='max-w-7xl mx-auto px-6 lg:px-8'>
          <div className='flex flex-col lg:flex-row lg:items-center gap-10 lg:gap-16'>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} className='flex-1'>
              <div className='inline-flex items-center gap-2 px-4 py-2 bg-primary/5 border border-primary/10 text-primary text-sm font-bold uppercase tracking-widest mb-6'>
                <Ban className='w-4 h-4' />
                Restricted Commodities
              </div>
              <h1 className='text-xl sm:text-2xl lg:text-3xl font-semibold text-zinc-900 leading-[0.95] tracking-tight font-heading'>
                Prohibited Items
              </h1>
              <p className='text-base sm:text-lg text-zinc-700 max-w-2xl mt-6 leading-relaxed'>
                To maintain safe and compliant logistics, certain items cannot be shipped.
                These restrictions protect people, goods, and operations. Please ensure your
                shipment meets the guidelines before booking.
              </p>
              <div className='flex flex-wrap gap-3 mt-8'>
                <Link
                  href='/contact'
                  className='inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-[#172554] text-base font-bold text-white uppercase tracking-wider transition-all duration-300 rounded-lg'
                >
                  Contact Support <ArrowRight className='w-4 h-4' />
                </Link>
                <Link
                  href='/faqs'
                  className='inline-flex items-center gap-2 px-6 py-3 border border-zinc-300 text-zinc-700 hover:text-zinc-900 hover:border-zinc-400 text-base font-semibold uppercase tracking-wider transition-all duration-300 rounded-lg'
                >
                  View FAQs
                </Link>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.2 }} className='flex-1'>
              <div className='relative h-64 lg:h-80 w-full overflow-hidden rounded-lg'>
                <Image
                  src='https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80'
                  alt='Prohibited shipping items'
                  fill
                  className='object-cover'
                  sizes='(max-width: 1024px) 100vw, 50vw'
                />
                <div className='absolute inset-0 bg-gradient-to-t from-zinc-50/60 to-transparent rounded-lg' />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== WHY IT MATTERS ===== */}
      <section className='py-14 lg:py-20'>
        <div className='max-w-7xl mx-auto px-6 lg:px-8'>
          <div className='flex flex-col lg:flex-row-reverse gap-10 lg:gap-16 items-center'>
            <motion.div {...fadeIn} className='flex-1'>
              <p className='text-base text-zinc-500 uppercase tracking-widest mb-2 font-medium'>Why It Matters</p>
              <h2 className='text-xl sm:text-2xl lg:text-3xl font-semibold text-zinc-900 leading-tight tracking-tight font-heading'>
                Safety & Compliance First
              </h2>
              <p className='text-base text-zinc-700 mt-4 leading-relaxed'>
                International shipping regulations exist to protect everyone involved in the logistics chain —
                from our pickup team to airline crew to the final recipient. Violating these rules can result
                in severe penalties, legal action, and safety hazards.
              </p>
              <div className='mt-6 space-y-3'>
                {[
                  'Airline safety regulations prohibit hazardous materials on aircraft',
                  'Customs laws restrict items that may harm local economies or security',
                  'Insurance policies do not cover prohibited items in transit',
                  'Environmental regulations protect against ecological damage from certain goods',
                ].map((item, i) => (
                  <div key={i} className='flex items-start gap-3'>
                    <CheckCircle className='w-4 h-4 text-primary mt-0.5 shrink-0' />
                    <span className='text-base text-zinc-700'>{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
            <motion.div {...fadeIn} className='flex-1'>
              <div className='relative h-64 lg:h-80 w-full overflow-hidden rounded-lg'>
                <Image
                  src='https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&q=80'
                  alt='Safety and compliance'
                  fill
                  className='object-cover'
                  sizes='(max-width: 1024px) 100vw, 50vw'
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== PROHIBITED ITEMS GRID ===== */}
      <section className='py-14 lg:py-20 bg-zinc-50'>
        <div className='max-w-7xl mx-auto px-6 lg:px-8'>
          <motion.div {...fadeIn}>
            <p className='text-base text-zinc-500 uppercase tracking-widest mb-2 font-medium'>Banned Commodities</p>
            <h2 className='text-xl sm:text-2xl lg:text-3xl font-semibold text-zinc-900 leading-tight tracking-tight font-heading'>
              Following commodities are banned
            </h2>
          </motion.div>

          <div className='grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-12'>
            {prohibitedItems.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                className='group bg-white border border-zinc-100 overflow-hidden hover:border-red-200 hover:shadow-lg hover:shadow-red-500/5 transition-all duration-300'
              >
                <div className='relative h-36 overflow-hidden rounded-t-lg'>
                  <Image
                    src={item.image}
                    alt={item.label}
                    fill
                    className='object-cover transition-all duration-500 group-hover:scale-105'
                    sizes='(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
                  />
                  <div className='absolute inset-0 bg-gradient-to-t from-black/50 to-transparent' />
                  <div className='absolute bottom-3 left-3 flex items-center gap-2'>
                    <ThreeDIcon icon={item.icon} iconClass='w-9 h-9 bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg' />
                    <span className='text-base font-bold text-white drop-shadow-md'>{item.label}</span>
                  </div>
                </div>
                <div className='p-4'>
                  <p className='text-base text-zinc-700 leading-relaxed'>{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CATEGORIES WITH IMAGES ===== */}
      <section className='py-14 lg:py-20'>
        <div className='max-w-7xl mx-auto px-6 lg:px-8'>
          <motion.div {...fadeIn}>
            <p className='text-base text-zinc-500 uppercase tracking-widest mb-2 font-medium'>Detailed Classification</p>
            <h2 className='text-xl sm:text-2xl lg:text-3xl font-semibold text-zinc-900 leading-tight tracking-tight font-heading'>
              Prohibited Item Categories
            </h2>
            <p className='text-base text-zinc-700 mt-4 max-w-3xl leading-relaxed'>
              Below is a comprehensive classification of items that cannot be shipped through our services.
              This list is not exhaustive and may vary by destination country.
            </p>
          </motion.div>

          <div className='grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-12'>
            {categories.map((cat, i) => (
              <motion.div
                key={cat.label}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                className='group bg-white border border-zinc-100 overflow-hidden hover:border-zinc-200 hover:shadow-sm transition-all duration-300'
              >
                <div className='relative h-40 overflow-hidden'>
                  <Image
                    src={cat.image}
                    alt={cat.label}
                    fill
                    className='object-cover transition-all duration-500 group-hover:scale-105'
                    sizes='(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
                  />
                  <div className='absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent' />
                  <h3 className='absolute bottom-3 left-4 text-base font-bold text-white'>{cat.label}</h3>
                </div>
                <div className='p-4'>
                  <ul className='space-y-2'>
                    {cat.items.map((item) => (
                      <li key={item} className='flex items-start gap-2 text-base text-zinc-700'>
                        <XCircle className='w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0' />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CONSEQUENCES ===== */}
      <section className='py-14 lg:py-20 bg-zinc-50'>
        <div className='max-w-7xl mx-auto px-6 lg:px-8'>
          <div className='grid lg:grid-cols-2 gap-10 lg:gap-16 items-center'>
            <motion.div {...fadeIn}>
              <p className='text-base text-zinc-500 uppercase tracking-widest mb-2 font-medium'>Penalties</p>
              <h2 className='text-xl sm:text-2xl lg:text-3xl font-semibold text-zinc-900 leading-tight tracking-tight font-heading'>
                Consequences of Shipping Prohibited Items
              </h2>
              <p className='text-base text-zinc-700 mt-4 leading-relaxed'>
                Shipping prohibited items can have serious consequences. Understanding these risks helps
                ensure compliance and avoids penalties.
              </p>
              <div className='mt-6 space-y-4'>
                {[
                  { icon: FileWarning, label: 'Shipment Confiscation', desc: 'Prohibited items found in transit will be seized and destroyed by authorities without compensation.' },
                  { icon: XCircle, label: 'Legal Penalties', desc: 'Violating shipping regulations can result in fines, legal action, and criminal charges depending on jurisdiction.' },
                  { icon: Ban, label: 'Account Suspension', desc: 'Repeated violations may lead to permanent suspension of your shipping account with Gajan Traders.' },
                  { icon: ClipboardList, label: 'Customs Blacklisting', desc: 'Frequent violations can result in your shipments being flagged for increased scrutiny by customs authorities.' },
                ].map((item, i) => (
                  <div key={i} className='flex items-start gap-3 p-4 bg-white border border-zinc-100'>
                    <ThreeDIcon icon={item.icon} iconClass='w-9 h-9 bg-red-50 text-red-500' />
                    <div>
                      <p className='text-sm font-semibold text-zinc-900'>{item.label}</p>
                      <p className='text-sm text-zinc-700 mt-0.5'>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
            <motion.div {...fadeIn}>
              <div className='relative h-72 lg:h-96 w-full overflow-hidden'>
                <Image
                  src='https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80'
                  alt='Shipping regulations and compliance'
                  fill
                  className='object-cover'
                  sizes='(max-width: 1024px) 100vw, 50vw'
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== NEED HELP ===== */}
      <section className='py-14 lg:py-20'>
        <div className='max-w-7xl mx-auto px-6 lg:px-8'>
          <div className='grid lg:grid-cols-2 gap-10 lg:gap-16 items-center'>
            <motion.div {...fadeIn}>
              <div className='relative h-64 lg:h-80 w-full overflow-hidden'>
                <Image
                  src='https://images.unsplash.com/photo-1579389083078-4e7018379f82?w=800&q=80'
                  alt='Customer support'
                  fill
                  className='object-cover'
                  sizes='(max-width: 1024px) 100vw, 50vw'
                />
              </div>
            </motion.div>
            <motion.div {...fadeIn}>
              <p className='text-base text-zinc-500 uppercase tracking-widest mb-2 font-medium'>Unsure?</p>
              <h2 className='text-xl sm:text-2xl lg:text-3xl font-semibold text-zinc-900 leading-tight tracking-tight font-heading'>
                Not Sure If Your Item Is Allowed?
              </h2>
              <p className='text-base text-zinc-700 mt-4 leading-relaxed'>
                Our support team can help you determine if your shipment meets all regulatory requirements
                before you book. We&apos;re available 24/7 to assist.
              </p>
              <div className='mt-6 space-y-3'>
                <div className='flex items-center gap-3'>
                  <ThreeDIcon icon={Mail} iconClass='w-9 h-9 bg-primary/10 text-primary' />
                  <div>
                    <p className='text-sm text-zinc-500 uppercase tracking-wider'>Email</p>
                    <p className='text-base font-medium text-zinc-900'>support@gajantraders.com</p>
                  </div>
                </div>
                <div className='flex items-center gap-3'>
                  <ThreeDIcon icon={Phone} iconClass='w-9 h-9 shrink-0 [&>div]:bg-primary/10 [&>div]:text-primary' />
                  <div>
                    <p className='text-sm text-zinc-500 uppercase tracking-wider'>Phone</p>
                    <p className='text-base font-medium text-zinc-900'>+91 22 2344 5678</p>
                  </div>
                </div>
              </div>
              <Link
                href='/contact'
                className='inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-[#172554] text-base font-bold text-white uppercase tracking-wider transition-all duration-300 rounded-lg mt-6'
              >
                Contact Support <ArrowRight className='w-4 h-4' />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

    </div>
  );
}
