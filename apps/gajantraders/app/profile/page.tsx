'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Mail, Phone, Save, Loader2, Package, Truck, Calendar, ShieldCheck, ShieldX } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api-client';
import Navbar from '@/components/Navbar';

interface ProfileData {
  id: string;
  email: string;
  name: string;
  role: string;
  phoneNumber?: string | null;
  organisationId?: string | null;
  branchId?: string | null;
  emailVerified?: boolean;
  isActive?: boolean;
  createdAt?: string;
}

const sidebarLinks = [
  { href: '/profile', label: 'Profile', icon: User },
  { href: '/shipments', label: 'My Shipments', icon: Truck },
  { href: '/quotes', label: 'My Quotes', icon: Package },
];

export default function ProfilePage() {
  const { user, updateUser, refreshToken } = useAuth();
  const pathname = usePathname();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      api.get<ProfileData>('/auth/me').then(setProfile).catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setPhone(profile.phoneNumber || '');
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      setError('');
      const res = await api.patch<ProfileData>('/auth/profile', { name, phoneNumber: phone || undefined });
      if (res.name) {
        updateUser({ id: user!.id, email: res.email, name: res.name, role: res.role, organisationId: res.organisationId ?? null });
        setProfile(res);
        refreshToken();
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      const msg = err?.data?.message || err?.data?.error || err?.message || 'Failed to update profile';
      setError(msg);
      console.error('Failed to update profile', err);
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  const display = profile || user;
  const memberSince = profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : null;

  return (
    <div className='min-h-screen bg-zinc-50'>
      <Navbar />
      <div className='pt-28 pb-20'>
        <div className='max-w-6xl mx-auto px-6 lg:px-8'>
          <div className='flex gap-8'>
            <aside className='w-56 shrink-0 hidden lg:block'>
              <div className='bg-white border border-zinc-100 overflow-hidden'>
                {sidebarLinks.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center gap-3 px-5 py-3.5 text-sm font-medium transition-all duration-200 border-l-2 ${
                        isActive
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-transparent text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
                      }`}
                    >
                      <link.icon className='w-4 h-4' />
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            </aside>

            <div className='flex-1 min-w-0'>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <div className='flex items-center gap-4 mb-8'>
                  <div className='w-16 h-16 rounded-full bg-primary flex items-center justify-center shrink-0'>
                    <span className='text-2xl font-bold text-white'>{display.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div>
                    <h1 className='text-xl font-semibold text-zinc-900'>{display.name}</h1>
                    <p className='text-sm text-zinc-500'>{display.email}</p>
                  </div>
                </div>

                <div className='grid grid-cols-2 gap-4 mb-10'>
                  <div className='flex items-center gap-3 p-4 bg-white border border-zinc-100'>
                    <Mail className='w-5 h-5 text-primary' />
                    <div>
                      <p className='text-xs text-zinc-400 uppercase tracking-wider'>Email</p>
                      <p className='text-sm font-medium text-zinc-900'>{display.email}</p>
                    </div>
                  </div>
                  <div className='flex items-center gap-3 p-4 bg-white border border-zinc-100'>
                    <Phone className='w-5 h-5 text-primary' />
                    <div>
                      <p className='text-xs text-zinc-400 uppercase tracking-wider'>Phone</p>
                      <p className='text-sm font-medium text-zinc-900'>{display.phoneNumber || 'Not set'}</p>
                    </div>
                  </div>
                  <div className='flex items-center gap-3 p-4 bg-white border border-zinc-100'>
                    {display.emailVerified ? (
                      <ShieldCheck className='w-5 h-5 text-emerald-600' />
                    ) : (
                      <ShieldX className='w-5 h-5 text-amber-600' />
                    )}
                    <div>
                      <p className='text-xs text-zinc-400 uppercase tracking-wider'>Email Verified</p>
                      <p className='text-sm font-medium text-zinc-900'>{display.emailVerified ? 'Verified' : 'Pending'}</p>
                    </div>
                  </div>
                  <div className='flex items-center gap-3 p-4 bg-white border border-zinc-100'>
                    <Calendar className='w-5 h-5 text-primary' />
                    <div>
                      <p className='text-xs text-zinc-400 uppercase tracking-wider'>Member Since</p>
                      <p className='text-sm font-medium text-zinc-900'>{memberSince || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSave} className='space-y-5 bg-white border border-zinc-100 p-8'>
                  <h2 className='text-base font-semibold text-zinc-900'>Edit Profile</h2>

                  <div>
                    <label className='block text-sm font-medium text-zinc-700 mb-1.5'>Full Name</label>
                    <input
                      type='text'
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className='w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all text-sm'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-zinc-700 mb-1.5'>Phone</label>
                    <input
                      type='tel'
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder='+91 98765 43210'
                      className='w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all text-sm'
                    />
                  </div>

                  <div className='flex items-center gap-3'>
                    <button
                      type='submit'
                      disabled={saving}
                      className='inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-[#172554] disabled:bg-primary/60 text-sm font-bold text-white uppercase tracking-wider transition-all duration-300 rounded-lg cursor-pointer'
                    >
                      {saving ? <><Loader2 className='w-4 h-4 animate-spin' /> Saving...</> : <><Save className='w-4 h-4' /> Save Changes</>}
                    </button>
                    {saved && (
                      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className='text-sm text-emerald-600 font-medium'>
                        Profile updated!
                      </motion.span>
                    )}
                    {error && (
                      <span className='text-sm text-red-600 font-medium'>{error}</span>
                    )}
                  </div>
                </form>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
