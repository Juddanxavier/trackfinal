/** @format */

'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Plane } from 'lucide-react';
import AuthButton from './AuthButton';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '#services', label: 'Services' },
  { href: '#tracking', label: 'Track Shipment' },
  { href: '#coverage', label: 'Coverage' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#about', label: 'About Us' },
  { href: '#contact', label: 'Contact' },
  { href: '#faq', label: 'FAQ' },
];

// Pages with light backgrounds that need dark text
const lightBgPages = ['/shipments', '/quotes'];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  
  // Check if current page has light background
  const isLightBg = lightBgPages.some(page => pathname?.startsWith(page));

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Determine text and background colors based on page and scroll state
  const textColor = isLightBg || scrolled ? 'text-gray-900' : 'text-white';
  const textColorMuted = isLightBg || scrolled ? 'text-gray-600' : 'text-white/80';
  const bgClass = isLightBg
    ? scrolled 
      ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200'
      : 'bg-white'
    : scrolled
      ? 'bg-foreground/95 backdrop-blur-md shadow-lg shadow-black/20 border-b border-white/10'
      : 'bg-transparent';

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{
        y: 0,
        opacity: 1,
        height: scrolled ? 64 : 80,
      }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`fixed top-0 left-0 right-0 z-50 ${bgClass}`}>
      <div className='absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent' />

      <nav className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full'>
        <div className='flex items-center justify-between h-full'>
          <motion.div
            animate={{ scale: scrolled ? 0.9 : 1 }}
            transition={{ duration: 0.3 }}>
            <Link href='/' className='flex items-center gap-2 cursor-pointer'>
              <motion.div
                animate={{ rotate: scrolled ? 0 : -10 }}
                transition={{ duration: 0.3 }}>
                <Plane className='w-8 h-8 text-primary' />
              </motion.div>
              <span className={`text-xl font-bold tracking-tight ${textColor}`}>
                Gajan Traders
              </span>
            </Link>
          </motion.div>

          <div className='hidden lg:flex items-center gap-8'>
            {navLinks.map((link, i) => (
              <motion.div
                key={link.href}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}>
                <Link
                  href={link.href}
                  className={`relative text-sm font-medium transition-colors duration-200 cursor-pointer py-1 group/link ${textColorMuted} hover:${textColor}`}>
                  <span className='relative z-10'>{link.label}</span>
                  <span className='absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-200 group-hover/link:w-full' />
                </Link>
              </motion.div>
            ))}
          </div>

          <div className='hidden lg:flex items-center gap-4'>
            <motion.div
              animate={{ opacity: scrolled ? 0 : 1, x: scrolled ? 20 : 0 }}
              transition={{ duration: 0.2 }}
              className='flex items-center gap-4'>
              <Link
                href='#track'
                className={`px-4 py-2 text-sm font-medium transition-colors duration-200 cursor-pointer ${textColorMuted} hover:${textColor}`}>
                Track Package
              </Link>
            </motion.div>

            <motion.div
              animate={{ opacity: scrolled ? 1 : 1 }}
              transition={{ duration: 0.2 }}
              className='flex items-center gap-3'>
              <AuthButton />
            </motion.div>
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className={`lg:hidden p-2 cursor-pointer ${textColor}`}
            aria-label='Toggle menu'>
            {mobileOpen ? (
              <X className='w-6 h-6' />
            ) : (
              <Menu className='w-6 h-6' />
            )}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className={`lg:hidden backdrop-blur-md border-t ${isLightBg ? 'bg-white/95 border-gray-200' : 'bg-black/95 border-white/10'}`}>
            <div className='px-4 py-4 space-y-3'>
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`block py-2 text-base font-medium transition-colors duration-200 cursor-pointer ${isLightBg ? 'text-gray-600 hover:text-gray-900' : 'text-white/80 hover:text-white'}`}>
                  {link.label}
                </a>
              ))}
              <div className={`pt-4 flex flex-col gap-3 border-t ${isLightBg ? 'border-gray-200' : 'border-white/10'}`}>
                <Link
                  href='#track'
                  className={`px-4 py-2.5 text-center text-sm font-medium rounded-lg transition-colors duration-200 cursor-pointer ${isLightBg ? 'bg-gray-100 hover:bg-gray-200 text-gray-900' : 'bg-white/10 hover:bg-white/20 text-white'}`}>
                  Track Package
                </Link>
                <div className='flex gap-3'>
                  <Link
                    href='/login'
                    className={`flex-1 px-4 py-2.5 text-center text-sm font-medium transition-colors duration-200 rounded-lg cursor-pointer ${isLightBg ? 'text-gray-600 hover:text-gray-900 border border-gray-300 hover:border-gray-400' : 'text-white/80 hover:text-white border border-white/20 hover:border-white/40'}`}>
                    Log In
                  </Link>
                  <Link
                    href='/register'
                    className='flex-1 px-4 py-2.5 text-center text-sm font-semibold bg-primary hover:bg-[#4C833E] text-white rounded-lg transition-colors duration-200 cursor-pointer'>
                    Sign Up
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
