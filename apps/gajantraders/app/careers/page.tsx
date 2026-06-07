'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Briefcase, Users, ArrowRight, Mail,
  Target, Zap, Star, Building2, Globe
} from 'lucide-react';
import Navbar from '@/components/Navbar';

const fadeIn = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.5 },
};

const values = [
  { icon: Users, title: 'Customer First', desc: 'Every decision guided by what\'s best for the customer.' },
  { icon: Target, title: 'Integrity & Transparency', desc: 'Honesty and openness at every level.' },
  { icon: Zap, title: 'Speed & Reliability', desc: 'Fast, consistent, and without compromise.' },
  { icon: Star, title: 'Innovation & Excellence', desc: 'Pushing boundaries for smarter logistics.' },
];

export default function CareersPage() {
  return (
    <div className='min-h-screen bg-white'>
      <Navbar />

      <section className='bg-zinc-50 pt-36 lg:pt-44 pb-16 lg:pb-20 overflow-hidden'>
        <div className='max-w-7xl mx-auto px-6 lg:px-8'>
          <div className='flex flex-col lg:flex-row lg:items-center gap-10 lg:gap-16'>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} className='flex-1'>
              <div className='inline-flex items-center gap-2 px-4 py-2 bg-primary/5 border border-primary/10 text-primary text-sm font-bold uppercase tracking-widest mb-6 rounded-lg'>
                <Users className='w-4 h-4' />
                Join Our Team
              </div>
              <h1 className='text-xl sm:text-2xl lg:text-3xl font-semibold text-zinc-900 leading-[0.95] tracking-tight font-heading max-w-3xl'>
                Careers at Gajan Traders
              </h1>
              <p className='text-base sm:text-lg text-zinc-700 max-w-2xl mt-6 leading-relaxed'>
                Build your future with global logistics leaders. Join our growing team and shape
                the future of international shipping.
              </p>
              <div className='flex flex-wrap gap-4 mt-8'>
                <Link
                  href='mailto:careers@gajantraders.com'
                  className='inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-[#172554] text-sm font-bold text-white uppercase tracking-wider transition-all duration-300 rounded-lg'
                >
                  Submit Your Profile <ArrowRight className='w-4 h-4' />
                </Link>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className='flex-1 hidden lg:block'
            >
              <div className='relative h-72 lg:h-80 w-full overflow-hidden rounded-lg bg-zinc-200'>
                <img
                  src='https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80'
                  alt=''
                  className='w-full h-full object-cover'
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className='-mt-8 relative z-10'>
        <div className='max-w-7xl mx-auto px-6 lg:px-8'>
          <div className='grid grid-cols-3 bg-white border border-zinc-100 shadow-sm'>
            <div className='p-6 lg:p-8 text-center border-r border-zinc-100'>
              <Building2 className='w-6 h-6 text-primary mx-auto mb-3' />
              <div className='text-xl lg:text-2xl font-semibold text-zinc-900'>445+</div>
              <div className='text-sm text-zinc-500 mt-1 uppercase tracking-wider'>Branches</div>
            </div>
            <div className='p-6 lg:p-8 text-center border-r border-zinc-100'>
              <Globe className='w-6 h-6 text-primary mx-auto mb-3' />
              <div className='text-xl lg:text-2xl font-semibold text-zinc-900'>50+</div>
              <div className='text-sm text-zinc-500 mt-1 uppercase tracking-wider'>Countries</div>
            </div>
            <div className='p-6 lg:p-8 text-center'>
              <Users className='w-6 h-6 text-primary mx-auto mb-3' />
              <div className='text-xl lg:text-2xl font-semibold text-zinc-900'>2000+</div>
              <div className='text-sm text-zinc-500 mt-1 uppercase tracking-wider'>Team Members</div>
            </div>
          </div>
        </div>
      </section>

      <section className='py-14 lg:py-20'>
        <div className='max-w-7xl mx-auto px-6 lg:px-8'>
          <motion.div {...fadeIn} className='text-center max-w-xl mx-auto mb-16'>
            <span className='text-primary text-sm font-semibold tracking-[0.2em] uppercase block mb-4'>Our DNA</span>
            <h2 className='text-xl sm:text-2xl lg:text-3xl font-semibold text-zinc-900 leading-[0.95] tracking-tight font-heading'>
              The Core Values We Live By
            </h2>
          </motion.div>

          <div className='grid sm:grid-cols-2 lg:grid-cols-4 gap-6'>
            {values.map((v, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className='p-6 lg:p-8 bg-zinc-50 border border-zinc-100 text-center'
              >
                <v.icon className='w-10 h-10 text-primary mx-auto mb-5' />
                <h3 className='text-base font-semibold text-zinc-900 mb-3'>{v.title}</h3>
                <p className='text-base text-zinc-700 leading-relaxed'>{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className='py-14 lg:py-20 bg-zinc-50'>
        <div className='max-w-7xl mx-auto px-6 lg:px-8'>
          <motion.div {...fadeIn} className='max-w-2xl mx-auto text-center'>
            <div className='w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4'>
              <Briefcase className='w-7 h-7 text-primary' />
            </div>
            <h2 className='text-xl sm:text-2xl lg:text-3xl font-semibold text-zinc-900 leading-[0.95] tracking-tight font-heading mb-4'>
              No Open Positions Right Now
            </h2>
            <p className='text-base text-zinc-700 leading-relaxed max-w-lg mx-auto'>
              We&apos;re always on the lookout for talented individuals. Submit your profile and be
              the first to know when the right opportunity opens up.
            </p>
            <Link
              href='mailto:careers@gajantraders.com'
              className='inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-[#172554] text-sm font-bold text-white uppercase tracking-wider transition-all duration-300 rounded-lg mt-8'
            >
              <Mail className='w-4 h-4' />
              Submit Your Profile
            </Link>
          </motion.div>
        </div>
      </section>

      <section className='relative py-16 lg:py-24 bg-zinc-50 overflow-hidden'>
        <div className='relative max-w-7xl mx-auto px-6 lg:px-8 text-center'>
          <motion.div {...fadeIn}>
            <h2 className='text-xl sm:text-2xl lg:text-3xl font-semibold text-zinc-900 leading-[0.95] tracking-tight font-heading mb-4'>
              Grow Beyond Borders
            </h2>
            <p className='text-zinc-700 max-w-lg mx-auto mb-10 text-base'>
              Stay connected with us for future opportunities.
            </p>
            <div className='flex flex-wrap justify-center gap-4'>
              <Link
                href='mailto:careers@gajantraders.com'
                className='inline-flex items-center gap-2 px-8 py-4 bg-primary hover:bg-[#172554] text-sm font-bold text-white uppercase tracking-wider transition-all duration-300 rounded-lg'
              >
                <Mail className='w-4 h-4' />
                careers@gajantraders.com
              </Link>
              <Link
                href='/contact'
                className='inline-flex items-center gap-2 px-8 py-4 border border-zinc-300 text-zinc-700 hover:text-zinc-900 hover:border-zinc-400 text-sm font-semibold uppercase tracking-wider transition-all duration-300 rounded-lg'
              >
                Contact Us
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
