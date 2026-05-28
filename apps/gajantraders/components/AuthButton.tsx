'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, LogOut, ChevronDown, Package } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function AuthButton() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { user, logout } = useAuth();
  const pathname = usePathname();
  
  // Light mode pages
  const lightModePages = ['/shipments', '/quotes', '/about', '/contact', '/profile', '/prohibited', '/faqs', '/careers'];
  const isLightMode = lightModePages.some(page => pathname?.startsWith(page));

  const handleLogout = async () => {
    await logout();
  };

  if (user) {
    return (
      <div className='relative z-50'>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all cursor-pointer ${
            isLightMode 
              ? 'bg-white/80 hover:bg-white' 
              : 'bg-white/10 hover:bg-white/20'
          }`}>
          <div className='w-7 h-7 rounded-full bg-primary flex items-center justify-center'>
            <span className='text-xs font-bold text-white'>
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className={`text-sm font-medium hidden md:block ${isLightMode ? 'text-gray-900' : 'text-white'}`}>
            {user.name.split(' ')[0]}
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''} ${isLightMode ? 'text-gray-500' : 'text-white/60'}`} />
        </button>

        <AnimatePresence>
          {dropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className={`absolute right-0 top-full mt-2 w-48 py-2 rounded-xl shadow-2xl overflow-hidden z-[100] ${
                isLightMode 
                  ? 'bg-white border border-gray-200' 
                  : 'bg-black/95 backdrop-blur-md border border-white/10'
              }`}>
              <div className={`px-4 py-2 border-b ${isLightMode ? 'border-gray-100' : 'border-white/10'}`}>
                <p className={`text-sm font-medium truncate ${isLightMode ? 'text-gray-900' : 'text-white'}`}>{user.name}</p>
                <p className={`text-xs truncate ${isLightMode ? 'text-gray-500' : 'text-white/50'}`}>{user.email}</p>
              </div>
              <div className='py-1'>
                <Link
                  href='/shipments'
                  className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors cursor-pointer ${
                    isLightMode 
                      ? 'text-gray-700 hover:text-gray-900 hover:bg-gray-50' 
                      : 'text-white/80 hover:text-white hover:bg-white/5'
                  }`}>
                  <User className='w-4 h-4' />
                  My Shipments
                </Link>
                <Link
                  href='/quotes'
                  className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors cursor-pointer ${
                    isLightMode 
                      ? 'text-gray-700 hover:text-gray-900 hover:bg-gray-50' 
                      : 'text-white/80 hover:text-white hover:bg-white/5'
                  }`}>
                  <Package className='w-4 h-4' />
                  My Quotes
                </Link>
                <Link
                  href='/profile'
                  className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors cursor-pointer ${
                    isLightMode 
                      ? 'text-gray-700 hover:text-gray-900 hover:bg-gray-50' 
                      : 'text-white/80 hover:text-white hover:bg-white/5'
                  }`}>
                  <User className='w-4 h-4' />
                  Profile
                </Link>
                <div className={`border-t ${isLightMode ? 'border-gray-100' : 'border-white/10'} my-1`} />
                <button
                  onClick={handleLogout}
                  className={`w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors cursor-pointer ${
                    isLightMode 
                      ? 'text-red-600 hover:text-red-700 hover:bg-red-50' 
                      : 'text-red-400 hover:text-red-300 hover:bg-red-500/10'
                  }`}>
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
        className={`px-4 py-2 text-sm font-bold transition-colors duration-200 cursor-pointer border rounded-lg ${
          isLightMode
            ? 'text-gray-700 hover:text-gray-900 border-gray-200 hover:border-gray-300'
            : 'text-white/80 hover:text-white border-white/20 hover:border-white/40'
        }`}>
        Log In
      </Link>
      <Link
        href='/register'
        className='px-5 py-2.5 text-sm font-semibold bg-primary hover:bg-[#172554] text-white rounded-lg transition-colors duration-200 cursor-pointer'>
        Sign Up
      </Link>
    </div>
  );
}