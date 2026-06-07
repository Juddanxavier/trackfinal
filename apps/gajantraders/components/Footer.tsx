'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Plane, Mail, Phone, MapPin, HeadphonesIcon,
  Send, ArrowRight
} from 'lucide-react';

const company = {
  name: 'Gajan Traders',
  description:
    'Trusted international courier and logistics provider offering free packing, real-time tracking, and customs-cleared delivery since 2015.',
};

const quickLinks = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About Us' },
  { href: '/branches', label: 'Branches' },
  { href: '/careers', label: 'Careers' },
  { href: '/contact', label: 'Contact' },
  { href: '/faqs', label: 'FAQs' },
  { href: '/prohibited', label: 'Prohibited Items' },
];

const tools = [
  { href: '/quotes', label: 'Get a Quote' },
  { href: '/shipments', label: 'Track Shipment' },
  { href: '/volumetric-calculator', label: 'Volumetric Calculator' },
  { href: '/currency-converter', label: 'Currency Converter' },
];

const services = [
  { href: '/about', label: 'About Us' },
  { href: '/branches', label: 'Branches' },
  { href: '/careers', label: 'Careers' },
  { href: '/contact', label: 'Contact' },
];

const contactDetails = [
  { icon: MapPin, text: '7, Gajan Traders House, P D Mello Road, Near Masjid Bunder, Mumbai 400009' },
  { icon: Phone, text: '+91 22 2344 5678' },
  { icon: Mail, text: 'support@gajantraders.com' },
];

const socialLinks = [
  {
    href: '#',
    label: 'LinkedIn',
    icon: (
      <svg viewBox='0 0 24 24' fill='currentColor' className='w-4 h-4'>
        <path d='M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' />
      </svg>
    ),
  },
  {
    href: '#',
    label: 'X',
    icon: (
      <svg viewBox='0 0 24 24' fill='currentColor' className='w-4 h-4'>
        <path d='M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z' />
      </svg>
    ),
  },
  {
    href: '#',
    label: 'Facebook',
    icon: (
      <svg viewBox='0 0 24 24' fill='currentColor' className='w-4 h-4'>
        <path d='M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z' />
      </svg>
    ),
  },
  {
    href: '#',
    label: 'Instagram',
    icon: (
      <svg viewBox='0 0 24 24' fill='currentColor' className='w-4 h-4'>
        <path d='M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z' />
      </svg>
    ),
  },
];

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  return (
    <footer className='relative border-t border-white/5 overflow-hidden' style={{ backgroundColor: '#1a1a1a' }}>
      <div className='absolute inset-0 pointer-events-none'>
        <div className='absolute -top-24 -right-24 w-96 h-96 bg-primary/[0.06] rounded-full blur-3xl' />
        <div className='absolute -bottom-32 -left-32 w-[30rem] h-[30rem] bg-primary/[0.04] rounded-full blur-3xl' />
      </div>
      <div className='absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent' />
      <div className='relative max-w-7xl mx-auto px-6 lg:px-8'>
        <div className='py-16'>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-10 lg:gap-8'>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className='lg:col-span-2'
            >
              <Link href='/' className='inline-flex items-center gap-2.5 mb-4'>
                <div className='w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center'>
                  <Plane className='w-5 h-5 text-primary' />
                </div>
                <span className='text-xl font-semibold text-white tracking-tight font-heading'>{company.name}</span>
              </Link>
              <p className='text-sm text-white/40 leading-relaxed mb-6 max-w-sm'>
                {company.description}
              </p>
              <div className='space-y-2.5'>
                {contactDetails.map((item, i) => (
                  <div key={i} className='flex items-start gap-2.5 text-sm text-white/40'>
                    <item.icon className='w-4 h-4 text-primary shrink-0 mt-0.5' />
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
              <div className='flex items-center gap-3 mt-6'>
                {socialLinks.map((social) => (
                  <Link
                    key={social.label}
                    href={social.href}
                    className='w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:bg-primary hover:text-white hover:border-primary transition-all duration-200'
                    aria-label={social.label}
                  >
                    {social.icon}
                  </Link>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05 }}
            >
              <h4 className='text-xs font-semibold text-white tracking-wider uppercase mb-5'>Quick Links</h4>
              <ul className='space-y-3'>
                {quickLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className='inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-primary transition-colors'
                    >
                      <span>{link.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <h4 className='text-xs font-semibold text-white tracking-wider uppercase mb-5'>Services</h4>
              <ul className='space-y-3'>
                {services.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className='inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-primary transition-colors'
                    >
                      <span>{link.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.12 }}
            >
              <h4 className='text-xs font-semibold text-white tracking-wider uppercase mb-5'>Tools</h4>
              <ul className='space-y-3'>
                {tools.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className='inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-primary transition-colors'
                    >
                      <span>{link.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 }}
            >
              <h4 className='text-xs font-semibold text-white tracking-wider uppercase mb-5'>More</h4>
              <ul className='space-y-3'>
                <li>
                  <Link href='/login' className='inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-primary transition-colors'>
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link href='/register' className='inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-primary transition-colors'>
                    Create Account
                  </Link>
                </li>
                <li>
                  <Link href='/profile' className='inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-primary transition-colors'>
                    My Profile
                  </Link>
                </li>
                <li>
                  <Link href='/contact' className='inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-primary transition-colors'>
                    <HeadphonesIcon className='w-3.5 h-3.5' />
                    <span>24/7 Support</span>
                  </Link>
                </li>
              </ul>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className='mt-14 p-6 rounded-xl bg-white/[0.03] border border-white/[0.06]'
          >
            <div className='flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6'>
              <div className='flex-1'>
                <h4 className='text-sm font-semibold text-white'>Stay Updated</h4>
                <p className='text-xs text-white/40 mt-1'>Get shipping tips, industry news, and exclusive offers.</p>
              </div>
              <form onSubmit={handleSubscribe} className='flex items-center gap-2 w-full sm:w-auto'>
                <div className='relative flex-1 sm:flex-initial'>
                  <Mail className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30' />
                  <input
                    type='email'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder='your@email.com'
                    required
                    className='w-full sm:w-60 pl-10 pr-3 py-2.5 bg-white/[0.04] border border-white/[0.06] rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 focus:bg-white/[0.06] transition-all'
                  />
                </div>
                <button
                  type='submit'
                  className='flex items-center gap-2 px-5 py-2.5 text-white text-sm font-semibold rounded-lg transition-all active:scale-95 shrink-0' style={{ backgroundColor: 'var(--primary)' }}
                >
                  {subscribed ? 'Subscribed!' : <><Send className='w-3.5 h-3.5' /><span>Subscribe</span></>}
                </button>
              </form>
            </div>
          </motion.div>
        </div>

        <div className='border-t border-white/[0.06] py-6'>
          <div className='flex flex-col md:flex-row items-center justify-between gap-4'>
            <p className='text-xs text-white/30 text-center md:text-left'>
              &copy; {new Date().getFullYear()} {company.name}. All rights reserved.
            </p>
            <div className='flex items-center gap-6'>
              <Link href='/privacy' className='text-xs text-white/30 hover:text-white/60 transition-colors'>
                Privacy Policy
              </Link>
              <Link href='/terms' className='text-xs text-white/30 hover:text-white/60 transition-colors'>
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
