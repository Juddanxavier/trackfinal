/** @format */

'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Plane, Bell, Check, Trash2, ChevronDown } from 'lucide-react';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import AuthButton from './AuthButton';

interface Notification {
  id: string;
  titleKey: string;
  data: Record<string, any>;
  isRead: boolean;
  createdAt: string;
}

function NotificationBell() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const [notifs, countRes] = await Promise.all([
        api.get<Notification[]>('/notifications?limit=5'),
        api.get<{ count: number }>('/notifications/unread-count'),
      ]);
      setNotifications(notifs);
      setUnreadCount(countRes.count);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`, {});
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all', {});
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await api.delete(`/notifications/${id}`, {});
      setNotifications(prev => prev.filter(n => n.id !== id));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to delete notification', err);
    }
  };

  if (!user) return null;

  const getNotificationTitle = (notif: Notification) => {
    const titles: Record<string, string> = {
      'quote.created': 'New quote request received',
      'quote.assigned': 'New quote needs attention',
      'quote.quoted': 'Your quote is ready - Price quoted',
      'quote.accepted': 'Your quote has been accepted',
      'quote.rejected': 'Your quote has been rejected',
      'shipment.delivered': 'Shipment delivered',
      'shipment.in_transit': 'Shipment in transit',
      'shipment.exception': 'Shipment exception',
    };
    return titles[notif.titleKey] || notif.titleKey;
  };

  const getNotificationSubtitle = (notif: Notification) => {
    if (notif.titleKey === 'quote.quoted' && notif.data?.price) {
      return `Price: ₹${notif.data.price}`;
    }
    if (notif.data?.origin && notif.data?.destination) {
      return `${notif.data.origin} → ${notif.data.destination}`;
    }
    return null;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-slate-100/20 transition-colors"
      >
        <Bell className="w-5 h-5 text-primary" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50"
          >
            <div className="p-3 border-b border-slate-100 flex items-center justify-between">
              <span className="font-semibold text-slate-900">Notifications</span>
              {unreadCount > 0 && (
                <button onClick={markAllAsRead} className="text-xs text-primary hover:underline">
                  Mark all read
                </button>
              )}
            </div>
            
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-slate-400 text-sm">
                  No notifications yet
                </div>
              ) : (
                notifications.map(notif => {
                  const subtitle = getNotificationSubtitle(notif);
                  return (
                    <div
                      key={notif.id}
                      className={`p-3 border-b border-slate-50 hover:bg-slate-50 transition-colors ${!notif.isRead ? 'bg-primary/5' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        {!notif.isRead && (
                          <div className="w-2 h-2 bg-primary rounded-full mt-2 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900">
                            {getNotificationTitle(notif)}
                          </p>
                          {subtitle && (
                            <p className="text-xs font-semibold text-primary mt-0.5">
                              {subtitle}
                            </p>
                          )}
                          <p className="text-xs text-slate-400 mt-0.5">
                            {new Date(notif.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {!notif.isRead && (
                            <button
                              onClick={() => markAsRead(notif.id)}
                              className="p-1 hover:bg-slate-200 rounded"
                              title="Mark as read"
                            >
                              <Check className="w-4 h-4 text-slate-400" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notif.id)}
                            className="p-1 hover:bg-red-100 rounded"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-slate-400 hover:text-red-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavDropdown({ label, items, textColorMuted, textColor }: {
  label: string;
  items: { href: string; label: string }[];
  textColorMuted: string;
  textColor: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className='relative' onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1 text-sm font-bold transition-colors duration-200 cursor-pointer py-1 group/link ${textColorMuted} hover:${textColor}`}>
        <span className='relative z-10'>{label}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        <span className='absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-200 group-hover/link:w-full' />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.15 }}
            className='absolute top-full left-0 mt-1 w-44 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50'>
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className='block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary transition-colors'>
                {item.label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface NavLink {
  href?: string;
  label: string;
  children?: { href: string; label: string }[];
}

const navLinks: NavLink[] = [
  { href: '/', label: 'Home' },
  { href: '#services', label: 'Services' },
  {
    label: 'Company',
    children: [
      { href: '/about', label: 'About Us' },
      { href: '/careers', label: 'Careers' },
    ],
  },
  {
    label: 'Support',
    children: [
      { href: '/faqs', label: 'FAQs' },
      { href: '/prohibited', label: 'Prohibited Items' },
    ],
  },
  { href: '/contact', label: 'Contact' },
];

// Pages with light backgrounds that need dark text
const lightBgPages = ['/shipments', '/quotes', '/about', '/contact', '/profile', '/prohibited', '/faqs', '/careers'];

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
  const textColor = isLightBg ? 'text-slate-900' : 'text-white';
  const textColorMuted = isLightBg ? 'text-slate-600' : 'text-white/80';
  const bgClass = isLightBg
    ? scrolled 
      ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-slate-200'
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
              link.children ? (
                <NavDropdown key={link.label} label={link.label} items={link.children} textColorMuted={textColorMuted} textColor={textColor} />
              ) : (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}>
                  <Link
                    href={link.href!}
                    className={`relative text-sm font-bold transition-colors duration-200 cursor-pointer py-1 group/link ${textColorMuted} hover:${textColor}`}>
                    <span className='relative z-10'>{link.label}</span>
                    <span className='absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-200 group-hover/link:w-full' />
                  </Link>
                </motion.div>
              )
            ))}
          </div>

          <div className='hidden lg:flex items-center gap-4'>
            <motion.div
              animate={{ opacity: scrolled ? 1 : 1 }}
              transition={{ duration: 0.2 }}
              className='flex items-center gap-3'>
              <NotificationBell />
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
                link.children ? (
                  <div key={link.label} className='space-y-1'>
                    <p className={`block py-2 text-base font-semibold ${isLightBg ? 'text-gray-900' : 'text-white'}`}>
                      {link.label}
                    </p>
                    <div className='ml-4 space-y-1 border-l-2 border-primary/30 pl-3'>
                      {link.children.map((child) => (
                        <a
                          key={child.href}
                          href={child.href}
                          onClick={() => setMobileOpen(false)}
                          className={`block py-1.5 text-sm font-bold transition-colors duration-200 cursor-pointer ${isLightBg ? 'text-gray-600 hover:text-gray-900' : 'text-white/70 hover:text-white'}`}>
                          {child.label}
                        </a>
                      ))}
                    </div>
                  </div>
                ) : (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`block py-2 text-base font-bold transition-colors duration-200 cursor-pointer ${isLightBg ? 'text-gray-600 hover:text-gray-900' : 'text-white/80 hover:text-white'}`}>
                    {link.label}
                  </a>
                )
              ))}
              <div className={`pt-4 flex flex-col gap-3 border-t ${isLightBg ? 'border-gray-200' : 'border-white/10'}`}>
                <div className='flex gap-3'>
                  <Link
                    href='/login'
                    className={`flex-1 px-4 py-2.5 text-center text-sm font-bold transition-colors duration-200 rounded-lg cursor-pointer ${isLightBg ? 'text-gray-600 hover:text-gray-900 border border-gray-300 hover:border-gray-400' : 'text-white/80 hover:text-white border border-white/20 hover:border-white/40'}`}>
                    Log In
                  </Link>
                  <Link
                    href='/register'
                    className='flex-1 px-4 py-2.5 text-center text-sm font-semibold bg-primary hover:bg-[#172554] text-white rounded-lg transition-colors duration-200 cursor-pointer'>
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
