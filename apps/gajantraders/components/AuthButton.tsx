'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { User, LogOut, ChevronDown, Package } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function AuthButton({ scrolled, isHome }: { scrolled?: boolean; isHome?: boolean }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { user, logout } = useAuth();

  const textColor = (scrolled || !isHome) ? 'text-gray-900' : 'text-white';
  const textColorMuted = (scrolled || !isHome) ? 'text-gray-500' : 'text-white/60';
  const borderColor = (scrolled || !isHome) ? 'border-gray-200' : 'border-white/20';
  const hoverBorderColor = (scrolled || !isHome) ? 'hover:border-gray-300' : 'hover:border-white/40';
  const bgHover = (scrolled || !isHome) ? 'hover:bg-white' : 'hover:bg-white/20';
  const userBg = (scrolled || !isHome) ? 'bg-white/80' : 'bg-white/10';

  const handleLogout = async () => {
    await logout();
  };

  if (user) {
    return (
      <div className='relative z-50'>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300 cursor-pointer ${userBg} ${bgHover}`}>
          <div className='w-7 h-7 rounded-full bg-primary flex items-center justify-center'>
            <span className='text-xs font-bold text-white'>
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className={`text-sm font-medium hidden md:block transition-colors duration-300 ${textColor}`}>
            {user.name.split(' ')[0]}
          </span>
          <ChevronDown className={`w-4 h-4 transition-all duration-300 ${dropdownOpen ? 'rotate-180' : ''} ${textColorMuted}`} />
        </button>

        <AnimatePresence>
          {dropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className='absolute right-0 top-full mt-2 w-48 py-2 rounded-xl shadow-2xl overflow-hidden z-[100] bg-white border border-gray-200'>
              <div className='px-4 py-2 border-b border-gray-100'>
                <p className='text-sm font-medium truncate text-gray-900'>{user.name}</p>
                <p className='text-xs truncate text-gray-500'>{user.email}</p>
              </div>
              <div className='py-1'>
                <Link
                  href='/shipments'
                  className='flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer'>
                  <User className='w-4 h-4' />
                  My Shipments
                </Link>
                <Link
                  href='/quotes'
                  className='flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer'>
                  <Package className='w-4 h-4' />
                  My Quotes
                </Link>
                <Link
                  href='/profile'
                  className='flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer'>
                  <User className='w-4 h-4' />
                  Profile
                </Link>
                <div className='border-t border-gray-100 my-1' />
                <button
                  onClick={handleLogout}
                  className='w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer'>
                  <LogOut className='w-4 h-4' />
                  Sign Out
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className='flex items-center gap-3'>
      <Link
        href='/login'
        className={`px-4 py-2 text-sm font-bold transition-all duration-300 cursor-pointer border rounded-lg ${textColorMuted} ${textColor} ${borderColor} ${hoverBorderColor}`}>
        Log In
      </Link>
      <Link
        href='/register'
        className='px-5 py-2.5 text-sm font-semibold bg-primary hover:brightness-110 text-white rounded-lg transition-all duration-200 cursor-pointer'>
        Sign Up
      </Link>
    </div>
  );
}
